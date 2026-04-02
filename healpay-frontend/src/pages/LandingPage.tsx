import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import {
  Activity, Brain, Shield, Zap, TrendingUp, Clock, CheckCircle, ArrowRight,
  UserPlus, ClipboardCheck, BarChart3, ChevronDown, Star, Award, Lock,
  Globe, Mail, Menu, X, HeartPulse, Stethoscope, FileText, CreditCard,
  Users, ChevronRight, Sparkles, Building2, Phone,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import Chatbot from '@/components/Chatbot'

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  { icon: Brain, title: 'AI-Powered Coding', description: 'ICD-10 & CPT code suggestions with 95%+ accuracy, trained on millions of real claims.', gradient: 'from-violet-500 to-purple-600' },
  { icon: Shield, title: 'HIPAA Compliant', description: 'Bank-level 256-bit encryption protects every patient record at rest and in transit.', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Zap, title: '10× Faster Processing', description: 'Automated workflows eliminate manual bottlenecks and cut claim turnaround time dramatically.', gradient: 'from-amber-400 to-orange-500' },
  { icon: TrendingUp, title: 'Rejection Prevention', description: 'Pre-submission AI validation catches errors before they reach the payer—saving costly re-work.', gradient: 'from-emerald-400 to-teal-500' },
  { icon: Clock, title: 'Real-Time Tracking', description: 'Live claim status updates across the full billing lifecycle—from encounter to payment.', gradient: 'from-rose-400 to-pink-500' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'Beautiful KPI charts, denial trends, and revenue insights tailored to every role.', gradient: 'from-indigo-500 to-blue-600' },
]

const stats = [
  { value: '99.9%', label: 'Uptime SLA', icon: CheckCircle, color: 'text-emerald-500' },
  { value: '10×', label: 'Faster Processing', icon: Zap, color: 'text-amber-500' },
  { value: '95%+', label: 'AI Code Accuracy', icon: Brain, color: 'text-violet-500' },
  { value: '50%', label: 'Cost Reduction', icon: TrendingUp, color: 'text-blue-500' },
]

const roles = [
  { icon: Stethoscope, label: 'Doctor', color: 'from-blue-500 to-cyan-500', description: 'Create encounters, write SOAP notes, and view AI code suggestions instantly.' },
  { icon: FileText, label: 'Medical Coder', color: 'from-violet-500 to-purple-600', description: 'Assign ICD-10 & CPT codes with AI assistance and send encounters to billing.' },
  { icon: CreditCard, label: 'Biller', color: 'from-emerald-400 to-teal-500', description: 'Submit clean claims, track status, and manage insurance adjudication.' },
  { icon: HeartPulse, label: 'Patient', color: 'from-rose-400 to-pink-500', description: 'View your intake records, appointments, and billing history in one place.' },
]

const howItWorks = [
  { icon: UserPlus, title: 'Create Account', description: 'Sign up in 60 seconds. Your role defines your dashboard automatically.', gradient: 'from-blue-500 to-cyan-500' },
  { icon: ClipboardCheck, title: 'Enter Encounter', description: 'Doctors document SOAP notes and chief complaints through a guided interface.', gradient: 'from-violet-500 to-purple-600' },
  { icon: Brain, title: 'AI Codes It', description: 'The AI engine recommends accurate ICD-10 and CPT codes for the coder to review.', gradient: 'from-amber-400 to-orange-500' },
  { icon: BarChart3, title: 'Bill & Track', description: 'Billers submit clean claims and monitor every step to payment.', gradient: 'from-emerald-400 to-teal-500' },
]

const testimonials = [
  { name: 'Dr. Sarah Mitchell', role: 'Chief Medical Officer', company: 'HealthFirst Medical Group', initials: 'SM', bg: 'from-blue-500 to-cyan-500', rating: 5, quote: 'HealPay reduced our billing errors by 90% and improved our reimbursement rate significantly. The AI coding is incredibly accurate.' },
  { name: 'Michael Chen', role: 'Medical Coding Manager', company: 'Metro General Hospital', initials: 'MC', bg: 'from-violet-500 to-purple-600', rating: 5, quote: 'The automation and prediction features save our team 15+ hours per week. Best investment we\'ve made in billing technology.' },
  { name: 'Jessica Rodriguez', role: 'Billing Director', company: 'Riverside Clinic', initials: 'JR', bg: 'from-emerald-400 to-teal-500', rating: 5, quote: 'Implementation was seamless and the support team is fantastic. Our claim approval rate improved from 85% to 97%.' },
]

