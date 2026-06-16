/* eslint-disable @next/next/no-img-element */
import { useContext, useEffect } from "react"
import { ethers } from "ethers"
import Link from "next/link"
import { MarketContext } from "../context"

export default function ExplorePage() {
  const {
    marketItems,
    isConnected,
    connectWallet,
    refreshMarket,
    isMarketLoading,
    marketError,
    hasLoadedMarket
  } = useContext(MarketContext)
  const activeListings = marketItems.filter((item) => !item.sold)

  useEffect(() => {
    void refreshMarket()
  }, [refreshMarket])

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Market</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Explore Listed CS2 Skins</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Live listings are hydrated from on-chain listings plus CS2 skin metadata.
            </p>
          </div>
          {!isConnected ? (
            <button
              className="rounded-full bg-orange-500 px-5 py-3 text-sm font-medium text-white"
              onClick={() => void connectWallet()}
            >
              Connect Wallet
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {marketError ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-950/20 p-8 text-red-100">
            {marketError}
          </div>
        ) : isMarketLoading && !hasLoadedMarket ? (
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-950/20 p-8 text-cyan-100">
            Loading market data from the local chain...
          </div>
        ) : activeListings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-slate-400">
            No active listings yet. Mint and list a skin from the create page.
          </div>
        ) : (
          activeListings.map((item) => (
            <Link key={item.listingKey} href={`/nft/${item.tokenId}`}>
              <a className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 transition hover:border-cyan-400/40">
                {item.image ? (
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
                    <img
                      alt={item.name}
                      className="h-full w-full object-cover"
                      src={item.image}
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] rounded-2xl border border-dashed border-white/10 bg-slate-900/80 p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      Preview Pending
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-100">
                      {item.weapon || "CS2 Skin"}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Add an image URL during mint to render a full card preview.
                    </p>
                  </div>
                )}
                <div className="mt-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                      Token #{item.tokenId}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold break-words">{item.name}</h2>
                  </div>
                  <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-orange-200">
                    {item.rarity || "Classified"}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Weapon</p>
                    <p className="mt-2 text-sm font-medium text-slate-100">
                      {item.weapon || "Unlabeled"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Paint Kit</p>
                    <p className="mt-2 text-sm font-medium text-slate-100">
                      {item.paintKit || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em] text-slate-300">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1">
                    Float {item.floatValue || "N/A"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                    Pattern {item.pattern || "N/A"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1">
                    {item.exterior || "Exterior TBD"}
                  </span>
                </div>
                <div className="mt-6 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Price</span>
                  <span className="font-medium text-orange-300">
                    {ethers.utils.formatEther(item.price)} ETH
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Seller</span>
                  <span className="font-medium text-slate-200">
                    {item.seller.slice(0, 10)}...
                  </span>
                </div>
              </a>
            </Link>
          ))
        )}
      </div>
    </section>
  )
}
