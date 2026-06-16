const { chromium } = require("playwright")

const APP_URL = process.env.APP_URL || "http://127.0.0.1:3000"
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545"
const CHAIN_ID_HEX = "0x7a69"
const SELLER = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
const BUYER = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"

async function rpc(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params
    })
  })

  const json = await response.json()
  if (json.error) {
    throw new Error(`${method} failed: ${json.error.message}`)
  }
  return json.result
}

async function waitForText(page, text) {
  await page.waitForFunction(
    (expected) => document.body?.innerText.includes(expected),
    text,
    { timeout: 60000 }
  )
}

async function connectWallet(page) {
  const button = page.locator("button", { hasText: "Connect Wallet" }).first()
  if (await button.isVisible().catch(() => false)) {
    await button.click()
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 2200 } })

  await context.exposeFunction("__goal12Rpc", rpc)
  await context.addInitScript(
    ({ seller, chainIdHex }) => {
      class Goal12EthereumProvider {
        constructor() {
          this.selectedAddress = seller
          this.chainId = chainIdHex
          this.listeners = new Map()
          this.isMetaMask = false
        }

        async request({ method, params }) {
          if (method === "eth_requestAccounts" || method === "eth_accounts") {
            return [this.selectedAddress]
          }
          if (method === "eth_chainId") {
            return this.chainId
          }
          if (method === "net_version") {
            return String(parseInt(this.chainId, 16))
          }
          if (method === "wallet_switchEthereumChain") {
            const target = params?.[0]?.chainId ?? this.chainId
            this.chainId = target
            this.emit("chainChanged", this.chainId)
            return null
          }
          if (method === "wallet_addEthereumChain") {
            return null
          }
          return window.__goal12Rpc(method, params ?? [])
        }

        on(event, listener) {
          const current = this.listeners.get(event) ?? []
          current.push(listener)
          this.listeners.set(event, current)
        }

        removeListener(event, listener) {
          const current = this.listeners.get(event) ?? []
          this.listeners.set(
            event,
            current.filter((candidate) => candidate !== listener)
          )
        }

        emit(event, payload) {
          const current = this.listeners.get(event) ?? []
          current.forEach((listener) => listener(payload))
        }

        setAccount(address) {
          this.selectedAddress = address
          this.emit("accountsChanged", [address])
        }
      }

      window.ethereum = new Goal12EthereumProvider()
    },
    { seller: SELLER, chainIdHex: CHAIN_ID_HEX }
  )

  const page = await context.newPage()
  page.on("console", (message) => {
    if (message.type() === "error") {
      console.error(`[browser:${message.type()}] ${message.text()}`)
    }
  })

  const uniqueName = `Goal12-${Date.now()}`

  await page.goto(`${APP_URL}/create`, { waitUntil: "networkidle" })
  await page.waitForLoadState("domcontentloaded")
  await connectWallet(page)

  await page.getByLabel("Skin Name").fill(uniqueName)
  await page.getByLabel("Weapon").fill("AK-47")
  await page.getByLabel("Paint Kit").fill("Redline")
  await page.getByLabel("Float Value").fill("0.12")
  await page.getByLabel("Pattern").fill("321")
  await page.getByLabel("Rarity").fill("Classified")
  await page.getByLabel("Exterior").fill("Field-Tested")
  await page.getByLabel("Image").fill("https://example.com/cs2-skin.png")
  await page.getByLabel("Description").fill("Goal 12 browser-level verification skin.")
  await page.getByLabel("Listing Price (ETH)").fill("0.1")
  await page.getByRole("button", { name: "Mint and List" }).click()

  await waitForText(page, "successfully")

  await page.goto(`${APP_URL}/explore`, { waitUntil: "networkidle" })
  await waitForText(page, uniqueName)
  await page.locator("a", { hasText: uniqueName }).first().click()

  await waitForText(page, "Current owner:")
  const detailBeforeBuy = await page.locator("body").innerText()
  if (!detailBeforeBuy.toLowerCase().includes(SELLER.toLowerCase())) {
    throw new Error("Seller address not visible on detail page before buy")
  }

  await page.evaluate((buyer) => {
    window.ethereum.setAccount(buyer)
  }, BUYER)
  await page.waitForFunction(
    () => document.body?.innerText.includes("Buy Listing"),
    { timeout: 60000 }
  )
  await page.getByRole("button", { name: "Buy Listing" }).click()
  await waitForText(page, "purchased successfully")

  const detailAfterBuy = await page.locator("body").innerText()
  if (!detailAfterBuy.toLowerCase().includes(BUYER)) {
    throw new Error("Buyer address not reflected on detail page after buy")
  }

  await page.evaluate((seller) => {
    window.ethereum.setAccount(seller)
  }, SELLER)
  await page.goto(`${APP_URL}/dashboard`, { waitUntil: "networkidle" })
  await waitForText(page, "Withdrawable proceeds:")

  const dashboardBeforeWithdraw = await page.locator("body").innerText()
  if (!dashboardBeforeWithdraw.includes("0.1 ETH")) {
    throw new Error("Expected seller proceeds to show 0.1 ETH before withdraw")
  }
  if (!dashboardBeforeWithdraw.includes(uniqueName)) {
    throw new Error("Expected sold inventory to show the minted listing")
  }

  await page.getByRole("button", { name: "Withdraw Proceeds" }).click()
  await waitForText(page, "Withdrawable proceeds: 0.0 ETH")

  console.log("Goal 12 browser-level localhost E2E passed.")
  console.log(`Created and traded listing: ${uniqueName}`)

  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
