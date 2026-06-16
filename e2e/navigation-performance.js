const { chromium } = require("playwright")

const APP_URL = process.env.APP_URL || "http://127.0.0.1:3001"
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545"
const NAV_VISIBLE_BUDGET_MS = Number(process.env.NAV_VISIBLE_BUDGET_MS || 750)
const CHAIN_ID_HEX = "0x7a69"
const SELLER = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"

const rpcCalls = []

async function rpc(method, params = []) {
  const startedAt = Date.now()
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
  rpcCalls.push({ method, ms: Date.now() - startedAt })
  if (json.error) {
    throw new Error(`${method} failed: ${json.error.message}`)
  }
  return json.result
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })

  await context.exposeFunction("__perfRpc", rpc)
  await context.addInitScript(
    ({ seller, chainIdHex }) => {
      class PerfEthereumProvider {
        constructor() {
          this.selectedAddress = seller
          this.chainId = chainIdHex
          this.listeners = new Map()
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
          return window.__perfRpc(method, params ?? [])
        }

        on(event, listener) {
          const listeners = this.listeners.get(event) ?? []
          listeners.push(listener)
          this.listeners.set(event, listeners)
        }

        removeListener(event, listener) {
          const listeners = this.listeners.get(event) ?? []
          this.listeners.set(
            event,
            listeners.filter((candidate) => candidate !== listener)
          )
        }
      }

      window.ethereum = new PerfEthereumProvider()
    },
    { seller: SELLER, chainIdHex: CHAIN_ID_HEX }
  )

  const page = await context.newPage()
  const errors = []
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text())
    }
  })

  const initialStart = Date.now()
  await page.goto(`${APP_URL}/`, { waitUntil: "domcontentloaded" })
  const initialDomMs = Date.now() - initialStart
  await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {})
  const initialIdleMs = Date.now() - initialStart

  const targets = [
    { label: "Market", url: "/explore", text: "Explore Listed CS2 Skins" },
    { label: "Create", url: "/create", text: "Mint and List a CS2 Skin" },
    { label: "Locker", url: "/dashboard", text: "Track Your Inventory and Proceeds" },
    { label: "Home", url: "/", text: "Build, list, and trade" },
    { label: "Market", url: "/explore", text: "Explore Listed CS2 Skins" },
    { label: "Create", url: "/create", text: "Mint and List a CS2 Skin" },
    { label: "Locker", url: "/dashboard", text: "Track Your Inventory and Proceeds" }
  ]

  const results = []
  for (const target of targets) {
    const beforeCallCount = rpcCalls.length
    const start = Date.now()

    await page
      .getByRole("navigation")
      .getByRole("link", { name: target.label, exact: true })
      .click({ noWaitAfter: true })
    const clickReturnedMs = Date.now() - start

    await page.waitForURL(`**${target.url === "/" ? "/" : target.url}`, { timeout: 60000 })
    const urlMs = Date.now() - start

    await page.waitForFunction(
      (text) => document.body?.innerText.includes(text),
      target.text,
      { timeout: 60000 }
    )
    const visibleMs = Date.now() - start

    await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {})
    results.push({
      label: target.label,
      clickReturnedMs,
      urlMs,
      visibleMs,
      networkIdleMs: Date.now() - start,
      rpcCallsDuringStep: rpcCalls.length - beforeCallCount
    })
  }

  await browser.close()

  const slowResults = results.filter((result) => result.visibleMs > NAV_VISIBLE_BUDGET_MS)
  const report = {
    appUrl: APP_URL,
    budgetMs: NAV_VISIBLE_BUDGET_MS,
    initial: { domMs: initialDomMs, idleMs: initialIdleMs },
    results,
    rpcCalls: rpcCalls.length,
    errors
  }

  console.log(JSON.stringify(report, null, 2))

  if (errors.length > 0) {
    throw new Error(`Browser console reported ${errors.length} error(s).`)
  }

  if (slowResults.length > 0) {
    const summary = slowResults
      .map((result) => `${result.label}: ${result.visibleMs}ms`)
      .join(", ")
    throw new Error(`Navigation exceeded ${NAV_VISIBLE_BUDGET_MS}ms budget: ${summary}`)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
