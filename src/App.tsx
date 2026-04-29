import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  FileClock,
  Fingerprint,
  Laptop,
  Link2,
  Loader2,
  MapPin,
  Plus,
  Search,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Store,
  UserRoundCheck,
  Wallet,
  Wrench,
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { Buffer } from 'buffer'
import './App.css'

type DeviceCategory = 'Laptop' | 'Phone' | 'Camera'
type HistoryKind = 'Inspection' | 'Repair' | 'Ownership' | 'Warranty'
type ViewMode = 'home' | 'app'

type PassportHistory = {
  id: string
  kind: HistoryKind
  title: string
  notes: string
  verifier: string
  date: string
  txSignature?: string
}

type Passport = {
  id: string
  category: DeviceCategory
  brand: string
  model: string
  serialHash: string
  condition: string
  batteryHealth: string
  estimatedValue: string
  city: string
  ownerName: string
  ownerWallet: string
  verifier: string
  createdAt: string
  trustScore: number
  lastTxSignature?: string
  history: PassportHistory[]
}

type FormState = {
  category: DeviceCategory
  brand: string
  model: string
  serialNumber: string
  condition: string
  batteryHealth: string
  estimatedValue: string
  city: string
  ownerName: string
  ownerWallet: string
  verifier: string
}

type SolanaProvider = {
  isPhantom?: boolean
  publicKey?: PublicKey
  connect: () => Promise<{ publicKey: PublicKey }>
  signAndSendTransaction: (
    transaction: Transaction,
  ) => Promise<{ signature: string }>
}

declare global {
  interface Window {
    solana?: SolanaProvider
  }
}

const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
)

const initialPassports: Passport[] = [
  {
    id: 'RK-24-MBP-7F3A',
    category: 'Laptop',
    brand: 'Apple',
    model: 'MacBook Pro M1 13"',
    serialHash: 'sha256:84b1e2c915d7fa02',
    condition: 'Grade A-',
    batteryHealth: '88%',
    estimatedValue: 'Rp 11.800.000',
    city: 'Bandung',
    ownerName: 'Nadia Putri',
    ownerWallet: '7mQK...9px2',
    verifier: 'RuangService ITB',
    createdAt: '2026-04-19',
    trustScore: 91,
    lastTxSignature:
      '5qkDEMOqYdApbW2buRJoVq9dc8NhzS4vjx2E9nA22Reka',
    history: [
      {
        id: 'H-001',
        kind: 'Inspection',
        title: 'Initial device inspection',
        notes:
          'Body minor dent, keyboard normal, display no dead pixel, battery cycle 412.',
        verifier: 'RuangService ITB',
        date: '2026-04-19',
        txSignature:
          '5qkDEMOqYdApbW2buRJoVq9dc8NhzS4vjx2E9nA22Reka',
      },
      {
        id: 'H-002',
        kind: 'Warranty',
        title: '30-day campus store warranty',
        notes: 'Warranty covers keyboard, display, SSD, and charging port.',
        verifier: 'Koperasi Mahasiswa',
        date: '2026-04-20',
      },
    ],
  },
  {
    id: 'RK-24-IPN-12C8',
    category: 'Phone',
    brand: 'Apple',
    model: 'iPhone 13 128GB',
    serialHash: 'sha256:d7c12fc56f2291aa',
    condition: 'Grade B+',
    batteryHealth: '84%',
    estimatedValue: 'Rp 6.250.000',
    city: 'Yogyakarta',
    ownerName: 'Fajar Nugroho',
    ownerWallet: '2Vrb...hS1a',
    verifier: 'Jogja Gadget Lab',
    createdAt: '2026-04-21',
    trustScore: 86,
    history: [
      {
        id: 'H-003',
        kind: 'Repair',
        title: 'Battery and True Tone check',
        notes:
          'Battery original, camera original, display has been replaced by verified service partner.',
        verifier: 'Jogja Gadget Lab',
        date: '2026-04-21',
      },
    ],
  },
  {
    id: 'RK-24-SONY-42E1',
    category: 'Camera',
    brand: 'Sony',
    model: 'Alpha a6400',
    serialHash: 'sha256:be54017a93c8d16f',
    condition: 'Grade A',
    batteryHealth: 'N/A',
    estimatedValue: 'Rp 9.400.000',
    city: 'Surabaya',
    ownerName: 'Raka Mahendra',
    ownerWallet: '9JvP...xK03',
    verifier: 'KameraKampus',
    createdAt: '2026-04-22',
    trustScore: 94,
    history: [
      {
        id: 'H-004',
        kind: 'Inspection',
        title: 'Shutter count verified',
        notes:
          'Shutter count 18.204, sensor clean, lens mount normal, invoice hash attached.',
        verifier: 'KameraKampus',
        date: '2026-04-22',
      },
    ],
  },
]

