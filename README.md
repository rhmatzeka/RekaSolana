# Reka

Reka is a Solana-powered asset passport for second-hand student devices. It helps buyers verify a used laptop, phone, or camera before purchase by checking its identity hash, condition, service history, current ownership, and transfer trail.

## Problem

Second-hand device markets around Indonesian campuses are active, but trust is still fragile. Buyers often rely on chat screenshots, verbal claims, or one-time store notes. After a device is resold, important context can disappear:

- The serial number or IMEI is not consistently verifiable.
- Battery, display, SSD, camera, and port repair history is scattered.
- Ownership transfer is not recorded in a portable way.
- Service warranty depends on a single seller or shop database.

## Solution

Reka gives each physical device a public asset passport. A verifier such as a service shop, campus community, cooperative, or trusted seller can create and update the passport. Buyers can scan a QR link before buying and inspect the device history.

The product is designed for the RWA and Consumer Apps tracks:

- **RWA:** each passport represents a real physical device.
- **Consumer Apps:** the user experience is built around simple verification for everyday buyers.
- **Solana:** important lifecycle events can be recorded as low-cost public audit trails.

## MVP Features

- Landing page for the product story, problem, solution, and demo entry point.
- Dashboard for device passports.
- Create a passport for a laptop, phone, or camera.
- Hash serial number or IMEI locally before storing it.
- Add inspection, repair, warranty, and condition history.
- Mark service history as verified on-chain, verified from off-chain evidence,
  or owner-reported and still pending verification.
- Show history confidence, first verified date, and unknown prior history so
  buyers do not confuse missing data with a clean device.
- Require seller disclosure and a buyer inspection checklist before treating an
  older device as low risk.
- Let buyers flag possible hidden repair history as a disputed timeline entry.
- Transfer passport ownership after resale.
- Generate a public QR verification link.
- Write create, update, and transfer transactions to the Reka Anchor program on Solana Devnet.

## Smart Contract

The Anchor/Rust program source is included in:

```text
contracts/reka/programs/reka/src/lib.rs
```

Core instructions:

- `create_passport`: creates a `DevicePassport` PDA for a physical device.
- `add_history`: creates a `HistoryEntry` PDA for inspection, repair, warranty, or ownership history.
- `transfer_passport`: lets the current owner transfer the passport to a new owner wallet.

History entries are modeled as attestations. A verifier can record a service
that happened directly in the Reka flow, or verify an off-chain receipt by
storing its evidence hash/URI. If the owner only reports a service without a
verifier, the frontend can keep it as a pending local claim instead of treating
it as verified audit-trail data.

For older devices, Reka intentionally shows `Unknown before first verified`.
This prevents a verifier from implying that one verified service means the
device has only been serviced once in its lifetime.

Seller disclosure is intentionally treated as a claim, not proof. If the seller
does not disclose or declines to answer, the passport shows elevated buyer risk
until a fresh inspection checklist and evidence-backed attestation are added.

Current implementation status:

- Frontend MVP is functional.
- Solana Devnet smart contract calls are wired from the browser when a wallet is connected.
- Custom Anchor program source is included and the frontend is configured to call it.
- Program address: `AkRsKmDKtdwE6A4fU3M56L5mh1UxspS4MqMCCY4sG1Mg`.
- Latest Devnet upgrade includes service history attestation fields
  (`service_date`, `source`, and `status`).

Check whether the Devnet program is actually deployed and executable:

```bash
bun run check:program
```

After installing the Solana toolchain:

```bash
bun run contract:build
bun run contract:deploy
```

You can also run Anchor directly from the contract workspace:

```bash
cd contracts/reka
anchor build
anchor deploy --provider.cluster devnet
```

## Tech Stack

- React
- TypeScript
- Vite
- Bun
- Solana Web3.js
- Anchor / Rust program source
- QR verification with `qrcode.react`

## Demo Flow

1. Open the landing page and explain the trust problem in second-hand campus markets.
2. Click **Coba Dashboard** or **Buka MVP**.
3. Connect a Phantom wallet configured for Solana Devnet.
4. Create a passport for a laptop, phone, or camera.
5. Confirm the Solana program transaction.
6. Add a service or inspection history entry.
7. Add seller disclosure, then compare it with the buyer inspection checklist.
8. Try the hidden-repair dispute action to show how missing history is flagged.
9. Transfer the passport to a new owner.
10. Scan or share the QR verification link.

## Local Development

Project layout:

```text
apps/web         React + Vite frontend
contracts/reka   Anchor/Rust Solana program
scripts          Repository utility scripts
```

Install dependencies:

```bash
bun install
```

Run the app:

```bash
bun run dev
```

Build and lint:

```bash
bun run build
bun run lint
```

Check deployed program status:

```bash
bun run check:program
```

## Production Roadmap

- Fetch passport and history accounts directly from Solana instead of relying
  on browser-local state after transactions.
- Generate the production IDL directly from `anchor build` and keep the
  frontend IDL synchronized automatically.
- Add persistent off-chain metadata storage for public passport pages.
- Add verifier roles and review workflow.
- Add better fraud prevention around serial hash duplication.
- Prepare security review before mainnet release.

## Project Status

Reka is currently a hackathon-ready MVP moving toward beta production. The app is useful for demo, validation, and early testing, but a real production launch should include a deployed program, security review, monitoring, and a clearer verifier onboarding process.
