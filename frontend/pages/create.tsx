/* eslint-disable @next/next/no-img-element */
import { useContext, useState } from "react"
import { ethers } from "ethers"
import { toast } from "react-toastify"
import { MarketContext } from "../context"
import {
  buildCS2TokenUri,
  getMarketplaceContract,
  getSkinContract
} from "../utils/contracts"
import { CS2MintInput } from "../interfaces"

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024
const USER_REJECTED_REQUEST = 4001

type TransactionStep = "mint" | "approve" | "list"

function getCreateErrorMessage(error: unknown, step: TransactionStep) {
  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code?: number }).code
    if (code === USER_REJECTED_REQUEST) {
      return "Wallet request was rejected in MetaMask."
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return `The ${step} transaction failed.`
}

function buildPreviewPlaceholder(fileName: string) {
  const escapedName = fileName.replace(/[<>&"]/g, "")
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 960 720">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#0f172a" offset="0"/>
          <stop stop-color="#164e63" offset="0.55"/>
          <stop stop-color="#f97316" offset="1"/>
        </linearGradient>
      </defs>
      <rect width="960" height="720" rx="48" fill="url(#bg)"/>
      <text x="72" y="120" fill="#67e8f9" font-family="Arial" font-size="34" letter-spacing="8">CS2 SKIN</text>
      <text x="72" y="380" fill="#f8fafc" font-family="Arial" font-size="54" font-weight="700">${escapedName}</text>
      <text x="72" y="462" fill="#cbd5e1" font-family="Arial" font-size="28">Local upload preview stored off-chain for this demo</text>
    </svg>`

  return `data:image/svg+xml;base64,${window.btoa(svg)}`
}

export default function CreatePage() {
  const { provider, chainId, connectWallet, isConnected, refreshMarket } =
    useContext(MarketContext)
  const [form, setForm] = useState<CS2MintInput>({
    name: "",
    description: "",
    image: "",
    weapon: "",
    paintKit: "",
    floatValue: "",
    pattern: "",
    rarity: "",
    exterior: ""
  })
  const [price, setPrice] = useState("0.1")
  const [status, setStatus] = useState("Fill in the CS2 skin fields and a listing price.")
  const [imagePreview, setImagePreview] = useState("")

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setImagePreview("")
      setForm((prev) => ({ ...prev, image: "", imageName: "" }))
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      event.target.value = ""
      setImagePreview("")
      setForm((prev) => ({ ...prev, image: "", imageName: "" }))
      toast.error("Image is too large for browser preview. Use an image under 1 MB.")
      return
    }

    const metadataPreview = buildPreviewPlaceholder(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setImagePreview(result)
      setForm((prev) => ({ ...prev, image: metadataPreview, imageName: file.name }))
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!provider || !chainId) {
      await connectWallet()
      return
    }

    const signer = provider.getSigner()
    const marketplace = getMarketplaceContract(signer, chainId)
    const skin = getSkinContract(signer, chainId)

    if (!marketplace || !skin) {
      toast.error("Contracts are not available for the current network.")
      return
    }

    const tokenUri = buildCS2TokenUri(form)
    let currentStep: TransactionStep = "mint"
    let mintedTokenId: ethers.BigNumber | undefined

    try {
      setStatus("Minting CS2 skin...")
      const mintTx = await skin.mintSkin(tokenUri)
      const mintReceipt = await mintTx.wait(1)
      mintedTokenId = mintReceipt.events?.[0]?.args?.tokenId

      if (!mintedTokenId) {
        throw new Error("Mint succeeded but token ID was not found in the receipt.")
      }

      currentStep = "approve"
      setStatus("Approving marketplace...")
      const approveTx = await skin.approve(marketplace.address, mintedTokenId)
      await approveTx.wait(1)

      currentStep = "list"
      setStatus("Listing skin on market...")
      const listTx = await marketplace.listItem(
        skin.address,
        mintedTokenId,
        ethers.utils.parseEther(price)
      )
      await listTx.wait(1)

      setStatus(`Listed token #${mintedTokenId.toString()} successfully.`)
      toast.success("CS2 skin minted and listed.")
    } catch (error) {
      console.error(error)
      const message = getCreateErrorMessage(error, currentStep)
      setStatus(`${currentStep} step failed: ${message}`)
      toast.error(`${currentStep} step failed.`)
      return
    }

    try {
      await refreshMarket({ force: true })
    } catch (error) {
      console.error(error)
      setStatus(
        `Listed token #${mintedTokenId.toString()} successfully, but the page refresh failed. Open Market or refresh the browser.`
      )
      toast.info("Listing succeeded. Refresh the page if it does not appear immediately.")
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/50 p-8">
      <p className="text-sm uppercase tracking-[0.3em] text-orange-300">Create</p>
      <h1 className="mt-3 text-3xl font-semibold">Mint and List a CS2 Skin</h1>
      <p className="mt-4 max-w-2xl text-slate-400">
        This slice collects CS2 skin metadata, builds a token URI, then performs mint,
        approve, and list directly against the local contracts.
      </p>
      {!isConnected ? (
        <button
          className="mt-6 rounded-full bg-orange-500 px-5 py-3 text-sm font-medium text-white"
          onClick={() => void connectWallet()}
        >
          Connect Wallet
        </button>
      ) : null}
      <form className="mt-8 grid gap-5 max-w-3xl" onSubmit={handleSubmit}>
        {[
          ["name", "Skin Name"],
          ["weapon", "Weapon"],
          ["paintKit", "Paint Kit"],
          ["floatValue", "Float Value"],
          ["pattern", "Pattern"],
          ["rarity", "Rarity"],
          ["exterior", "Exterior"],
          ["description", "Description"]
        ].map(([key, label]) => (
          <label className="grid gap-2 text-sm" key={key}>
            <span className="text-slate-300">{label}</span>
            <input
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-100"
              value={form[key as keyof CS2MintInput]}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, [key]: event.target.value }))
              }
              required={key !== "description"}
              />
          </label>
        ))}
        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Image Upload</span>
          <span className="text-xs text-slate-500">
            Upload an image under 1 MB for local preview. To keep mint gas low, the NFT stores a compact preview placeholder and the file name.
          </span>
          <input
            className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-100 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-950"
            accept="image/*"
            type="file"
            onChange={handleImageUpload}
            required
          />
          {imagePreview ? (
            <img
              alt="Preview"
              className="mt-2 max-h-56 rounded-2xl border border-white/10 object-cover"
              src={imagePreview}
            />
          ) : null}
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Listing Price (ETH)</span>
          <input
            className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-slate-100"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0.1"
            required
          />
        </label>
        <button
          className="w-fit rounded-full bg-cyan-500 px-5 py-3 text-sm font-medium text-slate-950"
          type="submit"
        >
          Mint and List
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-400">{status}</p>
    </section>
  )
}
