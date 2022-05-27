# 🏗 Scaffold-ETH - On-chain dynamic NFT generation

> Demonstration of soulbound on-chain dynamic SVGs, with Merkle Proof verification during mint

## Introduction

This branch is a demonstration of soulbound dynamic SVG NFTs which change according to the contract's state.

The NFTs represent donations to public goods recipients. Each token has an associated target donation amount, and a recipient address which will receive any ETH donated via the token.

When deploying the contract a Merkle tree containing a list of valid recipient address is created, and its root stored in the contract. This means the deployment cost is constant, no matter how many recipients there are.

When a token is minted the minter provides the beneficiary address and the Merkle proof. Tokens can only be minted for addresses on the predefined list. 

The SVG displays the amount that has been donated as a percentage of the target, using the contract's state variables.

## Acknowledgements/Inspiration

- Adam Fuller - https://github.com/BuidlGuidl/scaffold-eth/tree/merkler
- 0xbox https://github.com/BuidlGuidl/scaffold-eth/blob/composable-svg-nft/packages/hardhat/contracts/Loogies.sol
- https://gist.github.com/wilsoncusack/d2e680e0f961e36393d1bf0b6faafba7
- https://medium.com/@pppped/how-to-code-a-responsive-circular-percentage-chart-with-svg-and-css-3632f8cd7705

## Future

- confetti when target is reached https://stackoverflow.blog/2021/05/31/shipping-confetti-to-stack-overflows-design-system/
- ENS reverse lookup for recipient address
- owner can update Merkle root