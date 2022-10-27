/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import hre from 'hardhat';
import { ethers, network } from 'hardhat';
import Config from '../config/onChainConfig.json';
import MultichainConfig from '../config/multichainRoutersConfig.json';
import WnativeConfig from '../config/wrappedNativeConfig.json';

async function main() {
    const MultichainProxyFactory = await ethers.getContractFactory('MultichainProxy');
    const onChain = Config.chains.find(_chain => _chain.id === network.config.chainId)!;
    const multiConfig = MultichainConfig.chains.find(
        _chain => _chain.id === network.config.chainId
    )!;
    const wrappedConfig = WnativeConfig.chains.find(
        _chain => _chain.id === network.config.chainId
    )!;

    const multichainContract = await MultichainProxyFactory.deploy(
        wrappedConfig.wnative,
        0,
        0,
        onChain.dex,
        [],
        [],
        []
    );

    await multichainContract.deployed();

    await multichainContract.addAvailableRouters(multiConfig.anyRouters);

    console.log('Multichain Proxy deployed to:', multichainContract.address);

    await new Promise(r => setTimeout(r, 10000));

    await multichainContract.transferAdmin('0x105A3BA3637A29D36F61c7F03f55Da44B4591Cd1');
    console.log('Admin role granted.');

    await hre.run('verify:verify', {
        address: multichainContract.address,
        constructorArguments: [wrappedConfig.wnative, 0, 0, onChain.dex, [], [], []]
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
