import { ethers, network, waffle } from 'hardhat';
import { deployContractFixtureInFork } from './shared/fixtures';
import { Wallet } from '@ethersproject/wallet';
import { MultichainProxy, TestERC20, WETH9 } from '../typechain';
import { expect } from 'chai';
import { DEADLINE, DEFAULT_AMOUNT_IN, ZERO_ADDRESS } from './shared/consts';
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

describe('Multichain Proxy Bridge', () => {
    let wallet: Wallet, other: Wallet;
    let swapToken: TestERC20;
    let transitToken: TestERC20;
    let multichain: MultichainProxy;
    let wnative: WETH9;

    async function callBridgeMultichain({
        amountIn = DEFAULT_AMOUNT_IN,
        dstChainID = 56,
        bridgeToken = transitToken.address,
        anyToken = TEST_TRANSIT_ANYUSDT,
        integrator = ZERO_ADDRESS
    } = {}): Promise<ContractTransaction> {
        return multichain.bridgeMultichain(amountIn, dstChainID, bridgeToken, anyToken, integrator);
    }

    let loadFixture: ReturnType<typeof createFixtureLoader>;

    before('create fixture loader', async () => {
        [wallet, other] = await (ethers as any).getSigners();
        loadFixture = createFixtureLoader([wallet, other]);
    });

    beforeEach('deploy fixture', async () => {
        ({ multichain, swapToken, transitToken, wnative } = await loadFixture(
            deployContractFixtureInFork
        ));
    });

    it('constructor initializes', async () => {
        //expect(await multichain.nativeWrap()).to.eq(TEST_WFANTOM);
        expect(await multichain.AnyRouter()).to.eq(ANY_ROUTER);
    });

    describe('#Test Bridging', () => {
        describe('#bridgeMultichain', () => {
            it('Should transfer transit token to AnyRouter', async () => {
                callBridgeMultichain();
            });
        });
    });
});
