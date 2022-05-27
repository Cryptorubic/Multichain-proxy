import { ethers } from 'hardhat';

export const DEADLINE = '9999999999999999';
export const DEFAULT_AMOUNT_IN = ethers.BigNumber.from('1000000000000000000000'); // 1000 ethers
export const DEFAULT_AMOUNT_OUT_MIN = ethers.BigNumber.from('950000000000000000000'); // 950 ethers
export const DEFAULT_AMOUNT_IN_USDC = ethers.BigNumber.from('1000000000'); // 1000 USDC
export const DEFAULT_AMOUNT_OUT_MIN_USDC = ethers.BigNumber.from('950000000'); // 950 USDC
export const ZERO_ADDRESS = ethers.constants.AddressZero;
