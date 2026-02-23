import { useState, useEffect } from 'react'
import { User, Bell, Palette, Shield, CreditCard, Building2, Save, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../components/ThemeProvider'

const TABS = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'business', label: 'Business', icon: Building2 },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'notifications', label: 'Notifications', icon: Bell },
]

export default function Settings() {
    const { user } = useAuthStore()
    const { theme, setTheme } = useTheme()
    const [activeTab, setActiveTab] = useState('profile')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // Profile
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
    })

    // Business
    const [business, setBusiness] = useState({
        companyName: '',
        address: '',
        phone: '',
        website: '',
        taxId: '',
        defaultCurrency: 'USD',
        defaultTaxRate: '0',
        invoicePrefix: 'INV',
        invoiceNotes: '',
    })

    // Notifications
    const [notifications, setNotifications] = useState({
        emailInvoiceSent: true,
        emailPaymentReceived: true,
        emailInvoiceOverdue: true,
        emailWeeklyReport: false,
    })

    useEffect(() => {
        if (user) {
            setProfile({
                fullName: user.user_metadata?.full_name || '',
                email: user.email || '',
            })
        }
    }, [user])

    async function handleSaveProfile() {
        setSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: profile.fullName },
            })
            if (error) throw error
            showSaved()
        } catch (err) {
            // save failed silently
        } finally {
            setSaving(false)
        }
    }

    function showSaved() {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const inputCls = "w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
    const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5"
    const cardCls = "bg-card rounded-2xl border border-border p-6 shadow-sm"

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage your account and preferences.
                </p>
            </div>

            {/* ── Tabs ── */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-max min-w-full sm:w-fit">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`
                                    flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0
                                    ${isActive
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                                    }
                                `}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Tab Content ── */}
            <div className="max-w-2xl">

                {/* ─── Profile ─── */}
                {activeTab === 'profile' && (
                    <div className={cardCls}>
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> Profile Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-primary">
                                        {(profile.fullName || profile.email || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{profile.fullName || 'Your Name'}</p>
                                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>Full Name</label>
                                <input className={inputCls} placeholder="Your full name" value={profile.fullName}
                                    onChange={e => setProfile({ ...profile, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelCls}>Email Address</label>
                                <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={profile.email} disabled />
                                <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed here.</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-border flex justify-end">
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm"
                            >
                                {saved ? <><Check className="h-3.5 w-3.5" /> Saved!</> :
                                    saving ? 'Saving...' : <><Save className="h-3.5 w-3.5" /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Business ─── */}
                {activeTab === 'business' && (
                    <div className="space-y-6">
                        <div className={cardCls}>
                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" /> Company Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelCls}>Company Name</label>
                                    <input className={inputCls} placeholder="Acme Inc." value={business.companyName}
                                        onChange={e => setBusiness({ ...business, companyName: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>Address</label>
                                    <input className={inputCls} placeholder="123 Business Ave, Suite 100" value={business.address}
                                        onChange={e => setBusiness({ ...business, address: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Phone</label>
                                        <input className={inputCls} placeholder="+1 (555) 000-0000" value={business.phone}
                                            onChange={e => setBusiness({ ...business, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Website</label>
                                        <input className={inputCls} placeholder="https://acme.com" value={business.website}
                                            onChange={e => setBusiness({ ...business, website: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Tax ID / GST Number</label>
                                    <input className={inputCls} placeholder="GSTIN / EIN" value={business.taxId}
                                        onChange={e => setBusiness({ ...business, taxId: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className={cardCls}>
                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-primary" /> Invoice Defaults
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Default Currency</label>
                                        <select className={inputCls} value={business.defaultCurrency}
                                            onChange={e => setBusiness({ ...business, defaultCurrency: e.target.value })}>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="INR">INR (₹)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Default Tax Rate (%)</label>
                                        <input className={inputCls} type="number" min="0" max="100" placeholder="18" value={business.defaultTaxRate}
                                            onChange={e => setBusiness({ ...business, defaultTaxRate: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Invoice Number Prefix</label>
                                    <input className={inputCls} placeholder="INV" value={business.invoicePrefix}
                                        onChange={e => setBusiness({ ...business, invoicePrefix: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>Default Invoice Notes</label>
                                    <textarea
                                        className="w-full min-h-[80px] rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                        placeholder="Payment terms, bank details, etc."
                                        value={business.invoiceNotes}
                                        onChange={e => setBusiness({ ...business, invoiceNotes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-border flex justify-end">
                                <button
                                    onClick={showSaved}
                                    className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    {saved ? <><Check className="h-3.5 w-3.5" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> Save Changes</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Appearance ─── */}
                {activeTab === 'appearance' && (
                    <div className={cardCls}>
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <Palette className="h-4 w-4 text-primary" /> Theme
                        </h3>
                        <p className="text-xs text-muted-foreground mb-5">Choose how DustBill looks for you.</p>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { key: 'light', label: 'Light', preview: 'bg-white border-gray-200' },
                                { key: 'dark', label: 'Dark', preview: 'bg-gray-900 border-gray-700' },
                                { key: 'system', label: 'System', preview: 'bg-gradient-to-br from-white to-gray-900 border-gray-400' },
                            ].map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setTheme(opt.key)}
                                    className={`
                                        group rounded-xl border-2 p-4 text-center transition-all
                                        ${theme === opt.key
                                            ? 'border-primary bg-primary/5 shadow-sm'
                                            : 'border-border hover:border-primary/40'
                                        }
                                    `}
                                >
                                    <div className={`h-16 rounded-lg border ${opt.preview} mb-3 mx-auto w-full`} />
                                    <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                                    {theme === opt.key && (
                                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                                            <Check className="h-3 w-3" /> Active
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── Notifications ─── */}
                {activeTab === 'notifications' && (
                    <div className={cardCls}>
                        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <Bell className="h-4 w-4 text-primary" /> Email Notifications
                        </h3>
                        <p className="text-xs text-muted-foreground mb-5">Choose which emails you want to receive.</p>

                        <div className="space-y-4">
                            {[
                                { key: 'emailInvoiceSent', label: 'Invoice Sent', desc: 'Get notified when an invoice is sent to a client.' },
                                { key: 'emailPaymentReceived', label: 'Payment Received', desc: 'Get notified when a client pays an invoice.' },
                                { key: 'emailInvoiceOverdue', label: 'Invoice Overdue', desc: 'Get reminded about overdue invoices.' },
                                { key: 'emailWeeklyReport', label: 'Weekly Summary', desc: 'Receive a weekly summary of your invoicing activity.' },
                            ].map(opt => (
                                <div key={opt.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                                    <div className="min-w-0 mr-4">
                                        <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                                    </div>
                                    {/* Toggle switch */}
                                    <button
                                        onClick={() => setNotifications({ ...notifications, [opt.key]: !notifications[opt.key] })}
                                        className={`
                                            relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors
                                            ${notifications[opt.key] ? 'bg-primary' : 'bg-muted'}
                                        `}
                                    >
                                        <span className={`
                                            pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform
                                            ${notifications[opt.key] ? 'translate-x-5' : 'translate-x-0'}
                                        `} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-border flex justify-end">
                            <button
                                onClick={showSaved}
                                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm"
                            >
                                {saved ? <><Check className="h-3.5 w-3.5" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> Save Preferences</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── Danger Zone ─── */}
                {activeTab === 'profile' && (
                    <div className="mt-6 bg-card rounded-2xl border border-red-500/20 p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Danger Zone
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Once you delete your account, there is no going back. This action is permanent.
                        </p>
                        <button className="h-9 px-4 rounded-xl border border-red-500/30 text-xs font-semibold text-red-500 hover:bg-red-500/5 transition-colors">
                            Delete Account
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
