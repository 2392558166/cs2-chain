import { Contract, ContractInterface, providers } from "ethers"
import skinAbi from "../constants/CS2Skin.json"
import marketAbi from "../constants/NftMarketplace.json"
import networkMapping from "../constants/networkMapping.json"
import { CS2MintInput } from "../interfaces"

type NetworkMapping = Record<string, { NftMarketplace?: string[]; CS2Skin?: string[] }>

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
  const metadata = {
    ...input
  }

  const encoded = window.btoa(unescape(encodeURIComponent(JSON.stringify(metadata))))
  return `data:application/json;base64,${encoded}`
}
