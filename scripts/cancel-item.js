const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

const TOKEN_ID = process.env.TOKEN_ID || "0"

async function cancel() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const cs2Skin = await ethers.getContract("CS2Skin")
    const tx = await nftMarketplace.cancelListing(cs2Skin.address, TOKEN_ID)
    await tx.wait(1)
    console.log("CS2 skin listing canceled!")
    if ((network.config.chainId == "31337")) {
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

cancel()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
