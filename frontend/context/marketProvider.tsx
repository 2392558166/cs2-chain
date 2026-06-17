import { BigNumber, Contract, providers, utils } from "ethers"
import { ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { toast } from "react-toastify"
import { MarketContext } from "./marketContext"
import { ActiveListing, MarketItem, RefreshMarketOptions, SoldListing } from "../interfaces"
import { decodeCS2TokenUri, getMarketplaceContract, getSkinContract } from "../utils/contracts"

type MarketProviderProps = {
  children: ReactNode
}

const MARKET_CACHE_TTL_MS = 15000
const SUPPORTED_CHAIN_ID = 31337
const SUPPORTED_CHAIN_ID_HEX = "0x7a69"
const HARDHAT_NETWORK_PARAMS = {
  chainId: SUPPORTED_CHAIN_ID_HEX,
  chainName: "Hardhat Localhost 31337",
  nativeCurrency: {
    name: "Hardhat ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: ["http://127.0.0.1:8545"],
  blockExplorerUrls: []
}

function getWalletErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code?: number }).code
    if (code === 4001) {
      return "Wallet request was rejected in MetaMask."
    }
    if (code === -32002) {
      return "MetaMask already has a pending request. Open the extension to continue."
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return "MetaMask connection failed."
}

export function MarketProvider({ children }: MarketProviderProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [provider, setProvider] = useState<providers.Web3Provider | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [marketItems, setMarketItems] = useState<MarketItem[]>([])
  const [marketContract, setMarketContract] = useState<Contract | null>(null)
  const [skinContract, setSkinContract] = useState<Contract | null>(null)
  const [proceeds, setProceeds] = useState("0")
  const [isMarketLoading, setIsMarketLoading] = useState(false)
  const [marketError, setMarketError] = useState<string | null>(null)
  const [hasLoadedMarket, setHasLoadedMarket] = useState(false)
  const addressRef = useRef<string | null>(null)
  const cacheRef = useRef<{ chainId: number; loadedAt: number } | null>(null)
  const inFlightLoadRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    addressRef.current = address
  }, [address])

  const isSupportedNetwork = chainId === SUPPORTED_CHAIN_ID

  const resetMarketSnapshot = useCallback(() => {
    setMarketItems([])
    setProceeds("0")
    setHasLoadedMarket(false)
    cacheRef.current = null
  }, [])

  function parseMetadata(tokenUri: string) {
    return decodeCS2TokenUri(tokenUri) ?? {}
  }

  async function hydrateListing(
    nftContract: Contract,
    listing: ActiveListing | SoldListing,
    sold: boolean
  ): Promise<MarketItem> {
    const tokenId = listing.tokenId.toString()
    const price = listing.price.toString()
    const tokenUri: string = await nftContract.tokenURI(tokenId)
    const metadata = parseMetadata(tokenUri)
    const owner = sold ? (listing as SoldListing).buyer : await nftContract.ownerOf(tokenId).catch(() => null)

    return {
      ...listing,
      tokenId,
      price,
      listingKey: `${listing.nftAddress}-${tokenId}`,
      owner,
      tokenUri,
      name: metadata.name ?? tokenUri,
      description: metadata.description ?? "",
      image: metadata.image ?? "",
      weapon: metadata.weapon ?? "",
      paintKit: metadata.paintKit ?? "",
      floatValue: metadata.floatValue ?? "",
      pattern: metadata.pattern ?? "",
      rarity: metadata.rarity ?? "",
      exterior: metadata.exterior ?? "",
      sold,
      buyer: sold ? (listing as SoldListing).buyer : null
    }
  }

  useEffect(() => {
    async function restoreWalletSession() {
      if (typeof window === "undefined" || !window.ethereum?.selectedAddress) {
        return
      }

      const web3Provider = new providers.Web3Provider(window.ethereum, "any")
      const network = await web3Provider.getNetwork()

      const contract = getMarketplaceContract(web3Provider, network.chainId)
      const nftContract = getSkinContract(web3Provider, network.chainId)

      setProvider(web3Provider)
      setChainId(network.chainId)
      setAddress(window.ethereum.selectedAddress)
      setMarketContract(contract)
      setSkinContract(nftContract)
      setWalletError(network.chainId === SUPPORTED_CHAIN_ID ? null : "Switch MetaMask to Hardhat Localhost 31337.")
    }

    void restoreWalletSession()
  }, [])

  const loadMarketItems = useCallback(
    async (
      web3Provider: providers.Web3Provider,
      currentChainId: number,
      options: RefreshMarketOptions = {}
    ) => {
      const contract = getMarketplaceContract(web3Provider, currentChainId)
      const nftContract = getSkinContract(web3Provider, currentChainId)

      if (!contract || !nftContract) {
        resetMarketSnapshot()
        setMarketContract(null)
        setSkinContract(null)
        return
      }

      if (currentChainId !== SUPPORTED_CHAIN_ID) {
        resetMarketSnapshot()
        setMarketContract(null)
        setSkinContract(null)
        setWalletError("Switch MetaMask to Hardhat Localhost 31337.")
        return
      }

      const cache = cacheRef.current
      if (
        !options.force &&
        cache &&
        cache.chainId === currentChainId &&
        Date.now() - cache.loadedAt < MARKET_CACHE_TTL_MS
      ) {
        setMarketContract(contract)
        setSkinContract(nftContract)
        return
      }

      if (inFlightLoadRef.current) {
        return inFlightLoadRef.current
      }

      const loadPromise = (async () => {
        setIsMarketLoading(true)
        setMarketError(null)

        try {
          const [activeListings, soldListings]: [ActiveListing[], SoldListing[]] =
            await Promise.all([contract.getActiveListings(), contract.getSoldListings()])
          const hydratedItems = await Promise.all(
            activeListings.map((listing) => hydrateListing(nftContract, listing, false))
          )
          const soldItems = await Promise.all(
            soldListings.map((listing) => hydrateListing(nftContract, listing, true))
          )

          if (addressRef.current) {
            const sellerProceeds = await contract.getProceeds(addressRef.current)
            setProceeds(utils.formatEther(sellerProceeds))
          } else {
            setProceeds("0")
          }

          setMarketItems([...hydratedItems, ...soldItems])
          setMarketContract(contract)
          setSkinContract(nftContract)
          setHasLoadedMarket(true)
          cacheRef.current = { chainId: currentChainId, loadedAt: Date.now() }
        } catch (error) {
          console.error(error)
          setMarketError("Unable to load market data. Check your wallet network and local node.")
        } finally {
          setIsMarketLoading(false)
          inFlightLoadRef.current = null
        }
      })()

      inFlightLoadRef.current = loadPromise
      return loadPromise
    },
    [resetMarketSnapshot]
  )

  const refreshMarket = useCallback(async (options: RefreshMarketOptions = {}) => {
    if (!provider || !chainId) {
      return
    }

    await loadMarketItems(provider, chainId, options)
  }, [chainId, loadMarketItems, provider])

  useEffect(() => {
    const ethereum = window.ethereum

    async function handleAccountsChanged(...args: unknown[]) {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : []
      const nextAddress = accounts[0] ?? null
      setAddress(nextAddress)
      addressRef.current = nextAddress
      setWalletError(null)
      if (!nextAddress) {
        resetMarketSnapshot()
      } else {
        cacheRef.current = null
        if (provider && chainId) {
          await loadMarketItems(provider, chainId, { force: true })
        }
      }
    }

    function handleChainChanged(...args: unknown[]) {
      const nextChainId = typeof args[0] === "string" ? args[0] : "0x0"
      const parsedChainId = Number.parseInt(nextChainId, 16)
      setChainId(parsedChainId)
      setWalletError(parsedChainId === SUPPORTED_CHAIN_ID ? null : "Switch MetaMask to Hardhat Localhost 31337.")
      resetMarketSnapshot()
    }

    ethereum?.on?.("accountsChanged", handleAccountsChanged)
    ethereum?.on?.("chainChanged", handleChainChanged)

    return () => {
      ethereum?.removeListener?.("accountsChanged", handleAccountsChanged)
      ethereum?.removeListener?.("chainChanged", handleChainChanged)
    }
  }, [chainId, loadMarketItems, provider, resetMarketSnapshot])

  useEffect(() => {
    if (!provider || !chainId) {
      return
    }

    if (!address) {
      setProceeds("0")
      return
    }

    const contract = getMarketplaceContract(provider, chainId)
    if (!contract) {
      return
    }

    void contract.getProceeds(address).then((sellerProceeds: BigNumber) => {
      setProceeds(utils.formatEther(sellerProceeds))
    })
  }, [address, chainId, provider])

  async function connectWallet() {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.info("Please install MetaMask to connect your wallet.")
      return
    }

    try {
      setWalletError(null)
      await switchToSupportedNetwork()

      const web3Provider = new providers.Web3Provider(window.ethereum, "any")
      const accounts = await web3Provider.send("eth_requestAccounts", [])
      const network = await web3Provider.getNetwork()

      setProvider(web3Provider)
      setAddress(accounts[0] ?? null)
      addressRef.current = accounts[0] ?? null
      setChainId(network.chainId)
      setMarketContract(getMarketplaceContract(web3Provider, network.chainId))
      setSkinContract(getSkinContract(web3Provider, network.chainId))
      setWalletError(network.chainId === SUPPORTED_CHAIN_ID ? null : "Switch MetaMask to Hardhat Localhost 31337.")
      await loadMarketItems(web3Provider, network.chainId, { force: true })
    } catch (error) {
      const message = getWalletErrorMessage(error)
      setWalletError(message)
      toast.error(message)
    }
  }

  async function switchToSupportedNetwork() {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.info("Please install MetaMask to connect your wallet.")
      return
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SUPPORTED_CHAIN_ID_HEX }]
      })
      setWalletError(null)
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && (error as { code?: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [HARDHAT_NETWORK_PARAMS]
        })
        setWalletError(null)
        return
      }

      const message = getWalletErrorMessage(error)
      setWalletError(message)
      throw error
    }
  }

  return (
    <MarketContext.Provider
      value={{
        isConnected: Boolean(address),
        address,
        provider,
        chainId,
        isSupportedNetwork,
        walletError,
        marketItems,
        marketContract,
        skinContract,
        proceeds,
        isMarketLoading,
        marketError,
        hasLoadedMarket,
        connectWallet,
        switchToSupportedNetwork,
        refreshMarket
      }}
    >
      {children}
    </MarketContext.Provider>
  )
}
