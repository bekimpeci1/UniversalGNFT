// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

error BasicGNFT__OnlyOwner();
error BasicGNFT__AlreadyLocked();
error BasicGNFT_OnlyTokenContractCanCall();

contract BasicGNFT is ERC721("BasicGNFT", "BGNFT") {
    enum TokenType {
        Fire,
        Water,
        Earth,
        Wind
    }
    uint256 tokenCounter;
    address manager;
    address tokenContractAddress;
    struct TokenMetaData {
        TokenType tokenType;
        uint256 tokenLevel;
        string tokenURI;
        // a BGNFT is locked when it is used to swap for a more "complex" GNFT
        bool isLocked;
    }
    mapping(uint256 => TokenMetaData) private BGNFTMetaData;
    mapping(address => uint256[]) private addressTokens;

    constructor() {
        manager = msg.sender;
    }

    function createToken(TokenType _type, string memory _tokenURI) public {
        BGNFTMetaData[tokenCounter].tokenType = _type;
        BGNFTMetaData[tokenCounter].tokenURI = _tokenURI;
        _safeMint(msg.sender, tokenCounter);
        addressTokens[msg.sender].push(tokenCounter);
        tokenCounter = tokenCounter + 1;
    }

    /// @notice Set the contract address for the token contract,
    /// the manager becomes the dead address so the token contract address cannot be changed in the future
    /// @param newTokenContractAddress the address that will be set
    function setTokenContractAddress(address newTokenContractAddress) public {
        require(
            msg.sender == manager,
            "Only manager can change the token contract address"
        );
        tokenContractAddress = newTokenContractAddress;
        manager = address(0);
    }

    function lockTokens(
        uint256[] memory tokenIds,
        address originalAddressCalling
    ) external {
        for (uint i = 0; i < tokenIds.length; i++) {
            if (ownerOf(tokenIds[i]) != originalAddressCalling)
                revert BasicGNFT__OnlyOwner();
            if (msg.sender != tokenContractAddress)
                revert BasicGNFT_OnlyTokenContractCanCall();
            if (BGNFTMetaData[tokenIds[i]].isLocked)
                revert BasicGNFT__AlreadyLocked();
            BGNFTMetaData[tokenIds[i]].isLocked = true;
        }
    }

    // notice: Since when locking it already being checked whether the
    // tokens being locked belong to the msg.sender, and the disassembleToken function
    // checkes whether the msg.sender is the owner hence why we are not checking
    // is owner here
    function unlockTokens(uint256[] memory tokenIds) external {
        for (uint i = 0; i < tokenIds.length; i++) {
            if (msg.sender != tokenContractAddress)
                revert BasicGNFT_OnlyTokenContractCanCall();
            BGNFTMetaData[tokenIds[i]].isLocked = false;
        }
    }

    // View functionality
    function getTokenCounter() public view returns (uint256) {
        return tokenCounter;
    }

    function getBGNFTOfAccount(
        address userAddress
    ) public view returns (uint256[] memory) {
        return addressTokens[userAddress];
    }

    function getTokenType(uint256 tokenId) public view returns (TokenType) {
        return BGNFTMetaData[tokenId].tokenType;
    }

    function isTokenFireType(uint256 tokenId) public view returns (bool) {
        return BGNFTMetaData[tokenId].tokenType == TokenType.Fire;
    }

    function isTokenWaterType(uint256 tokenId) public view returns (bool) {
        return BGNFTMetaData[tokenId].tokenType == TokenType.Water;
    }

    function isTokenEarthType(uint256 tokenId) public view returns (bool) {
        return BGNFTMetaData[tokenId].tokenType == TokenType.Earth;
    }

    function isTokenWindType(uint256 tokenId) public view returns (bool) {
        return BGNFTMetaData[tokenId].tokenType == TokenType.Wind;
    }

    function isTokenLocked(uint256 tokenId) public view returns (bool) {
        return BGNFTMetaData[tokenId].isLocked;
    }

    function getTokenMetaData(
        uint256 tokenId
    ) public view returns (TokenMetaData memory) {
        return BGNFTMetaData[tokenId];
    }
}
