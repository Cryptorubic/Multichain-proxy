/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Fixture } from 'ethereum-waffle';
import { ethers, network } from 'hardhat';
import { MultichainProxy, TestERC20, WETH9, Encode, TestUnderlying } from '../../typechain';
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
    encoder: Encode;
    swapToken: TestERC20;
    transitToken: TestERC20;
    ercUnderlying: TestUnderlying;
    wnative: WETH9;
}

export const deployContractFixtureInFork: Fixture<DeployContractFixture> = async function (
    wallets
): Promise<DeployContractFixture> {
    const swapTokenFactory = await ethers.getContractFactory('TestERC20');
    let swapToken = swapTokenFactory.attach(SWAP_TOKEN) as TestERC20;
    swapToken = swapToken.connect(wallets[0]);

    const transitTokenFactory = await ethers.getContractFactory('TestERC20');
    let transitToken = transitTokenFactory.attach(TRANSIT_TOKEN) as TestERC20;
    transitToken = transitToken.connect(wallets[0]);

    const underlyingTokenFactory = await ethers.getContractFactory('TestUnderlying');
    let ercUnderlying = (await underlyingTokenFactory.deploy()) as TestUnderlying;
    ercUnderlying = ercUnderlying.connect(wallets[0]);

    const wnativeFactory = ethers.ContractFactory.fromSolidity(WETHJSON);
    let wnative = wnativeFactory.attach(NATIVE_POLY) as WETH9;
    wnative = wnative.connect(wallets[0]);

    const encodeFactory = await ethers.getContractFactory('Encode');
    let encoder = (await encodeFactory.deploy()) as Encode;

    const MultichainProxyFactory = await ethers.getContractFactory('MultichainProxy');

    const multichain = (await MultichainProxyFactory.deploy(
        NATIVE_POLY,
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
            abiCoder.encode(['uint256'], [0]).slice(2, 66)
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

    expect(await transitToken.balanceOf(wallets[0].address)).to.eq(
        ethers.utils.parseEther('100000')
    );

    expect(await swapToken.balanceOf(wallets[0].address)).to.eq(ethers.utils.parseEther('100000'));

    await network.provider.send('hardhat_setBalance', [
        wallets[0].address,
        '0x152D02C7E14AF6800000' // 100000 eth
    ]);

    return {
        multichain,
        encoder,
        swapToken,
        transitToken,
        ercUnderlying,
        wnative
    };
};
