import { ethers } from "hardhat";
import exportProperties from "./AddAbiAndAddressToFrontEnd";
const main = async () => {
  const BasicGNFT = await ethers.getContractFactory("BasicGNFT");
  const basicToken = await BasicGNFT.deploy();
  await basicToken.deployed();
  console.log(`BasicGNFT contract deployed to ${basicToken.address}`);
  const tokenContract = await ethers.getContractFactory("Token");
  const tokenContractDeployment = await tokenContract.deploy(
    basicToken.address
  );
  await tokenContractDeployment.deployed();
  console.log("Token deployed at " + tokenContractDeployment.address);
  exportProperties([tokenContractDeployment.address, basicToken.address]);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
