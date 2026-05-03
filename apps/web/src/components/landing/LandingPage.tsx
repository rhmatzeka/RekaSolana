import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import './landing.css'
import {
  ChevronRight,
  ChevronsRight,
  Globe,
  Target,
  Terminal,
  Award,
  CheckCircle2,
  Headphones,
  DollarSign,
  GitBranch,
  Zap,
  Waves,
  Hexagon,
  Diamond,
  Sun,
  Compass,
  Orbit,
  Volume2,
} from 'lucide-react'

/* ───── animation helpers ───── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
}

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.08 } },
}

/* ───── partner data ───── */
const partners = [
  { name: 'Jupiter', icon: Zap },
  { name: 'Solana Foundation', icon: Sun },
  { name: 'Metaplex', icon: Hexagon },
  { name: 'Orca', icon: Waves },
  { name: 'Helius', icon: Compass },
  { name: 'Arcium', icon: Diamond },
  { name: 'Pyth', icon: Orbit },
  { name: 'Sonic', icon: Volume2 },
]

/* ───── course data ───── */
const courses = [
  { title: 'Token on Solana', level: 'BEGINNER', lessons: 12 },
  { title: 'Introduction to Assembly', level: 'BEGINNER', lessons: 8 },
  { title: 'Anchor for Dummies', level: 'BEGINNER', lessons: 15 },
]

