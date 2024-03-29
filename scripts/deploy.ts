/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import hre from 'hardhat';
import { ethers, network } from 'hardhat';
import { MultichainProxy } from '../typechain';
import WnativeConfig from '../config/wrappedNativeConfig.json';

async function main() {
    const MultichainProxyFactory = await ethers.getContractFactory('MultichainProxy');
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
        '0x3330ee066fc570D56b4dfF6dE707C6A2998fd723',
        [],
        [],
        [],
        '0x0000006f0994c53C5D63E72dfA8Cf38412E874A4'
    );

    await multichainContract.deployed();

    console.log('Multichain Proxy deployed to:', multichainContract.address);

    await new Promise(r => setTimeout(r, 10000));

    await multichainContract.grantRole(
        '0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08',
        '0xaE6FAf6C1c0006b81ce04308E225B01D9b667A6E'
    );

    await new Promise(r => setTimeout(r, 10000));

    await multichainContract.transferAdmin('');
    console.log('Admin role granted.');

    await hre.run('verify:verify', {
        address: multichainContract.address,
        constructorArguments: [
            wrappedConfig.wnative,
            0,
            0,
            '0x3330ee066fc570D56b4dfF6dE707C6A2998fd723',
            [],
            [],
            [],
            '0x0000006f0994c53C5D63E72dfA8Cf38412E874A4'
        ]
    });
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
