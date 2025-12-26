import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, CheckCheck, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react'

interface Notification {
    id: number
    type: 'bill' | 'appointment' | 'payment' | 'alert'
    title: string
    message: string
    time: string
    read: boolean
}

const NotificationsPanel = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: 1,
            type: 'bill',
            title: 'Bill Due Tomorrow',
            message: 'Your medical bill of $450 is due on Dec 9, 2024',
            time: '2 hours ago',
            read: false
        },
        {
            id: 2,
            type: 'appointment',
            title: 'Appointment Reminder',
            message: 'You have an appointment with Dr. Smith tomorrow at 10:00 AM',
            time: '4 hours ago',
            read: false
        },
        {
            id: 3,
            type: 'payment',
            title: 'Payment Received',
            message: 'Your payment of $250 has been successfully processed',
            time: '1 day ago',
            read: true
        },
        {
            id: 4,
            type: 'alert',
            title: 'Insurance Update',
            message: 'Your insurance claim has been approved',
            time: '2 days ago',
            read: true
        },
        {
            id: 5,
            type: 'appointment',
            title: 'Appointment Confirmed',
            message: 'Your appointment on Dec 15 has been confirmed',
            time: '3 days ago',
            read: true
        }
    ])

    const unreadCount = notifications.filter(n => !n.read).length

    const getIcon = (type: string) => {
        const iconClass = "w-5 h-5"
        switch (type) {
            case 'bill':
                return <FileText className={`${iconClass} text-blue-600`} />
            case 'appointment':
                return <Calendar className={`${iconClass} text-green-600`} />
            case 'payment':
                return <DollarSign className={`${iconClass} text-purple-600`} />
            case 'alert':
                return <AlertCircle className={`${iconClass} text-orange-600`} />
            default:
                return <Bell className={iconClass} />
        }
    }

    const getBackgroundColor = (type: string) => {
        switch (type) {
            case 'bill':
                return 'bg-blue-50 dark:bg-blue-900/20'
            case 'appointment':
                return 'bg-green-50 dark:bg-green-900/20'
            case 'payment':
                return 'bg-purple-50 dark:bg-purple-900/20'
            case 'alert':
                return 'bg-orange-50 dark:bg-orange-900/20'
            default:
                return 'bg-gray-50 dark:bg-gray-800'
        }
    }

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ))
    }

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
    }

    const clearAll = () => {
        setNotifications([])
        setIsOpen(false)
    }

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold"
                    >
                        {unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Notification Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-40 max-h-[600px] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Notifications
                                    </h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                                {unreadCount > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {unreadCount} unread
                                        </span>
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            Mark all read
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="flex-1 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400">No notifications</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {notifications.map((notification) => (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                                    }`}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Icon */}
                                                    <div className={`p-2 rounded-lg ${getBackgroundColor(notification.type)} flex-shrink-0`}>
                                                        {getIcon(notification.type)}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                                                {notification.title}
                                                            </h4>
                                                            {!notification.read && (
                                                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <span className="text-xs text-gray-500 dark:text-gray-500 mt-2 block">
                                                            {notification.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={clearAll}
                                        className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 py-2"
                                    >
                                        Clear all notifications
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

export default NotificationsPanel
