import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Shield } from 'lucide-react'

interface Message {
    id: number
    text: string
    sender: 'user' | 'bot'
    timestamp: Date
}

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Hi! I'm HealPay Assistant. How can I help you with medical billing today?",
            sender: 'bot',
            timestamp: new Date()
        }
    ])
    const [inputMessage, setInputMessage] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const getBotResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase()

        // HealPay specific responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! I'm here to help you understand HealPay's AI-powered medical billing system. What would you like to know?"
        }

        if (lowerMessage.includes('what') && (lowerMessage.includes('healpay') || lowerMessage.includes('this'))) {
            return "HealPay is an AI-powered medical billing automation system that streamlines the entire billing process from patient intake to claims submission. We help healthcare providers reduce errors, save time, and get paid faster!"
        }

        if (lowerMessage.includes('how') && lowerMessage.includes('work')) {
            return "HealPay works in 4 simple steps:\n1. Patient submits their information\n2. Doctor provides clinical notes\n3. Our AI automatically generates medical codes\n4. Billing staff reviews and submits claims\nIt's that easy!"
        }

        if (lowerMessage.includes('feature') || lowerMessage.includes('benefit')) {
            return "Key features include:\n✓ AI-powered medical coding\n✓ Automated claim generation\n✓ Real-time claim tracking\n✓ HIPAA-compliant security\n✓ Integration with major insurance providers\n✓ Comprehensive analytics dashboard"
        }

        if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('pricing')) {
            return "We offer flexible pricing plans for practices of all sizes. Please register for an account or contact our sales team for detailed pricing information tailored to your needs."
        }

        if (lowerMessage.includes('register') || lowerMessage.includes('sign up') || lowerMessage.includes('account')) {
            return "Great! You can create an account by clicking the 'Get Started' button on the homepage or the 'Sign Up' link in the navigation. Registration takes just a few minutes!"
        }

        if (lowerMessage.includes('doctor') || lowerMessage.includes('physician') || lowerMessage.includes('clinician')) {
            return "HealPay is perfect for doctors! You can focus on patient care while our system handles the complex medical coding and billing. Just provide your clinical notes, and our AI does the rest."
        }

        if (lowerMessage.includes('patient')) {
            return "Patients benefit from faster claim processing and fewer billing errors. The HealPay system makes it easy to submit your information and track the status of your claims."
        }

        if (lowerMessage.includes('ai') || lowerMessage.includes('artificial intelligence') || lowerMessage.includes('automation')) {
            return "Our AI analyzes clinical notes and automatically suggests the most accurate ICD-10 and CPT codes. This reduces coding errors by up to 90% and speeds up the billing process significantly!"
        }

        if (lowerMessage.includes('secure') || lowerMessage.includes('security') || lowerMessage.includes('hipaa')) {
            return "Yes! HealPay is fully HIPAA-compliant. We use bank-level encryption, secure data storage, and undergo regular security audits to protect your sensitive medical information."
        }

        if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('contact')) {
            return "Our support team is here to help! You can reach us via:\n📧 Email: support@healpay.com\n📞 Phone: 1-800-HEALPAY\nOr register and use our in-app chat support for instant assistance."
        }

        if (lowerMessage.includes('demo') || lowerMessage.includes('trial')) {
            return "We offer a free 30-day trial! Register for an account to explore all features with no credit card required. Experience the power of AI-driven medical billing firsthand."
        }

        // Default response
        return "I'd be happy to help! You can ask me about:\n• What HealPay is and how it works\n• Features and benefits\n• Pricing and plans\n• Getting started\n• Security and compliance\n• Support options\n\nWhat would you like to know?"
    }

    const handleSendMessage = () => {
        if (!inputMessage.trim()) return

        const userMessage: Message = {
            id: messages.length + 1,
            text: inputMessage,
            sender: 'user',
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInputMessage('')
        setIsTyping(true)

        // Simulate bot thinking and response
        setTimeout(() => {
            const botMessage: Message = {
                id: messages.length + 2,
                text: getBotResponse(inputMessage),
                sender: 'bot',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, botMessage])
            setIsTyping(false)
        }, 1000)
    }

    return (
        <>
            {/* Animated Floating Button - Larger and More Prominent */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-8 right-8 z-50 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
                style={{
                    width: '80px',
                    height: '80px',
                    boxShadow: '0 10px 40px rgba(37, 99, 235, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                    y: [0, -15, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {isOpen ? (
                    <div className="flex items-center justify-center w-full h-full">
                        <X className="w-8 h-8" />
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-full h-full">
                        <Shield className="w-10 h-10" />
                    </div>
                )}

                {/* Enhanced Pulse animation rings */}
                {!isOpen && (
                    <>
                        <motion.div
                            className="absolute inset-0 rounded-full bg-blue-500"
                            animate={{
                                scale: [1, 1.8, 1],
                                opacity: [0.6, 0, 0.6]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeOut"
                            }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-full bg-blue-400"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.8, 0, 0.8]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeOut",
                                delay: 0.5
                            }}
                        />
                    </>
                )}

                {/* Notification Badge */}
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white"
                    >
                        AI
                    </motion.div>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <Shield className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">HealPay Assistant</h3>
                                <p className="text-xs text-blue-100">Online • Ready to help</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 rounded-bl-none shadow-md'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-line">{message.text}</p>
                                        <span className="text-xs opacity-70 mt-1 block">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-white rounded-2xl rounded-bl-none shadow-md px-4 py-3">
                                        <div className="flex gap-1">
                                            <motion.div
                                                className="w-2 h-2 bg-gray-400 rounded-full"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                            />
                                            <motion.div
                                                className="w-2 h-2 bg-gray-400 rounded-full"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                            />
                                            <motion.div
                                                className="w-2 h-2 bg-gray-400 rounded-full"
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <motion.button
                                    onClick={handleSendMessage}
                                    disabled={!inputMessage.trim()}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default Chatbot
