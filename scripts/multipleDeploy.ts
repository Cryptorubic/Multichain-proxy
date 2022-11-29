/* eslint-disable @typescript-eslint/no-loop-func */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-console */
import hre, { ethers, network, upgrades } from 'hardhat';
import { RubicWhitelist } from '../typechain';
const clc = require('cli-color');
import WnativeConfig from '../config/wrappedNativeConfig.json';

async function main() {
    const skipChains = [
        'hardhat',
        'ropsten',
        'rinkeby',
        'goerli',
        'kovan',
        'bscTest',
        'polygonMumbai',
        'defiKingdom'
        // 'polygon',
        // 'fantom',
        // 'bsc',
        // 'eth',
        // 'moonriver'
    ];

    const networks = hre.userConfig.networks;

    const blockchainNames = Object.keys(<{ [networkName: string]: any }>networks).filter(name => {
        return !skipChains.includes(name);
    });

    for (let blockchain of blockchainNames) {
        try {
            console.log(`deploying to ${clc.blue(blockchain)}`);
            hre.changeNetwork(blockchain);

            const MultichainProxyFactory = await hre.ethers.getContractFactory('MultichainProxy');
            const wrappedConfig = WnativeConfig.chains.find(
                _chain => _chain.id === network.config.chainId
            )!;

            console.log(`start deploy on ${clc.blue(blockchain)}`);
            const multichainContract = await MultichainProxyFactory.deploy(
                wrappedConfig.wnative,
                0,
                0,
                '0x7445a1617cb03438632993707b272951ff15600f',
                [],
                [],
                [],
                '0x0000006f0994c53C5D63E72dfA8Cf38412E874A4'
            );

            console.log(`waiting on ${clc.blue(blockchain)}`);
            await multichainContract.deployed();

            await new Promise(r => setTimeout(r, 10000));

            await multichainContract.grantRole(
                '0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08',
                '0xaE6FAf6C1c0006b81ce04308E225B01D9b667A6E'
            );

            await new Promise(r => setTimeout(r, 15000));

            console.log(
                `waiting for verification on ${clc.blue(blockchain)} at ${
                    multichainContract.address
                }`
            );

            await hre.run('verify:verify', {
                address: multichainContract.address,
                constructorArguments: [
                    wrappedConfig.wnative,
                    0,
                    0,
                    '0x7445a1617cb03438632993707b272951ff15600f',
                    [],
                    [],
                    [],
                    '0x0000006f0994c53C5D63E72dfA8Cf38412E874A4'
                ]
            });

            console.log(`deployed in ${clc.blue(blockchain)} to:`, multichainContract.address);
        } catch (e) {
            console.log(e);
        }
    }
}

main()
    .then(() => {
        console.log('Finished');
    })
    .catch(err => {
        console.log('Error = ', err);
    });
