/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import hre from 'hardhat';
import { ethers, network } from 'hardhat';
import Config from '../config/onChainConfig.json';
import { MultichainProxy } from '../typechain';
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

    // let multichainContract = (await MultichainProxyFactory.attach(
    //     '0x333BE852042F435431967664e09315CC63593333'
    // )) as MultichainProxy;

    const multichainContract = await MultichainProxyFactory.deploy(
        wrappedConfig.wnative,
        0,
        0,
        onChain.dex,
        multiConfig.anyRouters,
        [],
        [],
        []
    );

    await multichainContract.deployed();

    console.log('Multichain Proxy deployed to:', multichainContract.address);

    await new Promise(r => setTimeout(r, 10000));

    await multichainContract.grantRole(
        '0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08',
        '0xaE6FAf6C1c0006b81ce04308E225B01D9b667A6E'
    );

    // await new Promise(r => setTimeout(r, 10000));

    // await multichainContract.transferAdmin('');
    console.log('Admin role granted.');

    await hre.run('verify:verify', {
        address: multichainContract.address,
        constructorArguments: [
            wrappedConfig.wnative,
            0,
            0,
            onChain.dex,
            multiConfig.anyRouters,
            [],
            [],
            []
        ]
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
