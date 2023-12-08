await hre.run("verify:verify", {
    address: "0x6d7B7DE1f0114c11b8739b779d0C1dE5aF88f482",
    contract: "contracts/EventWise.sol:EventWise",
    constructorArguments: ['0xC8A71BACF28e24A274b95e785c436bb5F57043Ae'],
  });