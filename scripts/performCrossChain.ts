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
        '0x7a3bAc61d5b3b476cC774fa2209f1035BD01a4eF'
    )) as MultichainProxy;

    // // 56
    // await multichain.addAvailableRouters([
    //     '0xabd380327fe66724ffda91a87c772fb8d00be488',
    //     '0xe1d592c3322f1f714ca11f05b6bc0efef1907859',
    //     '0xf9736ec3926703e85c843fc972bd89a7f8e827c0'
    // ]);

    // 2222
    await multichain.addAvailableRouters([
        '0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c',
        '0x5d9ab5522c64e1f6ef5e3627eccc093f56167818',
        '0x264c1383ea520f73dd837f915ef3a732e204a493'
    ]);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
