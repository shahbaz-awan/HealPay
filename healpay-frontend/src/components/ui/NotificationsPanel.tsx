import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, CheckCheck, DollarSign, Calendar, FileText, AlertCircle, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPut } from '@/services/api'

interface Notification {
    id: number
    title: string
    message: string
    type: string   // info | success | warning | error
    is_read: boolean
    link?: string
    created_at: string
}

const getIcon = (type: string) => {
    const cls = 'w-5 h-5'
    switch (type) {
        case 'success': return <DollarSign className={`${cls} text-green-600`} />
        case 'warning': return <AlertCircle className={`${cls} text-orange-600`} />
        case 'error':   return <AlertCircle className={`${cls} text-red-600`} />
        default:        return <Info className={`${cls} text-blue-600`} />
    }
}

const getIconBg = (type: string) => {
    switch (type) {
        case 'success': return 'bg-green-50 dark:bg-green-900/20'
        case 'warning': return 'bg-orange-50 dark:bg-orange-900/20'
        case 'error':   return 'bg-red-50 dark:bg-red-900/20'
        default:        return 'bg-blue-50 dark:bg-blue-900/20'
    }
}

const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

const NotificationsPanel = () => {
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            const data = await apiGet<Notification[]>('/v1/notifications?limit=20')
            setNotifications(data)
        } catch {
            // silently fail â€” notifications are non-critical
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchUnreadCount = useCallback(async () => {
        try {
            const data = await apiGet<{ unread_count: number }>('/v1/notifications/unread-count')
            setUnreadCount(data.unread_count)
        } catch {
            // silently fail
        }
    }, [])

    // Poll unread count every 60 seconds
    useEffect(() => {
        fetchUnreadCount()
        const interval = setInterval(fetchUnreadCount, 60000)
        return () => clearInterval(interval)
    }, [fetchUnreadCount])

    // Load full list when panel opens
    useEffect(() => {
        if (isOpen) fetchNotifications()
    }, [isOpen, fetchNotifications])

    const markAsRead = async (id: number, link?: string) => {
        try {
            await apiPut(`/v1/notifications/${id}/read`, {})
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch { /* ignore */ }
        if (link) {
            setIsOpen(false)
            navigate(link)
        }
    }

    const markAllRead = async () => {
        try {
            await apiPut('/v1/notifications/read-all', {})
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch { /* ignore */ }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-40 max-h-[560px] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                    Notifications
                                </h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
                                        >
                                            <CheckCheck className="w-3.5 h-3.5" />
                                            Mark all read
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-6 text-center text-sm text-gray-500">Loadingâ€¦</div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {notifications.map(n => (
                                            <div
                                                key={n.id}
                                                className={`p-4 flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                                onClick={() => markAsRead(n.id, n.link)}
                                            >
                                                <div className={`p-2 rounded-lg ${getIconBg(n.type)} flex-shrink-0 h-fit`}>
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{n.title}</p>
                                                        {!n.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />}
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">{timeAgo(n.created_at)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

export default NotificationsPanel
