# Implementation Plan: CS2 Decentralized Skin Marketplace

## Overview
This project will turn `hardhat-nft-marketplace-fcc-main` into the main backend and integration workspace, then add a new frontend inside it that borrows route structure from `nft-marketplace-main/client` while replacing the data model, copy, and visuals with a CS2 skin marketplace.

## Architecture Decisions
- Main workspace: `hardhat-nft-marketplace-fcc-main`
- Frontend target: `hardhat-nft-marketplace-fcc-main/frontend`
- Metadata source of truth: tokenURI JSON for CS2 item fields
- Marketplace model: keep listing-based market logic and extend contract read APIs rather than switching to custody or full off-chain aggregation
- Implementation order: backend baseline -> CS2 NFT contract -> read-model contract upgrades -> deploy sync -> frontend shell -> frontend data model -> feature pages -> final E2E verification

## Task List

### Phase 1: Foundation

## Task 1: Stabilize the Hardhat baseline

**Description:** Confirm the backend reference project compiles, tests, and deploys locally before any semantic changes.

**Acceptance criteria:**
- [ ] `npx hardhat compile` succeeds
- [ ] `npx hardhat test` succeeds or failures are reduced to understood baseline issues with fixes landed
- [ ] Current contract interfaces, scripts, and deployment behavior are documented in notes for later frontend integration

**Verification:**
- [ ] Run `npx hardhat compile`
- [ ] Run `npx hardhat test`

