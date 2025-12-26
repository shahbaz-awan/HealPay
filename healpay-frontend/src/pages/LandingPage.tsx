import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Activity,
  Brain,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  UserPlus,
  ClipboardCheck,
  BarChart3,
  ChevronDown,
  Star,
  Award,
  Lock,
  Globe,
  Mail,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Logo } from '@/components/ui/Logo'
import Chatbot from '@/components/Chatbot'
import Threads from '@/components/Threads'

const LandingPage = () => {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Coding',
      description: 'Intelligent code recommendations with 95%+ accuracy using advanced ML models',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Shield,
      title: 'HIPAA Compliant',
      description: 'Bank-level security with end-to-end encryption for patient data',
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process claims 10x faster with automated workflows and validations',
      gradient: 'from-blue-400 to-sky-500',
    },
    {
      icon: TrendingUp,
      title: 'Rejection Prediction',
      description: 'Predict and prevent claim rejections before submission',
      gradient: 'from-blue-500 to-blue-700',
    },
    {
      icon: Clock,
      title: 'Real-time Tracking',
      description: 'Monitor claim status with instant updates and notifications',
      gradient: 'from-indigo-500 to-blue-600',
    },
    {
      icon: Activity,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights with beautiful charts and metrics',
      gradient: 'from-sky-500 to-blue-500',
    },
  ]

  const stats = [
    { value: '99.9%', label: 'Uptime', icon: CheckCircle },
    { value: '10x', label: 'Faster Processing', icon: Zap },
    { value: '95%+', label: 'AI Accuracy', icon: Brain },
    { value: '50%', label: 'Cost Reduction', icon: TrendingUp },
  ]

  const howItWorksSteps = [
    {
      icon: UserPlus,
      title: 'Sign Up',
      description: 'Create your account in under 60 seconds. No credit card required.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: ClipboardCheck,
      title: 'Complete Setup',
      description: 'Fill in patient and practice information with our guided wizard.',
      gradient: 'from-blue-600 to-indigo-600',
    },
    {
      icon: Brain,
      title: 'AI Assistance',
      description: 'Get intelligent code suggestions and automated claim generation.',
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      icon: BarChart3,
      title: 'Track & Optimize',
      description: 'Monitor claims in real-time and improve with actionable analytics.',
      gradient: 'from-purple-500 to-pink-600',
    },
  ]

  const testimonials = [
    {
      name: 'Dr. Sarah Mitchell',
      role: 'Chief Medical Officer',
      company: 'HealthFirst Medical Group',
      image: '👩‍⚕️',
      rating: 5,
      quote: 'HealPay has reduced our billing errors by 90% and increased our reimbursement rate significantly. The AI coding is incredibly accurate!',
    },
    {
      name: 'Michael Chen',
      role: 'Medical Coding Manager',
      company: 'Metro General Hospital',
      image: '👨‍💼',
      rating: 5,
      quote: 'The automation and prediction features save our team 15+ hours per week. Best investment we\'ve made in billing technology.',
    },
    {
      name: 'Jessica Rodriguez',
      role: 'Billing Director',
      company: 'Riverside Clinic',
      image: '👩‍💻',
      rating: 5,
      quote: 'Implementation was seamless and the support team is fantastic. Our claim approval rate improved from 85% to 97%.',
    },
  ]

  const trustBadges = [
    { icon: Shield, text: 'HIPAA Compliant' },
    { icon: Lock, text: 'SOC 2 Certified' },
    { icon: Award, text: 'ISO 27001' },
    { icon: CheckCircle, text: 'Trusted by 1000+ Providers' },
  ]

  const faqs = [
    {
      question: 'Is my patient data secure?',
      answer: 'Absolutely. We use bank-level 256-bit encryption, are HIPAA compliant, and SOC 2 certified. All data is encrypted at rest and in transit. We undergo regular security audits and penetration testing.',
    },
    {
      question: 'How accurate is the AI medical coding?',
      answer: 'Our AI achieves 95%+ accuracy on medical code recommendations, trained on millions of claim records. The system continuously learns and improves, with built-in validation to catch errors before submission.',
    },
    {
      question: 'What is the implementation timeline?',
      answer: 'Most practices are fully onboarded within 1-2 weeks. We provide dedicated implementation support, staff training, and data migration assistance to ensure a smooth transition.',
    },
    {
      question: 'Can I integrate with my existing EMR?',
      answer: 'Yes! HealPay integrates with 50+ popular EMR systems including Epic, Cerner, Athenahealth, and more. We also offer a robust API for custom integrations.',
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'We offer 24/7 email support, live chat during business hours, comprehensive documentation, video tutorials, and dedicated account managers for enterprise clients.',
    },
    {
      question: 'Do you offer training for my staff?',
      answer: 'Yes! We provide comprehensive onboarding training, ongoing webinars, video tutorials, and a knowledge base. Enterprise clients receive personalized training sessions.',
    },
  ]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-lg border-b border-blue-200/50 bg-white/80"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-6">
              <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Home
              </Button>
              <Button variant="ghost" onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}>
                FAQ
              </Button>
              <Button variant="ghost" onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })}>
                About Us
              </Button>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Login
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-gradient-to-br from-blue-50 via-white to-blue-100">
        {/* Dynamic Animated Background */}
        <div className="absolute inset-0">
          {/* Animated Gradient Mesh */}
          <div className="absolute inset-0 opacity-60">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-400/30 via-transparent to-blue-600/30 animate-pulse" style={{ animationDuration: '8s' }} />
          </div>

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: 'linear-gradient(to right, rgba(59, 130, 246, 0.8) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          {/* Floating Geometric Shapes */}
          <motion.div
            animate={{
              y: [0, -30, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/4 left-[20%] w-20 h-20 border-2 border-blue-300/30 rounded-lg"
          />
          <motion.div
            animate={{
              y: [0, 40, 0],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-1/3 right-[15%] w-16 h-16 border-2 border-blue-400/40 rounded-full"
          />
          <motion.div
            animate={{
              y: [0, -20, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/3 right-[25%] w-12 h-12 bg-blue-400/20 rounded-full blur-sm"
          />

          {/* Particle-like dots */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -100, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              className="absolute w-1.5 h-1.5 bg-blue-500/70 rounded-full"
              style={{
                left: `${10 + i * 6}%`,
                top: `${20 + (i * 13) % 60}%`,
              }}
            />
          ))}

          {/* WebGL Threads Animation */}
          <Threads amplitude={1.5} distance={0.1} enableMouseInteraction={true} />

          {/* Animated Connection Threads */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {/* Diagonal threads */}
            <motion.line
              x1="10%" y1="20%" x2="90%" y2="80%"
              stroke="rgba(59, 130, 246, 0.35)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.line
              x1="90%" y1="20%" x2="10%" y2="80%"
              stroke="rgba(59, 130, 246, 0.35)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* Curved connecting threads */}
            <motion.path
              d="M 20 30 Q 50 10, 80 30"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth="2.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M 10 50 Q 50 70, 90 50"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth="2.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            {/* Horizontal threads */}
            <motion.line
              x1="0%" y1="40%" x2="100%" y2="40%"
              stroke="rgba(59, 130, 246, 0.1)"
              strokeWidth="1"
              strokeDasharray="5,5"
              animate={{
                strokeDashoffset: [0, -10],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.line
              x1="0%" y1="60%" x2="100%" y2="60%"
              stroke="rgba(59, 130, 246, 0.1)"
              strokeWidth="1"
              strokeDasharray="5,5"
              animate={{
                strokeDashoffset: [0, -10],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
            />

            {/* Vertical threads */}
            <motion.line
              x1="30%" y1="0%" x2="30%" y2="100%"
              stroke="rgba(59, 130, 246, 0.1)"
              strokeWidth="1"
              strokeDasharray="5,5"
              animate={{
                strokeDashoffset: [0, -10],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
            />
            <motion.line
              x1="70%" y1="0%" x2="70%" y2="100%"
              stroke="rgba(59, 130, 246, 0.1)"
              strokeWidth="1"
              strokeDasharray="5,5"
              animate={{
                strokeDashoffset: [0, -10],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "linear", delay: 1.5 }}
            />

            {/* Network connection points */}
            {[...Array(8)].map((_, i) => (
              <motion.circle
                key={`node-${i}`}
                cx={`${20 + i * 12}%`}
                cy={`${30 + (i % 3) * 20}%`}
                r="3"
                fill="rgba(59, 130, 246, 0.3)"
                initial={{ scale: 0 }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.4
                }}
              />
            ))}
          </svg>
        </div>

        <motion.div
          style={{ opacity, scale }}
          className="container mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <span className="inline-block text-blue-600 font-semibold text-lg tracking-wide uppercase mb-4">
              Smart Medical Billing Made Simple
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-7xl font-bold mb-6 leading-tight text-secondary-900"
          >
            Transform Your
            <br />
            <span className="gradient-text">Healthcare Revenue Cycle</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-secondary-600 mb-10 max-w-2xl mx-auto"
          >
            Streamline your medical billing with intelligent automation, reduce claim rejections,
            and accelerate reimbursements—all in one powerful platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="text-lg"
            >
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="p-6 bg-white rounded-2xl shadow-glow border border-blue-100"
              >
                <stat.icon className="w-8 h-8 text-blue-600 mb-3 mx-auto" />
                <h3 className="text-3xl font-bold text-blue-600 mb-1">{stat.value}</h3>
                <p className="text-sm text-secondary-600">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white relative z-10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 text-secondary-900">
              How <span className="gradient-text">HealPay</span> Works
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Get started in minutes with our simple 4-step process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className={`w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-full flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-secondary-600">{step.description}</p>
                </div>
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-400 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50 relative z-10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 text-secondary-900">
              Powerful Features for <span className="gradient-text">Modern Healthcare</span>
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Everything you need to streamline your medical billing process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card variant="hover" className="h-full group bg-white border-blue-100">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white relative z-10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 text-secondary-900">
              Loved by <span className="gradient-text">Healthcare Professionals</span>
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              See what our customers have to say about HealPay
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-secondary-700 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3 border-t border-blue-100 pt-4">
                    <div className="text-4xl">{testimonial.image}</div>
                    <div>
                      <p className="font-bold text-secondary-900">{testimonial.name}</p>
                      <p className="text-sm text-secondary-600">{testimonial.role}</p>
                      <p className="text-xs text-blue-600">{testimonial.company}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq-section" className="py-20 bg-gradient-to-b from-white to-blue-50 relative z-10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4 text-secondary-900">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Everything you need to know about HealPay
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-secondary-900">{faq.question}</h3>
                    <ChevronDown
                      className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''
                        }`}
                    />
                  </div>
                  {openFaq === index && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 text-secondary-600 leading-relaxed"
                    >
                      {faq.answer}
                    </motion.p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer id="footer" className="py-10 bg-secondary-900 text-white relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <Logo size="md" />
              <p className="text-secondary-300 mt-3 mb-4">
                AI-powered medical billing platform trusted by healthcare providers nationwide.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-bold text-lg mb-3">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Demo</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-lg mb-3">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-lg mb-3">Company</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-secondary-300 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between">
            <p className="text-secondary-400 text-sm">
              © 2024 HealPay. All rights reserved. HIPAA Compliant & SOC 2 Certified.
            </p>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-sm text-secondary-400">Secure & Encrypted</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot Widget */}
      <Chatbot />
    </div>
  )
}

export default LandingPage
