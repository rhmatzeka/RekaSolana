import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileClock,
  Fingerprint,
  ListChecks,
  Laptop,
  Link2,
  Loader2,
  Plus,
  Settings,
  Search,
  ScanLine,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
  Wallet,
  Wrench,
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { PublicKey, type Transaction } from '@solana/web3.js'
import {
  addHistoryOnChain,
  checkRekaProgramStatus,
  createPassportOnChain,
  derivePassportPda,
  getRekaProgramExplorerUrl,
  initializeRegistryOnChain,
  registerVerifierOnChain,
  transferPassportOnChain,
  type BrowserWallet,
} from './lib/rekaProgram'

type DeviceCategory = 'Laptop' | 'Phone' | 'Camera'
type HistoryKind = 'Inspection' | 'Repair' | 'Ownership' | 'Warranty'
type AttestationSource = 'On-chain service' | 'Verified receipt' | 'Owner claim'
type AttestationStatus = 'Pending' | 'Verified' | 'Rejected' | 'Disputed'
type HistoryConfidenceLevel = 'High' | 'Medium' | 'Low'
type BuyerRiskLevel = 'Low' | 'Medium' | 'High'
type HistoryActionTab = 'disclosure' | 'event' | 'checklist'
type SellerDisclosureStatus =
  | 'Missing'
  | 'No known prior repair'
  | 'Prior repair disclosed'
  | 'Seller declined disclosure'
type ChecklistValue = 'Pass' | 'Watch' | 'Fail' | 'Unknown'
type AppRoute = 'home' | 'passport' | 'devices' | 'history' | 'verifier' | 'transfer' | 'settings'

type PassportHistory = {
  id: string
  kind: HistoryKind
  serviceDate?: string
  source?: AttestationSource
  status?: AttestationStatus
  title: string
  notes: string
  evidenceHash?: string
  evidenceUri?: string
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
  sellerDisclosure?: SellerDisclosure
  inspectionChecklist?: InspectionChecklist
  history: PassportHistory[]
}

type SellerDisclosure = {
  status: SellerDisclosureStatus
  sellerName: string
  knownRepairCount: string
  notes: string
  declaredAt: string
}

type InspectionChecklist = {
  battery: ChecklistValue
  display: ChecklistValue
  camera: ChecklistValue
  ports: ChecklistValue
  storage: ChecklistValue
  body: ChecklistValue
  opened: ChecklistValue
  parts: ChecklistValue
  verifier: string
  checkedAt: string
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
  signTransaction?: <T extends Transaction>(transaction: T) => Promise<T>
  signAllTransactions?: <T extends Transaction>(transactions: T[]) => Promise<T[]>
  signAndSendTransaction: (
    transaction: Transaction,
  ) => Promise<{ signature: string }>
}

type ProgramStatus = 'checking' | 'ready' | 'missing' | 'offline'

declare global {
  interface Window {
    solana?: SolanaProvider
  }
}

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
        serviceDate: '2026-04-19',
        source: 'On-chain service',
        status: 'Verified',
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
        serviceDate: '2026-04-20',
        source: 'Verified receipt',
        status: 'Verified',
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
        serviceDate: '2026-04-21',
        source: 'Verified receipt',
        status: 'Verified',
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
        serviceDate: '2026-04-22',
        source: 'On-chain service',
        status: 'Verified',
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
  const passportId = getPassportIdFromLocation()
  if (passportId && passports.some((passport) => passport.id === passportId)) {
    return passportId
  }
  return passports[0]?.id ?? initialPassports[0].id
}

const blankInspectionChecklist: InspectionChecklist = {
  battery: 'Unknown',
  display: 'Unknown',
  camera: 'Unknown',
  ports: 'Unknown',
  storage: 'Unknown',
  body: 'Unknown',
  opened: 'Unknown',
  parts: 'Unknown',
  verifier: '',
  checkedAt: today(),
}

const inspectionItems: Array<{
  key: keyof Omit<InspectionChecklist, 'verifier' | 'checkedAt'>
  label: string
}> = [
  { key: 'battery', label: 'Battery' },
  { key: 'display', label: 'Display' },
  { key: 'camera', label: 'Camera' },
  { key: 'ports', label: 'Ports' },
  { key: 'storage', label: 'SSD / storage' },
  { key: 'body', label: 'Body' },
  { key: 'opened', label: 'Opened / tampered' },
  { key: 'parts', label: 'Parts originality' },
]

function readInitialRoute(passports: Passport[]): AppRoute {
  const path = normalizePath(window.location.pathname)
  const passportId = getPassportIdFromLocation()

  if (passportId && passports.some((passport) => passport.id === passportId)) {
    return 'passport'
  }

  if (path === '/devices') return 'devices'
  if (path === '/history') return 'history'
  if (path === '/verifier') return 'verifier'
  if (path === '/transfer') return 'transfer'
  if (path === '/settings') return 'settings'
  if (path === '/dashboard' || path === '/app' || path === '/passport') {
    return 'passport'
  }
  return 'home'
}

