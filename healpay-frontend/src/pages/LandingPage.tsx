import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Brain, Shield, Zap, TrendingUp, CheckCircle, ArrowRight,
  ClipboardCheck, BarChart3, AlertCircle, Clock, Check, FileCheck,
  Layers, PieChart, Activity, Menu, X, ChevronDown, Star
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import Chatbot from '@/components/Chatbot'
import Threads from '@/components/Threads'

// ─── Animation Wrapper ────────────────────────────────────────────────────────
const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
)

// ─── Sparkles Icon ────────────────────────────────────────────────────────────
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // FIX: Sticky bottom CTA bar — show after user scrolls 40% of page
  const [showStickyBar, setShowStickyBar] = useState(false)
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      setShowStickyBar(scrolled > 0.4)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">

      {/* ── 1. Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="md" />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#problem" className="hover:text-blue-600 transition-colors">The Problem</a>
            <a href="#solution" className="hover:text-blue-600 transition-colors">Solution</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">Workflow</a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')} className="text-slate-600 hover:text-slate-900">
              Sign In
            </Button>
            <Button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20">
              Get Started
            </Button>
          </div>

          {/* FIX: Mobile menu button — only visible on mobile (hidden on md+) */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-4 flex flex-col gap-4">
                <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600 font-medium hover:text-blue-600">The Problem</a>
                <a href="#solution" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600 font-medium hover:text-blue-600">Solution</a>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600 font-medium hover:text-blue-600">Features</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-slate-600 font-medium hover:text-blue-600">Workflow</a>
                <hr className="border-slate-100" />
                <Button variant="ghost" onClick={() => navigate('/login')} className="w-full justify-start text-slate-600">Sign In</Button>
                <Button onClick={() => navigate('/register')} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── 2. Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        {/* FIX: Simplified background — one treatment only (Threads + subtle grid) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.8) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {/* Soft radial vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(248,250,252,0.7)_100%)]" />
          {/* Threads WebGL — sole animated treatment */}
          <Threads amplitude={1.5} distance={0.1} enableMouseInteraction={true} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-6 border border-blue-100">
              <SparklesIcon className="w-4 h-4" /> Next-Generation Medical Billing
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight"
          >
            End Claim Rejections with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              AI-Powered Coding
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg lg:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            HealPay automates the medical billing workflow, translating clinical notes into accurate ICD-10 and CPT
            codes. Reduce denials, accelerate reimbursements, and focus on patient care.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 h-12 px-8 text-base"
            >
              Get Started for Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto h-12 px-8 text-base border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Request a Demo
            </Button>
          </motion.div>

          {/* FIX: Added SOC 2 badge alongside HIPAA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 text-sm text-slate-500 flex items-center justify-center gap-8 flex-wrap"
          >
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" /> HIPAA Compliant
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> SOC 2 Type II Certified
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" /> 256-bit Encryption
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── 3. Problem ─────────────────────────────────────────────────────── */}
      <section id="problem" className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The traditional billing cycle is broken</h2>
            <p className="text-lg text-slate-600">
              Healthcare providers lose billions annually to avoidable administrative errors, slow manual coding, and
              insurance denials.
            </p>
          </div>

          {/* FIX: Changed from red icons to neutral slate — avoids "error state" feel */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: AlertCircle,
                title: 'High Denial Rates',
                desc: 'Up to 15% of claims are rejected due to coding inaccuracies or missing information, delaying crucial revenue.',
              },
              {
                icon: Clock,
                title: 'Manual Bottlenecks',
                desc: 'Medical coders spend hours manually translating physician notes, creating massive operational backlogs.',
              },
              {
                icon: TrendingUp,
                title: 'Revenue Leakage',
                desc: 'Under-coding out of fear of audits causes practices to leave thousands of legitimately earned dollars on the table.',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6 border border-slate-200">
                    <item.icon className="w-6 h-6 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Solution ────────────────────────────────────────────────────── */}
      <section id="solution" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="lg:flex items-center gap-16">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <FadeIn>
                <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 font-semibold text-sm rounded-full mb-6 border border-indigo-100">
                  The HealPay Advantage
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                  Automate the complexity.
                  <br />
                  Accelerate your cash flow.
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  HealPay bridges the gap between clinical care and financial reimbursement. By leveraging advanced
                  natural language processing (NLP), our platform reads provider notes and instantaneously suggests the
                  most accurate codes.
                </p>
                <ul className="space-y-4">
                  {[
                    'Instant AI code suggestions trained on millions of data points',
                    'Built-in rule engine catches compliance errors before submission',
                    'Unified workspace for doctors, coders, and billers',
                  ].map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-slate-700">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>

            <div className="lg:w-1/2 relative">
              <FadeIn delay={0.2}>
                {/* FIX: Dashboard mockup with real-ish labelled UI */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl p-2 relative overflow-hidden">
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[420px]">
                    {/* Window chrome */}
                    <div className="h-12 border-b border-slate-100 flex items-center px-4 gap-4 bg-slate-50/50 shrink-0">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      </div>
                      <div className="h-6 w-52 bg-white border border-slate-200 rounded-md flex items-center px-3">
                        <span className="text-[10px] text-slate-400 font-mono">healpay.io/claims/queue</span>
                      </div>
                    </div>

                    {/* Layout */}
                    <div className="flex flex-1 min-h-0">
                      {/* Sidebar */}
                      <div className="w-44 shrink-0 border-r border-slate-100 p-4 space-y-1 bg-slate-50/40">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Navigation</p>
                        {[
                          { label: 'Claims Queue', active: true },
                          { label: 'Analytics', active: false },
                          { label: 'Patients', active: false },
                          { label: 'Settings', active: false },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={`h-8 w-full rounded-md flex items-center px-3 text-[11px] font-medium ${item.active
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'text-slate-500'
                              }`}
                          >
                            {item.label}
                          </div>
                        ))}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
                        {/* Header row */}
                        <div className="flex justify-between items-center shrink-0">
                          <div>
                            <p className="text-[13px] font-bold text-slate-800">Claims Queue</p>
                            <p className="text-[10px] text-slate-400">97 claims pending review</p>
                          </div>
                          <div className="h-7 px-3 bg-blue-600 rounded-md flex items-center text-white text-[11px] font-medium">
                            + New Claim
                          </div>
                        </div>

                        {/* Stat chips */}
                        <div className="grid grid-cols-3 gap-2 shrink-0">
                          {[
                            { label: 'Auto-coded', value: '84', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                            { label: 'In Review', value: '13', color: 'bg-amber-50  border-amber-100  text-amber-700' },
                            { label: 'Denied', value: '3', color: 'bg-red-50    border-red-100    text-red-600' },
                          ].map((s) => (
                            <div key={s.label} className={`rounded-lg border p-3 flex flex-col gap-1 ${s.color}`}>
                              <span className="text-[10px] font-medium opacity-80">{s.label}</span>
                              <span className="text-[18px] font-bold leading-none">{s.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Claims rows */}
                        <div className="flex-1 overflow-hidden rounded-lg border border-slate-100">
                          <div className="bg-slate-50 border-b border-slate-100 grid grid-cols-4 px-3 py-2">
                            {['Patient', 'ICD-10', 'CPT', 'Status'].map((h) => (
                              <span key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</span>
                            ))}
                          </div>
                          {[
                            { patient: 'J. Martinez', icd: 'J06.9', cpt: '99213', status: 'Approved', sc: 'text-emerald-600 bg-emerald-50' },
                            { patient: 'A. Thompson', icd: 'M54.5', cpt: '99214', status: 'Review', sc: 'text-amber-600  bg-amber-50' },
                            { patient: 'R. Patel', icd: 'E11.9', cpt: '99215', status: 'Approved', sc: 'text-emerald-600 bg-emerald-50' },
                            { patient: 'S. Williams', icd: 'I10', cpt: '99212', status: 'Denied', sc: 'text-red-600    bg-red-50' },
                          ].map((row, i) => (
                            <div key={i} className="grid grid-cols-4 px-3 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                              <span className="text-[11px] text-slate-700 font-medium">{row.patient}</span>
                              <span className="text-[11px] text-blue-600 font-mono">{row.icd}</span>
                              <span className="text-[11px] text-slate-500 font-mono">{row.cpt}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${row.sc}`}>{row.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating badge */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-6 right-6 bg-white p-3 rounded-lg shadow-xl border border-blue-100 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">Claim Auto-Coded</div>
                      <div className="text-xs text-slate-500">98% Confidence Score</div>
                    </div>
                  </motion.div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to scale</h2>
            <p className="text-slate-400 text-lg">
              A comprehensive suite of tools designed to handle the entire lifecycle of a medical claim.
            </p>
          </div>

          {/* FIX: bumped feature icon to blue-300 for better visibility on dark bg */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Brain, title: 'AI Code Suggestions', desc: 'Instant extraction of ICD-10 and CPT codes from unstructured clinical notes.' },
              { icon: Layers, title: 'Workflow Automation', desc: 'Seamless handoffs between physicians, coders, and the billing department.' },
              { icon: FileCheck, title: 'Pre-Claim Validation', desc: 'Rule-based engine checks for missing modifiers and compliance gaps.' },
              { icon: PieChart, title: 'Revenue Analytics', desc: 'Real-time dashboards tracking AR days, denial rates, and staff productivity.' },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800 transition-colors">
                  <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-blue-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How HealPay Works</h2>
            <p className="text-slate-600 text-lg">From patient intake to cleared payment in 4 simple steps.</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-10 left-12 right-12 h-0.5 bg-slate-100" />
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Clinical Entry', desc: 'Physicians record patient encounters securely within the platform.' },
                { step: '02', title: 'AI Processing', desc: 'Natural Language Processing instantly analyzes the SOAP notes.' },
                { step: '03', title: 'Coder Review', desc: 'Coders verify AI-suggested codes, approving them in a single click.' },
                { step: '04', title: 'Claim Adjudicated', desc: 'Clean claims are generated and tracked until payment is posted.' },
              ].map((step, i) => (
                <FadeIn key={i} delay={i * 0.15}>
                  <div className="relative pt-6 md:pt-0 text-center md:text-left">
                    <div className="w-20 h-20 bg-white border-[6px] border-slate-50 shadow-sm rounded-full flex items-center justify-center text-xl font-bold text-blue-600 mb-6 relative z-10 mx-auto md:mx-0">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-slate-600">{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Benefits ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-blue-500/50 text-center">
            {[
              { value: '95%', label: 'Coding Accuracy Rate', note: 'Based on avg. customer data' },
              { value: '10x', label: 'Faster Workflow', note: 'vs. manual coding baseline' },
              { value: '40%', label: 'Reduction in Denials', note: 'Avg. across active accounts' },
            ].map((stat, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="py-6 md:py-0">
                  {/* FIX: text-white for numbers, text-blue-100 for labels (was blue-200, failed contrast) */}
                  <div className="text-5xl font-bold mb-2 text-white">{stat.value}</div>
                  <div className="text-blue-100 font-medium text-lg mb-1">{stat.label}</div>
                  <div className="text-blue-300 text-xs">{stat.note}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Testimonials ────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Trusted by modern practices</h2>
            <p className="text-slate-600 text-lg">Hear from the teams that transformed their revenue cycle.</p>
          </div>

          {/* FIX: Added practice/org name to each testimonial for credibility */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: 'HealPay caught hundreds of missing modifiers that we used to let slip. Our denial rate dropped overnight.',
                author: 'Dr. Sarah Jenkins',
                role: 'Primary Care Physician',
                org: 'Lakeside Family Medicine',
              },
              {
                text: 'The AI suggestions are surprisingly accurate. It cuts my coding time per chart from 10 minutes to barely 2.',
                author: 'James Chen, CPC',
                role: 'Sr. Medical Coder',
                org: 'Regional Health Partners',
              },
              {
                text: 'Cash flow used to be unpredictable. Now, clean claims go out instantly. Best ROI on any software we\'ve bought.',
                author: 'Elena Rodriguez',
                role: 'Billing Manager',
                org: 'Summit Orthopedics Group',
              },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 text-lg mb-8 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{t.author}</div>
                      <div className="text-sm text-slate-500">{t.role}</div>
                      <div className="text-xs text-blue-600 font-medium mt-0.5">{t.org}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white border-b border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'Do you integrate with my existing EHR?', a: 'Yes. HealPay offers seamless integration API hooks to interface with common EHR systems so data flows automatically without double-entry.' },
              { q: 'How accurate is the AI coding?', a: 'Our proprietary NLP models consistently achieve 95%+ accuracy in extracting billing codes directly from physician notes, based on aggregate customer data.' },
              { q: 'Is patient data secure?', a: 'Absolutely. HealPay is fully HIPAA and SOC 2 Type II compliant. All data is encrypted at rest and in transit using AES-256.' },
              { q: 'Are coders being replaced?', a: 'No. HealPay is designed to empower coders, turning them from data-entry clerks into auditors, increasing their throughput by 10x.' },
            ].map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors text-left font-semibold text-slate-900"
                >
                  {faq.q}
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-white px-6 overflow-hidden"
                    >
                      <div className="py-6 text-slate-600 leading-relaxed">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to modernize your revenue cycle?</h2>
            <p className="text-xl text-slate-600 mb-10">
              Join leading healthcare providers who have transformed their billing workflow with HealPay's intelligent
              automation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white h-14 px-10 text-lg shadow-xl shadow-blue-600/20"
              >
                Start Free Trial
              </Button>
              {/* FIX: Normalised from border-2 to border for consistency with rest of page */}
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto h-14 px-10 text-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Contact Sales
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-500">Free 14-day trial. Setup takes under 5 minutes.</p>
          </FadeIn>
        </div>
      </section>

      {/* ── 11. Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8 border-b border-slate-800 pb-8">
            <div className="col-span-1">
              <div className="text-white font-bold text-2xl mb-4 flex items-center gap-2">
                {/* FIX: icon colour matched to page's blue-400 used on dark surfaces */}
                <Activity className="w-6 h-6 text-blue-400" /> HealPay
              </div>
              <p className="text-sm leading-relaxed">Intelligent medical billing platform for the modern healthcare era.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between text-sm gap-4">
            <p>© {new Date().getFullYear()} HealPay Technologies Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" /> SOC 2 Type II Certified
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-slate-500" /> HIPAA Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── 12. Mobile Sticky CTA bar (NEW) ────────────────────────────────── */}
      {/* FIX: Appears on mobile after 40% scroll; gives persistent conversion nudge */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl px-4 py-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Ready to reduce denials?</p>
              <p className="text-xs text-slate-500">Free 14-day trial, no credit card needed.</p>
            </div>
            <Button
              onClick={() => navigate('/register')}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 px-4"
            >
              Start Free Trial
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Chatbot />
    </div>
  )
}

export default LandingPage