/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';

export const DENOMINATOR = BigNumber.from('1000000');
export const RUBIC_PLATFORM_FEE = '30000';
export const FIXED_CRYPTO_FEE = BigNumber.from(ethers.utils.parseEther('1'));
export const MIN_TOKEN_AMOUNT = BigNumber.from('1' + '0'.repeat(17));
export const MAX_TOKEN_AMOUNT = BigNumber.from(ethers.utils.parseEther('10'));
export const DEFAULT_AMOUNT_IN = BigNumber.from(ethers.utils.parseEther('1'));
export const DEFAULT_AMOUNT_MIN = BigNumber.from(ethers.utils.parseEther('0'));
export const DEFAULT_DST_CHAIN = 2222;
export const DEFAULT_EMPTY_MESSAGE = '0x';

export const ANY_ROUTER_POLY = '0x84cEbCa6bd17fE11F7864F7003a1A30f2852B1dC';
export const NATIVE_POLY = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
export const ANY_NATIVE_POLY = '0x21804205c744dd98fbc87898704564d5094bb167';
export const SWAP_TOKEN = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'; // USDT
export const TRANSIT_TOKEN = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'; // USDC
export const TRANSIT_ANY_TOKEN = '0x9877DC155d64970d3e32264A1d120dA82947dcA8'; // any USDC
export const DEX = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';
