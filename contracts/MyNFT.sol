// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    // Pastikan semua variabel state ada di sini, sebelum constructor
    private uint256 _nextTokenId;
    uint256 public immutable maxSupply;

    constructor(string memory name, string memory symbol, uint256 _maxSupply) 
        ERC721(name, symbol)
        Ownable(msg.sender) 
    {
        maxSupply = _maxSupply;
    }

    function safeMint(address to) public onlyOwner {
        require(_nextTokenId < maxSupply, "All tokens have been minted");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }
}
