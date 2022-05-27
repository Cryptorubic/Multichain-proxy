const hre = require("hardhat");

async function main() {
  const factory = await hre.ethers.getContractFactory("MultichainProxy");

  const deploy = await factory.deploy(
      '0xd1C5966f9F5Ee6881Ff6b261BBeDa45972B1B5f3',
  );

  await deploy.deployed();

  console.log("Multichain Proxy deployed to:", deploy.address);

  await new Promise(r => setTimeout(r, 10000));

    await hre.run("verify:verify", {
    address: deploy.address,
    constructorArguments: [
        '0xd1C5966f9F5Ee6881Ff6b261BBeDa45972B1B5f3',
    ],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
