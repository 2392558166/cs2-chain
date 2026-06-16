# CS2 Marketplace Local Runbook

## Objective
Run the CS2 marketplace locally, sync contract artifacts into the frontend, and verify the mint -> list -> buy -> withdraw flow with two wallets.

## Workspace
- Backend root: `hardhat-nft-marketplace-fcc-main`
- Frontend root: `hardhat-nft-marketplace-fcc-main/frontend`

## Prerequisites
- MetaMask installed in the browser
- Two funded Hardhat accounts imported into MetaMask
- Use `npm.cmd` and `npx.cmd` in PowerShell on this machine

## One-Time Install

### Backend
```powershell
cd e:\区块链\BlockChain4CS2\BlockChain4CS2\hardhat-nft-marketplace-fcc-main
npm.cmd install
```

### Frontend
```powershell
cd e:\区块链\BlockChain4CS2\BlockChain4CS2\hardhat-nft-marketplace-fcc-main\frontend
npm.cmd install --legacy-peer-deps
```

## Verification Commands

### Backend checks
```powershell
cd e:\区块链\BlockChain4CS2\BlockChain4CS2\hardhat-nft-marketplace-fcc-main
npx.cmd hardhat compile
npx.cmd hardhat test --no-compile
```

### Frontend check
```powershell
cd e:\区块链\BlockChain4CS2\BlockChain4CS2\hardhat-nft-marketplace-fcc-main\frontend
npm.cmd run build
```

## Local Startup Sequence

### Terminal 1: start Hardhat node
```powershell
cd e:\区块链\BlockChain4CS2\BlockChain4CS2\hardhat-nft-marketplace-fcc-main
npx.cmd hardhat node
```

### Terminal 2: deploy contracts and sync frontend artifacts
```powershell
cd e:\区块链\BlockChain4CS2\BlockChain4CS2\hardhat-nft-marketplace-fcc-main
$env:UPDATE_FRONT_END='true'
npx.cmd hardhat deploy --network localhost --no-compile
```

Expected result:
- `frontend/constants/NftMarketplace.json`
- `frontend/constants/CS2Skin.json`
- `frontend/constants/networkMapping.json`

### Terminal 3: run frontend
```powershell
cd e:\区块链\BlockChain4CS2\BlockChain4CS2\hardhat-nft-marketplace-fcc-main\frontend
npm.cmd run dev
```

Open:
- `http://localhost:3000`

## Manual End-to-End Flow

### Wallet setup
1. Add Hardhat localhost network in MetaMask:
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency symbol: `ETH`
2. Import two accounts printed by `hardhat node`.

### Seller flow
1. Connect wallet on `/create`.
2. Fill in:
   - `name`
   - `weapon`
   - `paintKit`
   - `floatValue`
   - `pattern`
   - `rarity`
   - `exterior`
   - `image`
   - `description`
   - `price`
3. Submit `Mint and List`.
4. Confirm MetaMask transactions for mint, approve, and list.
5. Verify the new listing appears on `/explore`.

### Buyer flow
1. Switch MetaMask to the second Hardhat account.
2. Open `/explore` and enter the created listing.
3. Use `Buy Listing`.
4. Verify:
   - Detail page updates owner state
   - Listing disappears from active explore cards
   - Seller sale appears in `/dashboard`

### Seller proceeds flow
1. Switch back to the seller account.
2. Open `/dashboard`.
3. Confirm `Withdrawable proceeds` is greater than `0`.
4. Click `Withdraw Proceeds`.
5. Confirm the withdrawal transaction and verify proceeds refresh back down.

## Current Notes
- Hardhat commands succeed in this workspace even though Hardhat warns that Node 24 is unsupported.
- Frontend metadata rendering is richest for skins minted through the in-app data-URI flow.
- If the frontend shows no contracts, re-run deploy with `$env:UPDATE_FRONT_END='true'`.

## Automated Browser Verification

Goal 12 now has a browser-level localhost verification path that does not rely on the MetaMask extension UI.

### Install the isolated E2E tool dependencies
```powershell
cd e:\区块链\BlockChain4CS2\BlockChain4CS2\hardhat-nft-marketplace-fcc-main\e2e
npm.cmd install
```

### Start a clean frontend production server
```powershell
cd e:\区块链\BlockChain4CS2\BlockChain4CS2\hardhat-nft-marketplace-fcc-main\frontend
npm.cmd run build
npm.cmd run start -- -p 3001
```

### Run the Goal 12 browser E2E
```powershell
cd e:\区块链\BlockChain4CS2\BlockChain4CS2\hardhat-nft-marketplace-fcc-main\e2e
$env:APP_URL='http://127.0.0.1:3001'
npm.cmd run goal12
```

Expected result:
- The script creates a new CS2 listing from the seller account
- Opens the created listing in the browser
- Switches to the buyer account and buys the listing
- Switches back to the seller account and withdraws proceeds
- Prints `Goal 12 browser-level localhost E2E passed.`
