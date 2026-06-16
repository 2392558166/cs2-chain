# CS2 NFT Marketplace

一个基于 Hardhat、Solidity、Next.js 和 MetaMask 的本地 CS2 皮肤 NFT 市场。项目支持铸造 CS2 皮肤 NFT、上架、购买、查看 Locker 库存、查看已售记录和提现收益。

## 功能

- `CS2Skin` ERC721 合约，支持写入 CS2 皮肤 metadata。
- `NftMarketplace` 合约，支持 list、buy、cancel、update、withdraw。
- Next.js 前端页面：Home、Market、Create、Locker、NFT Detail。
- MetaMask 本地链适配，支持提示/切换到 `Hardhat Localhost 31337`。
- Playwright 本地浏览器 E2E，覆盖 mint -> list -> buy -> withdraw。
- 导航性能回归脚本，避免页面切换重新变慢。

## 目录

```text
contracts/    Solidity contracts
deploy/       hardhat-deploy scripts
frontend/     Next.js frontend
e2e/          Playwright local browser checks
test/         Hardhat tests
docs/         spec, plan, and runbook
```

## 环境要求

- Node.js
- npm
- MetaMask 浏览器插件

本项目在本地 Hardhat 链上运行，默认 Chain ID 是 `31337`。

## 安装

```powershell
npm.cmd install

cd frontend
npm.cmd install

cd ..\e2e
npm.cmd install
```

## 启动本地项目

终端 1：启动本地链。

```powershell
npx.cmd hardhat node
```

终端 2：部署合约并同步前端 ABI/地址。

```powershell
$env:UPDATE_FRONT_END='true'
npx.cmd hardhat deploy --network localhost --no-compile
```

终端 3：启动前端。

```powershell
cd frontend
npm.cmd run build
npm.cmd run start -- -p 3001
```

浏览器打开：

```text
http://127.0.0.1:3001
```

## MetaMask 配置

页面会尝试帮助你切换或添加本地网络。如果需要手动添加：

- Network name: `Hardhat Localhost 31337`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

将 `npx hardhat node` 输出的本地测试账户私钥导入 MetaMask。只使用本地测试账户，不要导入真实有资金的钱包私钥。

## 测试

Hardhat 合约测试：

```powershell
npx.cmd hardhat test --no-compile
```

前端构建：

```powershell
cd frontend
npm.cmd run build
```

浏览器 E2E：

```powershell
cd e2e
$env:APP_URL='http://127.0.0.1:3001'
npm.cmd run goal12
```

导航性能检查：

```powershell
cd e2e
$env:APP_URL='http://127.0.0.1:3001'
npm.cmd run perf:navigation
```

## GitHub 发布注意事项

不要提交这些内容：

- `.env`
- `node_modules/`
- `frontend/.next/`
- `artifacts/`
- `cache/`
- 本地运行日志
- 本地调试截图

`.env.example` 只保留占位符，不要放真实 RPC key、私钥或助记词。
