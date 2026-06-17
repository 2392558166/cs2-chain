import { Contract, ContractInterface, providers } from "ethers"
import skinAbi from "../constants/CS2Skin.json"
import marketAbi from "../constants/NftMarketplace.json"
import networkMapping from "../constants/networkMapping.json"
import { CS2MintInput } from "../interfaces"

type NetworkMapping = Record<string, { NftMarketplace?: string[]; CS2Skin?: string[] }>
type MetadataValue = string | number | boolean | null | MetadataValue[] | { [key: string]: MetadataValue }

export function getMarketplaceAddress(chainId: number) {
  const mapping = networkMapping as NetworkMapping
  return mapping[String(chainId)]?.NftMarketplace?.[0] ?? null
}

export function getMarketplaceContract(
  provider: providers.Provider | providers.JsonRpcSigner,
  chainId: number
) {
  const address = getMarketplaceAddress(chainId)
  if (!address) {
    return null
  }

  return new Contract(address, marketAbi as ContractInterface, provider)
}

export function getSkinAddress(chainId: number) {
  const mapping = networkMapping as NetworkMapping
  return mapping[String(chainId)]?.CS2Skin?.[0] ?? null
}

export function getSkinContract(
  provider: providers.Provider | providers.JsonRpcSigner,
  chainId: number
) {
  const address = getSkinAddress(chainId)
  if (!address) {
    return null
  }

  return new Contract(address, skinAbi as ContractInterface, provider)
}

export function buildCS2TokenUri(input: CS2MintInput) {
  const metadata = { ...input }
  const json = JSON.stringify(metadata)
  const bytes = new TextEncoder().encode(json)
  let binary = ""

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return `data:application/json;base64,${window.btoa(binary)}`
}

export function decodeCS2TokenUri(tokenUri: string) {
  if (!tokenUri.startsWith("data:application/json;base64,")) {
    return null
  }

  try {
    const base64 = tokenUri.replace("data:application/json;base64,", "")
    const binary = window.atob(base64)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    return repairMojibake(JSON.parse(json)) as Partial<CS2MintInput>
  } catch {
    return null
  }
}

function repairMojibake(value: MetadataValue): MetadataValue {
  if (typeof value === "string") {
    return repairString(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairMojibake(item))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, repairMojibake(item)])
    )
  }

  return value
}

function repairString(value: string) {
  if (!/[ÃÂÄÅÆÇÈÉÊËÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/.test(value)) {
    return value
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff)
    return new TextDecoder().decode(bytes)
  } catch {
    return value
  }
}
