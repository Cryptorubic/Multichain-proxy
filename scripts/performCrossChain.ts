/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import hre from 'hardhat';
import { ethers, network } from 'hardhat';
import { MultichainProxy, TestERC20 } from '../typechain';

async function main() {
    const MultichainProxyFactory = await ethers.getContractFactory('MultichainProxy');
    const ERCFactory = await ethers.getContractFactory('TestERC20');

    // let token = (await ERCFactory.attach(
    //     '0xfA9343C3897324496A05fC75abeD6bAC29f8A40f'
    // )) as TestERC20;

    let multichain = (await MultichainProxyFactory.attach(
        '0x0C8f0d522094689E9eFeB2576AB60d54B85209dF'
    )) as MultichainProxy;

    await multichain.multiBridge({'0xfa9343c3897324496a05fc75abed6bac29f8a40f',})
    // await token.approve(multichain.address, ethers.constants.MaxUint256);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
