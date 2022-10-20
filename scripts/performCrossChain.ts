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

    await multichain.addAvailableRouters([
        '0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c',
        '0x5d9ab5522c64e1f6ef5e3627eccc093f56167818'
    ]);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
