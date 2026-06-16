import Link from "next/link"

export default function HomePage() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-8 shadow-2xl shadow-cyan-950/30">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-300">
          CS2 Skin Exchange
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-slate-100">
          Build, list, and trade CS2 skin NFTs on a wallet-native marketplace.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-400">
          Local Hardhat deployments, CS2 metadata, and trading flows are wired into a
          single marketplace shell.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/explore">
            <a className="rounded-full bg-orange-500 px-5 py-3 text-sm font-medium text-white">
              Browse Market
            </a>
          </Link>
          <Link href="/create">
            <a className="rounded-full border border-cyan-400/40 px-5 py-3 text-sm font-medium text-cyan-200">
              Mint a Skin
            </a>
          </Link>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
        <ul className="mt-5 space-y-4 text-sm text-slate-300">
          <li>Marketplace and CS2 NFT artifacts are synced locally.</li>
          <li>Market, create, detail, and dashboard flows all read the same state.</li>
          <li>Seller actions, sold history, and proceeds refresh are now wired into the UI.</li>
        </ul>
      </div>
    </section>
  )
}
