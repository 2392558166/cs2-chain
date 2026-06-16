// We are going to skip a bit on these tests...

const { assert } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//writing the test code from here..

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("CS2 Skin Unit Tests", function () {
          let cs2Skin, deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["cs2skin"])
              cs2Skin = await ethers.getContract("CS2Skin")
          })

          describe("Constructor", () => {
              it("initializes the CS2 skin collection correctly", async () => {
                  const name = await cs2Skin.name()
                  const symbol = await cs2Skin.symbol()
                  const tokenCounter = await cs2Skin.getTokenCounter()
                  assert.equal(name, "CS2 Skin")
                  assert.equal(symbol, "CS2")
                  assert.equal(tokenCounter.toString(), "0")
              })
          })
          describe("Mint skin", () => {
              beforeEach(async () => {
                  const txResponse = await cs2Skin.mintNft()
                  await txResponse.wait(1)
              })
              it("mints a CS2 skin with the default token URI", async function () {
                  const tokenURI = await cs2Skin.tokenURI(0)
                  const tokenCounter = await cs2Skin.getTokenCounter()

                  assert.equal(tokenCounter.toString(), "1")
                  assert.equal(tokenURI, await cs2Skin.DEFAULT_TOKEN_URI())
              })
              it("tracks owner and balance for the minted skin", async function () {
                  const deployerAddress = deployer.address
                  const deployerBalance = await cs2Skin.balanceOf(deployerAddress)
                  const owner = await cs2Skin.ownerOf("0")

                  assert.equal(deployerBalance.toString(), "1")
                  assert.equal(owner, deployerAddress)
              })
              it("allows minting with a custom token URI", async function () {
                  const customUri = "ipfs://cs2/custom/m4a1s-hyper-beast.json"
                  const txResponse = await cs2Skin.mintSkin(customUri)
                  await txResponse.wait(1)

                  const tokenURI = await cs2Skin.tokenURI(1)
                  assert.equal(tokenURI, customUri)
              })
          })
      })