const comparison = [
  { feature: 'Medical Code Suggestions', traditional: false, healpay: true },
  { feature: 'Real-time Claim Tracking', traditional: false, healpay: true },
  { feature: 'Automated Rejection Alerts', traditional: false, healpay: true },
  { feature: 'Role-based Dashboards', traditional: false, healpay: true },
  { feature: 'HIPAA Audit Logging', traditional: false, healpay: true },
  { feature: 'Multi-role Collaboration', traditional: false, healpay: true },
]

const faqs = [
  { question: 'Is patient data secure?', answer: 'Yes. We use 256-bit end-to-end encryption, HIPAA-compliant infrastructure, and maintain a full audit trail of every data access.' },
  { question: 'How accurate is the AI medical coding?', answer: 'Our AI achieves 95%+ accuracy on ICD-10 and CPT code recommendations, trained on millions of real claim records with continuous feedback loops.' },
  { question: 'Do all roles use the same login?', answer: 'Yes — the system detects your role on login and redirects you to the appropriate dashboard automatically (Doctor, Coder, Biller, or Patient).' },
  { question: 'What is the implementation timeline?', answer: 'Most practices are fully onboarded within 1-2 weeks. We provide guided setup, sample data, and support to ensure a smooth start.' },
  { question: 'Can I integrate with my existing EMR?', answer: 'HealPay is designed to complement existing workflows. Our API allows integration with popular EMR systems and custom in-house tools.' },
  { question: 'What kind of support do you offer?', answer: 'We provide email support, comprehensive documentation, and in-app guidance. Enterprise clients receive dedicated account management.' },
]

const navLinks = [
  { label: 'Features', id: 'features-section' },
  { label: 'How It Works', id: 'how-it-works-section' },
  { label: 'FAQ', id: 'faq-section' },
  { label: 'Contact', id: 'footer' },
]

// ─── Component ────────────────────────────────────────────────────────────────

