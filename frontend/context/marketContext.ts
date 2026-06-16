import { createContext } from "react"
import { MarketContextValue } from "../interfaces"

export const MarketContext = createContext<MarketContextValue>({
  isConnected: false,
  address: null,
  provider: null,
  chainId: null,
  isSupportedNetwork: false,
  walletError: null,
  marketItems: [],
  marketContract: null,
  skinContract: null,
  proceeds: "0",
  isMarketLoading: false,
  marketError: null,
  hasLoadedMarket: false,
  connectWallet: async () => {},
  switchToSupportedNetwork: async () => {},
  refreshMarket: async () => {}
})
