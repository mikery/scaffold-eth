import React, { useCallback, useState } from "react";
import { Button, Card, Input } from "antd";
import { Blockie } from "./index";
import { ethers } from "ethers";

// draws a card displaying beneficiary information

export default function Beneficiary({ name, address, tx, writeContracts, merkleProof }) {
  const [target, setTarget] = useState("1");
  const handleMint = useCallback(async () => {
    const result = tx(
      writeContracts.Items.mint(address, ethers.utils.parseUnits(target, "ether"), merkleProof),
      update => {
        console.log("📡 Transaction Update:", update);
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log(" 🍾 Transaction " + update.hash + " finished!");
        }
      },
    );
    console.log("awaiting metamask/web3 confirm result...", result);
    await result;
  }, [address, merkleProof, target, tx, writeContracts]);

  return (
    <Card title={name} style={{ width: 300, margin: 20 }}>
      <Blockie address={address} />
      <br />
      Target donation amount:
      <Input value={target} onChange={e => setTarget(e.target.value)} />
      <Button disabled={writeContracts.Items === undefined} onClick={handleMint}>
        Mint
      </Button>
    </Card>
  );
}
