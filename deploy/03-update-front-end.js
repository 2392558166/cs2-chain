const {
    frontEndContractsFile,
    frontEndContractsFile2,
    frontEndAbiLocation,
    frontEndAbiLocation2,
} = require("../helper-hardhat-config")
require("dotenv").config()
const fs = require("fs")
const { network } = require("hardhat")

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...")
        ensureOutputDirectories()
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

function ensureOutputDirectories() {
    fs.mkdirSync(frontEndAbiLocation, { recursive: true })
    fs.mkdirSync(frontEndAbiLocation2, { recursive: true })
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    fs.writeFileSync(
        `${frontEndAbiLocation}NftMarketplace.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )
    fs.writeFileSync(
        `${frontEndAbiLocation2}NftMarketplace.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )

    const cs2Skin = await ethers.getContract("CS2Skin")
    fs.writeFileSync(
        `${frontEndAbiLocation}CS2Skin.json`,
        cs2Skin.interface.format(ethers.utils.FormatTypes.json)
    )
    fs.writeFileSync(
        `${frontEndAbiLocation2}CS2Skin.json`,
        cs2Skin.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddresses() {
    const chainId = network.config.chainId.toString()
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const cs2Skin = await ethers.getContract("CS2Skin")
    const contractAddresses = fs.existsSync(frontEndContractsFile)
        ? JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
        : {}
    if (chainId in contractAddresses) {
        if (!Array.isArray(contractAddresses[chainId]["NftMarketplace"])) {
            contractAddresses[chainId]["NftMarketplace"] = []
        }
        if (!Array.isArray(contractAddresses[chainId]["CS2Skin"])) {
            contractAddresses[chainId]["CS2Skin"] = []
        }
        if (!contractAddresses[chainId]["NftMarketplace"].includes(nftMarketplace.address)) {
            contractAddresses[chainId]["NftMarketplace"].push(nftMarketplace.address)
        }
        if (!contractAddresses[chainId]["CS2Skin"].includes(cs2Skin.address)) {
            contractAddresses[chainId]["CS2Skin"].push(cs2Skin.address)
        }
    } else {
        contractAddresses[chainId] = {
            NftMarketplace: [nftMarketplace.address],
            CS2Skin: [cs2Skin.address]
        }
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
    fs.writeFileSync(frontEndContractsFile2, JSON.stringify(contractAddresses))
}
module.exports.tags = ["all", "frontend"]
