export type ActiveListing = {
  nftAddress: string
  tokenId: string
  price: string
  seller: string
}

export type CS2SkinMetadata = {
  name: string
  description: string
  image: string
  weapon: string
  paintKit: string
  floatValue: string
  pattern: string
  rarity: string
  exterior: string
}

export type MarketItem = ActiveListing &
  CS2SkinMetadata & {
    listingKey: string
    owner: string | null
    tokenUri: string
    sold: boolean
    buyer: string | null
  }

export type SoldListing = {
  nftAddress: string
  tokenId: string
  price: string
  seller: string
  buyer: string
}

export type CS2MintInput = {
  name: string
  description: string
  image: string
  weapon: string
  paintKit: string
  floatValue: string
  pattern: string
  rarity: string
  exterior: string
}
