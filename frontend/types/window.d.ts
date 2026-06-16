export {}

declare global {
  interface EthereumProvider {
    isMetaMask?: boolean
    selectedAddress?: string
    request: (args: { method: string; params?: unknown[] | Record<string, unknown>[] }) => Promise<unknown>
    on?: (eventName: string, listener: (...args: unknown[]) => void) => void
    removeListener?: (eventName: string, listener: (...args: unknown[]) => void) => void
  }

  interface Window {
    ethereum?: EthereumProvider
  }
}
