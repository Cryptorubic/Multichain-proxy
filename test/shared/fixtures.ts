import { Fixture } from 'ethereum-waffle';
import { ethers, network } from 'hardhat';
import { MultichainProxy, TestERC20, WETH9 } from '../../typechain';
import TokenJSON from '../../artifacts/contracts/test/TestERC20.sol/TestERC20.json';
import WETHJSON from '../../artifacts/contracts/test/WETH9.sol/WETH9.json';
import { expect } from 'chai';

const envConfig = require('dotenv').config();
const {
    NATIVE_FTM: TEST_WFANTOM,
    SWAP_TOKEN_FTM: TEST_SWAP_TOKEN, // WETH
    TRANSIT_TOKEN_FTM: TEST_TRANSIT_TOKEN_USDT,
    ANY_ROUTER: TEST_ROUTER_FTM
} = envConfig.parsed || {};

interface DeployContractFixture {
    multichain: MultichainProxy;
    swapToken: TestERC20;
    transitToken: TestERC20;
    wnative: WETH9;
}

export const deployContractFixtureInFork: Fixture<DeployContractFixture> = async function (
    wallets
): Promise<DeployContractFixture> {
    const swapTokenFactory = ethers.ContractFactory.fromSolidity(TokenJSON);
    let swapToken = swapTokenFactory.attach(TEST_SWAP_TOKEN) as TestERC20;
    swapToken = swapToken.connect(wallets[0]);

    const transitTokenFactory = ethers.ContractFactory.fromSolidity(TokenJSON);
    let transitToken = transitTokenFactory.attach(TEST_TRANSIT_TOKEN_USDT) as TestERC20;
    transitToken = transitToken.connect(wallets[0]);

    const wnativeFactory = ethers.ContractFactory.fromSolidity(WETHJSON);
    let wnative = wnativeFactory.attach(TEST_WFANTOM) as WETH9;
    wnative = wnative.connect(wallets[0]);

    const MultichainProxyFactory = await ethers.getContractFactory('MultichainProxy');

    const multichain = (await MultichainProxyFactory.deploy(
        TEST_ROUTER_FTM
    )) as MultichainProxy;

    // part for seting storage
    const abiCoder = ethers.utils.defaultAbiCoder;

    const storageBalancePositionSwap = ethers.utils.keccak256(
        abiCoder.encode(['address'], [wallets[0].address]) +
            abiCoder.encode(['uint256'], [2]).slice(2, 66)
    );

    await network.provider.send('hardhat_setStorageAt', [
        swapToken.address,
        storageBalancePositionSwap,
        abiCoder.encode(['uint256'], [ethers.utils.parseEther('100000')])
    ]);

    expect(await swapToken.balanceOf(wallets[0].address)).to.eq(ethers.utils.parseEther('100000'));

    await network.provider.send('hardhat_setBalance', [
        wallets[0].address,
        '0x152D02C7E14AF6800000' // 100000 eth
    ]);

    return {
        multichain,
        swapToken,
        transitToken,
        wnative
    };
};
