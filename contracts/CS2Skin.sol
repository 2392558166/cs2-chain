// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CS2Skin is ERC721 {
    string public constant DEFAULT_TOKEN_URI =
        "ipfs://bafybeibc7u4zy4mrh5b6rjv6xg7ezw2x4k5a4v3o4e2s6zv6r5w3s7w2zu/cs2-awp-dragon-lore.json";
    uint256 private s_tokenCounter;

    mapping(uint256 => string) private s_tokenUris;

    event SkinMinted(uint256 indexed tokenId, string tokenUri);

    constructor() ERC721("CS2 Skin", "CS2") {
        s_tokenCounter = 0;
    }

    function mintSkin(string memory tokenUri) public returns (uint256 tokenId) {
        tokenId = s_tokenCounter;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenUris[tokenId] = bytes(tokenUri).length > 0 ? tokenUri : DEFAULT_TOKEN_URI;
        emit SkinMinted(tokenId, s_tokenUris[tokenId]);
        s_tokenCounter = s_tokenCounter + 1;
    }

    function mintNft() public returns (uint256 tokenId) {
        return mintSkin(DEFAULT_TOKEN_URI);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return s_tokenUris[tokenId];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
