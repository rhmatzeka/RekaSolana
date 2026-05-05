import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileClock,
  Fingerprint,
  Laptop,
  Link2,
  ScanLine,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
  Wallet,
  Wrench,
} from 'lucide-react'
import './landing.css'

const trustSignals = [
  { name: 'Serial hash', value: 'sha256:84b1e2c915d7fa02', icon: Fingerprint },
  { name: 'Service history', value: '2 verified logs', icon: FileClock },
  { name: 'Seller disclosure', value: 'Prior repair checked', icon: ClipboardCheck },
  { name: 'Owner trail', value: 'Transfer signed', icon: UserRoundCheck },
]

const deviceTypes = [
  { name: 'Laptop', detail: 'battery, SSD, display, ports', icon: Laptop },
  { name: 'Phone', detail: 'IMEI, battery, camera, screen', icon: Smartphone },
  { name: 'Camera', detail: 'serial, shutter count, sensor', icon: Camera },
]

const heroStats = [
  { label: 'Trust score', value: '91%' },
  { label: 'Verified logs', value: '2' },
  { label: 'Owner trail', value: 'Signed' },
]

const featureCards = [
  {
    title: 'HASHED DEVICE IDENTITY',
    description:
      'Serial number or IMEI is hashed locally before it becomes the passport PDA seed. Buyers can verify identity without exposing raw identifiers.',
    icon: Fingerprint,
    mockup: 'identity',
  },
  {
    title: 'SERVICE ATTESTATIONS',
    description:
      'Verifier, receipt URI, evidence hash, service date, source, and status are recorded as lifecycle entries.',
    icon: Wrench,
    mockup: 'history',
  },
  {
    title: 'BUYER RISK CONTROLS',
    description:
      'Seller disclosure and inspection checklist keep missing history visible instead of pretending an old device is clean.',
    icon: ShieldCheck,
    mockup: 'risk',
  },
  {
    title: 'QR PUBLIC VERIFICATION',
    description:
      'A public passport link gives buyers a scannable view of condition, ownership, confidence, and transaction trail.',
    icon: ScanLine,
    mockup: 'qr',
  },
]

const flowTabs = [
  {
    id: 'passport',
    label: 'PASSPORT',
    title: 'Create a device passport',
    badge: 'create_passport',
    copy: 'Register a laptop, phone, or camera with hashed identity, owner wallet, verifier name, city, value, and condition.',
    icon: BadgeCheck,
  },
  {
    id: 'history',
    label: 'HISTORY',
    title: 'Add verified lifecycle logs',
    badge: 'add_history',
    copy: 'Attach inspection, repair, warranty, or ownership evidence with source and status so confidence is explicit.',
    icon: FileClock,
  },
  {
    id: 'transfer',
    label: 'TRANSFER',
    title: 'Transfer ownership after resale',
    badge: 'transfer_passport',
    copy: 'The current owner signs a transfer to the buyer wallet, then the QR link reflects the new ownership trail.',
    icon: Wallet,
  },
]

const footerColumns = [
  { heading: 'PRODUCT', links: ['Asset passport', 'QR verification', 'Buyer risk'] },
  { heading: 'SOLANA', links: ['Anchor program', 'Devnet audit trail', 'PDA accounts'] },
  { heading: 'MVP', links: ['Dashboard', 'Verifier registry', 'Transfer flow'] },
]

