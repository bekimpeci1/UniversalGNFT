import { ethers, network } from "hardhat";
import fs from "fs";

const exportProperties = async (contractAddresses: string[]) => {
  await exportAbis(contractAddresses);
  await exportAddresses(contractAddresses);
};

const Contracts = ["Token", "BasicGNFT"];
const FrontEndAddressPaths = [
  "/home/bekim/Documents/Project/Apps/GNFT/gaming-nft/constants/Token/TokenAddress.json",
  "/home/bekim/Documents/Project/Apps/GNFT/gaming-nft/constants/BasicGNFT/BasicGNFTAddress.json",
];
const FrontEndAbiPaths = [
  "/home/bekim/Documents/Project/Apps/GNFT/gaming-nft/constants/Token/TokenABI.json",
  "/home/bekim/Documents/Project/Apps/GNFT/gaming-nft/constants/BasicGNFT/BasicGNFTABI.json",
];
const exportAbis = async (contractAddresses: string[]) => {
  for (let i = 0; i < Contracts.length; i++) {
    const contract = await ethers.getContractAt(
      Contracts[i],
      contractAddresses[i]
    );
    fs.writeFileSync(
      FrontEndAbiPaths[i],
      contract.interface.format(ethers.utils.FormatTypes.json).toString()
    );
  }
};

const exportAddresses = async (contractAddresses: string[]) => {
  for (let i = 0; i < Contracts.length; i++) {
    console.log("Updateting Contract address");

    const lottery = await ethers.getContractAt(
      Contracts[i],
      contractAddresses[i]
    );

    const chainId = network.config.chainId?.toString();
    const currentAddresses = JSON.parse(
      fs.readFileSync(FrontEndAddressPaths[i], "utf8")
    );
    if (chainId! in currentAddresses) {
      if (!currentAddresses[chainId!].includes(lottery.address)) {
        currentAddresses[chainId!].push(lottery.address);
      }
    } else {
      currentAddresses[chainId!] = [lottery.address];
    }
    fs.writeFileSync(FrontEndAddressPaths[i], JSON.stringify(currentAddresses));
  }
};

export default exportProperties;
