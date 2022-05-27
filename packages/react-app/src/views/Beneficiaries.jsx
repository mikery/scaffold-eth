import React from "react";
import { Beneficiary } from "../components";
import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";

export default function Beneficiaries({ writeContracts, tx }) {
  const beneficiaries = [
    { name: "Carlos", address: "0x60583563D5879C2E59973E5718c7DE2147971807" },
    { name: "Austin", address: "0x34aa3f359a9d614239015126635ce7732c18fdf3" },
  ];
  const merkleTree = new MerkleTree(
    beneficiaries.map(x => ethers.utils.keccak256(x.address)),
    ethers.utils.keccak256,
    { sortPairs: true },
  );

  return (
    <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
      {beneficiaries.map(b => (
        <Beneficiary
          name={b.name}
          address={b.address}
          tx={tx}
          writeContracts={writeContracts}
          merkleProof={merkleTree.getHexProof(ethers.utils.keccak256(b.address))}
        />
      ))}
    </div>
  );
}
