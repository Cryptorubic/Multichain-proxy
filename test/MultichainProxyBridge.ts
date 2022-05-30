import { ethers, network, waffle } from 'hardhat';
import { deployContractFixtureInFork } from './shared/fixtures';
import { Wallet } from '@ethersproject/wallet';
import { MultichainProxy, TestERC20, WETH9 } from '../typechain';
import { expect } from 'chai';
import { DEADLINE, DEFAULT_AMOUNT_IN, DEFAULT_AMOUNT_IN_USDC, ZERO_ADDRESS } from './shared/consts';
import { BigNumber as BN, BigNumberish, ContractTransaction } from 'ethers';
const hre = require('hardhat');

const createFixtureLoader = waffle.createFixtureLoader;

const envConfig = require('dotenv').config();
const {
    NATIVE_FTM: TEST_WFANTOM,
    ANY_ROUTER: ANY_ROUTER,
    USDT_ANY: TEST_TRANSIT_ANYUSDT,
    FTM_ANY: TEST_ANYFANTOM
} = envConfig.parsed || {};

describe('Multichain Proxy', () => {
    let wallet: Wallet, other: Wallet;
    let swapToken: TestERC20;
    let transitToken: TestERC20;
    let multichain: MultichainProxy;
    let wnative: WETH9;

    async function callBridgeMultichain({
        amountIn = DEFAULT_AMOUNT_IN_USDC,
        dstChainID = '56',
        bridgeToken = transitToken.address,
        anyToken = TEST_TRANSIT_ANYUSDT,
        integrator = ZERO_ADDRESS
    } = {}): Promise<ContractTransaction> {
        return multichain.multichainBridge(amountIn, dstChainID, bridgeToken, anyToken, integrator);
    }

    async function callBridgeMultichainNative({
        amountIn = DEFAULT_AMOUNT_IN,
        dstChainID = '56',
        bridgeToken = wnative.address,
        anyToken = TEST_ANYFANTOM,
        integrator = ZERO_ADDRESS
    } = {}): Promise<ContractTransaction> {
        return multichain.multichainBridgeNative(
            amountIn,
            dstChainID,
            bridgeToken,
            anyToken,
            integrator,
            { value: DEFAULT_AMOUNT_IN }
        );
    }

    // async function callV2Multichain({
    //     amountIn = DEFAULT_AMOUNT_IN,
    //     dstChainID = 56,
    //     bridgeToken = wnative.address,
    //     anyToken = TEST_ANYFANTOM,
    //     integrator = ZERO_ADDRESS
    // } = {}): Promise<ContractTransaction> {
    //     return multichain.multichainV2(
    //         amountIn,
    //         dstChainID,
    //         ,
    //         anyToken,
    //         integrator
    //     );
    // }
    //
    // async function callV2MultichainNative({
    //     amountIn = DEFAULT_AMOUNT_IN,
    //     dstChainID = 56,
    //     bridgeToken = wnative.address,
    //     anyToken = TEST_ANYFANTOM,
    //     integrator = ZERO_ADDRESS
    // } = {}): Promise<ContractTransaction> {
    //     return multichain.multichainV2Native(
    //         amountIn,
    //         dstChainID,
    //         ,
    //         anyToken,
    //         integrator
    //     );
    // }

    //  async function assertIntegratorFee(
    //     integrator: string,
    //     token: string,
    //     inputAmount: BigNumber
    // ): Promise<{ platformFee: BigNumber; integratorFee: BigNumber }> {
    //     const fee = await proxy.integratorFee(integrator);
    //     const share = await proxy.platformShare(integrator);
    //
    //     const totalFee = inputAmount.mul(fee).div(DENOMINATOR);
    //     const platformFee = totalFee.mul(share).div(DENOMINATOR);
    //     const integratorFee = totalFee.sub(platformFee);
    //
    //     expect(await proxy.amountOfIntegrator(token, integrator)).to.be.eq(integratorFee);
    //     expect(await proxy.availableRubicFee(token)).to.be.eq(platformFee);
    //
    //     return Promise.resolve({ platformFee, integratorFee });
    // }
    //
    // async function collectTokenFees(
    //     platformFee: BigNumber,
    //     integratorFee: BigNumber,
    //     token: TestToken
    // ) {
    //     await proxy.connect(integratorWallet)['collectIntegratorFee(address)'](token.address);
    //
    //     const ownerBalanceBefore = await token.balanceOf(admin.address);
    //
    //     await proxy.connect(admin).collectRubicFee(token.address);
    //
    //     const ownerBalanceAfter = await token.balanceOf(admin.address);
    //
    //     expect(await token.balanceOf(integratorWallet.address)).to.be.eq(integratorFee);
    //     expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.be.eq(platformFee);
    //     expect(await proxy.availableRubicFee(token.address)).to.be.eq('0');
    //     expect(await proxy.amountOfIntegrator(token.address, integratorWallet.address)).to.be.eq(
    //         '0'
    //     );
    // }

    let loadFixture: ReturnType<typeof createFixtureLoader>;

    before('create fixture loader', async () => {
        [wallet, other] = await (ethers as any).getSigners();
        loadFixture = createFixtureLoader([wallet, other]);
    });

    beforeEach('deploy fixture', async () => {
        ({ multichain, swapToken, transitToken, wnative } = await loadFixture(
            deployContractFixtureInFork
        ));
        await multichain.setMaxSwapAmount(transitToken.address, 1500e6);
        await multichain.setMinSwapAmount(transitToken.address, 100e6);
        await multichain.setMaxSwapAmount(wnative.address, ethers.utils.parseEther('10000'));
        await multichain.setMinSwapAmount(wnative.address, 1);
        await multichain.setMaxSwapAmount(swapToken.address, 1);
        await multichain.setMinSwapAmount(swapToken.address, 1);
    });

    it('constructor initializes', async () => {
        //expect(await multichain.nativeWrap()).to.eq(TEST_WFANTOM);
        expect(await multichain.AnyRouter()).to.eq(ANY_ROUTER);
    });

    describe('#Test Bridging', () => {
        describe('#bridgeMultichain', () => {
            it('Should transfer transit token to AnyRouter', async () => {
                await transitToken.approve(multichain.address, ethers.constants.MaxUint256);
                await expect(callBridgeMultichain()).to.emit(multichain, 'BridgeRequestSent');
            });
        });
        describe('#bridgeMultichainNative', () => {
            it('Should transfer wnative token to AnyRouter', async () => {
                await expect(callBridgeMultichainNative()).to.emit(multichain, 'BridgeRequestSent');
            });
        });
    });

    // describe('#Test swap V2', () => {
    //     describe('#multichainV2', () => {
    //         it('Should swap V2 amd transfer transit token to AnyRouter', async () => {
    //             callV2Multichain();
    //         });
    //     });
    //     describe('#bridgeMultichainNative', () => {
    //         it('Should transfer wnative token to AnyRouter', async () => {
    //             callV2MultichainNative();
    //         });
    //     });
    // });
});
