import React from "react";
import { SVGToken } from "../components";

export default function Gallery({ writeContracts, tx }) {
  return (
    <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
      Gallery
      <p>Note: The gallery displays token IDs 0 through 2.</p>
      <SVGToken tokenId={0} writeContracts={writeContracts} tx={tx} />
      <SVGToken tokenId={1} writeContracts={writeContracts} tx={tx} />
      <SVGToken tokenId={2} writeContracts={writeContracts} tx={tx} />
    </div>
  );
}
