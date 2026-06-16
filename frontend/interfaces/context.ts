import { Contract, providers } from "ethers"
import { MarketItem } from "./market"

export type RefreshMarketOptions = {
  force?: boolean
}

export type MarketContextValue = {
  isConnected: boolean
  address: string | null
  provider: providers.Web3Provider | null
  chainId: number | null
  isSupportedNetwork: boolean
  walletError: string | null
  marketItems: MarketItem[]
  marketContract: Contract | null
  skinContract: Contract | null
  proceeds: string
  isMarketLoading: boolean
  marketError: string | null
  hasLoadedMarket: boolean
  connectWallet: () => Promise<void>
  switchToSupportedNetwork: () => Promise<void>
  refreshMarket: (options?: RefreshMarketOptions) => Promise<void>
}
