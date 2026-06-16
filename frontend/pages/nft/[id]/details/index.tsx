/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/router"
import { useContext, useEffect, useMemo } from "react"
import { MarketContext } from "../../../../context"

export default function NftMetadataPage() {
  const router = useRouter()
  const { id } = router.query
  const { marketItems, refreshMarket, isMarketLoading, marketError, hasLoadedMarket } =
    useContext(MarketContext)

  useEffect(() => {
    void refreshMarket()
  }, [refreshMarket])

  const item = useMemo(
    () => marketItems.find((candidate) => candidate.tokenId === String(id)),
    [id, marketItems]
  )

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Metadata</p>
      <h1 className="mt-3 text-3xl font-semibold">Deep Stats for Listing {id ?? "..."}</h1>
      {marketError ? (
        <p className="mt-4 max-w-2xl text-red-100">
          {marketError}
        </p>
      ) : !item ? (
        <p className="mt-4 max-w-2xl text-slate-400">
          {isMarketLoading && !hasLoadedMarket
            ? "Loading metadata from the local chain..."
            : "Listing metadata is not available yet."}
        </p>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-300">
            {item.image ? (
              <img
                alt={item.name}
                className="aspect-[4/3] w-full rounded-2xl object-cover"
                src={item.image}
              />
            ) : null}
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-cyan-300">Core Profile</p>
            <p className="mt-3 text-xl font-semibold text-slate-50">{item.name}</p>
            <p className="mt-3 leading-7 text-slate-400">
              {item.description || "Pending metadata parser"}
            </p>
            <p className="mt-4 break-all text-xs text-slate-500">{item.tokenUri}</p>
          </div>
          <div className="grid gap-4">
            {[
              ["Weapon", item.weapon || "Pending metadata parser"],
              ["Paint Kit", item.paintKit || "Pending metadata parser"],
              ["Float", item.floatValue || "Pending metadata parser"],
              ["Pattern", item.pattern || "Pending metadata parser"],
              ["Rarity", item.rarity || "Pending metadata parser"],
              ["Exterior", item.exterior || "Pending metadata parser"]
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-300"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-orange-300">{label}</p>
                <p className="mt-3 text-base font-medium text-slate-100">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