export default function LandingPage({ onLaunchApp }: { onLaunchApp?: () => void }) {
  const [activeFlow, setActiveFlow] = useState(flowTabs[0].id)
  const [navCompact, setNavCompact] = useState(false)
  const selectedFlow = flowTabs.find((flow) => flow.id === activeFlow) ?? flowTabs[0]
  const SelectedFlowIcon = selectedFlow.icon

  useEffect(() => {
    const onScroll = () => {
      setNavCompact(window.scrollY > 24)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // IntersectionObserver for section reveal animations
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const reveals = document.querySelectorAll('[data-reveal]')
    if (!reveals.length) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).classList.add('is-revealed')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    reveals.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="landing-root">
      <nav className={`landing-nav${navCompact ? ' is-compact' : ''}`}>
        <a href="/" className="landing-logo" aria-label="Reka home">
          <Fingerprint size={22} className="landing-logo-icon" />
          <span>Reka</span>
        </a>

        <div className="landing-nav-links">
          <a href="#problem">Masalah</a>
          <a href="#features">Fitur</a>
          <a href="#flow">Demo flow</a>
        </div>

        <button className="landing-cta-sm" onClick={onLaunchApp}>
          Buka MVP <ChevronRight size={14} />
        </button>
      </nav>

      <header className="landing-hero">

        <div className="landing-spline-layer" aria-hidden="true">
          <iframe
            src="https://my.spline.design/solanaplanet-VKQMp0fXRjAW7z08NmG8yKlt/"
            frameBorder="0"
            width="100%"
            height="100%"
            title="Reka landing background"
          />
        </div>
        <div className="landing-hero-copy">
          <p className="landing-badge">
            <ShieldCheck size={14} /> Reka Passport
          </p>
          <h1 className="landing-headline">
            Cek device bekas sebelum beli.
          </h1>
          <p className="landing-subheadline">
            Riwayat servis, owner trail, dan QR verify dalam satu tempat.
          </p>
          <div className="landing-hero-buttons">
            <button className="btn-primary" onClick={onLaunchApp}>
              Buka Dashboard
            </button>
            <a className="btn-ghost" href="#flow">
              Lihat Demo Flow <ChevronRight size={16} />
            </a>
          </div>
          <div className="landing-hero-stats" aria-label="Reka passport preview stats">
            {heroStats.map((stat) => (
              <div className="hero-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="landing-partners" id="problem" data-reveal>
        <p className="section-micro-label">YANG DICEK SEBELUM BELI DEVICE BEKAS</p>
        <div className="partners-grid">
          {trustSignals.map(({ name, value, icon: Icon }) => (
            <div className="partner-item" key={name}>
              <Icon size={18} />
              <span>{name}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-features" id="features" data-reveal>
        <div className="features-header">
          <span className="pill-label">REKA MVP</span>
          <h2>Passport publik untuk riwayat perangkat.</h2>
          <p>
            Reka tidak mengklaim semua masa lalu barang bersih. Reka menampilkan
            apa yang sudah diverifikasi, apa yang masih klaim owner, dan apa yang
            perlu dicek ulang pembeli.
          </p>
        </div>

        <div className="device-strip">
          {deviceTypes.map(({ name, detail, icon: Icon }) => (
            <div className="device-chip" key={name}>
              <Icon size={20} />
              <span>{name}</span>
              <small>{detail}</small>
            </div>
          ))}
        </div>

        <div className="features-grid">
          {featureCards.map(({ title, description, icon: Icon, mockup }) => (
            <article className="feature-card" key={title}>
              <div className="feature-card-header">
                <Icon size={16} className="fc-icon" />
                <span>{title}</span>
              </div>
              <p className="fc-desc">{description}</p>
              <FeatureMockup kind={mockup} />
            </article>
          ))}
        </div>

        <div className="mini-features">
          {[
            { icon: CheckCircle2, text: 'LOCAL HASHING' },
            { icon: BadgeCheck, text: 'VERIFIER EVIDENCE' },
            { icon: Link2, text: 'DEVNET AUDIT TRAIL' },
            { icon: ClipboardCheck, text: 'BUYER CHECKLIST' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="mini-feat">
              <Icon size={16} /> <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-courses" id="flow" data-reveal>
        <div className="courses-header">
          <span className="section-micro-label">DEMO FLOW HACKATHON</span>
          <h2>Buat passport, tambah evidence, transfer owner.</h2>
          <button className="btn-primary" onClick={onLaunchApp}>
            Coba Dashboard
          </button>
        </div>

        <div className="course-tabs">
          {flowTabs.map((flow) => (
            <button
              key={flow.id}
              className={`course-tab${activeFlow === flow.id ? ' active' : ''}`}
              onClick={() => setActiveFlow(flow.id)}
              type="button"
            >
              {flow.label}
            </button>
          ))}
        </div>

        <div className="flow-panel" key={selectedFlow.id}>
          <div className="flow-visual">
            <SelectedFlowIcon size={30} />
            <span>{selectedFlow.badge}</span>
          </div>
          <div>
            <h3>{selectedFlow.title}</h3>
            <p>{selectedFlow.copy}</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-gradient-line" />
        <div className="footer-inner">
          <p className="footer-copy">REKA / SOLANA ASSET PASSPORT MVP</p>
          <div className="footer-columns">
            {footerColumns.map((col) => (
              <div key={col.heading} className="footer-col">
                <h4>{col.heading}</h4>
                {col.links.map((link) => (
                  <a key={link} href="#features">{link}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureMockup({ kind }: { kind: string }) {
  if (kind === 'identity') {
    return (
      <div className="fc-mockup">
        <div className="fc-mock-title">PASSPORT IDENTITY</div>
        {[
          ['Category', 'Laptop'],
          ['Model', 'ThinkPad X1 Carbon'],
          ['Serial / IMEI', 'Stored as local hash'],
        ].map(([label, value]) => (
          <div className="fc-data-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    )
  }

  if (kind === 'history') {
    return (
      <div className="fc-mockup">
        <div className="fc-mock-title">LIFECYCLE LOG</div>
        <div className="fc-timeline">
          <span />
          <div>
            <strong>Battery and display inspection</strong>
            <small>Verified receipt / 2026-04-21</small>
          </div>
        </div>
        <div className="fc-timeline">
          <span />
          <div>
            <strong>30-day campus store warranty</strong>
            <small>On-chain service / verified</small>
          </div>
        </div>
      </div>
    )
  }

  if (kind === 'risk') {
    return (
      <div className="fc-mockup">
        <div className="fc-mock-title">BUYER RISK</div>
        {[
          ['Seller disclosure', 'Pending'],
          ['Display', 'Pass'],
          ['Opened / tampered', 'Watch'],
        ].map(([label, value]) => (
          <div className="fc-check-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="fc-mockup qr-mockup">
      <div className="qr-mark qr-mark-small" aria-hidden="true">
        {Array.from({ length: 25 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>
      <div>
        <div className="fc-mock-title">PUBLIC LINK</div>
        <strong>reka.dev/passport/RK-24-MBP-7F3A</strong>
        <small>Scan before COD or campus meetup.</small>
      </div>
    </div>
  )
}
