import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Building, CreditCard, Bell, FileText, Save, Loader2, CheckCircle } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { apiGet, apiPut } from '@/services/api'
import { toast } from 'react-toastify'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'

interface SystemSettings {
    billing: {
        default_payment_terms_days: number
        late_fee_percent: number
        currency: string
        tax_rate_percent: number
    }
    claims: {
        auto_submit: boolean
        default_insurance_provider: string
        claim_expiry_days: number
    }
    notifications: {
        send_invoice_emails: boolean
        send_payment_reminders: boolean
        reminder_days_before_due: number
    }
    system: {
        facility_name: string
        facility_npi: string
        facility_address: string
        facility_phone: string
        timezone: string
    }
}

const DEFAULT_SETTINGS: SystemSettings = {
    billing: { default_payment_terms_days: 30, late_fee_percent: 1.5, currency: 'USD', tax_rate_percent: 0 },
    claims: { auto_submit: false, default_insurance_provider: '', claim_expiry_days: 365 },
    notifications: { send_invoice_emails: true, send_payment_reminders: true, reminder_days_before_due: 7 },
    system: { facility_name: '', facility_npi: '', facility_address: '', facility_phone: '', timezone: 'America/New_York' },
}

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-sm text-secondary-700 dark:text-gray-300">{label}</span>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
)

const AdminSettings = () => {
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        apiGet<SystemSettings>('/v1/admin/settings')
            .then(data => setSettings(data))
            .catch(() => { /* use defaults */ })
            .finally(() => setIsLoading(false))
    }, [])

    const updateSection = <K extends keyof SystemSettings>(
        section: K,
        key: keyof SystemSettings[K],
        value: any
    ) => {
        setSettings(prev => ({
            ...prev,
            [section]: { ...prev[section], [key]: value },
        }))
        setSaved(false)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const updated = await apiPut<SystemSettings>('/v1/admin/settings', settings)
            setSettings(updated)
            setSaved(true)
            toast.success('Settings saved successfully!')
            setTimeout(() => setSaved(false), 3000)
        } catch {
            toast.error('Failed to save settings. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <DashboardSkeleton statCount={4} />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">System Settings</h1>
                    <p className="text-secondary-500 dark:text-gray-400 mt-1">Configure billing, claims, and notification preferences</p>
                </div>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                        <CheckCircle className="w-4 h-4" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saved ? 'Saved!' : 'Save Settings'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facility / System Info */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardHeader
                            title="Facility Information"
                            subtitle="Name, NPI, and contact details"
                            action={<Building className="w-5 h-5 text-secondary-400" />}
                        />
                        <div className="space-y-4 mt-4">
                            <Input
                                label="Facility Name"
                                value={settings.system.facility_name}
                                onChange={e => updateSection('system', 'facility_name', e.target.value)}
                                placeholder="HealPay Medical Center"
                            />
                            <Input
                                label="NPI Number"
                                value={settings.system.facility_npi}
                                onChange={e => updateSection('system', 'facility_npi', e.target.value)}
                                placeholder="1234567890"
                            />
                            <Input
                                label="Facility Address"
                                value={settings.system.facility_address}
                                onChange={e => updateSection('system', 'facility_address', e.target.value)}
                                placeholder="123 Medical Drive, Suite 100"
                            />
                            <Input
                                label="Facility Phone"
                                value={settings.system.facility_phone}
                                onChange={e => updateSection('system', 'facility_phone', e.target.value)}
                                placeholder="+1 (555) 000-0000"
                            />
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">Timezone</label>
                                <select
                                    value={settings.system.timezone}
                                    onChange={e => updateSection('system', 'timezone', e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="America/New_York">Eastern Time (ET)</option>
                                    <option value="America/Chicago">Central Time (CT)</option>
                                    <option value="America/Denver">Mountain Time (MT)</option>
                                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                    <option value="UTC">UTC</option>
                                </select>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Billing Settings */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card>
                        <CardHeader
                            title="Billing Configuration"
                            subtitle="Payment terms, fees, and currency"
                            action={<CreditCard className="w-5 h-5 text-secondary-400" />}
                        />
                        <div className="space-y-4 mt-4">
                            <Input
                                label="Payment Terms (days)"
                                type="number"
                                value={settings.billing.default_payment_terms_days.toString()}
                                onChange={e => updateSection('billing', 'default_payment_terms_days', parseInt(e.target.value) || 30)}
                                placeholder="30"
                            />
                            <Input
                                label="Late Fee (%)"
                                type="number"
                                step="0.1"
                                value={settings.billing.late_fee_percent.toString()}
                                onChange={e => updateSection('billing', 'late_fee_percent', parseFloat(e.target.value) || 0)}
                                placeholder="1.5"
                            />
                            <Input
                                label="Tax Rate (%)"
                                type="number"
                                step="0.01"
                                value={settings.billing.tax_rate_percent.toString()}
                                onChange={e => updateSection('billing', 'tax_rate_percent', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                            />
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">Currency</label>
                                <select
                                    value={settings.billing.currency}
                                    onChange={e => updateSection('billing', 'currency', e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="USD">USD — US Dollar</option>
                                    <option value="EUR">EUR — Euro</option>
                                    <option value="GBP">GBP — British Pound</option>
                                    <option value="CAD">CAD — Canadian Dollar</option>
                                </select>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Claims Settings */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <CardHeader
                            title="Claims Configuration"
                            subtitle="Default insurance and submission settings"
                            action={<FileText className="w-5 h-5 text-secondary-400" />}
                        />
                        <div className="space-y-4 mt-4">
                            <Input
                                label="Default Insurance Provider"
                                value={settings.claims.default_insurance_provider}
                                onChange={e => updateSection('claims', 'default_insurance_provider', e.target.value)}
                                placeholder="Blue Cross Blue Shield"
                            />
                            <Input
                                label="Claim Expiry (days)"
                                type="number"
                                value={settings.claims.claim_expiry_days.toString()}
                                onChange={e => updateSection('claims', 'claim_expiry_days', parseInt(e.target.value) || 365)}
                                placeholder="365"
                            />
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                <Toggle
                                    checked={settings.claims.auto_submit}
                                    onChange={v => updateSection('claims', 'auto_submit', v)}
                                    label="Auto-submit claims when billing codes are assigned"
                                />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Notification Settings */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card>
                        <CardHeader
                            title="Notification Preferences"
                            subtitle="Email and reminder settings"
                            action={<Bell className="w-5 h-5 text-secondary-400" />}
                        />
                        <div className="space-y-4 mt-4">
                            <div className="space-y-1 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <Toggle
                                    checked={settings.notifications.send_invoice_emails}
                                    onChange={v => updateSection('notifications', 'send_invoice_emails', v)}
                                    label="Send invoice emails to patients"
                                />
                                <Toggle
                                    checked={settings.notifications.send_payment_reminders}
                                    onChange={v => updateSection('notifications', 'send_payment_reminders', v)}
                                    label="Send payment reminder emails"
                                />
                            </div>
                            <Input
                                label="Reminder days before due date"
                                type="number"
                                value={settings.notifications.reminder_days_before_due.toString()}
                                onChange={e => updateSection('notifications', 'reminder_days_before_due', parseInt(e.target.value) || 7)}
                                placeholder="7"
                            />
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Sticky save bar at bottom */}
            <div className="sticky bottom-4 flex justify-end">
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="shadow-lg flex items-center gap-2 px-6"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving…' : 'Save All Settings'}
                </Button>
            </div>
        </div>
    )
}

export default AdminSettings