const blankForm: FormState = {
  category: 'Laptop',
  brand: '',
  model: '',
  serialNumber: '',
  condition: 'Grade A',
  batteryHealth: '',
  estimatedValue: '',
  city: '',
  ownerName: '',
  ownerWallet: '',
  verifier: '',
}

const deviceIcons = {
  Laptop,
  Phone: Smartphone,
  Camera,
}

const kindIcons = {
  Inspection: ShieldCheck,
  Repair: Wrench,
  Ownership: UserRoundCheck,
  Warranty: BadgeCheck,
}

const storageKey = 'reka-passports-v1'

function readStoredPassports() {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return initialPassports
    const parsed = JSON.parse(saved) as Passport[]
    return parsed.length > 0 ? parsed : initialPassports
  } catch {
    return initialPassports
  }
}

function readInitialSelectedId(passports: Passport[]) {
  const params = new URLSearchParams(window.location.search)
  const passportId = params.get('passport')
  if (passportId && passports.some((passport) => passport.id === passportId)) {
    return passportId
  }
  return passports[0]?.id ?? initialPassports[0].id
}

function readInitialView(passports: Passport[]): ViewMode {
  const params = new URLSearchParams(window.location.search)
  const passportId = params.get('passport')
  if (passportId && passports.some((passport) => passport.id === passportId)) {
    return 'app'
  }
  return 'home'
}