const LandingPage = () => {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92])
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 border-b border-slate-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')} size="sm">Sign In</Button>
            <Button onClick={() => navigate('/register')} size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Started Free
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="px-6 py-4 space-y-2">
                {navLinks.map(link => (
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => navigate('/login')} size="sm" className="flex-1">Sign In</Button>
                  <Button onClick={() => navigate('/register')} size="sm" className="flex-1">Get Started</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(59,130,246,0.5) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(139,92,246,0.4) 0%, transparent 50%)'
        }} />
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
        {/* Floating orbs */}
        {[
          { size: 'w-96 h-96', pos: '-top-20 -left-20', color: 'bg-blue-500/10', dur: 8 },
          { size: 'w-72 h-72', pos: 'top-1/2 -right-10', color: 'bg-violet-500/10', dur: 12 },
          { size: 'w-52 h-52', pos: 'bottom-20 left-1/4', color: 'bg-cyan-500/10', dur: 10 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-3xl ${orb.size} ${orb.pos} ${orb.color}`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

        <motion.div style={{ opacity, scale }} className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium px-4 py-2 rounded-full mb-8"
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Medical Billing Platform
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6"
          >
            The Smartest Way to{' '}
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Run Medical Billing
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            HealPay connects doctors, coders, and billers on a single AI-powered platform —
            reducing rejections, accelerating reimbursements, and eliminating manual errors.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 border-0 text-white shadow-xl shadow-blue-500/25 px-8"
            >
              Start for Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-white/20 text-white hover:bg-white/10 px-8"
            >
              Sign In to Dashboard
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, scale: 1.03 }}
                className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-5 text-center"
              >
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ── Roles Section ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-sm font-medium px-4 py-2 rounded-full mb-4">
              <Users className="w-4 h-4" /> Built for Every Role
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              One platform, <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">every role</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Each user type gets a dashboard tailored to their exact workflow.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/register')}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center mb-5 shadow-lg`}>
                  <role.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{role.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{role.description}</p>
                <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Get started <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works-section" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-600 text-sm font-medium px-4 py-2 rounded-full mb-4">
              <ClipboardCheck className="w-4 h-4" /> Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              How <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">HealPay</span> Works
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">From patient intake to claim payment in 4 clear steps.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-violet-200 to-teal-200" />

            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center relative z-10"
              >
                <div className="relative inline-block mb-6">
                  <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-xl mx-auto`}>
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-slate-900 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features-section" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 text-sm font-medium px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" /> Platform Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything in <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">one platform</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">Powerful tools built specifically for modern healthcare billing teams.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group bg-white border border-slate-100 rounded-2xl p-7 shadow-sm hover:shadow-lg hover:shadow-slate-200/80 transition-all duration-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Badges Strip ─────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {[
              { icon: Shield, label: 'HIPAA Compliant', color: 'text-blue-600 bg-blue-50' },
              { icon: Lock, label: 'SOC 2 Certified', color: 'text-violet-600 bg-violet-50' },
              { icon: Award, label: 'ISO 27001', color: 'text-amber-600 bg-amber-50' },
              { icon: CheckCircle, label: '1000+ Providers', color: 'text-emerald-600 bg-emerald-50' },
              { icon: Building2, label: 'HIPAA Audit Trail', color: 'text-rose-600 bg-rose-50' },
            ].map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex items-center gap-2.5"
              >
                <div className={`w-9 h-9 rounded-lg ${badge.color} flex items-center justify-center`}>
                  <badge.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-slate-700">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ──────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              HealPay vs. <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Traditional Billing</span>
            </h2>
            <p className="text-lg text-slate-500">See why practices are switching to an AI-first approach.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
          >
            {/* Header */}
            <div className="grid grid-cols-3 bg-slate-900 text-white text-sm font-semibold">
              <div className="px-6 py-4">Feature</div>
              <div className="px-6 py-4 text-center text-slate-400">Traditional</div>
              <div className="px-6 py-4 text-center text-blue-400">HealPay AI</div>
            </div>
            {comparison.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 border-t border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <div className="px-6 py-4 text-sm font-medium text-slate-700">{row.feature}</div>
                <div className="px-6 py-4 flex justify-center">
                  <X className="w-5 h-5 text-rose-400" />
                </div>
                <div className="px-6 py-4 flex justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 text-sm font-medium px-4 py-2 rounded-full mb-4">
              <Star className="w-4 h-4 fill-amber-500" /> Customer Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Loved by <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Healthcare Teams</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">Real results from real healthcare professionals.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex gap-1 mb-5">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
                  <div className={`w-11 h-11 bg-gradient-to-br ${t.bg} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                    <p className="text-xs text-blue-600 font-medium">{t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(59,130,246,0.6), transparent 60%), radial-gradient(circle at 70% 50%, rgba(139,92,246,0.5), transparent 60%)'
        }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-900/40">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to transform your billing?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
              Join healthcare providers already using HealPay to streamline claims, reduce rejections, and get paid faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 border-0 text-white shadow-xl shadow-blue-900/30 px-8"
              >
                Get Started — It's Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-6">No credit card required · HIPAA compliant · Set up in minutes</p>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq-section" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Frequently Asked <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Questions</span>
            </h2>
            <p className="text-lg text-slate-500">Everything you need to know before getting started.</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="border border-slate-100 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-800 text-sm pr-4">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-blue-500 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer id="footer" className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-2">
              <Logo size="md" />
              <p className="text-slate-400 text-sm mt-4 mb-6 max-w-xs leading-relaxed">
                AI-powered medical billing for modern healthcare teams. Trusted by doctors, coders, and billers nationwide.
              </p>
              <div className="flex gap-3">
                {[Globe, Mail, Phone].map((Icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 bg-white/8 hover:bg-white/15 rounded-lg flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white">Product</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                {['Features', 'How It Works', 'Security', 'Integrations'].map(item => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Roles */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white">Roles</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                {['For Doctors', 'For Coders', 'For Billers', 'For Patients'].map(item => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                {['About', 'Contact', 'Privacy Policy', 'Terms of Service'].map(item => (
                  <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© 2026 HealPay. All rights reserved.</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>HIPAA Compliant & SOC 2 Certified</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot */}
      <Chatbot />
    </div>
  )
}

export default LandingPage
