pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract Items is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    bytes32 merkleRoot;
    uint256 totalDonated;
    mapping(uint256 => uint256) donations;
    mapping(uint256 => uint256) targets;
    mapping(uint256 => address) beneficiaries;

    event NewDonor(address donor, address beneficiary, uint256 tokenId);
    event Donation(uint256 tokenId, uint256 amount);

    constructor(string memory name_, string memory symbol_, bytes32 merkleRoot_) ERC721(name_, symbol_) {
        merkleRoot = merkleRoot_;
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        revert("Whoa there, Doctor Faustus");
    }

    function mint(address beneficiary, uint256 targetAmount, bytes32[] memory proof) public {
        require(MerkleProof.verify(proof, merkleRoot, keccak256(abi.encodePacked(beneficiary))), "Unknown beneficiary or invalid proof");
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        beneficiaries[newItemId] = beneficiary;
        targets[newItemId] = targetAmount;
        _tokenIds.increment();
        emit NewDonor(msg.sender, beneficiary, newItemId);
    }

    function donate(uint256 tokenId) public payable {
        require(_exists(tokenId), "Invalid token ID");
        totalDonated += msg.value;
        donations[tokenId] += msg.value;
        payable(beneficiaries[tokenId]).transfer(msg.value);
        emit Donation(tokenId, msg.value);
    }

    function renderSVG(uint256 tokenId) public view returns (string memory) {
        // decimalString displays "0.0..." when value is 0.
        string memory donated = "0";
        if (donations[tokenId] > 0) {
            donated = decimalString(donations[tokenId], 18, false);
        }
        return string(abi.encodePacked(
                "<svg viewBox='0 0 36 56' xmlns='http://www.w3.org/2000/svg'><style> :root { --c: ",
                Strings.toString(donations[tokenId] * 100 / targets[tokenId]),
                "; } svg { width: 33%; margin: 10px auto; max-width: 80%; max-height: 250px; } .circle-bg { fill: none; stroke: #eee; stroke-width: 3.8; } .circle { fill: none; stroke-width: 2.8; stroke-linecap: round; stroke-dasharray: var(--c),100; animation: progress 1s ease-out forwards; } @keyframes progress { 0% { stroke-dasharray: 0 100; } } .t { fill: #666; font-family: sans-serif; font-size: 2px; text-anchor: middle; } </style> <text x='18' y='2' class='t'>Public Goods Philanthropist</text><path transform='translate(0, 2)' class='circle-bg' d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'/> <path transform='translate(0, 2)' class='circle' stroke='#4CC790' d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'/> <text x='18' y='19' class='t'>Donated ",
                donated,
                " of ",
                decimalString(targets[tokenId], 18, false),
                " ETH to</text> <text x='18' y='22' class='t' style='font-size: 1px;'>",
                Strings.toHexString(uint160(beneficiaries[tokenId]), 20),
                "</text></svg>"
            ));
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Invalid token ID");
        string memory name = string(abi.encodePacked(name(), ' #', "tokenId"));
        string memory description = string(abi.encodePacked("TODO"));

        return string(
            abi.encodePacked(
                'data:application/json;base64,',
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '{"name":"',
                            name,
                            '", "description":"',
                            description,
                            '", "image": "',
                            'data:image/svg+xml;base64,',
                            Base64.encode(bytes(renderSVG(tokenId))),
                            '"}'
                        )
                    )
                )
            )
        );
    }

    // https://gist.github.com/wilsoncusack/d2e680e0f961e36393d1bf0b6faafba7
    function decimalString(uint256 number, uint8 decimals, bool isPercent) private pure returns (string memory){
        uint8 percentBufferOffset = isPercent ? 1 : 0;
        uint256 tenPowDecimals = 10 ** decimals;

        uint256 temp = number;
        uint8 digits;
        uint8 numSigfigs;
        while (temp != 0) {
            if (numSigfigs > 0) {
                // count all digits preceding least significant figure
                numSigfigs++;
            } else if (temp % 10 != 0) {
                numSigfigs++;
            }
            digits++;
            temp /= 10;
        }

        DecimalStringParams memory params;
        params.isPercent = isPercent;
        if ((digits - numSigfigs) >= decimals) {
            // no decimals, ensure we preserve all trailing zeros
            params.sigfigs = number / tenPowDecimals;
            params.sigfigIndex = digits - decimals;
            params.bufferLength = params.sigfigIndex + percentBufferOffset;
        } else {
            // chop all trailing zeros for numbers with decimals
            params.sigfigs = number / (10 ** (digits - numSigfigs));
            if (tenPowDecimals > number) {
                // number is less tahn one
                // in this case, there may be leading zeros after the decimal place
                // that need to be added

                // offset leading zeros by two to account for leading '0.'
                params.zerosStartIndex = 2;
                params.zerosEndIndex = decimals - digits + 2;
                params.sigfigIndex = numSigfigs + params.zerosEndIndex;
                params.bufferLength = params.sigfigIndex + percentBufferOffset;
                params.isLessThanOne = true;
            } else {
                // In this case, there are digits before and
                // after the decimal place
                params.sigfigIndex = numSigfigs + 1;
                params.decimalIndex = digits - decimals + 1;
            }
        }
        params.bufferLength = params.sigfigIndex + percentBufferOffset;
        return generateDecimalString(params);
    }

    // With modifications, the below taken
    // from https://github.com/Uniswap/uniswap-v3-periphery/blob/main/contracts/libraries/NFTDescriptor.sol#L189-L231

    struct DecimalStringParams {
        // significant figures of decimal
        uint256 sigfigs;
        // length of decimal string
        uint8 bufferLength;
        // ending index for significant figures (funtion works backwards when copying sigfigs)
        uint8 sigfigIndex;
        // index of decimal place (0 if no decimal)
        uint8 decimalIndex;
        // start index for trailing/leading 0's for very small/large numbers
        uint8 zerosStartIndex;
        // end index for trailing/leading 0's for very small/large numbers
        uint8 zerosEndIndex;
        // true if decimal number is less than one
        bool isLessThanOne;
        // true if string should include "%"
        bool isPercent;
    }

    function generateDecimalString(DecimalStringParams memory params) private pure returns (string memory) {
        bytes memory buffer = new bytes(params.bufferLength);
        if (params.isPercent) {
            buffer[buffer.length - 1] = '%';
        }
        if (params.isLessThanOne) {
            buffer[0] = '0';
            buffer[1] = '.';
        }

        // add leading/trailing 0's
        for (uint256 zerosCursor = params.zerosStartIndex; zerosCursor < params.zerosEndIndex; zerosCursor++) {
            buffer[zerosCursor] = bytes1(uint8(48));
        }
        // add sigfigs
        while (params.sigfigs > 0) {
            if (params.decimalIndex > 0 && params.sigfigIndex == params.decimalIndex) {
                buffer[--params.sigfigIndex] = '.';
            }
            buffer[--params.sigfigIndex] = bytes1(uint8(uint256(48) + (params.sigfigs % 10)));
            params.sigfigs /= 10;
        }
        return string(buffer);
    }


}