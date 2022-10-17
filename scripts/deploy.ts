/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import hre from 'hardhat';
import { ethers, network } from 'hardhat';
import Config from '../config/onChainConfig.json';

async function main() {
    const MultichainProxyFactory = await ethers.getContractFactory('MultichainProxy');
    const chain = Config.chains.find(_chain => _chain.id === network.config.chainId)!;

    const deploy = await MultichainProxyFactory.deploy(0, 0, chain.dex, [], []);

    await deploy.deployed();

    console.log('Multichain Proxy deployed to:', deploy.address);

    await new Promise(r => setTimeout(r, 10000));

    // await deploy.transferAdmin('0x105A3BA3637A29D36F61c7F03f55Da44B4591Cd1');
    // console.log('Admin role granted.');

    await hre.run('verify:verify', {
        address: deploy.address,
        constructorArguments: [0, 0, chain.dex, [], []]
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
