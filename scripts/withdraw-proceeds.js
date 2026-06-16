const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function withdrawProceeds() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const before = await nftMarketplace.getProceeds((await ethers.getSigners())[0].address)
    console.log(`Proceeds before withdraw: ${ethers.utils.formatEther(before)} ETH`)

    const tx = await nftMarketplace.withdrawProceeds()
    await tx.wait(1)

    const after = await nftMarketplace.getProceeds((await ethers.getSigners())[0].address)
    console.log(`Proceeds after withdraw: ${ethers.utils.formatEther(after)} ETH`)

    if (network.config.chainId == 31337) {
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

withdrawProceeds()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
