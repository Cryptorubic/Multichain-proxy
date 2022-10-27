/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import hre from 'hardhat';
import { ethers, network } from 'hardhat';
import { TestERC20 } from '../typechain';

async function main() {
    // let token = (await ERCFactory.attach(
    //     ''
    // )) as TestERC20;
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
