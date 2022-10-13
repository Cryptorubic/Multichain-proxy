import { Fixture } from 'ethereum-waffle';
import { ethers, network } from 'hardhat';
import { MultichainProxy, TestERC20, WETH9 } from '../../typechain';
import TokenJSON from '../../artifacts/contracts/test/TestERC20.sol/TestERC20.json';
import WETHJSON from '../../artifacts/contracts/test/WETH9.sol/WETH9.json';
import {
    RUBIC_PLATFORM_FEE,
    MIN_TOKEN_AMOUNT,
    MAX_TOKEN_AMOUNT,
    FIXED_CRYPTO_FEE,
    ANY_ROUTER_POLY,
    NATIVE_POLY,
    SWAP_TOKEN,
    TRANSIT_TOKEN,
    DEX
} from './consts';
import { expect } from 'chai';

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
    let swapToken = swapTokenFactory.attach(SWAP_TOKEN) as TestERC20;
    swapToken = swapToken.connect(wallets[0]);

    const transitTokenFactory = ethers.ContractFactory.fromSolidity(TokenJSON);
    let transitToken = transitTokenFactory.attach(TRANSIT_TOKEN) as TestERC20;
    transitToken = transitToken.connect(wallets[0]);

    const wnativeFactory = ethers.ContractFactory.fromSolidity(WETHJSON);
    let wnative = wnativeFactory.attach(NATIVE_POLY) as WETH9;
    wnative = wnative.connect(wallets[0]);

    const MultichainProxyFactory = await ethers.getContractFactory('MultichainProxy');

    const multichain = (await MultichainProxyFactory.deploy(
        FIXED_CRYPTO_FEE,
        RUBIC_PLATFORM_FEE,
        [DEX, ANY_ROUTER_POLY],
        [transitToken.address, swapToken.address],
        [MIN_TOKEN_AMOUNT, MIN_TOKEN_AMOUNT],
        [MAX_TOKEN_AMOUNT, MAX_TOKEN_AMOUNT]
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

    await network.provider.send('hardhat_setStorageAt', [
        transitToken.address,
        storageBalancePositionSwap,
        abiCoder.encode(['uint256'], [ethers.utils.parseEther('100000')])
    ]);

    expect(await swapToken.balanceOf(wallets[0].address)).to.eq(ethers.utils.parseEther('100000'));
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
