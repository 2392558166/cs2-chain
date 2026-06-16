# Spec: CS2 Decentralized Skin Marketplace

## Assumptions
1. The implementation target is `hardhat-nft-marketplace-fcc-main`, and that project will become the main deliverable.
2. The frontend will live inside the backend project as `hardhat-nft-marketplace-fcc-main/frontend` so contract deployment and ABI sync stay in one workspace.
3. We will reuse structure and patterns from `nft-marketplace-main/client`, but we will not ship its branding, copy, or old custody-market item model.
4. The first delivery target is local development on Hardhat localhost, not public testnet deployment.
5. CS2 item metadata will be tokenURI-driven JSON, with the frontend responsible for parsing display fields from metadata plus listing state from the marketplace contract.

## Objective
Build a locally runnable CS2-themed NFT marketplace that supports the full flow: connect wallet, mint a CS2 skin NFT, approve and list it, browse market listings, view item details, buy from another account, and withdraw seller proceeds. The result must be a real integration of the two reference projects rather than a superficial UI reskin.

## Tech Stack
- Backend: Hardhat, Solidity, JavaScript, `hardhat-deploy`, `ethers`, `chai`
- Frontend: Next.js 12, React 18, TypeScript, Tailwind CSS, `ethers`, `web3modal`
- NFT standard: ERC-721
- Metadata model: tokenURI JSON with CS2-specific fields

## Commands
Backend root: `hardhat-nft-marketplace-fcc-main`

Build contracts:
```bash
npx hardhat compile
```

Run contract tests:
```bash
npx hardhat test
```

Start local chain:
```bash
npx hardhat node
```

Deploy to localhost:
```bash
npx hardhat deploy --network localhost
```

Frontend root:
```bash
hardhat-nft-marketplace-fcc-main/frontend
```

Install frontend dependencies:
```bash
npm install
```

Run frontend dev server:
```bash
npm run dev
```

Build frontend:
```bash
npm run build
```

Lint frontend:
```bash
npm run lint
```

## Project Structure
```text
hardhat-nft-marketplace-fcc-main/
  contracts/              Solidity contracts for marketplace and CS2 NFT
  deploy/                 Hardhat deploy scripts and frontend sync
  scripts/                Local workflow scripts such as mint/list/buy
  test/unit/              Contract unit tests
  frontend/               New Next.js frontend target for this project
    pages/                Route entry points
    components/           UI building blocks
    context/              Wallet and market state
    interfaces/           Shared frontend types
    lib/ or constants/    ABI and address mapping output
    styles/               Global theme styles
docs/
  cs2-marketplace-spec.md
  cs2-marketplace-plan.md
```

## Code Style
Keep changes direct and task-scoped. Prefer small helpers over generic abstractions.

```ts
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
```

Conventions:
- Use CS2 domain naming everywhere: `CS2Skin`, `listingId`, `paintKit`, `floatValue`.
- Keep contract read models explicit rather than overloading old `itemId`-based shapes.
- Prefer additive changes that preserve current marketplace transaction guarantees.
- Preserve existing formatting style in each subproject.

## Testing Strategy
- Contract layer: `npx hardhat test` after each backend slice.
- Contract compile gate: `npx hardhat compile` after Solidity or deploy-script changes.
- Frontend layer: `npm run build` and `npm run lint` after frontend slices.
- Manual integration: local node + deploy + wallet flow for mint, list, buy, withdraw.
- New marketplace read APIs must be covered by unit tests, not just event assertions.

## Boundaries
- Always:
  - Keep `listItem`, `cancelListing`, `buyItem`, `updateListing`, and `withdrawProceeds` semantics intact.
  - Keep ABI/address sync automatic after deploy.
  - Verify every slice with the relevant test/build command before moving on.
- Ask first:
  - Adding third-party services beyond the existing stack
  - Changing the deployment target beyond localhost-first delivery
  - Replacing the listing model with an off-chain aggregation architecture
- Never:
  - Copy reference project branding or README text into the deliverable
  - Depend on old external output paths outside this repository
  - Fake frontend fields that the backend does not actually provide

## Success Criteria
1. `hardhat-nft-marketplace-fcc-main` compiles and tests cleanly on the updated baseline.
2. The demo NFT contract is replaced by a CS2 skin NFT model and its scripts/tests use CS2 naming.
3. The marketplace contract exposes stable read APIs for market listings, seller listings, ownership-related views, and item detail lookup needed by the frontend.
4. A frontend exists inside `hardhat-nft-marketplace-fcc-main/frontend` and consumes generated ABI/address artifacts from local deploys.
5. The create page supports CS2 metadata entry, metadata upload flow, mint, approve, and list.
6. The explore, detail, and dashboard pages render CS2-specific listing data instead of the old generic NFT schema.
7. The local end-to-end flow works across at least two accounts: mint -> list -> browse -> buy -> withdraw proceeds.

## Open Questions
- Metadata upload can initially use data URLs or local JSON-compatible URIs during local development; production-grade storage is out of scope for the first milestone.
- “Sold items” in dashboard will be implemented either via contract state/indexing or event aggregation depending on the simplest reliable contract extension after baseline inspection.
