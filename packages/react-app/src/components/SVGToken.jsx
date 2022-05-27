import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Input } from "antd";
import { ethers } from "ethers";

// retrieve the token's metadata by calling tokenURI, then rendering the embedded SVG

export default function SVGToken({ tokenId, tx, writeContracts }) {
  const [imageData, setImageData] = useState();
  const [donationAmount, setDonationAmount] = useState("1");
  const [hidden, setHidden] = useState(true);

  const donate = useCallback(async () => {
    const result = tx(
      writeContracts.Items.donate(tokenId, { value: ethers.utils.parseUnits(donationAmount, "ether") }),
    );
    await result;
    await loadGallery();
  });

  const loadGallery = useCallback(async () => {
    if (!writeContracts.Items) return;
    try {
      const tokenURI = await writeContracts.Items.tokenURI(tokenId);
      const decoded = JSON.parse(Buffer.from(tokenURI.slice(29), "base64").toString());
      setImageData(decoded.image);
      setHidden(false);
    } catch (e) {
      console.error(e);
    }
  }, [tokenId, writeContracts.Items]);

  useEffect(() => {
    setTimeout(loadGallery, 1000);
  }, [loadGallery]);

  if (hidden) return <span />;
  return (
    <Card title={"Token"} style={{ width: 300, margin: 20 }}>
      <img src={imageData} />
      Donation amount:
      <Input value={donationAmount} onChange={e => setDonationAmount(e.target.value)} />
      <Button onClick={donate}>Donate</Button>
    </Card>
  );
}
