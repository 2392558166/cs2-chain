const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const seedItems = [
    {
        name: "Seed AWP | Dragon Lore",
        description: "Local test listing for buyer-flow verification.",
        image: "",
        weapon: "AWP",
        paintKit: "Dragon Lore",
        floatValue: "0.012",
        pattern: "661",
        rarity: "Covert",
        exterior: "Factory New",
        price: "0.25",
    },
    {
        name: "Seed AK-47 | Redline",
        description: "Seeded by Hardhat account #1 so account #0 can test buying.",
        image: "",
        weapon: "AK-47",
        paintKit: "Redline",
        floatValue: "0.184",
        pattern: "321",
        rarity: "Classified",
        exterior: "Field-Tested",
        price: "0.15",
    },
    {
        name: "Seed M4A1-S | Printstream",
        description: "Default local inventory for marketplace buyer tests.",
        image: "",
        weapon: "M4A1-S",
        paintKit: "Printstream",
        floatValue: "0.071",
        pattern: "104",
        rarity: "Covert",
        exterior: "Minimal Wear",
        price: "0.18",
    },
]

function buildTokenUri(item) {
    const { price, ...metadata } = item
    return `data:application/json;base64,${Buffer.from(JSON.stringify(metadata), "utf8").toString(
        "base64"
    )}`
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { log } = deployments

    if (!developmentChains.includes(network.name)) {
        return
    }

    const { player } = await getNamedAccounts()
    const seller = await ethers.getSigner(player)
    const marketplace = await ethers.getContract("NftMarketplace")
    const cs2Skin = await ethers.getContract("CS2Skin")
    const sellerListings = await marketplace.getActiveListingsBySeller(player)

    if (sellerListings.length > 0) {
        log("Local seed listings already exist for buyer tests; skipping seed.")
        return
    }

    log("Seeding local marketplace listings from Hardhat account #1...")

    const sellerSkin = cs2Skin.connect(seller)
    const sellerMarketplace = marketplace.connect(seller)

    for (const item of seedItems) {
        const tokenId = await cs2Skin.getTokenCounter()
        const mintTx = await sellerSkin.mintSkin(buildTokenUri(item))
        await mintTx.wait(1)

        const approveTx = await sellerSkin.approve(marketplace.address, tokenId)
        await approveTx.wait(1)

        const listTx = await sellerMarketplace.listItem(
            cs2Skin.address,
            tokenId,
            ethers.utils.parseEther(item.price)
        )
        await listTx.wait(1)

        log(`Seeded token #${tokenId.toString()}: ${item.name} at ${item.price} ETH`)
    }
}

module.exports.tags = ["local-seed"]
module.exports.dependencies = ["nftmarketplace", "cs2skin"]
