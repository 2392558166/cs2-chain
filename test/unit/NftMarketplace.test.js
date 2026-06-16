const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Unit Tests", function () {
          let nftMarketplace, nftMarketplaceContract, cs2Skin, cs2SkinContract
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          const SECOND_TOKEN_ID = 1
          const THIRD_TOKEN_ID = 2

          beforeEach(async () => {
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              deployer = accounts[0]
              user = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplaceContract = await ethers.getContract("NftMarketplace")
              nftMarketplace = nftMarketplaceContract.connect(deployer)
              cs2SkinContract = await ethers.getContract("CS2Skin")
              cs2Skin = cs2SkinContract.connect(deployer)
              await cs2Skin.mintNft()
              await cs2Skin.approve(nftMarketplaceContract.address, TOKEN_ID)
          })

          describe("listItem", function () {
              it("emits an event after listing an item", async function () {
                  expect(await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)).to.emit(
                      "ItemListed"
                  )
              })
              it("exclusively items that haven't been listed", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  const error = `AlreadyListed("${cs2Skin.address}", ${TOKEN_ID})`
                  //   await expect(
                  //       nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  //   ).to.be.revertedWith("AlreadyListed")
                  await expect(
                      nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error)
              })
              it("exclusively allows owners to list", async function () {
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await cs2Skin.approve(user.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NotOwner")
              })
              it("needs approvals to list item", async function () {
                  await cs2Skin.approve(ethers.constants.AddressZero, TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NotApprovedForMarketplace")
              })
              it("Updates listing with seller and price", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  const listing = await nftMarketplace.getListing(cs2Skin.address, TOKEN_ID)
                  assert(listing.price.toString() == PRICE.toString())
                  assert(listing.seller.toString() == deployer.address)
              })
              it("reverts if the price be 0", async () => {
                  const ZERO_PRICE = ethers.utils.parseEther("0")
                  await expect(
                      nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, ZERO_PRICE)
                  ).to.be.revertedWith("PriceMustBeAboveZero")
              })
          })
          describe("cancelListing", function () {
              it("reverts if there is no listing", async function () {
                  const error = `NotListed("${cs2Skin.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.cancelListing(cs2Skin.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })
              it("reverts if anyone but the owner tries to call", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await cs2Skin.approve(user.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.cancelListing(cs2Skin.address, TOKEN_ID)
                  ).to.be.revertedWith("NotOwner")
              })
              it("emits event and removes listing", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  expect(await nftMarketplace.cancelListing(cs2Skin.address, TOKEN_ID)).to.emit(
                      "ItemCanceled"
                  )
                  const listing = await nftMarketplace.getListing(cs2Skin.address, TOKEN_ID)
                  assert(listing.price.toString() == "0")
              })
          })
          describe("buyItem", function () {
              it("reverts if the item isnt listed", async function () {
                  await expect(
                      nftMarketplace.buyItem(cs2Skin.address, TOKEN_ID)
                  ).to.be.revertedWith("NotListed")
              })
              it("reverts if the price isnt met", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.buyItem(cs2Skin.address, TOKEN_ID)
                  ).to.be.revertedWith("PriceNotMet")
              })
              it("transfers the nft to the buyer and updates internal proceeds record", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  expect(
                      await nftMarketplace.buyItem(cs2Skin.address, TOKEN_ID, { value: PRICE })
                  ).to.emit("ItemBought")
                  const newOwner = await cs2Skin.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)
                  assert(newOwner.toString() == user.address)
                  assert(deployerProceeds.toString() == PRICE.toString())
              })
          })
          describe("updateListing", function () {
              it("must be owner and listed", async function () {
                  await expect(
                      nftMarketplace.updateListing(cs2Skin.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NotListed")
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await expect(
                      nftMarketplace.updateListing(cs2Skin.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NotOwner")
              })
              it("reverts if new price is 0", async function () {
                  const updatedPrice = ethers.utils.parseEther("0")
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  await expect(nftMarketplace.updateListing(cs2Skin.address, TOKEN_ID, updatedPrice)).to.be.revertedWith("PriceMustBeAboveZero")
              })
              it("updates the price of the item", async function () {
                  const updatedPrice = ethers.utils.parseEther("0.2")
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  expect(
                      await nftMarketplace.updateListing(cs2Skin.address, TOKEN_ID, updatedPrice)
                  ).to.emit("ItemListed")
                  const listing = await nftMarketplace.getListing(cs2Skin.address, TOKEN_ID)
                  assert(listing.price.toString() == updatedPrice.toString())
              })
          })
          describe("withdrawProceeds", function () {
              it("doesn't allow 0 proceed withdrawls", async function () {
                  await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith("NoProceeds")
              })
              it("withdraws proceeds", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await nftMarketplace.buyItem(cs2Skin.address, TOKEN_ID, { value: PRICE })
                  nftMarketplace = nftMarketplaceContract.connect(deployer)

                  const deployerProceedsBefore = await nftMarketplace.getProceeds(deployer.address)
                  const deployerBalanceBefore = await deployer.getBalance()
                  const txResponse = await nftMarketplace.withdrawProceeds()
                  const transactionReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const deployerBalanceAfter = await deployer.getBalance()

                  assert(
                      deployerBalanceAfter.add(gasCost).toString() ==
                          deployerProceedsBefore.add(deployerBalanceBefore).toString()
                  )
              })
          })
          describe("read functions", function () {
              beforeEach(async function () {
                  await cs2Skin.mintNft()
                  await cs2Skin.mintNft()
                  await cs2Skin.approve(nftMarketplaceContract.address, SECOND_TOKEN_ID)
                  await cs2Skin.approve(nftMarketplaceContract.address, THIRD_TOKEN_ID)
              })

              it("tracks active listings for market enumeration", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  await nftMarketplace.listItem(
                      cs2Skin.address,
                      SECOND_TOKEN_ID,
                      PRICE.mul(2)
                  )

                  const activeListings = await nftMarketplace.getActiveListings()
                  const listingCount = await nftMarketplace.getActiveListingCount()
                  const firstListing = await nftMarketplace.getActiveListingAtIndex(0)
                  const secondListing = await nftMarketplace.getActiveListingAtIndex(1)

                  assert.equal(listingCount.toString(), "2")
                  assert.equal(activeListings.length, 2)
                  assert.equal(firstListing.tokenId.toString(), TOKEN_ID.toString())
                  assert.equal(secondListing.tokenId.toString(), SECOND_TOKEN_ID.toString())
                  assert.equal(activeListings[0].seller, deployer.address)
                  assert.equal(activeListings[1].price.toString(), PRICE.mul(2).toString())
              })

              it("removes canceled listings from the active market view", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  await nftMarketplace.listItem(cs2Skin.address, SECOND_TOKEN_ID, PRICE)

                  await nftMarketplace.cancelListing(cs2Skin.address, TOKEN_ID)

                  const activeListings = await nftMarketplace.getActiveListings()
                  const listingCount = await nftMarketplace.getActiveListingCount()

                  assert.equal(listingCount.toString(), "1")
                  assert.equal(activeListings.length, 1)
                  assert.equal(activeListings[0].tokenId.toString(), SECOND_TOKEN_ID.toString())
              })

              it("removes purchased listings from the active market view", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  await nftMarketplace.listItem(cs2Skin.address, SECOND_TOKEN_ID, PRICE)

                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await nftMarketplace.buyItem(cs2Skin.address, TOKEN_ID, { value: PRICE })

                  const activeListings = await nftMarketplace.getActiveListings()
                  const listingCount = await nftMarketplace.getActiveListingCount()

                  assert.equal(listingCount.toString(), "1")
                  assert.equal(activeListings.length, 1)
                  assert.equal(activeListings[0].tokenId.toString(), SECOND_TOKEN_ID.toString())
              })

              it("filters active listings by seller", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  await nftMarketplace.listItem(cs2Skin.address, SECOND_TOKEN_ID, PRICE.mul(2))

                  const userSkin = cs2SkinContract.connect(user)
                  const mintTx = await userSkin.mintNft()
                  const mintReceipt = await mintTx.wait(1)
                  const userTokenId = mintReceipt.events[0].args.tokenId
                  await userSkin.approve(nftMarketplaceContract.address, userTokenId)
                  const userMarketplace = nftMarketplaceContract.connect(user)
                  await userMarketplace.listItem(cs2Skin.address, userTokenId, PRICE.mul(3))

                  const deployerListings = await nftMarketplace.getActiveListingsBySeller(
                      deployer.address
                  )
                  const userListings = await nftMarketplace.getActiveListingsBySeller(user.address)

                  assert.equal(deployerListings.length, 2)
                  assert.equal(userListings.length, 1)
                  assert.equal(userListings[0].tokenId.toString(), userTokenId.toString())
                  assert.equal(userListings[0].seller, user.address)
              })

              it("tracks sold listings by seller and buyer", async function () {
                  await nftMarketplace.listItem(cs2Skin.address, TOKEN_ID, PRICE)
                  await nftMarketplace.listItem(cs2Skin.address, SECOND_TOKEN_ID, PRICE.mul(2))

                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await nftMarketplace.buyItem(cs2Skin.address, TOKEN_ID, { value: PRICE })
                  nftMarketplace = nftMarketplaceContract.connect(deployer)

                  const soldListings = await nftMarketplace.getSoldListings()
                  const soldCount = await nftMarketplace.getSoldListingCount()
                  const soldBySeller = await nftMarketplace.getSoldListingsBySeller(deployer.address)
                  const soldByBuyer = await nftMarketplace.getSoldListingsByBuyer(user.address)
                  const firstSold = await nftMarketplace.getSoldListingAtIndex(0)

                  assert.equal(soldCount.toString(), "1")
                  assert.equal(soldListings.length, 1)
                  assert.equal(soldBySeller.length, 1)
                  assert.equal(soldByBuyer.length, 1)
                  assert.equal(firstSold.tokenId.toString(), TOKEN_ID.toString())
                  assert.equal(firstSold.seller, deployer.address)
                  assert.equal(firstSold.buyer, user.address)
              })
          })
      })