**Dependencies:** None

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/contracts/*`
- `hardhat-nft-marketplace-fcc-main/test/unit/*`
- `hardhat-nft-marketplace-fcc-main/deploy/*`
- `hardhat-nft-marketplace-fcc-main/hardhat.config.js`

**Estimated scope:** Medium

## Task 2: Replace demo NFT with CS2 skin NFT contract

**Description:** Introduce a CS2 skin ERC-721 contract and migrate deployment scripts, scripts, and tests away from `BasicNft` semantics.

**Acceptance criteria:**
- [ ] A CS2-themed ERC-721 contract exists with mint and tokenURI support
- [ ] Unit tests cover mint, owner/balance changes, and tokenURI behavior
- [ ] Deploy and helper scripts reference CS2 naming instead of `BasicNft`

**Verification:**
- [ ] Run `npx hardhat compile`
- [ ] Run `npx hardhat test`

**Dependencies:** Task 1

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/contracts/test/BasicNft.sol` or replacement contract
- `hardhat-nft-marketplace-fcc-main/deploy/02-deploy-basic-nft.js`
- `hardhat-nft-marketplace-fcc-main/scripts/*.js`
- `hardhat-nft-marketplace-fcc-main/test/unit/basicNft.test.js`

**Estimated scope:** Medium

### Checkpoint: Foundation
- [ ] Contracts compile and tests pass after CS2 NFT migration
- [ ] No remaining user-facing `BasicNft` demo semantics in active scripts or tests

### Phase 2: Backend Read Model and Sync

## Task 3: Extend marketplace read APIs for frontend consumption

**Description:** Add stable query methods and indexing so the listing-based marketplace can power market, detail, and dashboard views directly.

**Acceptance criteria:**
- [ ] Market listings can be enumerated without replaying external scripts
- [ ] Seller-specific and detail-level read methods exist
- [ ] Existing transaction protections and proceeds logic remain unchanged

**Verification:**
- [ ] Run `npx hardhat compile`
- [ ] Run `npx hardhat test`

**Dependencies:** Task 2

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/contracts/NftMarketplace.sol`
- `hardhat-nft-marketplace-fcc-main/test/unit/NftMarketplace.test.js`
- `hardhat-nft-marketplace-fcc-main/scripts/*.js`

**Estimated scope:** Medium

## Task 4: Rebuild deploy-to-frontend sync pipeline

**Description:** Make local deploys emit ABI and address artifacts into the new frontend directory inside this repository.

**Acceptance criteria:**
- [ ] Deploy scripts no longer write to external legacy paths
- [ ] Frontend receives marketplace and CS2 NFT ABI files plus a network mapping file
- [ ] A localhost deploy updates frontend artifacts automatically

**Verification:**
- [ ] Run `npx hardhat deploy --network localhost`
- [ ] Manually confirm generated files under `hardhat-nft-marketplace-fcc-main/frontend`

**Dependencies:** Task 3

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/deploy/03-update-front-end.js`
- `hardhat-nft-marketplace-fcc-main/helper-hardhat-config.js`
- `hardhat-nft-marketplace-fcc-main/frontend/lib/*` or `frontend/constants/*`

**Estimated scope:** Small

### Checkpoint: Backend Integration
- [ ] Backend deploy produces frontend-consumable artifacts
- [ ] Read APIs are test-covered and stable enough for UI work

### Phase 3: Frontend Foundation

## Task 5: Stand up the frontend target

**Description:** Create the frontend app inside the backend project and port only the route and structural baseline needed for continued development.

**Acceptance criteria:**
- [ ] `frontend/package.json` exists and installs cleanly
- [ ] Home, explore, create, dashboard, and detail route skeletons build
- [ ] Wallet/provider initialization works without hardcoded old artifacts

**Verification:**
- [ ] Run `npm install` in `frontend`
- [ ] Run `npm run build`

**Dependencies:** Task 4

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/frontend/**`

**Estimated scope:** Large

## Task 6: Rebuild the frontend data model

**Description:** Replace the old item schema with a contract-aligned CS2 marketplace model and aggregation helpers.

**Acceptance criteria:**
- [ ] Shared types distinguish listing data, metadata, and UI-composed view models
- [ ] Contract helper/context code reads the new marketplace APIs
- [ ] No remaining frontend dependency on the old custody-market `itemId` shape unless explicitly backed by new contract methods

**Verification:**
- [ ] Run `npm run build`
- [ ] Run `npm run lint`

**Dependencies:** Task 5

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/frontend/context/*`
- `hardhat-nft-marketplace-fcc-main/frontend/interfaces/*`
- `hardhat-nft-marketplace-fcc-main/frontend/utils/*`

**Estimated scope:** Medium

### Checkpoint: Frontend Foundation
- [ ] Frontend builds successfully against local ABI/address artifacts
- [ ] Pages can request and shape real market data

### Phase 4: User Flows

## Task 7: Implement create and list flow

**Description:** Build the create page so users can enter CS2 metadata, mint the NFT, approve the marketplace, and list it with clear transaction states.

**Acceptance criteria:**
- [ ] CS2-specific form fields exist
- [ ] Transaction states cover upload, mint, approve, list, success, and failure
- [ ] Successful creation produces a listing visible on the market page

**Verification:**
- [ ] Run `npm run build`
- [ ] Manual localhost flow: connect wallet and create/list one item

**Dependencies:** Task 6

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/frontend/pages/create.tsx`
- `hardhat-nft-marketplace-fcc-main/frontend/components/common/*`
- `hardhat-nft-marketplace-fcc-main/frontend/context/*`

**Estimated scope:** Medium

## Task 8: Implement explore page and listing cards

**Description:** Render real on-chain market listings with CS2 skin presentation and basic loading/empty states.

**Acceptance criteria:**
- [ ] Explore page renders listing cards from contract-backed data
- [ ] Cards show image, name, weapon or paint kit, rarity, float summary, price, and seller snippet
- [ ] Empty and loading states are handled

**Verification:**
- [ ] Run `npm run build`
- [ ] Manual localhost check on `/explore`

**Dependencies:** Task 6

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/frontend/pages/explore.tsx`
- `hardhat-nft-marketplace-fcc-main/frontend/components/collections/*`

**Estimated scope:** Small

## Task 9: Implement detail pages and trading actions

**Description:** Add item detail routing, detailed metadata display, buy action, and seller-only listing management actions.

**Acceptance criteria:**
- [ ] Detail routes load a real listing by the chosen route key
- [ ] Seller-only actions and buyer-only actions are conditionally correct
- [ ] Buy flow updates displayed state after purchase

**Verification:**
- [ ] Run `npm run build`
- [ ] Manual localhost flow: open detail page and complete a buy with a second account

**Dependencies:** Task 8

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/frontend/pages/nft/*`
- `hardhat-nft-marketplace-fcc-main/frontend/context/*`

**Estimated scope:** Medium

## Task 10: Implement dashboard and proceeds view

**Description:** Build the personal center around created/listed, sold, and owned states plus proceeds withdrawal where available.

**Acceptance criteria:**
- [ ] Dashboard shows current address state across owned/listed/sold or equivalent views
- [ ] Seller proceeds can be viewed and withdrawn or a clear alternative path exists
- [ ] Data sourcing for sold items is explicit and consistent with the chosen backend model

**Verification:**
- [ ] Run `npm run build`
- [ ] Manual localhost flow: seller sees updated state after sale and can withdraw proceeds

**Dependencies:** Task 9

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/frontend/pages/dashboard.tsx`
- `hardhat-nft-marketplace-fcc-main/frontend/context/*`

**Estimated scope:** Medium

### Checkpoint: Core Features
- [ ] Mint/list/browse/buy/withdraw works locally end-to-end
- [ ] Frontend state matches contract state across views

### Phase 5: Theme and Final Verification

## Task 11: Apply CS2 visual redesign

**Description:** Replace the generic NFT look and copy with a cohesive CS2 skin-market experience.

**Acceptance criteria:**
- [ ] Core pages use CS2-specific copy, labels, and visuals
- [ ] Theme emphasizes rarity, float, price, and tactical-market styling
- [ ] Legacy marketplace branding is removed from the shipped UI

**Verification:**
- [ ] Run `npm run build`
- [ ] Manual page review on home, explore, create, detail, and dashboard

**Dependencies:** Task 10

**Files likely touched:**
- `hardhat-nft-marketplace-fcc-main/frontend/components/**`
- `hardhat-nft-marketplace-fcc-main/frontend/pages/**`
- `hardhat-nft-marketplace-fcc-main/frontend/styles/**`

**Estimated scope:** Medium

## Task 12: Run final end-to-end verification

**Description:** Validate the full local demo path and capture the exact startup/run sequence.

**Acceptance criteria:**
- [ ] Contracts compile and tests pass
- [ ] Frontend builds successfully
- [ ] Local demo path works across at least two accounts
- [ ] Final runbook commands are documented

**Verification:**
- [ ] Run `npx hardhat compile`
- [ ] Run `npx hardhat test`
- [ ] Run `npx hardhat node`
- [ ] Run `npx hardhat deploy --network localhost`
- [ ] Run `npm run build` in `frontend`
- [ ] Manual localhost demo

**Dependencies:** Task 11

**Files likely touched:**
- `docs/*`
- `hardhat-nft-marketplace-fcc-main/frontend/**`
- `hardhat-nft-marketplace-fcc-main/scripts/**`

**Estimated scope:** Small

### Checkpoint: Complete
- [ ] All success criteria in the spec are met
- [ ] Local runbook is clear and repeatable
- [ ] Ready for review/demo

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Baseline reference project does not compile cleanly in current environment | High | Fix baseline before semantic changes and keep Goal 1 isolated |
| Frontend expects old custody-market fields | High | Replace shared types early and keep contract/UI models explicit |
| Metadata hosting introduces blocking complexity | Medium | Start with local-safe tokenURI/data URL strategy for first milestone |
| Sold-items dashboard view is awkward with current listing model | Medium | Extend read APIs or derive via events only after documenting the tradeoff |
| ABI sync path drifts from frontend expectations | Medium | Make deploy script output the exact artifact shape consumed by frontend helpers |

## Open Questions
- Whether sold-item tracking should be contract-indexed or event-derived will be finalized after Goal 3 inspection.
- If the existing frontend reference assets are too coupled to old branding, replacement assets may be added instead of migrated.
