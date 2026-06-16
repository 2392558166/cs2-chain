const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const PRICE = ethers.utils.parseEther("0.1")
const DEFAULT_TOKEN_URI =
    "data:application/json;base64,eyJuYW1lIjoiQVdQIHwgRHJhZ29uIExvcmUiLCJkZXNjcmlwdGlvbiI6IkxvY2FsaG9zdCBDUzIgc2tpbiBmb3IgZW5kLXRvLWVuZCB2ZXJpZmljYXRpb24uIiwiaW1hZ2UiOiIiLCJ3ZWFwb24iOiJBV1AiLCJwYWludEtpdCI6IkRyYWdvbiBMb3JlIiwiZmxvYXRWYWx1ZSI6IjAuMDEiLCJwYXR0ZXJuIjoiMzg3IiwicmFyaXR5IjoiQ292ZXJ0IiwiZXh0ZXJpb3IiOiJGYWN0b3J5IE5ldyJ9"

async function mintAndList() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const cs2Skin = await ethers.getContract("CS2Skin")
    console.log("Minting CS2 skin...")
    const mintTx = await cs2Skin.mintSkin(DEFAULT_TOKEN_URI)
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log("Approving CS2 skin for marketplace...")
    const approvalTx = await cs2Skin.approve(nftMarketplace.address, tokenId)
    await approvalTx.wait(1)
    console.log("Listing CS2 skin...")
    const tx = await nftMarketplace.listItem(cs2Skin.address, tokenId, PRICE)
    await tx.wait(1)
    console.log("CS2 skin listed!")
    if (network.config.chainId == 31337) {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