function getPassportIdFromLocation() {
  const params = new URLSearchParams(window.location.search)
  const queryPassport = params.get('passport')
  if (queryPassport) return queryPassport

  const match = normalizePath(window.location.pathname).match(/^\/passport\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

function normalizePath(path: string) {
  const normalized = path.replace(/\/+$/, '')
  return normalized || '/'
}

function buildAppPath(route: AppRoute, passportId?: string) {
  if (route === 'home') return '/'
  if (route === 'passport') {
    return passportId ? `/passport/${encodeURIComponent(passportId)}` : '/passport'
  }
  return `/${route}`
}

function getRouteTitle(route: AppRoute) {
  const titles: Record<AppRoute, string> = {
    home: 'Reka',
    passport: 'Passport detail',
    devices: 'Device registry',
    history: 'Service history',
    verifier: 'Verifier registry',
    transfer: 'Transfer ownership',
    settings: 'Program settings',
  }
  return titles[route]
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const ui = {
  eyebrow: 'm-0 text-[11px] font-black uppercase tracking-[0.22em] text-teal-300',
  primaryButton:
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-teal-600 bg-teal-600 px-4 text-sm font-black text-white no-underline shadow-sm shadow-teal-900/15 transition hover:bg-teal-700 disabled:cursor-wait disabled:opacity-70',
  secondaryButton:
    'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/8 px-4 text-sm font-black text-slate-100 no-underline shadow-sm shadow-black/20 transition hover:border-teal-300/40 hover:bg-teal-300/10',
  panel:
    'rounded-2xl border border-white/12 bg-slate-900/72 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl',
  panelHeading: 'mb-4 flex items-center justify-between gap-4',
  formGrid: 'grid grid-cols-1 gap-3 md:grid-cols-2',
  compactForm: 'grid gap-3',
  input:
    'h-11 w-full min-w-0 rounded-xl border border-white/12 bg-slate-950/72 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal-300/60 focus:ring-4 focus:ring-teal-300/10',
  textarea:
    'min-h-28 w-full min-w-0 resize-y rounded-xl border border-white/12 bg-slate-950/72 px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal-300/60 focus:ring-4 focus:ring-teal-300/10',
  label: 'grid gap-2 text-xs font-bold text-slate-300',
  wide: 'col-span-full',
}

function railButtonClass(active: boolean) {
  return cx(
    'relative grid h-10 w-10 place-items-center rounded-xl border transition',
    active
      ? 'border-teal-300/40 bg-teal-300/12 text-teal-100 shadow-sm shadow-teal-950/20 before:absolute before:-left-3 before:h-6 before:w-1 before:rounded-r before:bg-teal-300 before:content-[\'\']'
      : 'border-transparent text-slate-400 hover:border-teal-300/30 hover:bg-teal-300/10 hover:text-teal-100',
  )
}

function historyActionTabClass(active: boolean) {
  return cx(
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-black transition',
    active
      ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/15'
      : 'text-slate-400 hover:bg-teal-300/10 hover:text-teal-100',
  )
}

function App() {
  const [boot] = useState(() => {
    const storedPassports = readStoredPassports()
    return {
      passports: storedPassports,
      selectedId: readInitialSelectedId(storedPassports),
      initialRoute: readInitialRoute(storedPassports),
    }
  })
  const [passports, setPassports] = useState<Passport[]>(boot.passports)
  const [selectedId, setSelectedId] = useState(boot.selectedId)
  const [activeRoute, setActiveRoute] = useState<AppRoute>(boot.initialRoute)
  const [activeHistoryAction, setActiveHistoryAction] = useState<HistoryActionTab>('disclosure')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<FormState>(blankForm)
  const [historyForm, setHistoryForm] = useState({
    kind: 'Inspection' as HistoryKind,
    serviceDate: today(),
    source: 'On-chain service' as AttestationSource,
    status: 'Verified' as AttestationStatus,
    title: '',
    notes: '',
    verifier: '',
    evidenceUri: '',
  })
  const [sellerDisclosureForm, setSellerDisclosureForm] = useState({
    status: 'No known prior repair' as SellerDisclosureStatus,
    knownRepairCount: '',
    notes: '',
  })
  const [inspectionForm, setInspectionForm] = useState<InspectionChecklist>({
    ...blankInspectionChecklist,
  })
  const [verifierForm, setVerifierForm] = useState({
    name: '',
    location: '',
    evidenceUri: '',
  })
  const [transferForm, setTransferForm] = useState({
    ownerName: '',
    ownerWallet: '',
  })
  const [walletAddress, setWalletAddress] = useState('')
  const [isWritingChain, setIsWritingChain] = useState(false)
  const [chainMessage, setChainMessage] = useState('')
  const [programStatus, setProgramStatus] = useState<ProgramStatus>('checking')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const verifierNameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(passports))
  }, [passports])

  useEffect(() => {
    function syncRouteFromLocation() {
      const route = readInitialRoute(passports)
      const routePassportId = getPassportIdFromLocation()

      setActiveRoute(route)
      if (routePassportId && passports.some((passport) => passport.id === routePassportId)) {
        setSelectedId(routePassportId)
      }
    }

    window.addEventListener('popstate', syncRouteFromLocation)
    return () => window.removeEventListener('popstate', syncRouteFromLocation)
  }, [passports])

  useEffect(() => {
    let shouldUpdate = true

    checkRekaProgramStatus()
      .then((status) => {
        if (!shouldUpdate) return
        setProgramStatus(status.deployed && status.executable ? 'ready' : 'missing')
      })
      .catch(() => {
        if (shouldUpdate) setProgramStatus('offline')
      })

    return () => {
      shouldUpdate = false
    }
  }, [])

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
  const verifiedHistoryCount = selectedPassport
    ? selectedPassport.history.filter(
        (item) => (item.status ?? (item.txSignature ? 'Verified' : 'Pending')) === 'Verified',
      ).length
    : 0
  const unverifiedHistoryCount = selectedPassport
    ? selectedPassport.history.length - verifiedHistoryCount
    : 0
  const historyConfidence = selectedPassport
    ? getHistoryConfidence(selectedPassport)
    : undefined
  const sellerDisclosure = selectedPassport
    ? getSellerDisclosure(selectedPassport)
    : undefined
  const inspectionSummary = selectedPassport
    ? getInspectionSummary(selectedPassport)
    : undefined
  const buyerRisk = selectedPassport
    ? getBuyerRisk(selectedPassport)
    : undefined

  const publicUrl = selectedPassport
    ? `${window.location.origin}/passport/${encodeURIComponent(selectedPassport.id)}`
    : window.location.href
  const programStatusText = getProgramStatusText(programStatus)

  function navigateTo(route: AppRoute, nextSelectedId = selectedPassport?.id) {
    const path = buildAppPath(route, nextSelectedId)
    window.history.pushState({}, '', path)
    setActiveRoute(route)
    if (nextSelectedId) setSelectedId(nextSelectedId)
  }

  async function connectWallet() {
    if (!window.solana) {
      setChainMessage('Wallet belum ditemukan. Install Phantom lalu pakai Devnet.')
      return
    }

    const response = await window.solana.connect()
    setWalletAddress(response.publicKey.toBase58())
    setChainMessage('Wallet tersambung ke Reka Devnet mode.')
  }

  async function getConnectedWallet() {
    if (!window.solana?.publicKey) {
      await connectWallet()
    }

    const provider = window.solana
    if (!provider?.publicKey) {
      return undefined
    }

    return provider
  }

  async function runRekaTransaction<T>(
    actionLabel: string,
    action: (wallet: BrowserWallet) => Promise<T>,
  ) {
    const provider = await getConnectedWallet()
    if (!provider) return undefined

    setIsWritingChain(true)
    setChainMessage(`${actionLabel} ke program Reka di Solana Devnet...`)

    try {
      const result = await action(provider)
      setChainMessage(`${actionLabel} berhasil dicatat oleh smart contract Reka.`)
      return result
    } catch (error) {
      setChainMessage(
        error instanceof Error
          ? error.message
          : 'Transaksi program Reka dibatalkan atau gagal.',
      )
      return undefined
    } finally {
      setIsWritingChain(false)
    }
  }

  async function setupVerifier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const verifierName = verifierForm.name.trim()
    const location = verifierForm.location.trim()
    const evidenceUri = verifierForm.evidenceUri.trim()

    const result = await runRekaTransaction('Mengaktifkan verifier', async (wallet) => {
      try {
        await initializeRegistryOnChain(wallet, 'Reka Campus Registry')
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : ''
        if (!message.includes('already in use') && !message.includes('already initialized')) {
          throw error
        }
      }

      return registerVerifierOnChain(wallet, {
        verifier: wallet.publicKey!,
        name: verifierName,
        location,
        evidenceUri,
      })
    })

    if (!result) return

    setHistoryForm((current) => ({
      ...current,
      verifier: verifierName,
    }))
    setChainMessage(`Verifier ${verifierName} aktif. Sekarang riwayat servis wajib punya evidence.`)
  }

  async function createPassport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const serialHash = await hashSerial(form.serialNumber)
    const id = makePassportId(form.brand, form.model)
    const onChainResult = await runRekaTransaction('Membuat passport', async (wallet) => {
      const owner = parseWalletOrFallback(form.ownerWallet, wallet.publicKey!)
      const result = await createPassportOnChain(wallet, {
        category: form.category,
        brand: form.brand.trim(),
        model: form.model.trim(),
        serialHash,
        condition: form.condition.trim(),
        batteryHealth: form.batteryHealth.trim() || 'N/A',
        estimatedValue: form.estimatedValue.trim(),
        city: form.city.trim(),
        owner,
        ownerName: form.ownerName.trim(),
        verifierName: form.verifier.trim(),
      })
      return { ...result, owner }
    })

    if (!onChainResult) return

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
      ownerWallet: onChainResult.owner.toBase58(),
      verifier: form.verifier.trim(),
      createdAt: today(),
      trustScore: 78,
      history: [
        {
          id: crypto.randomUUID(),
          kind: 'Inspection',
          serviceDate: today(),
          source: 'On-chain service',
          status: 'Verified',
          title: 'Passport created and serial hash verified',
          notes:
            'Device identity was hashed locally. Raw serial or IMEI is not stored in the app.',
          verifier: form.verifier.trim(),
          date: today(),
        },
      ],
    }

    newPassport.lastTxSignature = onChainResult.signature
    newPassport.history[0].txSignature = onChainResult.signature

    setPassports((current) => [newPassport, ...current])
    navigateTo('passport', id)
    setForm(blankForm)
  }

  function saveSellerDisclosure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPassport) return

    const disclosure: SellerDisclosure = {
      status: sellerDisclosureForm.status,
      sellerName: selectedPassport.ownerName,
      knownRepairCount:
        sellerDisclosureForm.status === 'No known prior repair'
          ? '0'
          : sellerDisclosureForm.knownRepairCount.trim() || 'Unknown',
      notes:
        sellerDisclosureForm.notes.trim() ||
        getDisclosureDefaultNotes(sellerDisclosureForm.status),
      declaredAt: today(),
    }
    const entry: PassportHistory = {
      id: makeEntryId(),
      kind: 'Inspection',
      serviceDate: today(),
      source: 'Owner claim',
      status:
        sellerDisclosureForm.status === 'Seller declined disclosure'
          ? 'Disputed'
          : 'Pending',
      title: `Seller disclosure: ${sellerDisclosureForm.status}`,
      notes: `${disclosure.notes} Known repair count: ${disclosure.knownRepairCount}.`,
      verifier: selectedPassport.ownerName,
      date: today(),
    }

    setPassports((current) =>
      current.map((passport) =>
        passport.id === selectedPassport.id
          ? {
              ...passport,
              sellerDisclosure: disclosure,
              history: [entry, ...passport.history],
            }
          : passport,
      ),
    )
    setChainMessage('Seller disclosure disimpan. Ini tetap klaim seller sampai diverifikasi.')
  }

  function saveInspectionChecklist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPassport) return

    const checklist: InspectionChecklist = {
      ...inspectionForm,
      verifier: inspectionForm.verifier.trim() || selectedPassport.verifier,
      checkedAt: today(),
    }
    const riskyFindings = inspectionItems
      .filter(({ key }) => checklist[key] === 'Watch' || checklist[key] === 'Fail')
      .map(({ label }) => label)
    const entry: PassportHistory = {
      id: makeEntryId(),
      kind: 'Inspection',
      serviceDate: today(),
      source: checklist.verifier ? 'Verified receipt' : 'Owner claim',
      status: riskyFindings.length > 0 ? 'Disputed' : 'Pending',
      title: 'Buyer protection inspection checklist',
      notes:
        riskyFindings.length > 0
          ? `Inspection found risk signals: ${riskyFindings.join(', ')}.`
          : 'Checklist completed. Items marked unknown still need verifier evidence before trust increases.',
      verifier: checklist.verifier || 'Checklist reviewer',
      date: today(),
    }

    setPassports((current) =>
      current.map((passport) =>
        passport.id === selectedPassport.id
          ? {
              ...passport,
              inspectionChecklist: checklist,
              history: [entry, ...passport.history],
            }
          : passport,
      ),
    )
    setChainMessage('Inspection checklist disimpan dan buyer risk diperbarui.')
  }

  function addHiddenRepairDispute() {
    if (!selectedPassport) return

    const entry: PassportHistory = {
      id: makeEntryId(),
      kind: 'Repair',
      serviceDate: today(),
      source: 'Owner claim',
      status: 'Disputed',
      title: 'Potential hidden repair history',
      notes:
        'Buyer or verifier flagged a risk that prior repairs may be missing from seller disclosure. Require fresh inspection evidence before pricing as clean.',
      verifier: walletAddress ? shortWallet(walletAddress) : 'Buyer protection',
      date: today(),
    }

    setPassports((current) =>
      current.map((passport) =>
        passport.id === selectedPassport.id
          ? {
              ...passport,
              trustScore: clampTrustScore(passport.trustScore - 3),
              history: [entry, ...passport.history],
            }
          : passport,
      ),
    )
    navigateTo('history')
    setChainMessage('Dispute ditambahkan. Device tidak boleh dipresentasikan sebagai clean tanpa evidence.')
  }

  async function addHistory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPassport) return

    const entryId = makeEntryId()
    const evidenceUri = historyForm.evidenceUri.trim()
    const source = historyForm.source
    const status = source === 'Owner claim' ? 'Pending' : historyForm.status
    if (source !== 'Owner claim' && !evidenceUri) {
      setChainMessage('Evidence wajib untuk attestation verifier on-chain.')
      return
    }

    const evidenceHash = await hashEvidence(
      `${selectedPassport.serialHash}:${entryId}:${historyForm.serviceDate}:${source}:${status}:${historyForm.title}:${historyForm.notes}:${evidenceUri}`,
    )
    const baseEntry: PassportHistory = {
      id: entryId,
      kind: historyForm.kind,
      serviceDate: historyForm.serviceDate,
      source,
      status,
      title: historyForm.title.trim(),
      notes: historyForm.notes.trim(),
      evidenceHash,
      evidenceUri,
      verifier:
        historyForm.verifier.trim() ||
        (source === 'Owner claim' ? selectedPassport.ownerName : 'Registered verifier'),
      date: today(),
    }

    if (source === 'Owner claim') {
      setPassports((current) =>
        current.map((passport) =>
          passport.id === selectedPassport.id
            ? {
                ...passport,
                trustScore: clampTrustScore(
                  passport.trustScore + getTrustScoreDelta(source, status),
                ),
                history: [baseEntry, ...passport.history],
              }
            : passport,
        ),
      )
      setChainMessage('Klaim owner disimpan lokal sebagai riwayat belum terverifikasi.')
      resetHistoryForm()
      return
    }

    const onChainResult = await runRekaTransaction('Menambah attestation', (wallet) =>
      addHistoryOnChain(wallet, {
        passport: derivePassportPda(selectedPassport.serialHash),
        entryId,
        kind: historyKindToNumber(historyForm.kind),
        serviceDate: dateToUnixSeconds(historyForm.serviceDate),
        source: attestationSourceToNumber(source),
        status: attestationStatusToNumber(status),
        title: historyForm.title.trim(),
        notes: historyForm.notes.trim(),
        evidenceHash,
        evidenceUri,
      }),
    )

    if (!onChainResult) return

    const entry: PassportHistory = {
      ...baseEntry,
      txSignature: onChainResult.signature,
    }

    setPassports((current) =>
      current.map((passport) =>
        passport.id === selectedPassport.id
          ? {
              ...passport,
              trustScore: clampTrustScore(
                passport.trustScore + getTrustScoreDelta(source, status),
              ),
              lastTxSignature: onChainResult.signature,
              history: [entry, ...passport.history],
            }
          : passport,
      ),
    )
    resetHistoryForm()
  }

  async function transferOwnership(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedPassport) return

    let newOwner: PublicKey
    try {
      newOwner = parseRequiredWallet(transferForm.ownerWallet)
    } catch (error) {
      setChainMessage(error instanceof Error ? error.message : 'Wallet pemilik baru tidak valid.')
      return
    }
    const onChainResult = await runRekaTransaction('Transfer ownership', (wallet) =>
      transferPassportOnChain(
        wallet,
        derivePassportPda(selectedPassport.serialHash),
        newOwner,
        transferForm.ownerName.trim(),
      ),
    )

    if (!onChainResult) return

    const entry: PassportHistory = {
      id: makeEntryId(),
      kind: 'Ownership',
      serviceDate: today(),
      source: 'On-chain service',
      status: 'Verified',
      title: `Ownership transferred to ${transferForm.ownerName}`,
      notes:
        'Seller and buyer agreed to transfer this asset passport after device handover.',
      verifier: walletAddress ? shortWallet(walletAddress) : 'Connected wallet',
      date: today(),
      txSignature: onChainResult.signature,
    }

    setPassports((current) =>
      current.map((passport) =>
        passport.id === selectedPassport.id
          ? {
              ...passport,
              ownerName: transferForm.ownerName.trim(),
              ownerWallet: transferForm.ownerWallet.trim(),
              trustScore: Math.min(99, passport.trustScore + 2),
              lastTxSignature: onChainResult.signature,
              history: [entry, ...passport.history],
            }
          : passport,
      ),
    )
    setTransferForm({ ownerName: '', ownerWallet: '' })
  }

  function resetHistoryForm() {
    setHistoryForm({
      kind: 'Inspection',
      serviceDate: today(),
      source: 'On-chain service',
      status: 'Verified',
      title: '',
      notes: '',
      verifier: '',
      evidenceUri: '',
    })
  }

  function copyPublicUrl() {
    navigator.clipboard.writeText(publicUrl)
    setChainMessage('Link verifikasi publik disalin.')
  }

  function handleRouteAction(route: AppRoute) {
    navigateTo(route)

    if (route === 'devices') {
      window.setTimeout(() => searchInputRef.current?.focus(), 80)
    }

    if (route === 'verifier') {
      window.setTimeout(() => verifierNameInputRef.current?.focus(), 80)
    }
  }

  if (!selectedPassport) {
    return null
  }

  if (activeRoute === 'home') {
    return (
      <LandingPage
        featuredPassport={selectedPassport}
        onOpenApp={() => navigateTo('passport')}
      />
    )
  }

  return (
    <main className="reka-dashboard relative isolate grid min-h-screen grid-cols-[74px_minmax(0,1fr)] bg-[#050b12] text-slate-100">
      <aside className="sticky top-0 z-10 grid h-screen grid-rows-[auto_1fr_auto] justify-items-center border-r border-white/10 bg-slate-950/58 px-3 py-5 shadow-[18px_0_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <button className="grid h-11 w-11 place-items-center rounded-2xl border border-white/12 bg-white/8 text-3xl font-black leading-none text-white shadow-sm shadow-black/20" type="button" onClick={() => navigateTo('home')} aria-label="Reka home">
          R
        </button>
        <nav className="grid content-center gap-3" aria-label="Dashboard navigation">
          <button
            className={railButtonClass(activeRoute === 'passport')}
            type="button"
            aria-label="Passport"
            aria-current={activeRoute === 'passport' ? 'page' : undefined}
            onClick={() => handleRouteAction('passport')}
          >
            <Wallet size={22} />
          </button>
          <button
            className={railButtonClass(activeRoute === 'devices')}
            type="button"
            aria-label="Devices"
            aria-current={activeRoute === 'devices' ? 'page' : undefined}
            onClick={() => handleRouteAction('devices')}
          >
            <Laptop size={22} />
          </button>
          <button
            className={railButtonClass(activeRoute === 'history')}
            type="button"
            aria-label="History"
            aria-current={activeRoute === 'history' ? 'page' : undefined}
            onClick={() => handleRouteAction('history')}
          >
            <FileClock size={22} />
          </button>
          <button
            className={railButtonClass(activeRoute === 'verifier')}
            type="button"
            aria-label="Verifier"
            aria-current={activeRoute === 'verifier' ? 'page' : undefined}
            onClick={() => handleRouteAction('verifier')}
          >
            <ShieldCheck size={22} />
          </button>
          <button
            className={railButtonClass(activeRoute === 'transfer')}
            type="button"
            aria-label="Transfer"
            aria-current={activeRoute === 'transfer' ? 'page' : undefined}
            onClick={() => handleRouteAction('transfer')}
          >
            <UserRoundCheck size={22} />
          </button>
          <button
            className={railButtonClass(activeRoute === 'settings')}
            type="button"
            aria-label="Settings"
            aria-current={activeRoute === 'settings' ? 'page' : undefined}
            onClick={() => handleRouteAction('settings')}
          >
            <Settings size={22} />
          </button>
        </nav>
        <div className="grid justify-items-center gap-2 text-xs font-semibold text-slate-400">
          <span>Profile</span>
          <button className="relative h-7 w-12 rounded-full border border-white/12 bg-white/12" type="button" onClick={connectWallet} aria-label="Connect wallet">
            <span className="absolute right-1 top-1 h-5 w-5 rounded-full bg-teal-200 shadow-sm shadow-teal-950/30" />
          </button>
        </div>
      </aside>

      <section className="relative z-10 mx-auto w-full max-w-[1360px] px-6 py-6">
        <header className="mb-5 grid grid-cols-1 items-end justify-between gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className={ui.eyebrow}>Reka dashboard</p>
            <h2 className="mt-1 text-4xl font-black leading-none tracking-normal text-white">{getRouteTitle(activeRoute)}</h2>
          </div>
          <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
            <button className={ui.secondaryButton} type="button" onClick={connectWallet}>
              <Wallet size={17} />
              {walletAddress ? shortWallet(walletAddress) : 'Connect wallet'}
            </button>
            <button
              className={ui.secondaryButton}
              type="button"
              onClick={() => navigateTo('home')}
            >
              <BookOpenCheck size={17} />
              Beranda
            </button>
            <a
              className={ui.secondaryButton}
              href={getRekaProgramExplorerUrl()}
              target="_blank"
              rel="noreferrer"
            >
              <Link2 size={17} />
              Program
            </a>
            <a
              className={ui.secondaryButton}
              href={explorerUrl(selectedPassport.lastTxSignature)}
              target="_blank"
              rel="noreferrer"
            >
              <Link2 size={17} />
              Explorer
            </a>
            <button className={ui.primaryButton} type="button" onClick={copyPublicUrl}>
              <Copy size={17} />
              Copy Verify Link
            </button>
          </div>
        </header>

        {activeRoute === 'passport' ? (
          <section className="grid gap-4">
            <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-slate-950/68 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_4%,rgba(45,212,191,0.18),transparent_32%),radial-gradient(circle_at_78%_14%,rgba(251,191,36,0.12),transparent_27%),linear-gradient(135deg,rgba(15,23,42,0.86),rgba(8,20,33,0.74)_45%,rgba(18,24,38,0.82))]" />
              <div className="relative grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_390px] xl:p-7">
                <div className="flex min-w-0 flex-col justify-between gap-7">
                  <div>
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-stone-500">
                      <span className="rounded-full border border-teal-200 bg-white/60 px-3 py-1.5 text-teal-700">{selectedPassport.category}</span>
                      <span className="rounded-full border border-stone-200 bg-white/60 px-3 py-1.5">{selectedPassport.city}</span>
                      <span className="rounded-full border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-amber-800">{selectedPassport.id}</span>
                    </div>
                    <h3 className="max-w-4xl text-5xl font-black leading-[0.92] text-white md:text-7xl">
                      {selectedPassport.brand} {selectedPassport.model}
                    </h3>
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3 text-xs font-black text-teal-800">
                        <CheckCircle2 size={16} />
                        Verified passport
                      </span>
                      <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-3 text-xs font-black text-stone-700">
                        <ShieldCheck size={16} />
                        Devnet audit trail
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <StatTile label="Trust score" value={`${selectedPassport.trustScore}/100`} tone="teal" />
                    <StatTile label="Condition" value={selectedPassport.condition} tone="amber" />
                    <StatTile label="Verified logs" value={`${verifiedHistoryCount}/${selectedPassport.history.length}`} tone="indigo" />
                    <StatTile label="Confidence" value={historyConfidence?.level ?? 'Low'} tone={historyConfidenceTone(historyConfidence?.level ?? 'Low')} />
                    <StatTile label="Value" value={selectedPassport.estimatedValue} tone="rose" />
                  </div>
                </div>

                <div className="relative min-h-[320px] overflow-hidden rounded-[24px] border border-white/12 bg-white/6 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(226,232,240,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.055)_1px,transparent_1px)] bg-[length:32px_32px]" />
                  <div className="relative grid h-full min-h-[280px] place-items-center">
                    <HeroDeviceMockup passport={selectedPassport} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className={cx(ui.panel, 'p-5')}>
                <div className="mb-4 flex items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
                  <div>
                    <p className={ui.eyebrow}>Registry data</p>
                    <h3 className="text-xl font-black text-stone-950">Identity & ownership</h3>
                  </div>
                  <button className={ui.secondaryButton} type="button" onClick={() => navigateTo('history')}>
                    <FileClock size={17} />
                    View history
                  </button>
                </div>
                <div className="grid gap-x-6 md:grid-cols-2">
                  <DetailRow label="Serial hash" value={selectedPassport.serialHash} />
                  <DetailRow label="Owner" value={selectedPassport.ownerName} />
                  <DetailRow label="Owner wallet" value={selectedPassport.ownerWallet} />
                  <DetailRow label="Verifier" value={selectedPassport.verifier} />
                  <DetailRow label="Created" value={selectedPassport.createdAt} />
                  <DetailRow label="First verified" value={historyConfidence?.firstVerifiedDate ?? 'Not verified'} />
                  <DetailRow label="Unknown before first verified" value={historyConfidence?.unknownBeforeFirstVerified ? 'Yes' : 'No'} />
                  <DetailRow label="Last transaction" value={selectedPassport.lastTxSignature ? shortWallet(selectedPassport.lastTxSignature) : 'Not recorded'} />
                </div>
                <div className="mt-5 grid gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm font-semibold leading-6 text-stone-700">
                  <div className="flex min-h-8 items-center gap-3">
                    <ShieldCheck className="text-amber-700" size={18} />
                    <span>{historyConfidence?.summary}</span>
                  </div>
                  <p className="m-0 text-xs font-bold leading-5 text-amber-900/80">
                    Reka membuktikan riwayat yang sudah diverifikasi, bukan menjamin semua kejadian sebelum first verified date tidak pernah terjadi.
                  </p>
                </div>
                <div className="mt-3 flex min-h-12 items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm font-semibold leading-6 text-stone-700">
                  {isWritingChain ? <Loader2 className="animate-spin text-teal-700" size={18} /> : <ShieldCheck className="text-teal-700" size={18} />}
                  <span>
                    {chainMessage ||
                      `${programStatusText}. ${unverifiedHistoryCount} riwayat belum terverifikasi.`}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 rounded-2xl border border-stone-200 bg-white/64 p-4 lg:grid-cols-[1fr_1fr_auto]">
                  <Metric
                    icon={ClipboardCheck}
                    label="Seller disclosure"
                    value={sellerDisclosure?.status ?? 'Missing'}
                  />
                  <Metric
                    icon={ListChecks}
                    label="Inspection checklist"
                    value={inspectionSummary?.label ?? 'Not checked'}
                  />
                  <div className={cx('rounded-xl border p-4', buyerRiskClass(buyerRisk?.level ?? 'High'))}>
                    <ShieldCheck size={18} />
                    <span className="mt-2 block text-xs font-bold">Buyer risk</span>
                    <strong className="mt-1 block text-sm font-black">{buyerRisk?.level ?? 'High'}</strong>
                    <p className="m-0 mt-2 text-xs font-bold leading-5">{buyerRisk?.summary}</p>
                    <button
                      className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-current bg-white/70 px-3 text-xs font-black"
                      type="button"
                      onClick={addHiddenRepairDispute}
                    >
                      <FileClock size={15} />
                      Flag hidden repair
                    </button>
                  </div>
                </div>
              </div>

              <aside className={cx(ui.panel, 'grid content-start gap-4 p-5')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={ui.eyebrow}>Public verify</p>
                    <h3 className="text-xl font-black text-stone-950">Scan QR</h3>
                  </div>
                  <ScanLine className="text-teal-700" size={22} />
                </div>
                <div className="grid justify-items-center gap-4 rounded-2xl border border-stone-200 bg-white/60 p-4">
                  <QRCodeCanvas className="h-36! w-36! rounded-2xl bg-white" value={publicUrl} size={144} marginSize={2} />
                  <span className="max-w-full break-words rounded-xl bg-stone-100/80 px-3 py-2 text-xs font-black text-stone-600">{selectedPassport.id}</span>
                </div>
                <button className={cx(ui.primaryButton, 'w-full')} type="button" onClick={copyPublicUrl}>
                  <Copy size={17} />
                  Copy link
                </button>
              </aside>
            </div>
          </section>
        ) : null}

        {activeRoute === 'devices' ? (
          <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(310px,0.72fr)_minmax(0,1fr)]">
            <div className={ui.panel}>
              <div className={ui.panelHeading}>
                <div>
                  <p className={ui.eyebrow}>Device registry</p>
                  <h3>Passport tersimpan</h3>
                </div>
                <Search className="text-teal-700" size={20} />
              </div>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white/80 px-3 text-stone-500">
                <Search size={18} />
                <input
                  className="h-full w-full border-0 bg-transparent px-0 text-sm outline-none focus:ring-0"
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari device, owner, kota"
                />
              </label>
              <div className="mt-4 grid gap-3">
                {filteredPassports.map((passport) => {
                  const ListIcon = deviceIcons[passport.category]
                  return (
                    <button
                      className={cx(
                        'grid min-h-16 w-full grid-cols-[42px_minmax(0,1fr)_42px] items-center gap-3 rounded-xl border p-3 text-left text-stone-950 transition',
                        passport.id === selectedPassport.id
                          ? 'border-teal-200 bg-teal-50/80'
                          : 'border-stone-200 bg-white/72 hover:border-teal-200 hover:bg-teal-50/70',
                      )}
                      key={passport.id}
                      type="button"
                      onClick={() => navigateTo('passport', passport.id)}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                        <ListIcon size={18} />
                      </span>
                      <span>
                        <strong className="block overflow-hidden text-ellipsis whitespace-nowrap">{passport.brand} {passport.model}</strong>
                        <small className="block overflow-hidden text-ellipsis whitespace-nowrap text-sm text-stone-500">{passport.ownerName} - {passport.city}</small>
                      </span>
                      <em className="grid h-9 place-items-center rounded-xl bg-emerald-50 text-sm font-black not-italic text-emerald-700">{passport.trustScore}</em>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={ui.panel}>
              <div className={ui.panelHeading}>
                <div>
                  <p className={ui.eyebrow}>Create RWA passport</p>
                  <h3>Daftarkan barang bekas</h3>
                </div>
                <Plus className="text-teal-700" size={20} />
              </div>

              <form className={ui.formGrid} onSubmit={createPassport}>
                <label className={ui.label}>
                  Category
                  <select className={ui.input} value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value as DeviceCategory })
                    }
                  >
                    <option>Laptop</option>
                    <option>Phone</option>
                    <option>Camera</option>
                  </select>
                </label>
                <label className={ui.label}>
                  Brand
                  <input className={ui.input} required value={form.brand}
                    onChange={(event) => setForm({ ...form, brand: event.target.value })}
                    placeholder="Lenovo"
                  />
                </label>
                <label className={ui.label}>
                  Model
                  <input className={ui.input} required value={form.model}
                    onChange={(event) => setForm({ ...form, model: event.target.value })}
                    placeholder="ThinkPad X1 Carbon"
                  />
                </label>
                <label className={ui.label}>
                  Serial / IMEI
                  <input className={ui.input} required value={form.serialNumber}
                    onChange={(event) =>
                      setForm({ ...form, serialNumber: event.target.value })
                    }
                    placeholder="Disimpan sebagai hash"
                  />
                </label>
                <label className={ui.label}>
                  Condition
                  <select className={ui.input} value={form.condition}
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
                <label className={ui.label}>
                  Battery health
                  <input className={ui.input} value={form.batteryHealth}
                    onChange={(event) =>
                      setForm({ ...form, batteryHealth: event.target.value })
                    }
                    placeholder="92% / N/A"
                  />
                </label>
                <label className={ui.label}>
                  Estimated value
                  <input className={ui.input} required value={form.estimatedValue}
                    onChange={(event) =>
                      setForm({ ...form, estimatedValue: event.target.value })
                    }
                    placeholder="Rp 8.500.000"
                  />
                </label>
                <label className={ui.label}>
                  City
                  <input className={ui.input} required value={form.city}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                    placeholder="Depok"
                  />
                </label>
                <label className={ui.label}>
                  Owner
                  <input className={ui.input} required value={form.ownerName}
                    onChange={(event) =>
                      setForm({ ...form, ownerName: event.target.value })
                    }
                    placeholder="Nama penjual"
                  />
                </label>
                <label className={ui.label}>
                  Owner wallet
                  <input className={ui.input} value={form.ownerWallet}
                    onChange={(event) =>
                      setForm({ ...form, ownerWallet: event.target.value })
                    }
                    placeholder="Optional, default wallet terhubung"
                  />
                </label>
                <label className={cx(ui.label, ui.wide)}>
                  Verifier
                  <input className={ui.input} required value={form.verifier}
                    onChange={(event) =>
                      setForm({ ...form, verifier: event.target.value })
                    }
                    placeholder="Toko servis / komunitas verifier"
                  />
                </label>
                <button className={cx(ui.primaryButton, ui.wide)} type="submit" disabled={isWritingChain}>
                  {isWritingChain ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
                  Create Passport
                </button>
              </form>
            </div>
          </section>
        ) : null}

        {activeRoute === 'history' ? (
          <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,390px)]">
            <div className={cx(ui.panel, 'grid gap-5')}>
              <div className={ui.panelHeading}>
                <div>
                  <p className={ui.eyebrow}>Lifecycle log</p>
                  <h3>Riwayat servis & kondisi</h3>
                </div>
                <Wrench className="text-teal-700" size={20} />
              </div>
              <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white/64 p-4 md:grid-cols-3">
                <Metric icon={ShieldCheck} label="History confidence" value={historyConfidence?.level ?? 'Low'} />
                <Metric icon={FileClock} label="First verified" value={historyConfidence?.firstVerifiedDate ?? 'Not verified'} />
                <Metric icon={Search} label="Unverified records" value={`${unverifiedHistoryCount}`} />
              </div>

              <div className="grid">
                {selectedPassport.history.map((item) => {
                  const KindIcon = kindIcons[item.kind]
                  const source = item.source ?? (item.txSignature ? 'On-chain service' : 'Owner claim')
                  const status = item.status ?? (item.txSignature ? 'Verified' : 'Pending')
                  const serviceDate = item.serviceDate ?? item.date
                  return (
                    <article className="grid grid-cols-[42px_minmax(0,1fr)] gap-4 border-t border-stone-100 py-4 text-left first:border-t-0 first:pt-0" key={item.id}>
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
                        <KindIcon size={17} />
                      </span>
                      <div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                          <strong className="min-w-0 text-base font-bold leading-snug text-stone-950">{item.title}</strong>
                          <time className="shrink-0 text-xs font-bold text-stone-500">{serviceDate}</time>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={attestationStatusClass(status)}>
                            {status}
                          </span>
                          <span className={attestationSourceClass(source)}>
                            {source}
                          </span>
                          {item.date !== serviceDate ? (
                            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-black text-stone-600">
                              Attested {item.date}
                            </span>
                          ) : null}
                        </div>
                        <p className="my-2 max-w-3xl text-sm leading-6 text-stone-600">{item.notes}</p>
                        {item.evidenceHash ? (
                          <a
                            className="inline-flex w-fit text-sm font-bold text-teal-700 no-underline hover:text-teal-900"
                            href={item.evidenceUri}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Evidence {shortWallet(item.evidenceHash)}
                          </a>
                        ) : null}
                        <small className="text-xs font-semibold text-stone-500">
                          {item.verifier}
                          {item.txSignature ? ` - ${shortWallet(item.txSignature)}` : ''}
                        </small>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

            <div className={cx(ui.panel, 'sticky top-6 grid gap-4 self-start')}>
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-stone-200 bg-white/64 p-1">
                <button
                  className={historyActionTabClass(activeHistoryAction === 'disclosure')}
                  type="button"
                  onClick={() => setActiveHistoryAction('disclosure')}
                >
                  <ClipboardCheck size={15} />
                  Disclosure
                </button>
                <button
                  className={historyActionTabClass(activeHistoryAction === 'event')}
                  type="button"
                  onClick={() => setActiveHistoryAction('event')}
                >
                  <FileClock size={15} />
                  Event
                </button>
                <button
                  className={historyActionTabClass(activeHistoryAction === 'checklist')}
                  type="button"
                  onClick={() => setActiveHistoryAction('checklist')}
                >
                  <ListChecks size={15} />
                  Checklist
                </button>
              </div>

            {activeHistoryAction === 'disclosure' ? (
            <div>
              <div className={ui.panelHeading}>
                <div>
                  <p className={ui.eyebrow}>Seller disclosure</p>
                  <h3>Pengakuan penjual</h3>
                </div>
                <ClipboardCheck className="text-teal-700" size={20} />
              </div>
              <form className={ui.compactForm} onSubmit={saveSellerDisclosure}>
                <select
                  className={ui.input}
                  value={sellerDisclosureForm.status}
                  onChange={(event) =>
                    setSellerDisclosureForm({
                      ...sellerDisclosureForm,
                      status: event.target.value as SellerDisclosureStatus,
                    })
                  }
                >
                  <option>No known prior repair</option>
                  <option>Prior repair disclosed</option>
                  <option>Seller declined disclosure</option>
                </select>
                <input
                  className={ui.input}
                  value={sellerDisclosureForm.knownRepairCount}
                  onChange={(event) =>
                    setSellerDisclosureForm({
                      ...sellerDisclosureForm,
                      knownRepairCount: event.target.value,
                    })
                  }
                  placeholder="Jumlah service yang diketahui"
                />
                <textarea
                  className={ui.textarea}
                  value={sellerDisclosureForm.notes}
                  onChange={(event) =>
                    setSellerDisclosureForm({
                      ...sellerDisclosureForm,
                      notes: event.target.value,
                    })
                  }
                  placeholder="Catatan seller: part diganti, pernah bongkar, atau alasan tidak disclose"
                />
                <button className={ui.secondaryButton} type="submit">
                  <ClipboardCheck size={17} />
                  Save Disclosure
                </button>
              </form>
            </div>
            ) : null}

            {activeHistoryAction === 'event' ? (
            <div>
              <div className={ui.panelHeading}>
                <div>
                  <p className={ui.eyebrow}>Add event</p>
                  <h3>Tambah riwayat</h3>
                </div>
                <FileClock className="text-teal-700" size={20} />
              </div>
              <form className={ui.compactForm} onSubmit={addHistory}>
                <select className={ui.input} value={historyForm.kind}
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
                  className={ui.input}
                  required
                  type="date"
                  value={historyForm.serviceDate}
                  onChange={(event) =>
                    setHistoryForm({ ...historyForm, serviceDate: event.target.value })
                  }
                />
                <select
                  className={ui.input}
                  value={historyForm.source}
                  onChange={(event) => {
                    const source = event.target.value as AttestationSource
                    setHistoryForm({
                      ...historyForm,
                      source,
                      status: source === 'Owner claim' ? 'Pending' : historyForm.status,
                    })
                  }}
                >
                  <option>On-chain service</option>
                  <option>Verified receipt</option>
                  <option>Owner claim</option>
                </select>
                <select
                  className={ui.input}
                  value={historyForm.status}
                  disabled={historyForm.source === 'Owner claim'}
                  onChange={(event) =>
                    setHistoryForm({
                      ...historyForm,
                      status: event.target.value as AttestationStatus,
                    })
                  }
                >
                  <option>Pending</option>
                  <option>Verified</option>
                  <option>Rejected</option>
                  <option>Disputed</option>
                </select>
                <input className={ui.input} required value={historyForm.title}
                  onChange={(event) =>
                    setHistoryForm({ ...historyForm, title: event.target.value })
                  }
                  placeholder="Judul riwayat"
                />
                <input className={ui.input} value={historyForm.verifier}
                  onChange={(event) =>
                    setHistoryForm({ ...historyForm, verifier: event.target.value })
                  }
                  placeholder="Label verifier untuk tampilan lokal"
                />
                <input className={ui.input} required={historyForm.source !== 'Owner claim'} value={historyForm.evidenceUri}
                  onChange={(event) =>
                    setHistoryForm({ ...historyForm, evidenceUri: event.target.value })
                  }
                  placeholder={historyForm.source === 'Owner claim' ? 'Evidence optional untuk klaim owner' : 'Evidence wajib: IPFS / Arweave / Drive / invoice'}
                />
                <textarea
                  className={ui.textarea}
                  required
                  value={historyForm.notes}
                  onChange={(event) =>
                    setHistoryForm({ ...historyForm, notes: event.target.value })
                  }
                  placeholder="Catatan kondisi, sparepart, bukti invoice, atau garansi"
                />
                <button className={ui.secondaryButton} type="submit" disabled={isWritingChain}>
                  <FileClock size={17} />
                  {historyForm.source === 'Owner claim' ? 'Save Owner Claim' : 'Add Attestation'}
                </button>
              </form>
            </div>
            ) : null}

            {activeHistoryAction === 'checklist' ? (
            <div>
              <div className={ui.panelHeading}>
                <div>
                  <p className={ui.eyebrow}>Buyer protection</p>
                  <h3>Inspection checklist</h3>
                </div>
                <ListChecks className="text-teal-700" size={20} />
              </div>
              <form className={ui.compactForm} onSubmit={saveInspectionChecklist}>
                <input
                  className={ui.input}
                  value={inspectionForm.verifier}
                  onChange={(event) =>
                    setInspectionForm({ ...inspectionForm, verifier: event.target.value })
                  }
                  placeholder="Nama teknisi / verifier inspeksi"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {inspectionItems.map((item) => (
                    <label
                      className="grid gap-1 text-xs font-bold text-stone-600"
                      key={item.key}
                    >
                      {item.label}
                      <select
                        className={ui.input}
                        value={inspectionForm[item.key]}
                        onChange={(event) =>
                          setInspectionForm({
                            ...inspectionForm,
                            [item.key]: event.target.value as ChecklistValue,
                          })
                        }
                      >
                        <option>Unknown</option>
                        <option>Pass</option>
                        <option>Watch</option>
                        <option>Fail</option>
                      </select>
                    </label>
                  ))}
                </div>
                <button className={ui.secondaryButton} type="submit">
                  <ListChecks size={17} />
                  Save Checklist
                </button>
              </form>
            </div>
            ) : null}
            </div>
          </section>
        ) : null}

        {activeRoute === 'verifier' ? (
          <section className={ui.panel}>
            <div className={ui.panelHeading}>
              <div>
                <p className={ui.eyebrow}>Verifier registry</p>
                <h3>Aktifkan wallet verifier</h3>
              </div>
              <ShieldCheck className="text-teal-700" size={20} />
            </div>
            <form className={ui.formGrid} onSubmit={setupVerifier}>
              <label className={ui.label}>
                Nama verifier
                <input ref={verifierNameInputRef}
                  className={ui.input}
                  required
                  value={verifierForm.name}
                  onChange={(event) =>
                    setVerifierForm({ ...verifierForm, name: event.target.value })
                  }
                  placeholder="Nama toko / komunitas"
                />
              </label>
              <label className={ui.label}>
                Lokasi
                <input className={ui.input} required value={verifierForm.location}
                  onChange={(event) =>
                    setVerifierForm({ ...verifierForm, location: event.target.value })
                  }
                  placeholder="Kampus / kota"
                />
              </label>
              <label className={cx(ui.label, ui.wide)}>
                Bukti izin / profil
                <input className={ui.input} required value={verifierForm.evidenceUri}
                  onChange={(event) =>
                    setVerifierForm({ ...verifierForm, evidenceUri: event.target.value })
                  }
                  placeholder="ipfs://... atau link profil"
                />
              </label>
              <button className={cx(ui.secondaryButton, ui.wide)} type="submit" disabled={isWritingChain}>
                <ShieldCheck size={17} />
                Activate Verifier
              </button>
            </form>
          </section>
        ) : null}

        {activeRoute === 'transfer' ? (
          <section className={ui.panel}>
            <div className={ui.panelHeading}>
              <div>
                <p className={ui.eyebrow}>Quick transfer</p>
                <h3>Transfer asset</h3>
              </div>
              <UserRoundCheck className="text-teal-700" size={20} />
            </div>
            <form className={ui.compactForm} onSubmit={transferOwnership}>
              <input className={ui.input} required value={transferForm.ownerName}
                onChange={(event) =>
                  setTransferForm({
                    ...transferForm,
                    ownerName: event.target.value,
                  })
                }
                placeholder="Nama pemilik baru"
              />
              <input className={ui.input} required value={transferForm.ownerWallet}
                onChange={(event) =>
                  setTransferForm({
                    ...transferForm,
                    ownerWallet: event.target.value,
                  })
                }
                placeholder="Public key wallet pemilik baru"
              />
              <button className={ui.primaryButton} type="submit" disabled={isWritingChain}>
                <UserRoundCheck size={17} />
                Transfer Asset
              </button>
            </form>
            <a
              className="mt-4 inline-flex w-fit text-sm font-bold text-teal-700 no-underline hover:text-teal-900"
              href={explorerUrl(selectedPassport.lastTxSignature)}
              target="_blank"
              rel="noreferrer"
            >
              View transaction
            </a>
          </section>
        ) : null}

        {activeRoute === 'settings' ? (
          <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
            <div className={ui.panel}>
              <div className={ui.panelHeading}>
                <div>
                  <p className={ui.eyebrow}>Program</p>
                  <h3>Solana Devnet status</h3>
                </div>
                <Settings className="text-teal-700" size={20} />
              </div>
              <div className="grid gap-3">
                <Metric icon={ShieldCheck} label="Program status" value={programStatusText} />
                <Metric icon={Fingerprint} label="Program ID" value="AkRsKmDKtdwE6A4fU3M56L5mh1UxspS4MqMCCY4sG1Mg" />
                <Metric icon={Wallet} label="Connected wallet" value={walletAddress || 'Belum tersambung'} />
              </div>
            </div>
            <div className={ui.panel}>
              <div className={ui.panelHeading}>
                <div>
                  <p className={ui.eyebrow}>Links</p>
                  <h3>Audit trail</h3>
                </div>
                <Link2 className="text-teal-700" size={20} />
              </div>
              <div className="grid gap-3">
                <a className={ui.secondaryButton} href={getRekaProgramExplorerUrl()} target="_blank" rel="noreferrer">
                  <Link2 size={17} />
                  Open Program
                </a>
                <a className={ui.secondaryButton} href={explorerUrl(selectedPassport.lastTxSignature)} target="_blank" rel="noreferrer">
                  <Link2 size={17} />
                  Last Transaction
                </a>
              </div>
            </div>
          </section>
        ) : null}
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
  const verifyUrl = `${window.location.origin}/passport/${encodeURIComponent(featuredPassport.id)}`

  return (
    <main className="reka-landing min-h-screen overflow-hidden bg-[#050b12] text-white">
      <nav className="sticky top-0 z-20 mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-5 border-b border-white/10 bg-slate-950/62 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl" aria-label="Main navigation">
        <a className="inline-flex items-center gap-3 text-lg font-black text-white no-underline" href="#home">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/8 text-teal-200 shadow-sm shadow-black/20">
            <Fingerprint size={20} />
          </span>
          <span>Reka</span>
        </a>
        <div className="flex items-center justify-center gap-6">
          <a className="text-sm font-bold text-slate-300 no-underline hover:text-teal-200" href="#problem">Masalah</a>
          <a className="text-sm font-bold text-slate-300 no-underline hover:text-teal-200" href="#flow">Cara Kerja</a>
          <a className="text-sm font-bold text-slate-300 no-underline hover:text-teal-200" href="#mvp">MVP</a>
        </div>
        <button className={cx(ui.primaryButton, 'justify-self-end')} type="button" onClick={onOpenApp}>
          Buka MVP
          <ArrowRight size={17} />
        </button>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-[0.9fr_1fr]" id="home">
        <div>
          <p className="m-0 text-[12px] font-black uppercase tracking-[0.34em] text-teal-300">Frontier Solana Hackathon</p>
          <h1 className="mb-5 mt-4 text-6xl font-black leading-none text-white md:text-8xl">Reka</h1>
          <p className="m-0 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            Passport on-chain untuk laptop, HP, dan kamera second-hand, dibuat
            supaya mahasiswa bisa beli barang bekas dengan riwayat yang jelas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className={ui.primaryButton} type="button" onClick={onOpenApp}>
              Coba Dashboard
              <ArrowRight size={17} />
            </button>
            <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/8 px-4 text-sm font-black text-white no-underline shadow-sm shadow-black/20 transition hover:border-teal-300/40 hover:bg-teal-300/10" href="#flow">
              Lihat Alur
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-2" aria-label="Project proof points">
            <span className="rounded-full border border-teal-300/28 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-200">RWA</span>
            <span className="rounded-full border border-amber-300/28 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-200">Consumer App</span>
            <span className="rounded-full border border-indigo-300/28 bg-indigo-300/10 px-3 py-1.5 text-xs font-black text-indigo-200">Solana Devnet</span>
          </div>
        </div>

        <div className="min-w-0" aria-label="Reka product preview">
          <HeroDeviceMockup passport={featuredPassport} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16" id="problem">
        <div className="max-w-3xl">
          <p className="m-0 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Masalah yang dekat dengan mahasiswa</p>
          <h2 className="mb-3 mt-3 text-3xl font-extrabold leading-tight text-white md:text-4xl">Pasar barang bekas kampus punya trust issue.</h2>
        </div>
        <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
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

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-[0.85fr_1fr]" id="flow">
        <div className="max-w-3xl">
          <p className="m-0 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Solusi</p>
          <h2 className="mb-3 mt-3 text-3xl font-extrabold leading-tight text-white md:text-4xl">Satu passport publik untuk satu barang fisik.</h2>
          <p className="m-0 text-base leading-7 text-slate-300">
            Verifier seperti toko servis, komunitas kampus, atau koperasi bisa
            menambahkan inspeksi dan garansi. Event penting dicatat ke Solana
            Devnet sebagai audit trail.
          </p>
        </div>
        <div className="grid gap-3">
          <HomeStep number="01" title="Hash identitas barang" text="Serial atau IMEI diubah menjadi hash agar privasi tetap aman." />
          <HomeStep number="02" title="Catat kondisi dan servis" text="Verifier menambahkan inspeksi, sparepart, warranty, dan estimasi harga." />
          <HomeStep number="03" title="Transfer saat dijual" text="Passport berpindah ke owner baru dan riwayatnya tetap ikut terbawa." />
          <HomeStep number="04" title="Scan QR sebelum beli" text="Calon pembeli membuka halaman verifikasi publik dari QR." />
        </div>
      </section>

      <section className="mx-auto mb-12 grid max-w-7xl grid-cols-1 items-center gap-6 border-t border-white/10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_auto]" id="mvp">
        <div>
          <p className="m-0 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">MVP yang sudah bisa dicoba</p>
          <h2 className="mb-3 mt-3 text-3xl font-extrabold leading-tight text-white md:text-4xl">Demo Reka siap dipakai untuk video 3 menit.</h2>
          <p className="m-0 text-base leading-7 text-slate-300">
            Flow demo paling enak: buka dashboard, connect Phantom Devnet, buat
            passport, tambah riwayat servis, transfer owner, lalu scan QR.
          </p>
        </div>
        <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
          <button className={ui.primaryButton} type="button" onClick={onOpenApp}>
            Masuk ke MVP
            <ArrowRight size={17} />
          </button>
          <a className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/8 px-4 text-sm font-black text-white no-underline shadow-sm shadow-black/20 transition hover:border-teal-300/40 hover:bg-teal-300/10" href={verifyUrl}>
            Buka Contoh QR
            <ScanLine size={17} />
          </a>
        </div>
      </section>
    </main>
  )
}

function HeroDeviceMockup({ passport }: { passport: Passport }) {
  return (
    <div className="relative mx-auto h-[360px] max-w-[520px] lg:mr-0">
      <div className="absolute inset-x-8 bottom-4 h-20 rounded-full bg-teal-300/14 blur-3xl" />
      <div className="absolute bottom-8 left-8 right-4 h-36 rounded-[22px] border border-white/14 bg-gradient-to-br from-slate-300 via-slate-500 to-slate-800 shadow-[0_30px_80px_rgba(0,0,0,0.48)] [transform:perspective(620px)_rotateX(63deg)_rotateZ(-10deg)]" />
      <div className="absolute bottom-24 left-24 h-44 w-72 rounded-[20px] border border-white/16 bg-gradient-to-br from-slate-900 via-black to-slate-800 shadow-[0_28px_80px_rgba(0,0,0,0.55)] [transform:perspective(720px)_rotateY(-18deg)_rotateX(6deg)_rotateZ(2deg)]">
        <div className="absolute inset-3 rounded-xl border border-white/8 bg-[radial-gradient(circle_at_75%_28%,rgba(20,184,166,0.2),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_38%)]" />
      </div>
      <div className="absolute right-12 top-12 h-64 w-40 rotate-[-13deg] rounded-[24px] border border-white/34 bg-white/13 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/30 via-white/8 to-slate-900/24" />
        <div className="relative grid h-full content-start justify-items-center gap-4 text-center">
          <span className="text-[13px] font-black uppercase tracking-[0.16em] text-white/86">Passport</span>
          <div className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/8 text-white/72">
            <Fingerprint size={34} />
          </div>
          <div className="grid w-full gap-2">
            <span className="mx-auto h-2 w-24 rounded-full bg-white/58" />
            <span className="mx-auto h-2 w-20 rounded-full bg-white/42" />
            <span className="mx-auto h-2 w-28 rounded-full bg-white/30" />
          </div>
          <span className="mt-auto rounded-md border border-white/18 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
            {passport.id.slice(0, 8)}
          </span>
        </div>
      </div>
    </div>
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
    <article className="rounded-2xl border border-white/12 bg-white/7 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/8 text-slate-200">
        <Icon size={22} />
      </span>
      <h3 className="mb-2 mt-4 text-lg font-bold leading-tight text-white">{title}</h3>
      <p className="m-0 text-slate-300">{text}</p>
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
    <article className="grid grid-cols-[58px_minmax(0,1fr)] gap-4 rounded-2xl border border-white/12 bg-white/7 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <span className="grid h-11 place-items-center rounded-xl border border-white/10 bg-white/8 text-sm font-black text-teal-200">{number}</span>
      <div>
        <h3 className="mb-1 text-lg font-bold leading-tight text-white">{title}</h3>
        <p className="m-0 text-slate-300">{text}</p>
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
    <div className="rounded-xl border border-white/12 bg-white/7 p-4">
      <Icon className="text-teal-200" size={18} />
      <span className="mt-2 block text-xs font-bold text-slate-400">{label}</span>
      <strong className="mt-1 block break-words text-sm font-bold text-white">{value}</strong>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-white/8 py-3 md:grid-cols-[150px_minmax(0,1fr)] md:gap-5">
      <span className="text-sm font-bold text-slate-400">{label}</span>
      <strong className="min-w-0 break-words text-sm font-black text-white">{value}</strong>
    </div>
  )
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'teal' | 'amber' | 'indigo' | 'rose'
}) {
  const styles = {
    teal: 'border-teal-300/24 bg-teal-300/10 text-teal-200',
    amber: 'border-amber-300/24 bg-amber-300/10 text-amber-200',
    indigo: 'border-indigo-300/24 bg-indigo-300/10 text-indigo-200',
    rose: 'border-rose-300/24 bg-rose-300/10 text-rose-200',
  }

  return (
    <div className={cx('min-w-0 rounded-2xl border p-4 shadow-sm shadow-black/20', styles[tone])}>
      <span className="block text-[11px] font-black uppercase tracking-[0.16em] opacity-70">{label}</span>
      <strong className="mt-2 block break-words text-lg font-black leading-tight text-white">{value}</strong>
    </div>
  )
}

function getHistoryConfidence(passport: Passport) {
  const verifiedEntries = passport.history.filter(
    (item) => getAttestationStatus(item) === 'Verified',
  )
  const onChainVerifiedCount = verifiedEntries.filter(
    (item) => getAttestationSource(item) === 'On-chain service',
  ).length
  const receiptVerifiedCount = verifiedEntries.filter(
    (item) => getAttestationSource(item) === 'Verified receipt',
  ).length
  const riskyEntries = passport.history.filter((item) =>
    ['Pending', 'Rejected', 'Disputed'].includes(getAttestationStatus(item)),
  ).length
  const firstVerifiedDate = verifiedEntries
    .map((item) => item.serviceDate ?? item.date)
    .sort()[0]
  const unknownBeforeFirstVerified = Boolean(firstVerifiedDate)

  let level: HistoryConfidenceLevel = 'Low'
  if (verifiedEntries.length >= 3 && riskyEntries === 0 && onChainVerifiedCount >= 1) {
    level = 'High'
  } else if (
    verifiedEntries.length >= 2 ||
    (onChainVerifiedCount >= 1 && receiptVerifiedCount >= 1)
  ) {
    level = riskyEntries > 1 ? 'Low' : 'Medium'
  }

  const summary = firstVerifiedDate
    ? `Hanya ${verifiedEntries.length} riwayat yang verified. Riwayat sebelum ${firstVerifiedDate} tetap unknown kecuali ada evidence tambahan.`
    : 'Belum ada riwayat verified. Semua klaim service harus dianggap belum terbukti.'

  return {
    level,
    firstVerifiedDate,
    unknownBeforeFirstVerified,
    verifiedCount: verifiedEntries.length,
    riskyCount: riskyEntries,
    summary,
  }
}

function getSellerDisclosure(passport: Passport): SellerDisclosure {
  return (
    passport.sellerDisclosure ?? {
      status: 'Missing',
      sellerName: passport.ownerName,
      knownRepairCount: 'Unknown',
      notes: 'Seller has not disclosed known prior repair history.',
      declaredAt: '',
    }
  )
}

function getInspectionSummary(passport: Passport) {
  const checklist = passport.inspectionChecklist
  if (!checklist) {
    return {
      label: 'Not checked',
      knownCount: 0,
      riskyCount: inspectionItems.length,
      unknownCount: inspectionItems.length,
    }
  }

  const values = inspectionItems.map(({ key }) => checklist[key])
  const riskyCount = values.filter((value) => value === 'Watch' || value === 'Fail').length
  const unknownCount = values.filter((value) => value === 'Unknown').length
  const knownCount = values.length - unknownCount

  return {
    label: `${knownCount}/${values.length} checked`,
    knownCount,
    riskyCount,
    unknownCount,
  }
}

function getBuyerRisk(passport: Passport) {
  const disclosure = getSellerDisclosure(passport)
  const inspection = getInspectionSummary(passport)
  const confidence = getHistoryConfidence(passport)
  const hasDispute = passport.history.some((item) => getAttestationStatus(item) === 'Disputed')

  let level: BuyerRiskLevel = 'Low'
  if (
    disclosure.status === 'Missing' ||
    disclosure.status === 'Seller declined disclosure' ||
    inspection.knownCount < 5 ||
    confidence.level === 'Low' ||
    hasDispute
  ) {
    level = 'High'
  } else if (
    disclosure.status === 'Prior repair disclosed' ||
    inspection.unknownCount > 0 ||
    inspection.riskyCount > 0 ||
    confidence.level === 'Medium'
  ) {
    level = 'Medium'
  }

  const summary =
    level === 'High'
      ? 'Do not price as clean without fresh inspection evidence.'
      : level === 'Medium'
        ? 'Some risk remains; compare disclosure with inspection results.'
        : 'Disclosure, inspection, and verified history are aligned.'

  return { level, summary }
}

function buyerRiskClass(level: BuyerRiskLevel) {
  const styles: Record<BuyerRiskLevel, string> = {
    Low: 'border-emerald-300/24 bg-emerald-300/10 text-emerald-200',
    Medium: 'border-amber-300/24 bg-amber-300/10 text-amber-200',
    High: 'border-rose-300/24 bg-rose-300/10 text-rose-200',
  }
  return styles[level]
}

function getDisclosureDefaultNotes(status: SellerDisclosureStatus) {
  const notes: Record<SellerDisclosureStatus, string> = {
    Missing: 'Seller has not disclosed known prior repair history.',
    'No known prior repair': 'Seller states they know no prior repair history.',
    'Prior repair disclosed': 'Seller disclosed prior repair history.',
    'Seller declined disclosure':
      'Seller declined to disclose repair history; buyer should require inspection.',
  }
  return notes[status]
}

function getAttestationStatus(item: PassportHistory): AttestationStatus {
  return item.status ?? (item.txSignature ? 'Verified' : 'Pending')
}

function getAttestationSource(item: PassportHistory): AttestationSource {
  return item.source ?? (item.txSignature ? 'On-chain service' : 'Owner claim')
}

function historyConfidenceTone(level: HistoryConfidenceLevel) {
  const tones: Record<HistoryConfidenceLevel, 'teal' | 'amber' | 'indigo' | 'rose'> = {
    High: 'teal',
    Medium: 'amber',
    Low: 'rose',
  }
  return tones[level]
}

function attestationStatusClass(status: AttestationStatus) {
  const styles: Record<AttestationStatus, string> = {
    Verified: 'border-emerald-300/24 bg-emerald-300/10 text-emerald-200',
    Pending: 'border-amber-300/24 bg-amber-300/10 text-amber-200',
    Rejected: 'border-rose-300/24 bg-rose-300/10 text-rose-200',
    Disputed: 'border-indigo-300/24 bg-indigo-300/10 text-indigo-200',
  }

  return cx('rounded-full border px-2.5 py-1 text-[11px] font-black', styles[status])
}

function attestationSourceClass(source: AttestationSource) {
  const styles: Record<AttestationSource, string> = {
    'On-chain service': 'border-teal-300/24 bg-teal-300/10 text-teal-200',
    'Verified receipt': 'border-sky-300/24 bg-sky-300/10 text-sky-200',
    'Owner claim': 'border-slate-300/18 bg-white/7 text-slate-300',
  }

  return cx('rounded-full border px-2.5 py-1 text-[11px] font-black', styles[source])
}

function parseWalletOrFallback(value: string, fallback: PublicKey) {
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return parseRequiredWallet(trimmed)
}

function parseRequiredWallet(value: string) {
  try {
    return new PublicKey(value.trim())
  } catch {
    throw new Error('Masukkan public key wallet Solana yang valid.')
  }
}

function historyKindToNumber(kind: HistoryKind) {
  const map: Record<HistoryKind, number> = {
    Inspection: 0,
    Repair: 1,
    Warranty: 2,
    Ownership: 3,
  }
  return map[kind]
}

function attestationSourceToNumber(source: AttestationSource) {
  const map: Record<AttestationSource, number> = {
    'On-chain service': 0,
    'Verified receipt': 1,
    'Owner claim': 2,
  }
  return map[source]
}

function attestationStatusToNumber(status: AttestationStatus) {
  const map: Record<AttestationStatus, number> = {
    Pending: 0,
    Verified: 1,
    Rejected: 2,
    Disputed: 3,
  }
  return map[status]
}

function getTrustScoreDelta(source: AttestationSource, status: AttestationStatus) {
  if (status === 'Rejected') return -6
  if (status === 'Disputed') return -3
  if (status === 'Pending') return source === 'Owner claim' ? 0 : 1
  if (source === 'On-chain service') return 3
  if (source === 'Verified receipt') return 2
  return 0
}

function clampTrustScore(value: number) {
  return Math.max(0, Math.min(99, value))
}

function dateToUnixSeconds(value: string) {
  const timestamp = Date.parse(`${value}T00:00:00.000Z`)
  if (Number.isNaN(timestamp)) {
    throw new Error('Tanggal service tidak valid.')
  }
  return Math.floor(timestamp / 1000)
}

function makeEntryId() {
  return `H${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`
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

async function hashEvidence(value: string) {
  const encoded = new TextEncoder().encode(value.trim())
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  const bytes = Array.from(new Uint8Array(digest))
  return `sha256:${bytes
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)}`
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

function getProgramStatusText(status: ProgramStatus) {
  const messages: Record<ProgramStatus, string> = {
    checking: 'Checking Devnet program',
    ready: 'Program deployed & executable',
    missing: 'Program belum ditemukan di Devnet',
    offline: 'RPC Devnet belum merespons',
  }
  return messages[status]
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function explorerUrl(signature?: string) {
  if (!signature) return 'https://explorer.solana.com/?cluster=devnet'
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`
}

export default App
