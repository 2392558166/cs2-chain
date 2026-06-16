const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function mintAndList() {
    const cs2Skin = await ethers.getContract("CS2Skin")
    console.log("Minting CS2 skin...")
    const mintTx = await cs2Skin.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    console.log(
        `Minted CS2 skin tokenId ${mintTxReceipt.events[0].args.tokenId.toString()} from contract: ${
            cs2Skin.address
        }`
    )
    if (network.config.chainId == 31337) {
        // Moralis has a hard time if you move more than 1 block!
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
