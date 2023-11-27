
const hre = require("hardhat");

async function main() {
    provider = hre.ethers.provider;
    const [deployer] = await ethers.getSigners();

    const weth = await ethers.getContractFactory("ERC20Token");
    const WETH = await weth.deploy("Wrapped Ether", "WETH");
    console.log("WETH deployed to:", WETH.address);

    const EventWise = await ethers.getContractFactory("EventWise");
    const eventWise = await EventWise.deploy(WETH.address);
    console.log("eventWise deployed to:", eventWise.address);


    /*   const Greeter = await hre.ethers.getContractFactory("Greeter");
      const greeter = await Greeter.deploy("Hello, Hardhat!");
    
      await greeter.deployed();
    
      console.log("Greeter deployed to:", greeter.address); */
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
