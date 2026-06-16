import Link from "next/link"
import { ReactNode, useContext } from "react"
import { MarketContext } from "../../context"

type LayoutProps = {
  children: ReactNode
}

const links = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Market" },
  { href: "/create", label: "Create" },
  { href: "/dashboard", label: "Locker" }
]

export function Layout({ children }: LayoutProps) {
  const {
    address,
    connectWallet,
    isConnected,
    isSupportedNetwork,
    switchToSupportedNetwork,
    walletError
  } = useContext(MarketContext)

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <a className="text-lg font-semibold tracking-[0.24em] text-orange-400">
                CS2 MARKET
              </a>
            </Link>
            <nav className="flex gap-5 text-sm text-slate-300 lg:hidden">
              {links.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a className="transition hover:text-cyan-300">{link.label}</a>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
              {isConnected ? `MetaMask ${shortAddress}` : "MetaMask not connected"}
            </div>
            <div
              className={`rounded-full border px-3 py-1 text-xs ${
                isSupportedNetwork
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-200"
              }`}
            >
              {isSupportedNetwork ? "Hardhat Localhost 31337" : "Switch to Hardhat 31337"}
            </div>
            {!isConnected ? (
              <button
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white"
                onClick={() => void connectWallet()}
              >
                Connect MetaMask
              </button>
            ) : !isSupportedNetwork ? (
              <button
                className="rounded-full border border-cyan-400/40 px-4 py-2 text-sm text-cyan-200"
                onClick={() => void switchToSupportedNetwork()}
              >
                Switch Network
              </button>
            ) : null}
          </div>

          <nav className="hidden gap-5 text-sm text-slate-300 lg:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className="transition hover:text-cyan-300">{link.label}</a>
              </Link>
            ))}
          </nav>
        </div>
        {walletError ? (
          <div className="border-t border-red-400/20 bg-red-950/30 px-6 py-2 text-center text-sm text-red-100">
            {walletError}
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  )
}
