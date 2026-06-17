const LOCAL_IMAGE_PREFIX = "cs2-market-image:"

export function createLocalImageKey() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function saveLocalImage(imageStorageKey: string, dataUrl: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(`${LOCAL_IMAGE_PREFIX}${imageStorageKey}`, dataUrl)
}

export function readLocalImage(imageStorageKey?: string) {
  if (typeof window === "undefined" || !imageStorageKey) {
    return ""
  }

  return window.localStorage.getItem(`${LOCAL_IMAGE_PREFIX}${imageStorageKey}`) ?? ""
}
