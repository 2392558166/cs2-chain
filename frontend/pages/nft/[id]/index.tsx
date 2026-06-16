/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/router"
import Link from "next/link"
import { useContext, useEffect, useMemo, useState } from "react"
import { ethers } from "ethers"
import { toast } from "react-toastify"
import { MarketContext } from "../../../context"

export default function NftDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const {
    marketItems,
    address,
    provider,
    chainId,
    connectWallet,
    marketContract,
    skinContract,
    refreshMarket,
    isMarketLoading,
    marketError,
    hasLoadedMarket
  } = useContext(MarketContext)
  const [newPrice, setNewPrice] = useState("")
  const [actionState, setActionState] = useState("Ready to inspect and trade this listing.")

  useEffect(() => {
    void refreshMarket()
  }, [refreshMarket])

  const item = useMemo(
    () => marketItems.find((candidate) => candidate.tokenId === String(id)),
    [id, marketItems]
  )

  async function buyItem() {
    if (!provider || !chainId || !item) {
      await connectWallet()
      return
    }

    if (!marketContract || !skinContract) {
      return
    }

    try {
      setActionState("Submitting buy transaction...")
      const signer = provider.getSigner()
      const tx = await marketContract.connect(signer).buyItem(item.nftAddress, item.tokenId, {
        value: item.price
      })
      await tx.wait(1)
      await refreshMarket({ force: true })
      setActionState("Listing purchased successfully.")
      toast.success("Listing purchased.")
      router.replace(router.asPath)
    } catch (error) {
      console.error(error)
      setActionState("Buy transaction failed.")
      toast.error("Failed to buy listing.")
    }
  }

  async function cancelListing() {
    if (!provider || !chainId || !item) {
      await connectWallet()
      return
    }

    if (!marketContract) {
      return
    }

    try {
      setActionState("Cancelling listing...")
      const signer = provider.getSigner()
      const tx = await marketContract.connect(signer).cancelListing(item.nftAddress, item.tokenId)
      await tx.wait(1)
      await refreshMarket({ force: true })
      setActionState("Listing cancelled.")
      toast.success("Listing cancelled.")
      router.replace(router.asPath)
    } catch (error) {
      console.error(error)
      setActionState("Cancel transaction failed.")
      toast.error("Failed to cancel listing.")
    }
  }

  async function updateListing() {
    if (!provider || !chainId || !item) {
      await connectWallet()
      return
    }

    if (!marketContract) {
      return
    }

    const parsedPrice = Number(newPrice)
    if (!newPrice || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Enter a valid price greater than 0 ETH.")
      return
    }

    try {
      setActionState("Updating listing price...")
      const signer = provider.getSigner()
      const tx = await marketContract.connect(signer).updateListing(
        item.nftAddress,
        item.tokenId,
        ethers.utils.parseEther(newPrice)
      )
      await tx.wait(1)
      await refreshMarket({ force: true })
      setActionState("Listing price updated.")
      toast.success("Listing price updated.")
      setNewPrice("")
      router.replace(router.asPath)
    } catch (error) {
      console.error(error)
      setActionState("Price update failed.")
      toast.error("Failed to update listing.")
    }
  }

  const isSeller =
    address && item ? item.seller.toLowerCase() === address.toLowerCase() : false

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-orange-300">Listing Detail</p>
      <h1 className="mt-3 text-3xl font-semibold">Skin Listing {id ?? "..."}</h1>
      {marketError ? (
        <p className="mt-4 max-w-2xl text-red-100">
          {marketError}
        </p>
      ) : !item ? (
        <p className="mt-4 max-w-2xl text-slate-400">
          {isMarketLoading && !hasLoadedMarket
            ? "Loading listing data from the local chain..."
            : "This listing is not loaded yet. Connect your wallet or return to the market."}
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              {item.image ? (
                <img
                  alt={item.name}
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                  src={item.image}
                />
              ) : (
                <div className="flex aspect-[4/3] items-end rounded-2xl border border-dashed border-white/10 bg-[linear-gradient(160deg,rgba(34,211,238,0.18),rgba(15,23,42,0.6)),linear-gradient(180deg,rgba(249,115,22,0.18),transparent)] p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                      No Preview Image
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-slate-100">
                      {item.weapon || "CS2 Skin"}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Add an `image` URL when minting to display a full item preview.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-200">
                  Token #{item.tokenId}
                </span>
                <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-orange-200">
                  {item.rarity || "Classified"}
                </span>
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-slate-50">{item.name}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {item.description || "This listing currently relies on token metadata for its skin description."}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Weapon</p>
                  <p className="mt-2 text-sm font-medium text-slate-100">{item.weapon || "Unknown"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Paint Kit</p>
                  <p className="mt-2 text-sm font-medium text-slate-100">{item.paintKit || "Unknown"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Float</p>
                  <p className="mt-2 text-sm font-medium text-slate-100">{item.floatValue || "N/A"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Exterior</p>
                  <p className="mt-2 text-sm font-medium text-slate-100">{item.exterior || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Trade State</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p>Price: {ethers.utils.formatEther(item.price)} ETH</p>
                <p>Seller: {item.seller}</p>
                <p>Current owner: {item.owner ?? "Unknown"}</p>
                <p>Pattern: {item.pattern || "N/A"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Token URI</p>
              <p className="mt-3 break-all text-sm text-slate-300">{item.tokenUri}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={typeof id === "string" ? `/nft/${id}/details` : "#"}>
              <a className="inline-flex rounded-full border border-cyan-400/40 px-4 py-2 text-sm text-cyan-200">
                View Full Metadata
              </a>
            </Link>
            {!isSeller ? (
              <button
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white"
                onClick={() => void buyItem()}
                disabled={item.sold}
              >
                {item.sold ? "Sold" : "Buy Listing"}
              </button>
            ) : (
              <>
                <input
                  className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-100"
                  placeholder={`New price, current ${ethers.utils.formatEther(item.price)}`}
                  value={newPrice}
                  onChange={(event) => setNewPrice(event.target.value)}
                />
                <button
                  className="rounded-full border border-orange-400/40 px-4 py-2 text-sm text-orange-200"
                  onClick={() => void cancelListing()}
                >
                  Cancel Listing
                </button>
                <button
                  className="rounded-full border border-cyan-400/40 px-4 py-2 text-sm text-cyan-200"
                  onClick={() => void updateListing()}
                >
                  Update Price
                </button>
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-slate-400">{actionState}</p>
        </>
      )}
    </section>
  )
}