/* ───── footer data ───── */
const footerColumns = [
  { heading: 'FEATURED WORK', links: ['Wormhole', 'Orca', 'Virtuals', 'Sonic'] },
  { heading: 'RESOURCES', links: ['Courses', 'Research', 'Labs', 'Brand'] },
  { heading: 'COMMUNITY', links: ['X', 'Discord', 'Github'] },
]

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage({ onLaunchApp }: { onLaunchApp?: () => void }) {
  const [hoveredPartner, setHoveredPartner] = useState<string | null>(null)

  return (
    <div className="landing-root">
      {/* ── atmospheric glows ── */}
      <div className="landing-glow landing-glow--hero" />
      <div className="landing-glow landing-glow--features" />

      {/* ══════ NAVBAR ══════ */}
      <nav className="landing-nav">
        <a href="#" className="landing-logo">
          <ChevronsRight size={22} className="landing-logo-icon" />
          <span>BlueShift</span>
        </a>

        <div className="landing-nav-links">
          {['COMMUNITY', 'RESOURCES', 'DOCS'].map((l) => (
            <a key={l} href="#">{l}</a>
          ))}
        </div>

        <button className="landing-cta-sm" onClick={onLaunchApp}>
          LAUNCH APP <ChevronRight size={14} />
        </button>
      </nav>

      {/* ══════ HERO ══════ */}
      <header className="landing-hero">
        {/* stacked vault cards */}
        <motion.div
          className="vault-stack"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="vault-card" style={{ '--vi': i } as React.CSSProperties}>
              <div className="vault-card-glow" />
              <div className="vault-card-inner">
                <span className="vault-label">Solana</span>
                <span className="vault-sublabel">Vault</span>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.p
          className="landing-badge"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ChevronsRight size={14} /> ADMIN
        </motion.p>

        <motion.h1
          className="landing-headline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          Make the shift.{' '}
          <span className="headline-glow">Build on Solana.</span>
        </motion.h1>

        <motion.p
          className="landing-subheadline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Learn how to write your own on-chain programs from the top instructors
          in the Solana ecosystem.
        </motion.p>

        <motion.div
          className="landing-hero-buttons"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <button className="btn-primary" onClick={onLaunchApp}>
            START LEARNING
          </button>
          <button className="btn-ghost">
            JOIN THE COMMUNITY <ChevronRight size={16} />
          </button>
        </motion.div>
      </header>

      {/* ══════ PARTNERS ══════ */}
      <section className="landing-partners">
        <p className="section-micro-label">UP TO TENS OF THOUSANDS OF BUILDERS</p>
        <motion.div
          className="partners-grid"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {partners.map(({ name, icon: Icon }, i) => (
            <motion.div
              key={name}
              className={`partner-item${hoveredPartner === name ? ' active' : ''}`}
              variants={fadeUp}
              custom={i}
              onMouseEnter={() => setHoveredPartner(name)}
              onMouseLeave={() => setHoveredPartner(null)}
            >
              <Icon size={18} />
              <span>{name}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section className="landing-features">
        <motion.div
          className="features-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="pill-label">FEATURES</span>
          <h2>The only free, on-chain<br />learning platform.</h2>
          <p>
            Rich, adept and foundational open source, MIT licensed teacher and
            student content for your educational needs.
          </p>
        </motion.div>

        <motion.div
          className="features-grid"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Card 1 */}
          <motion.div className="feature-card" variants={fadeUp} custom={0}>
            <div className="feature-card-header">
              <Globe size={16} className="fc-icon" />
              <span>FULLY ONLINE & INTERNATIONAL</span>
            </div>
            <p className="fc-desc">BlueShift is available worldwide and supports numerous languages, covering a variety of key programs.</p>
            <div className="fc-mockup">
              <div className="fc-mock-title">SELECT LANGUAGE</div>
              {['English', 'Español', 'Bahasa Indonesia', '日本語'].map((l, idx) => (
                <div key={l} className={`fc-lang-row${idx === 0 ? ' active' : ''}`}>
                  <span>{l}</span>
                  {idx === 0 && <CheckCircle2 size={14} />}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div className="feature-card" variants={fadeUp} custom={1}>
            <div className="feature-card-header">
              <Target size={16} className="fc-icon" />
              <span>FLEXIBLE WITH YOUR LIFESTYLE</span>
            </div>
            <p className="fc-desc">Try to find a balanced learning approach with the help of daily and weekly goals set flexibly.</p>
            <div className="fc-mockup">
              <div className="fc-mock-title">MOTIVATION</div>
              <div className="fc-goal">
                <span className="fc-goal-label">Determined</span>
                <span className="fc-goal-value">5 lessons / week</span>
              </div>
              <div className="fc-progress-bar">
                <div className="fc-progress-fill" style={{ width: '72%' }} />
              </div>
              <div className="fc-progress-label">72% this week</div>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div className="feature-card" variants={fadeUp} custom={2}>
            <div className="feature-card-header">
              <Terminal size={16} className="fc-icon" />
              <span>INTERACTIVE LEARNING WITH CHALLENGES</span>
            </div>
            <p className="fc-desc">Layer by layer, build from the basics of Rust/Anchor to crafting smart contracts to the world.</p>
            <div className="fc-mockup fc-terminal">
              <div className="fc-term-bar">
                <span className="fc-dot" /><span className="fc-dot" /><span className="fc-dot" />
              </div>
              <div className="fc-term-body">
                <code><span className="t-kw">use</span> anchor_lang::prelude::*;</code>
                <code>&nbsp;</code>
                <code><span className="t-attr">#[program]</span></code>
                <code><span className="t-kw">pub mod</span> <span className="t-fn">blueshift</span> {'{'}</code>
                <code>  <span className="t-kw">pub fn</span> <span className="t-fn">initialize</span>(ctx) {'{'}</code>
                <code>    msg!(<span className="t-str">"GM Solana!"</span>);</code>
                <code>  {'}'}</code>
                <code>{'}'}</code>
              </div>
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div className="feature-card" variants={fadeUp} custom={3}>
            <div className="feature-card-header">
              <Award size={16} className="fc-icon" />
              <span>REWARDING FOR YOUR HARD WORK</span>
            </div>
            <p className="fc-desc">Collect exclusive NFT certificates on Solana to prove and quantify your achievements.</p>
            <div className="fc-mockup fc-nft-stack">
              {[0, 1, 2].map((i) => (
                <div key={i} className="fc-nft" style={{ '--ni': i } as React.CSSProperties}>
                  <Award size={24} />
                  <span>{['Solana 101', 'Anchor Pro', 'DeFi Hero'][i]}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* mini feature row */}
        <motion.div
          className="mini-features"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          {[
            { icon: CheckCircle2, text: 'MODULAR EXPERIENCE' },
            { icon: Headphones, text: '24/7 MENTOR SUPPORT' },
            { icon: DollarSign, text: '100% FREE' },
            { icon: GitBranch, text: 'OPEN SOURCE' },
          ].map(({ icon: Ic, text }) => (
            <div key={text} className="mini-feat">
              <Ic size={16} /> <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ══════ COURSES ══════ */}
      <section className="landing-courses">
        <motion.div
          className="courses-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-micro-label">START EARNING MATTERS NOW</span>
          <h2>Jump in and<br />make the shift.</h2>
          <button className="btn-primary" style={{ marginTop: 16 }}>SEE OUR COURSES</button>
        </motion.div>

        {/* tab row */}
        <div className="course-tabs">
          {['COURSES', 'WALKTHROUGHS', 'WORKSHOPS'].map((t, idx) => (
            <button key={t} className={`course-tab${idx === 0 ? ' active' : ''}`}>{t}</button>
          ))}
        </div>

        <motion.div
          className="courses-grid"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {courses.map((c, i) => (
            <motion.div key={c.title} className="course-card" variants={fadeUp} custom={i}>
              <div className="course-card-visual">
                <div className="dot-grid" />
                <div className="course-visual-glow" />
              </div>
              <div className="course-card-tags">
                <span className="tag-online"><ChevronsRight size={12} /> ON-LINE</span>
                <span className="tag-level">{c.level}</span>
              </div>
              <h3>{c.title}</h3>
              <button className="btn-course">START COURSE</button>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="landing-footer">
        <div className="footer-gradient-line" />
        <div className="footer-inner">
          <p className="footer-copy">© 2024 BLUESHIFT LABS LIMITED</p>
          <div className="footer-columns">
            {footerColumns.map((col) => (
              <div key={col.heading} className="footer-col">
                <h4>{col.heading}</h4>
                {col.links.map((l) => (
                  <a key={l} href="#">{l}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
