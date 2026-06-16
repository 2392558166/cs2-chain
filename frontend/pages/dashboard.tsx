import { useContext, useEffect, useMemo } from "react"
import Link from "next/link"
import { ethers } from "ethers"
import { toast } from "react-toastify"
import { MarketContext } from "../context"

export default function DashboardPage() {
  const {
    address,
    marketItems,
    connectWallet,
    isConnected,
    proceeds,
    marketContract,
    provider,
    refreshMarket,
    isMarketLoading,
    marketError,
    hasLoadedMarket
  } = useContext(MarketContext)

  useEffect(() => {
    void refreshMarket()
  }, [refreshMarket])

  const listedByMe = useMemo(() => {
    if (!address) {
      return []
    }

    return marketItems.filter(
      (item) => !item.sold && item.seller.toLowerCase() === address.toLowerCase()
    )
  }, [address, marketItems])

  const soldByMe = useMemo(() => {
    if (!address) {
      return []
    }

    return marketItems.filter(
      (item) => item.sold && item.seller.toLowerCase() === address.toLowerCase()
    )
  }, [address, marketItems])

  const ownedByMe = useMemo(() => {
    if (!address) {
      return []
    }

    return marketItems.filter((item) => item.owner?.toLowerCase() === address.toLowerCase())
  }, [address, marketItems])

  async function withdrawProceeds() {
    if (!provider || !marketContract) {
      await connectWallet()
      return
    }

    try {
      const signer = provider.getSigner()
      const tx = await marketContract.connect(signer).withdrawProceeds()
      await tx.wait(1)
      await refreshMarket({ force: true })
      toast.success("Proceeds withdrawn.")
    } catch (error) {
      console.error(error)
      toast.error("Failed to withdraw proceeds.")
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Locker</p>
        <h1 className="mt-3 text-3xl font-semibold">Track Your Inventory and Proceeds</h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Review your listed skins, sold inventory, held items, and withdrawable proceeds
          from the same on-chain market snapshot.
        </p>
        {!isConnected ? (
          <button
            className="mt-6 rounded-full bg-orange-500 px-5 py-3 text-sm font-medium text-white"
            onClick={() => void connectWallet()}
          >
            Connect Wallet
          </button>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            {isMarketLoading && !hasLoadedMarket
              ? "Loading withdrawable proceeds..."
              : `Withdrawable proceeds: ${proceeds} ETH`}
          </div>
          <button
            className="rounded-full border border-cyan-400/40 px-4 py-2 text-sm text-cyan-200"
            onClick={() => void withdrawProceeds()}
          >
            Withdraw Proceeds
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {marketError ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-950/20 p-8 text-red-100">
            {marketError}
          </div>
        ) : isMarketLoading && !hasLoadedMarket ? (
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-950/20 p-8 text-cyan-100">
            Loading your locker from the local chain...
          </div>
        ) : listedByMe.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-slate-400">
            No active listings owned by the current wallet yet.
          </div>
        ) : (
          listedByMe.map((item) => (
            <Link key={item.listingKey} href={`/nft/${item.tokenId}`}>
              <a className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 transition hover:border-cyan-400/40">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                  Token #{item.tokenId}
                </p>
                <h2 className="mt-3 text-lg font-semibold break-all">{item.name}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {item.weapon || "Unknown weapon"} · {item.paintKit || "Unknown finish"}
                </p>
                <p className="mt-4 text-sm text-slate-400">
                  Listed for {ethers.utils.formatEther(item.price)} ETH
                </p>
              </a>
            </Link>
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-orange-300">Sold Inventory</p>
          <div className="mt-4 space-y-3">
            {soldByMe.length === 0 ? (
              <p className="text-sm text-slate-400">No sold skins recorded yet.</p>
            ) : (
              soldByMe.map((item) => (
                <div
                  key={`${item.listingKey}-sold`}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <p className="font-medium text-slate-100">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Sold for {ethers.utils.formatEther(item.price)} ETH
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.weapon || "Unknown weapon"} · {item.rarity || "Unknown rarity"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Buyer: {item.buyer}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Held Inventory</p>
          <div className="mt-4 space-y-3">
            {ownedByMe.length === 0 ? (
              <p className="text-sm text-slate-400">No owned skins detected for this wallet.</p>
            ) : (
              ownedByMe.map((item) => (
                <div
                  key={`${item.listingKey}-owned`}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                >
                  <p className="font-medium text-slate-100">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.weapon || "Unknown weapon"} · {item.paintKit || "Unknown finish"}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Float {item.floatValue || "N/A"} · {item.exterior || "Unknown exterior"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
