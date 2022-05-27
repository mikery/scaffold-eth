const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { MerkleTree } = require("merkletreejs");
const { writeFileSync } = require("fs");

use(solidity);

function extractSVGFromTokenData(tokenData) {
  const decoded = JSON.parse(
    Buffer.from(tokenData.slice(29), "base64").toString()
  );
  const svg = Buffer.from(decoded.image.slice(26), "base64").toString();
  return svg;
}

describe("My Dapp", function () {
  // quick fix to let gas reporter fetch data from gas station & coinmarketcap
  before((done) => {
    setTimeout(done, 2000);
  });

  describe("Tokens", function () {
    it("Should create a new token", async function () {
      const Items = await ethers.getContractFactory("Items");
      const [_, minter, receiver] = await ethers.getSigners();
      const ben1 = ethers.Wallet.createRandom();
      const ben2 = ethers.Wallet.createRandom();
      const beneficiaries = [ben1.address, ben2.address];

      const merkleTree = new MerkleTree(
        beneficiaries.map((x) => ethers.utils.keccak256(x)),
        ethers.utils.keccak256,
        { sortPairs: true }
      );
      const merkleRoot = merkleTree.getHexRoot();
      const ben1Proof = merkleTree.getHexProof(
        ethers.utils.keccak256(ben1.address)
      );
      const ben2Proof = merkleTree.getHexProof(
        ethers.utils.keccak256(ben2.address)
      );
      const minterProof = merkleTree.getHexProof(
        ethers.utils.keccak256(minter.address)
      );

      const tokenId = 0;
      const itemsContract = await Items.deploy(
        "Philanthropist",
        "PHIL",
        merkleRoot
      );

      // Mint a new token, providing proof that the beneficiary in the tree
      await itemsContract.connect(minter).mint(beneficiaries[0], 2, ben1Proof);
      // Donate via the token...
      await itemsContract.connect(minter).donate(tokenId, {
        value: ethers.utils.parseUnits("1", "ether"),
      });
      // ...and verify the recipient's balance has increased
      expect(await ethers.provider.getBalance(ben1.address)).to.eql(
        ethers.utils.parseEther("1")
      );

      // Minting fails if provided proof does not match address (i.e. using address1 and proof2).
      await expect(
        itemsContract.connect(minter).mint(beneficiaries[0], 2, ben2Proof)
      ).to.revertedWith("Unknown beneficiary or invalid proof");

      // Minting fails if address is not in tree
      await expect(
        itemsContract.connect(minter).mint(minter.address, 2, minterProof)
      ).to.revertedWith("Unknown beneficiary or invalid proof");

      // Token is soulbound
      await expect(
        itemsContract
          .connect(minter)
          .transferFrom(minter.address, receiver.address, tokenId)
      ).to.revertedWith("Whoa there, Doctor Faustus");
    });

    it("Render an SVG", async function () {
      const Items = await ethers.getContractFactory("Items");
      const [_, minter] = await ethers.getSigners();
      const ben1 = ethers.Wallet.createRandom();
      const ben2 = ethers.Wallet.createRandom();
      const beneficiaries = [ben1.address, ben2.address];

      const merkleTree = new MerkleTree(
        beneficiaries.map((x) => ethers.utils.keccak256(x)),
        ethers.utils.keccak256,
        { sortPairs: true }
      );
      const merkleRoot = merkleTree.getHexRoot();
      const ben1Proof = merkleTree.getHexProof(
        ethers.utils.keccak256(ben1.address)
      );
      const itemsContract = await Items.deploy(
        "Philanthropist",
        "PHIL",
        merkleRoot
      );
      const tokenId = 0;
      // Mint a new token, providing proof that the beneficiary in the tree
      await itemsContract
        .connect(minter)
        .mint(
          beneficiaries[0],
          ethers.utils.parseUnits("2", "ether"),
          ben1Proof
        );
      // Donate via the token...
      await itemsContract.connect(minter).donate(tokenId, {
        value: ethers.utils.parseUnits("1", "ether"),
      });
      const tokenData = await itemsContract.tokenURI(tokenId);
      const svg = extractSVGFromTokenData(tokenData);
      writeFileSync("/tmp/images/test.svg", svg);
    });
  });
});