function App() {
  const [boot] = useState(() => {
    const storedPassports = readStoredPassports()
    return {
      passports: storedPassports,
      selectedId: readInitialSelectedId(storedPassports),
      initialView: readInitialView(storedPassports),
    }
  })
  const [passports, setPassports] = useState<Passport[]>(boot.passports)
  const [selectedId, setSelectedId] = useState(boot.selectedId)
  const [view, setView] = useState<ViewMode>(boot.initialView)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<FormState>(blankForm)
  const [historyForm, setHistoryForm] = useState({
    kind: 'Inspection' as HistoryKind,
    title: '',
    notes: '',
    verifier: '',
  })
  const [transferForm, setTransferForm] = useState({
    ownerName: '',
    ownerWallet: '',
  })
  const [walletAddress, setWalletAddress] = useState('')
  const [isWritingChain, setIsWritingChain] = useState(false)
  const [chainMessage, setChainMessage] = useState('')

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(passports))
  }, [passports])

  const filteredPassports = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return passports
    return passports.filter((passport) =>
      [
        passport.id,
        passport.brand,
        passport.model,
        passport.city,
        passport.ownerName,
        passport.serialHash,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [passports, query])

  const selectedPassport =
    passports.find((passport) => passport.id === selectedId) ?? passports[0]

  const publicUrl = selectedPassport
    ? `${window.location.origin}${window.location.pathname}?passport=${selectedPassport.id}`
    : window.location.href

  async function connectWallet() {
    if (!window.solana) {
      setChainMessage('Wallet belum ditemukan. Install Phantom lalu pakai Testnet.')
      return
    }

    const response = await window.solana.connect()
    setWalletAddress(response.publicKey.toBase58())
    setChainMessage('Wallet tersambung ke Reka Testnet mode.')
  }

  async function writeMemoToTestnet(memo: string) {
    if (!window.solana?.publicKey) {
      await connectWallet()
    }

    const provider = window.solana
    if (!provider?.publicKey) {
      return undefined
    }

    setIsWritingChain(true)
    setChainMessage('Menulis audit memo ke Solana Testnet...')

    try {
      const connection = new Connection(clusterApiUrl('testnet'), 'confirmed')
      const latestBlockhash = await connection.getLatestBlockhash('confirmed')
      const transaction = new Transaction().add(
        new TransactionInstruction({
          keys: [],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(new TextEncoder().encode(memo)),
        }),
      )

      transaction.feePayer = provider.publicKey
      transaction.recentBlockhash = latestBlockhash.blockhash

      const { signature } = await provider.signAndSendTransaction(transaction)
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed',
      )
      setChainMessage('Audit memo berhasil dicatat di Solana Testnet.')
      return signature
    } catch (error) {
      setChainMessage(
        error instanceof Error
          ? error.message
          : 'Transaksi Testnet dibatalkan atau gagal.',
      )
      return undefined
    } finally {
      setIsWritingChain(false)
    }
  }

  async function createPassport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const serialHash = await hashSerial(form.serialNumber)
    const id = makePassportId(form.brand, form.model)
    const newPassport: Passport = {
      id,
      category: form.category,
      brand: form.brand.trim(),
      model: form.model.trim(),
      serialHash,
      condition: form.condition.trim(),
      batteryHealth: form.batteryHealth.trim() || 'N/A',
      estimatedValue: form.estimatedValue.trim(),
      city: form.city.trim(),
      ownerName: form.ownerName.trim(),
      ownerWallet: form.ownerWallet.trim() || shortWallet(walletAddress),
      verifier: form.verifier.trim(),
      createdAt: today(),
      trustScore: 78,
      history: [
        {
          id: crypto.randomUUID(),
          kind: 'Inspection',
          title: 'Passport created and serial hash verified',
          notes:
            'Device identity was hashed locally. Raw serial or IMEI is not stored in the app.',
          verifier: form.verifier.trim(),
          date: today(),
        },
      ],
    }

    const signature = await writeMemoToTestnet(
      `Reka CREATE ${id} ${form.category} ${form.brand} ${form.model} ${serialHash}`,
    )
    newPassport.lastTxSignature = signature
    newPassport.history[0].txSignature = signature

    setPassports((current) => [newPassport, ...current])
    setSelectedId(id)
    setForm(blankForm)
  }

  async function addHistory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPassport) return

    const entry: PassportHistory = {
      id: crypto.randomUUID(),
      kind: historyForm.kind,
      title: historyForm.title.trim(),
      notes: historyForm.notes.trim(),
      verifier: historyForm.verifier.trim(),
      date: today(),
    }

    const signature = await writeMemoToTestnet(
      `Reka ${historyForm.kind.toUpperCase()} ${selectedPassport.id} ${historyForm.title}`,
    )
    entry.txSignature = signature

    setPassports((current) =>
      current.map((passport) =>
        passport.id === selectedPassport.id
          ? {
              ...passport,
              trustScore: Math.min(99, passport.trustScore + 3),
              lastTxSignature: signature ?? passport.lastTxSignature,
              history: [entry, ...passport.history],
            }
          : passport,
      ),
    )
    setHistoryForm({
      kind: 'Inspection',
      title: '',
      notes: '',
      verifier: '',
    })
  }

  async function transferOwnership(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPassport) return

    const signature = await writeMemoToTestnet(
      `Reka TRANSFER ${selectedPassport.id} ${selectedPassport.ownerName} -> ${transferForm.ownerName}`,
    )

    const entry: PassportHistory = {
      id: crypto.randomUUID(),
      kind: 'Ownership',
      title: `Ownership transferred to ${transferForm.ownerName}`,
      notes:
        'Seller and buyer agreed to transfer this asset passport after device handover.',
      verifier: walletAddress ? shortWallet(walletAddress) : 'Connected wallet',
      date: today(),
      txSignature: signature,
    }

    setPassports((current) =>
      current.map((passport) =>
        passport.id === selectedPassport.id
          ? {
              ...passport,
              ownerName: transferForm.ownerName.trim(),
              ownerWallet: transferForm.ownerWallet.trim(),
              trustScore: Math.min(99, passport.trustScore + 2),
              lastTxSignature: signature ?? passport.lastTxSignature,
              history: [entry, ...passport.history],
            }
          : passport,
      ),
    )
    setTransferForm({ ownerName: '', ownerWallet: '' })
  }

  function copyPublicUrl() {
    navigator.clipboard.writeText(publicUrl)
    setChainMessage('Link verifikasi publik disalin.')
  }

  if (!selectedPassport) {
    return null
  }

  if (view === 'home') {
    return (
      <LandingPage
        featuredPassport={selectedPassport}
        onOpenApp={() => setView('app')}
      />
    )
  }

  const DeviceIcon = deviceIcons[selectedPassport.category]

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">
            <Fingerprint size={24} />
          </div>
          <div>
            <p className="eyebrow">Solana RWA Passport</p>
            <h1>Reka</h1>
          </div>
        </div>

        <button className="sidebar-home-button" type="button" onClick={() => setView('home')}>
          <ArrowRight size={17} />
          Beranda
        </button>

        <div className="wallet-panel">
          <div>
            <span>Testnet wallet</span>
            <strong>{walletAddress ? shortWallet(walletAddress) : 'Not connected'}</strong>
          </div>
          <button className="icon-button" type="button" onClick={connectWallet}>
            <Wallet size={18} />
          </button>
        </div>

        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari device, owner, kota"
          />
        </label>

        <div className="passport-list">
          {filteredPassports.map((passport) => {
            const ListIcon = deviceIcons[passport.category]
            return (
              <button
                className={`passport-row ${
                  passport.id === selectedPassport.id ? 'active' : ''
                }`}
                key={passport.id}
                type="button"
                onClick={() => setSelectedId(passport.id)}
              >
                <span className="row-icon">
                  <ListIcon size={18} />
                </span>
                <span>
                  <strong>{passport.brand}</strong>
                  <small>{passport.model}</small>
                </span>
                <em>{passport.trustScore}</em>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Second-hand trust layer for campus markets</p>
            <h2>{selectedPassport.brand} {selectedPassport.model}</h2>
          </div>
          <div className="topbar-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setView('home')}
            >
              <BookOpenCheck size={17} />
              Beranda
            </button>
            <a
              className="secondary-button"
              href={explorerUrl(selectedPassport.lastTxSignature)}
              target="_blank"
              rel="noreferrer"
            >
              <Link2 size={17} />
              Explorer
            </a>
            <button className="primary-button" type="button" onClick={copyPublicUrl}>
              <Copy size={17} />
              Copy Verify Link
            </button>
          </div>
        </header>

        <section className="passport-hero">
          <div className="device-visual">
            <div className={`device-shape ${selectedPassport.category.toLowerCase()}`}>
              <DeviceIcon size={74} />
            </div>
            <div className="trust-meter">
              <span>Trust score</span>
              <strong>{selectedPassport.trustScore}</strong>
            </div>
          </div>

          <div className="passport-summary">
            <div className="status-line">
              <span className="verified-pill">
                <CheckCircle2 size={16} />
                Verified passport
              </span>
              <span>{selectedPassport.id}</span>
            </div>
            <h3>{selectedPassport.brand} {selectedPassport.model}</h3>
            <p>
              Public passport untuk membuktikan identitas barang, histori servis,
              kondisi terakhir, dan transfer kepemilikan tanpa menyimpan serial
              number mentah.
            </p>

            <div className="metric-grid">
              <Metric icon={Fingerprint} label="Serial hash" value={selectedPassport.serialHash} />
              <Metric icon={ShieldCheck} label="Condition" value={selectedPassport.condition} />
              <Metric icon={CircleDollarSign} label="Value" value={selectedPassport.estimatedValue} />
              <Metric icon={MapPin} label="City" value={selectedPassport.city} />
              <Metric icon={Store} label="Verifier" value={selectedPassport.verifier} />
              <Metric icon={UserRoundCheck} label="Owner" value={selectedPassport.ownerName} />
            </div>
          </div>

          <div className="qr-panel">
            <QRCodeCanvas value={publicUrl} size={148} marginSize={2} />
            <div>
              <strong>Scan to verify</strong>
              <span>{selectedPassport.id}</span>
            </div>
          </div>
        </section>

        <div className="chain-status">
          {isWritingChain ? <Loader2 className="spin" size={18} /> : <FileClock size={18} />}
          <span>{chainMessage || 'Aksi create, update, dan transfer bisa dicatat ke Solana Testnet Memo.'}</span>
        </div>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Create RWA passport</p>
                <h3>Daftarkan barang bekas</h3>
              </div>
              <Plus size={20} />
            </div>

            <form className="form-grid" onSubmit={createPassport}>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value as DeviceCategory })
                  }
                >
                  <option>Laptop</option>
                  <option>Phone</option>
                  <option>Camera</option>
                </select>
              </label>
              <label>
                Brand
                <input
                  required
                  value={form.brand}
                  onChange={(event) => setForm({ ...form, brand: event.target.value })}
                  placeholder="Lenovo"
                />
              </label>
              <label>
                Model
                <input
                  required
                  value={form.model}
                  onChange={(event) => setForm({ ...form, model: event.target.value })}
                  placeholder="ThinkPad X1 Carbon"
                />
              </label>
              <label>
                Serial / IMEI
                <input
                  required
                  value={form.serialNumber}
                  onChange={(event) =>
                    setForm({ ...form, serialNumber: event.target.value })
                  }
                  placeholder="Disimpan sebagai hash"
                />
              </label>
              <label>
                Condition
                <select
                  value={form.condition}
                  onChange={(event) =>
                    setForm({ ...form, condition: event.target.value })
                  }
                >
                  <option>Grade A</option>
                  <option>Grade A-</option>
                  <option>Grade B+</option>
                  <option>Grade B</option>
                  <option>Need repair</option>
                </select>
              </label>
              <label>
                Battery health
                <input
                  value={form.batteryHealth}
                  onChange={(event) =>
                    setForm({ ...form, batteryHealth: event.target.value })
                  }
                  placeholder="92% / N/A"
                />
              </label>
              <label>
                Estimated value
                <input
                  required
                  value={form.estimatedValue}
                  onChange={(event) =>
                    setForm({ ...form, estimatedValue: event.target.value })
                  }
                  placeholder="Rp 8.500.000"
                />
              </label>
              <label>
                City
                <input
                  required
                  value={form.city}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                  placeholder="Depok"
                />
              </label>
              <label>
                Owner
                <input
                  required
                  value={form.ownerName}
                  onChange={(event) =>
                    setForm({ ...form, ownerName: event.target.value })
                  }
                  placeholder="Nama penjual"
                />
              </label>
              <label>
                Owner wallet
                <input
                  value={form.ownerWallet}
                  onChange={(event) =>
                    setForm({ ...form, ownerWallet: event.target.value })
                  }
                  placeholder="Optional"
                />
              </label>
              <label className="wide">
                Verifier
                <input
                  required
                  value={form.verifier}
                  onChange={(event) =>
                    setForm({ ...form, verifier: event.target.value })
                  }
                  placeholder="Toko servis / komunitas verifier"
                />
              </label>
              <button className="primary-button wide" type="submit" disabled={isWritingChain}>
                {isWritingChain ? <Loader2 className="spin" size={17} /> : <Plus size={17} />}
                Create Passport
              </button>
            </form>
          </div>

          <div className="panel stack">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Lifecycle log</p>
                <h3>Riwayat servis & kondisi</h3>
              </div>
              <Wrench size={20} />
            </div>

            <form className="compact-form" onSubmit={addHistory}>
              <select
                value={historyForm.kind}
                onChange={(event) =>
                  setHistoryForm({
                    ...historyForm,
                    kind: event.target.value as HistoryKind,
                  })
                }
              >
                <option>Inspection</option>
                <option>Repair</option>
                <option>Warranty</option>
              </select>
              <input
                required
                value={historyForm.title}
                onChange={(event) =>
                  setHistoryForm({ ...historyForm, title: event.target.value })
                }
                placeholder="Judul riwayat"
              />
              <input
                required
                value={historyForm.verifier}
                onChange={(event) =>
                  setHistoryForm({ ...historyForm, verifier: event.target.value })
                }
                placeholder="Verifier"
              />
              <textarea
                required
                value={historyForm.notes}
                onChange={(event) =>
                  setHistoryForm({ ...historyForm, notes: event.target.value })
                }
                placeholder="Catatan kondisi, sparepart, bukti invoice, atau garansi"
              />
              <button className="secondary-button" type="submit" disabled={isWritingChain}>
                <FileClock size={17} />
                Add History
              </button>
            </form>

            <div className="timeline">
              {selectedPassport.history.map((item) => {
                const KindIcon = kindIcons[item.kind]
                return (
                  <article className="timeline-item" key={item.id}>
                    <span className="timeline-icon">
                      <KindIcon size={17} />
                    </span>
                    <div>
                      <div className="timeline-title">
                        <strong>{item.title}</strong>
                        <time>{item.date}</time>
                      </div>
                      <p>{item.notes}</p>
                      <small>
                        {item.verifier}
                        {item.txSignature ? ` - ${shortWallet(item.txSignature)}` : ''}
                      </small>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <div className="panel transfer-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Ownership transfer</p>
                <h3>Pindah tangan</h3>
              </div>
              <UserRoundCheck size={20} />
            </div>
            <form className="compact-form" onSubmit={transferOwnership}>
              <input
                required
                value={transferForm.ownerName}
                onChange={(event) =>
                  setTransferForm({
                    ...transferForm,
                    ownerName: event.target.value,
                  })
                }
                placeholder="Nama pemilik baru"
              />
              <input
                required
                value={transferForm.ownerWallet}
                onChange={(event) =>
                  setTransferForm({
                    ...transferForm,
                    ownerWallet: event.target.value,
                  })
                }
                placeholder="Wallet / kontak pemilik baru"
              />
              <button className="primary-button" type="submit" disabled={isWritingChain}>
                <UserRoundCheck size={17} />
                Transfer Passport
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  )
}

function LandingPage({
  featuredPassport,
  onOpenApp,
}: {
  featuredPassport: Passport
  onOpenApp: () => void
}) {
  const DeviceIcon = deviceIcons[featuredPassport.category]
  const verifyUrl = `${window.location.origin}${window.location.pathname}?passport=${featuredPassport.id}`

  return (
    <main className="home-page">
      <nav className="home-nav" aria-label="Main navigation">
        <a className="home-brand" href="#home">
          <span className="brand-mark small">
            <Fingerprint size={20} />
          </span>
          <span>Reka</span>
        </a>
        <div className="home-links">
          <a href="#problem">Masalah</a>
          <a href="#flow">Cara Kerja</a>
          <a href="#mvp">MVP</a>
        </div>
        <button className="primary-button" type="button" onClick={onOpenApp}>
          Buka MVP
          <ArrowRight size={17} />
        </button>
      </nav>

      <section className="home-hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow">Frontier Solana Hackathon</p>
          <h1>Reka</h1>
          <p className="hero-lead">
            Passport on-chain untuk laptop, HP, dan kamera second-hand, dibuat
            supaya mahasiswa bisa beli barang bekas dengan riwayat yang jelas.
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={onOpenApp}>
              Coba Dashboard
              <ArrowRight size={17} />
            </button>
            <a className="secondary-button" href="#flow">
              Lihat Alur
            </a>
          </div>
          <div className="home-proof-row" aria-label="Project proof points">
            <span>RWA</span>
            <span>Consumer App</span>
            <span>Solana Testnet</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Reka product preview">
          <div className="market-scene">
            <div className="scene-device">
              <DeviceIcon size={72} />
            </div>
            <div className="scene-passport">
              <div>
                <span>Passport ID</span>
                <strong>{featuredPassport.id}</strong>
              </div>
              <div>
                <span>Device</span>
                <strong>
                  {featuredPassport.brand} {featuredPassport.model}
                </strong>
              </div>
              <div>
                <span>Trust score</span>
                <strong>{featuredPassport.trustScore}/100</strong>
              </div>
            </div>
            <div className="scene-qr">
              <QRCodeCanvas value={verifyUrl} size={92} marginSize={2} />
            </div>
          </div>
        </div>
      </section>

      <section className="home-band" id="problem">
        <div className="section-heading">
          <p className="eyebrow">Masalah yang dekat dengan mahasiswa</p>
          <h2>Pasar barang bekas kampus punya trust issue.</h2>
        </div>
        <div className="problem-grid">
          <HomePoint
            icon={ShieldCheck}
            title="Identitas barang tidak jelas"
            text="Serial atau IMEI sering cuma ditunjukkan di chat, lalu hilang setelah transaksi."
          />
          <HomePoint
            icon={Wrench}
            title="Riwayat servis tercecer"
            text="Pembeli sulit tahu apakah layar, baterai, SSD, kamera, atau port pernah diganti."
          />
          <HomePoint
            icon={UserRoundCheck}
            title="Kepemilikan sulit dibuktikan"
            text="Saat barang berpindah tangan, tidak ada catatan publik yang bisa diverifikasi."
          />
        </div>
      </section>

      <section className="home-split" id="flow">
        <div className="section-heading">
          <p className="eyebrow">Solusi</p>
          <h2>Satu passport publik untuk satu barang fisik.</h2>
          <p>
            Verifier seperti toko servis, komunitas kampus, atau koperasi bisa
            menambahkan inspeksi dan garansi. Event penting dicatat ke Solana
            Testnet sebagai audit trail.
          </p>
        </div>
        <div className="flow-list">
          <HomeStep number="01" title="Hash identitas barang" text="Serial atau IMEI diubah menjadi hash agar privasi tetap aman." />
          <HomeStep number="02" title="Catat kondisi dan servis" text="Verifier menambahkan inspeksi, sparepart, warranty, dan estimasi harga." />
          <HomeStep number="03" title="Transfer saat dijual" text="Passport berpindah ke owner baru dan riwayatnya tetap ikut terbawa." />
          <HomeStep number="04" title="Scan QR sebelum beli" text="Calon pembeli membuka halaman verifikasi publik dari QR." />
        </div>
      </section>

      <section className="mvp-section" id="mvp">
        <div className="mvp-copy">
          <p className="eyebrow">MVP yang sudah bisa dicoba</p>
          <h2>Demo Reka siap dipakai untuk video 3 menit.</h2>
          <p>
            Flow demo paling enak: buka dashboard, connect Phantom Testnet, buat
            passport, tambah riwayat servis, transfer owner, lalu scan QR.
          </p>
        </div>
        <div className="mvp-actions">
          <button className="primary-button" type="button" onClick={onOpenApp}>
            Masuk ke MVP
            <ArrowRight size={17} />
          </button>
          <a className="secondary-button" href={verifyUrl}>
            Buka Contoh QR
            <ScanLine size={17} />
          </a>
        </div>
      </section>
    </main>
  )
}

function HomePoint({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType
  title: string
  text: string
}) {
  return (
    <article className="home-point">
      <Icon size={22} />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

function HomeStep({
  number,
  title,
  text,
}: {
  number: string
  title: string
  text: string
}) {
  return (
    <article className="flow-step">
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="metric">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

async function hashSerial(serial: string) {
  const encoded = new TextEncoder().encode(serial.trim().toLowerCase())
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  const bytes = Array.from(new Uint8Array(digest))
  return `sha256:${bytes
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)}`
}

function makePassportId(brand: string, model: string) {
  const brandCode = brand.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase()
  const modelCode = model.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase()
  const random = Math.random().toString(16).slice(2, 6).toUpperCase()
  return `RK-26-${brandCode || 'DEV'}-${modelCode || 'AST'}-${random}`
}

function shortWallet(value: string) {
  if (!value) return ''
  if (value.length <= 10) return value
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function explorerUrl(signature?: string) {
  if (!signature) return 'https://explorer.solana.com/?cluster=testnet'
  return `https://explorer.solana.com/tx/${signature}?cluster=testnet`
}

export default App
