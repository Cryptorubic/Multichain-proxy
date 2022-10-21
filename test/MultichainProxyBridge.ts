import { ethers, network, waffle } from 'hardhat';
import { deployContractFixtureInFork } from './shared/fixtures';
import { Wallet } from '@ethersproject/wallet';
import { Encode, MultichainProxy, TestERC20, WETH9 } from '../typechain';
import { expect } from 'chai';
import {
    DEFAULT_EMPTY_MESSAGE,
    DEFAULT_AMOUNT_IN,
    MIN_TOKEN_AMOUNT,
    DEFAULT_DST_CHAIN,
    ANY_ROUTER_POLY,
    TRANSIT_ANY_TOKEN,
    DEX,
    NATIVE_POLY,
    ANY_NATIVE_POLY,
    DEFAULT_AMOUNT_MIN
} from './shared/consts';
import { BigNumber as BN, BigNumberish, BytesLike, ContractTransaction } from 'ethers';
import { calcCryptoFees, calcTokenFees } from './shared/utils';
const hre = require('hardhat');

const createFixtureLoader = waffle.createFixtureLoader;

describe('Multichain Proxy', () => {
    let wallet: Wallet, swapper: Wallet;
    let swapToken: TestERC20;
    let encoder: Encode;
    let transitToken: TestERC20;
    let multichain: MultichainProxy;
    let wnative: WETH9;

    async function callBridge(
        data: BytesLike,
        {
            srcInputToken = TRANSIT_ANY_TOKEN,
            dstOutputToken = transitToken.address,
            integrator = ethers.constants.AddressZero,
            recipient = swapper.address,
            srcInputAmount = DEFAULT_AMOUNT_IN,
            dstMinOutputAmount = MIN_TOKEN_AMOUNT,
            dstChainID = DEFAULT_DST_CHAIN,
            router = ANY_ROUTER_POLY,
            dex = DEX
        } = {},
        value?: BN
    ): Promise<ContractTransaction> {
        if (value === undefined) {
            // call with tokens
            value = (
                await calcCryptoFees({
                    bridge: multichain,
                    integrator: integrator === ethers.constants.AddressZero ? undefined : integrator
                })
            ).totalCryptoFee;
            if (data === DEFAULT_EMPTY_MESSAGE) {
                return multichain.multiBridge(
                    {
                        srcInputToken,
                        srcInputAmount,
                        dstChainID,
                        dstOutputToken,
                        dstMinOutputAmount,
                        recipient,
                        integrator,
                        router
                    },
                    { value: value }
                );
            } else {
                return multichain.multiBridgeSwap(
                    dex,
                    dstOutputToken,
                    data,
                    {
                        srcInputToken,
                        srcInputAmount,
                        dstChainID,
                        dstOutputToken,
                        dstMinOutputAmount,
                        recipient,
                        integrator,
                        router
                    },
                    { value: value }
                );
            }
        }

        value = (
            await calcCryptoFees({
                bridge: multichain,
                integrator: integrator === ethers.constants.AddressZero ? undefined : integrator
            })
        ).totalCryptoFee.add(srcInputAmount);

        if (data === DEFAULT_EMPTY_MESSAGE) {
            return multichain.multiBridgeNative(
                {
                    srcInputToken,
                    srcInputAmount,
                    dstChainID,
                    dstOutputToken,
                    dstMinOutputAmount,
                    recipient,
                    integrator,
                    router
                },
                { value: value }
            );
        } else {
            return multichain.multiBridgeSwapNative(
                dex,
                dstOutputToken,
                data,
                {
                    srcInputToken,
                    srcInputAmount,
                    dstChainID,
                    dstOutputToken,
                    dstMinOutputAmount,
                    recipient,
                    integrator,
                    router
                },
                { value: value }
            );
        }
    }

    let loadFixture: ReturnType<typeof createFixtureLoader>;

    before('create fixture loader', async () => {
        [wallet, swapper] = await (ethers as any).getSigners();
        loadFixture = createFixtureLoader([wallet, swapper]);
    });

    beforeEach('deploy fixture', async () => {
        ({ multichain, encoder, swapToken, transitToken, wnative } = await loadFixture(
            deployContractFixtureInFork
        ));
    });

    describe('Multichain proxy tests', () => {
        describe('#multiBridge', () => {
            beforeEach('prepare before tests', async () => {
                transitToken.approve(multichain.address, ethers.constants.MaxUint256);
                swapToken.approve(multichain.address, ethers.constants.MaxUint256);
            });

            it('Should transfer transit token to AnyRouter without integrator', async () => {
                const { feeAmount } = await calcTokenFees({
                    bridge: multichain,
                    amountWithFee: DEFAULT_AMOUNT_IN
                });
                const { totalCryptoFee } = await calcCryptoFees({
                    bridge: multichain,
                    integrator: ethers.constants.AddressZero
                });

                await expect(callBridge('0x')).to.emit(multichain, 'RequestSent');

                expect(await transitToken.allowance(multichain.address, ANY_ROUTER_POLY)).to.be.eq(
                    0
                );
                expect(await waffle.provider.getBalance(multichain.address)).to.be.eq(
                    totalCryptoFee,
                    'wrong amount of swapped native on the contract as fees'
                );

                expect(await multichain.availableRubicTokenFee(transitToken.address)).to.be.eq(
                    feeAmount,
                    'wrong Rubic fees collected'
                );
            });
        });

        describe('#multiBridgeNative', () => {
            it('Should transfer native token to AnyRouter without integrator', async () => {
                const { feeAmount } = await calcTokenFees({
                    bridge: multichain,
                    amountWithFee: DEFAULT_AMOUNT_IN
                });
                const { totalCryptoFee } = await calcCryptoFees({
                    bridge: multichain,
                    integrator: ethers.constants.AddressZero
                });
                // let balanceBefore = await waffle.provider.getBalance(ANY_ROUTER_POLY);

                await expect(
                    callBridge('0x', { srcInputToken: ANY_NATIVE_POLY }, DEFAULT_AMOUNT_IN)
                ).to.emit(multichain, 'RequestSent');

                expect(await waffle.provider.getBalance(multichain.address)).to.be.eq(
                    feeAmount.add(totalCryptoFee),
                    'wrong amount of swapped native on the contract as fees'
                );
                expect(
                    await multichain.availableRubicTokenFee(ethers.constants.AddressZero)
                ).to.be.eq(feeAmount, 'wrong Rubic fees collected');
                // expect(
                //     balanceBefore.add(DEFAULT_AMOUNT_IN).sub(feeAmount).sub(totalCryptoFee)
                // ).to.be.eq(await waffle.provider.getBalance(ANY_ROUTER_POLY));
            });
        });

        describe('#multiBridgeNativeSwap', () => {
            it('Should swap native token and transfer to AnyRouter without integrator', async () => {
                const { feeAmount, amountWithoutFee } = await calcTokenFees({
                    bridge: multichain,
                    amountWithFee: DEFAULT_AMOUNT_IN
                });
                const { totalCryptoFee } = await calcCryptoFees({
                    bridge: multichain,
                    integrator: ethers.constants.AddressZero
                });
                let swapData = await encoder.encodeNative(
                    DEFAULT_AMOUNT_MIN,
                    [NATIVE_POLY, transitToken.address],
                    multichain.address
                );

                // let balanceBefore = await waffle.provider.getBalance(ANY_ROUTER_POLY);

                await expect(
                    callBridge(swapData, { dstOutputToken: TRANSIT_ANY_TOKEN }, DEFAULT_AMOUNT_IN)
                ).to.emit(multichain, 'RequestSent');

                expect(await waffle.provider.getBalance(multichain.address)).to.be.eq(
                    feeAmount.add(totalCryptoFee),
                    'wrong amount of swapped native on the contract as fees'
                );
                expect(
                    await multichain.availableRubicTokenFee(ethers.constants.AddressZero)
                ).to.be.eq(feeAmount, 'wrong Rubic fees collected');
                // expect(
                //     balanceBefore.add(DEFAULT_AMOUNT_IN).sub(feeAmount).sub(totalCryptoFee)
                // ).to.be.eq(await waffle.provider.getBalance(ANY_ROUTER_POLY));
            });
        });

        describe('#multiBridgeSwap', () => {
            beforeEach('prepare before tests', async () => {
                transitToken.approve(multichain.address, ethers.constants.MaxUint256);
                swapToken.approve(multichain.address, ethers.constants.MaxUint256);
            });

            it('Should swap token for token and transfer to AnyRouter without integrator', async () => {
                const { feeAmount, amountWithoutFee } = await calcTokenFees({
                    bridge: multichain,
                    amountWithFee: DEFAULT_AMOUNT_IN
                });
                const { totalCryptoFee } = await calcCryptoFees({
                    bridge: multichain,
                    integrator: ethers.constants.AddressZero
                });
                let swapData = await encoder.encode(
                    amountWithoutFee,
                    DEFAULT_AMOUNT_MIN,
                    [swapToken.address, transitToken.address],
                    multichain.address
                );
                await expect(
                    callBridge(swapData, {
                        srcInputToken: swapToken.address,
                        dstOutputToken: TRANSIT_ANY_TOKEN
                    })
                ).to.emit(multichain, 'RequestSent');
                expect(await waffle.provider.getBalance(multichain.address)).to.be.eq(
                    totalCryptoFee,
                    'wrong amount of swapped native on the contract as fees'
                );
                expect(await multichain.availableRubicTokenFee(swapToken.address)).to.be.eq(
                    feeAmount,
                    'wrong Rubic fees collected'
                );
            });

            it('Should swap token for native and transfer to AnyRouter without integrator', async () => {
                const { feeAmount, amountWithoutFee } = await calcTokenFees({
                    bridge: multichain,
                    amountWithFee: DEFAULT_AMOUNT_IN
                });
                const { totalCryptoFee } = await calcCryptoFees({
                    bridge: multichain,
                    integrator: ethers.constants.AddressZero
                });
                let swapData = await encoder.encodeTokenForNative(
                    amountWithoutFee,
                    DEFAULT_AMOUNT_MIN,
                    [swapToken.address, NATIVE_POLY],
                    multichain.address
                );
                await expect(
                    callBridge(swapData, {
                        srcInputToken: swapToken.address,
                        dstOutputToken: ANY_NATIVE_POLY
                    })
                ).to.emit(multichain, 'RequestSent');
                expect(await waffle.provider.getBalance(multichain.address)).to.be.eq(
                    totalCryptoFee,
                    'wrong amount of swapped native on the contract as fees'
                );
                expect(await multichain.availableRubicTokenFee(swapToken.address)).to.be.eq(
                    feeAmount,
                    'wrong Rubic fees collected'
                );
            });
        });
    });
});
