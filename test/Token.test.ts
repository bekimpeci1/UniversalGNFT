import { expect, assert } from "chai";
import { ethers } from "hardhat";
import {Token, BasicGNFT} from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function deployBasicGNFT() {
    const BasicGNFT = await ethers.getContractFactory("BasicGNFT");
    const basicGNFTContract = await BasicGNFT.deploy();
    await basicGNFTContract.deployed();
    return basicGNFTContract;
}

async function deployTokenContract(basicGNFT : BasicGNFT) {
    const tokenFactory = await ethers.getContractFactory("Token");
    const tokenContract = await tokenFactory.deploy(basicGNFT.address);
    await tokenContract.deployed();
    return tokenContract;
}

describe('Token', () => { 
  let tokenContract : Token, basicGNFTContract : BasicGNFT, accounts : SignerWithAddress[]
  beforeEach(async () => {
    basicGNFTContract = await deployBasicGNFT();
    tokenContract = await deployTokenContract(basicGNFTContract);
    await basicGNFTContract.setTokenContractAddress(tokenContract.address);
    accounts = await ethers.getSigners();
  })
  it("Should not be able to change tokenContractAddress in BasicGNFT contract more than once", async () => {
    await expect(basicGNFTContract.setTokenContractAddress(tokenContract.address)).to.be.revertedWith("Only manager can change the token contract address");
  })
  describe("Deployment", () => {
    it("Should have deployed BasicGNFT and Token contracts", () => {
        assert.notStrictEqual(basicGNFTContract.address, "");
        assert.notStrictEqual(tokenContract.address, "");
      })
  })
  describe('Creating', () => { 
    describe("BasicGNFT contract", () => {
        it("Should be able to create a new BasicGNFT Fire Token", async () => {
            await basicGNFTContract.createToken("0","123");
            const isTokenFireType = await basicGNFTContract.isTokenFireType("0");
            assert(isTokenFireType);
          })
          it("Should be able to create a new BasicGNFT Water Token", async () => {
            await basicGNFTContract.createToken("1","123");
            const isTokenFireType = await basicGNFTContract.isTokenWaterType("0");
            assert(isTokenFireType);
          })
          it("Should be able to create a new BasicGNFT Earth Token", async () => {
            await basicGNFTContract.createToken("2","123");
            const isTokenFireType = await basicGNFTContract.isTokenEarthType("0");
            assert(isTokenFireType);
          })
          it("Should be able to create a new BasicGNFT Wind Token", async () => {
            await basicGNFTContract.createToken("3","123");
            const isTokenFireType = await basicGNFTContract.isTokenWindType("0");
            assert(isTokenFireType);
          })
          it("Should add token to address that created one", async () => {
            const deployerAccount = accounts[0];
            const deployerTokensBeforeCreation = await basicGNFTContract.getBGNFTOfAccount(deployerAccount.address);
            await basicGNFTContract.createToken("3","123");
            const deployerTokens = await basicGNFTContract.getBGNFTOfAccount(deployerAccount.address);
            assert.notEqual(deployerTokens.length, deployerTokensBeforeCreation.length);
          })
    })
    describe('Token Contract', () => { 
        it("Should be able to create complex token", async () => {
            await tokenContract.createGameNFT("123", "123", {
                FireReq: "1",
                WaterReq: "0",
                EarthReq: "0",
                WindReq: "0"
            });
            const tokenCounter = await tokenContract.getTokenCounter();
            assert.strictEqual(tokenCounter.toString(), "1");
          })
     })
   })
  describe('Swapping', () => { 
    beforeEach(async () => {
        await tokenContract.createGameNFT("123", "123", {
            FireReq: "1",
            WaterReq: "0",
            EarthReq: "0",
            WindReq: "0"
        });
      await basicGNFTContract.connect(accounts[1]).createToken("0","123");
    })
    it("Should be able to swap BasicGNFT tokens to complex Token", async () => {
        const ownerOfComplexToken= await tokenContract.ownerOf("0");
        await tokenContract.connect(accounts[1]).swapTokens(["0"], "0", {
            value: "123"
        });
        const newOwnerOfComplexToken = await tokenContract.ownerOf("0");
        assert.notEqual(ownerOfComplexToken, newOwnerOfComplexToken);
    });
    it("Should not swap if BasicGNFT requirements for a token are not met", async () => {
        await basicGNFTContract.connect(accounts[1]).createToken("1","123");
        await expect(tokenContract.connect(accounts[1]).swapTokens(["1"], "0", {
            value: "123"
        })).to.be.revertedWith("Fire requirements not met"); 
    })
    it("Should not swap if enough eth isn't being sent", async () => {
        await expect(tokenContract.connect(accounts[1]).swapTokens(["0"], "0", {
            value: "12"
        })).to.be.revertedWith("You must pay the full price for the selected NFT"); 
    })
    it("Should lock tokens when swapping", async () => {
        await tokenContract.connect(accounts[1]).swapTokens(["0"], "0", {
            value: "123"
        });
        const isTokenLocked = await basicGNFTContract.connect(accounts[1]).isTokenLocked("0");
        assert(isTokenLocked);
    })
    it("Cannot use a locked token for swapping", async () => {
      await tokenContract.connect(accounts[1]).swapTokens(["0"], "0", {
            value: "123"
        });
        await tokenContract.createGameNFT("123", "123", {
          FireReq: "1",
          WaterReq: "0",
          EarthReq: "0",
          WindReq: "0"
      });
      await expect(tokenContract.connect(accounts[1]).swapTokens(["0"], "0", {
        value: "123"
    })).to.be.revertedWithCustomError(basicGNFTContract, "BasicGNFT__AlreadyLocked")
    })
    it("Should unlock BasicGNFT after disassembling a complex token", async () => {
      await tokenContract.connect(accounts[1]).swapTokens(["0"], "0", {
        value: "123"
    });
      const isTokenLocked = await basicGNFTContract.isTokenLocked("0");
      await tokenContract.connect(accounts[1]).disassembleToken("0");
      const isTokenLockedAfterDisassebling = await basicGNFTContract.isTokenLocked("0");
      assert.notStrictEqual(isTokenLockedAfterDisassebling, isTokenLocked);
    })
   })
 })