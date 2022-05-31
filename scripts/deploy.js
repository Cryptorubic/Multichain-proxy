const hre = require("hardhat");

async function main() {
  const factory = await hre.ethers.getContractFactory("MultichainProxy");

  const deploy = await factory.deploy(
      '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
      ['0xf3Ce95Ec61114a4b1bFC615C16E6726015913CCC','0x1CcCA1cE62c62F7Be95d4A67722a8fDbed6EEcb4','0xb576C9403f39829565BD6051695E2AC7Ecf850E2'],
      ['0xF491e7B69E4244ad4002BC14e878a34207E38c29','0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52','0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506','0x1111111254fb6c44bAC0beD2854e76F90643097d']
  );

  await deploy.deployed();

  console.log("Multichain Proxy deployed to:", deploy.address);

  await new Promise(r => setTimeout(r, 10000));

      await hre.run("verify:verify", {
      address: deploy.address,
      constructorArguments: [
          '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
          ['0xf3Ce95Ec61114a4b1bFC615C16E6726015913CCC','0x1CcCA1cE62c62F7Be95d4A67722a8fDbed6EEcb4','0xb576C9403f39829565BD6051695E2AC7Ecf850E2'],
          ['0xF491e7B69E4244ad4002BC14e878a34207E38c29','0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52','0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506','0x1111111254fb6c44bAC0beD2854e76F90643097d']
    ],
  });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
