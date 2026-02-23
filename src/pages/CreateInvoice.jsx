import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Trash2, Plus, Save, ArrowLeft, Eye, EyeOff, Palette, X, Upload, Send, ChevronDown, Search, UserCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { emailService } from '../lib/emailService'

const CURRENCIES = {
    USD: { symbol: '$', label: 'USD ($)' },
    EUR: { symbol: '€', label: 'EUR (€)' },
    GBP: { symbol: '£', label: 'GBP (£)' },
    INR: { symbol: '₹', label: 'INR (₹)' },
}

const PRESET_COLORS = [
    '#A582F7', '#7c3aed', '#6366f1', '#3b82f6', '#0ea5e9',
    '#14b8a6', '#22c55e', '#eab308', '#f97316', '#ef4444',
    '#ec4899', '#8b5cf6', '#1e293b', '#0f172a',
]

export default function CreateInvoice() {
    const navigate = useNavigate()
    const location = useLocation()
    const editInvoice = location.state?.editInvoice || null
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [showPreview, setShowPreview] = useState(true)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [brandColor, setBrandColor] = useState('#A582F7')
    const [formError, setFormError] = useState('')

    // Existing clients
    const [existingClients, setExistingClients] = useState([])
    const [clientSearch, setClientSearch] = useState('')
    const [showClientDropdown, setShowClientDropdown] = useState(false)
    const clientDropdownRef = useRef(null)

    useEffect(() => {
        async function fetchClients() {
            if (!user) return
            const { data } = await supabase
                .from('clients')
                .select('id, name, email, address, phone')
                .eq('user_id', user.id)
                .order('name')
            if (data) setExistingClients(data)
        }
        fetchClients()
    }, [user])

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target))
                setShowClientDropdown(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filteredClients = existingClients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(clientSearch.toLowerCase())
    )

    const selectExistingClient = (c) => {
        setClient({ name: c.name, email: c.email || '', address: c.address || '', phone: c.phone || '' })
        setClientSearch(c.name)
        setShowClientDropdown(false)
    }

    // Scroll-hide header
    const [headerVisible, setHeaderVisible] = useState(true)
    const lastScrollY = useRef(0)
    const mainRef = useRef(null)

    useEffect(() => {
        // Listen on the closest scrollable ancestor (the <main> in DashboardLayout)
        const scrollEl = mainRef.current?.closest('main') || window
        const handleScroll = () => {
            const currentY = scrollEl === window ? window.scrollY : scrollEl.scrollTop
            if (currentY > lastScrollY.current && currentY > 60) {
                setHeaderVisible(false)   // scrolling down
            } else {
                setHeaderVisible(true)    // scrolling up
            }
            lastScrollY.current = currentY
        }
        scrollEl.addEventListener('scroll', handleScroll, { passive: true })
        return () => scrollEl.removeEventListener('scroll', handleScroll)
    }, [])

    // Logo
    const [logo, setLogo] = useState(null)
    const [logoDrag, setLogoDrag] = useState(false)
    const logoInputRef = useRef(null)

    // Invoice number
    const [invoiceNumber, setInvoiceNumber] = useState(
        editInvoice?.id ? `INV-${editInvoice.id.slice(0, 8).toUpperCase()}` : `INV-${String(Math.floor(Math.random() * 90000) + 10000)}`
    )

    const [client, setClient] = useState({
        name: editInvoice?.clients?.name || '',
        email: editInvoice?.clients?.email || '',
        address: '',
        phone: '',
    })

    const [company, setCompany] = useState({
        name: '',
        address: '',
    })

    const [invoiceDetails, setInvoiceDetails] = useState({
        issueDate: editInvoice?.created_at ? new Date(editInvoice.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: editInvoice?.due_date || '',
        currency: editInvoice?.currency || 'USD',
        notes: '',
        taxRate: 0,
    })

    const [items, setItems] = useState(
        editInvoice?.items?.length ? editInvoice.items : [{ description: '', quantity: 1, rate: 0 }]
    )

    // ── Logo handling ──
    const handleLogoFile = (file) => {
        if (!file || !file.type.startsWith('image/')) return
        const reader = new FileReader()
        reader.onload = (e) => setLogo(e.target.result)
        reader.readAsDataURL(file)
    }
    const handleLogoDrop = (e) => { e.preventDefault(); setLogoDrag(false); handleLogoFile(e.dataTransfer.files?.[0]) }
    const handleLogoDragOver = (e) => { e.preventDefault(); setLogoDrag(true) }

    const addItem = () => setItems([...items, { description: '', quantity: 1, rate: 0 }])
    const removeItem = (index) => { if (items.length === 1) return; setItems(items.filter((_, i) => i !== index)) }
    const updateItem = (index, field, value) => { const n = [...items]; n[index][field] = value; setItems(n) }

    const subtotal = useMemo(() => items.reduce((a, i) => a + i.quantity * i.rate, 0), [items])
    const taxAmount = useMemo(() => subtotal * (invoiceDetails.taxRate / 100), [subtotal, invoiceDetails.taxRate])
    const total = subtotal + taxAmount
    const fmt = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: invoiceDetails.currency }).format(v)

    const handleSubmit = async (status = 'draft') => {
        if (!user) return

        if (status === 'pending' && !client.email.trim()) {
            setFormError('Please enter the client\'s email address before sending.')
            return
        }
        setFormError('')

        setLoading(true)
        try {
            if (editInvoice?.id) {
                // ── Update existing invoice ──
                const { error: invoiceError } = await supabase
                    .from('invoices')
                    .update({ status, amount: total, currency: invoiceDetails.currency, due_date: invoiceDetails.dueDate || null, items })
                    .eq('id', editInvoice.id)
                if (invoiceError) throw invoiceError

                // Send email if updating status to pending (sending to client)
                if (status === 'pending' && editInvoice.clients?.email) {
                    const invoiceWithClient = {
                        ...editInvoice,
                        status: 'pending',
                        amount: total,
                        clients: { ...editInvoice.clients, email: editInvoice.clients.email }
                    }
                    const emailResult = await emailService.sendInvoiceEmail(invoiceWithClient, 'invoice_sent')
                    if (!emailResult.success) { /* email failed silently; invoice already saved */ }
                }
            } else {
                // ── Create new invoice ──
                const shareToken = crypto.randomUUID()

                // Check if client with that email already exists for this user
                let clientId

                // Only search by email if one was actually provided — an empty string
                // would match every client whose email is empty, corrupting random records
                const emailTrimmed = client.email.trim()
                const existingClient = emailTrimmed ? (await supabase
                    .from('clients')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('email', emailTrimmed)
                    .maybeSingle()).data : null

                if (existingClient) {
                    // Update existing client with new info
                    const { error: updateError } = await supabase.from('clients')
                        .update({ name: client.name, phone: client.phone, address: client.address })
                        .eq('id', existingClient.id)
                    if (updateError) throw updateError
                    clientId = existingClient.id
                } else {
                    // Create new client
                    const { data: clientData, error: clientError } = await supabase
                        .from('clients')
                        .insert({ user_id: user.id, name: client.name, email: client.email, phone: client.phone, address: client.address })
                        .select()
                        .single()
                    if (clientError) throw clientError
                    clientId = clientData.id
                }

                const { data: newInvoice, error: invoiceError } = await supabase
                    .from('invoices')
                    .insert({ user_id: user.id, client_id: clientId, status, amount: total, currency: invoiceDetails.currency, due_date: invoiceDetails.dueDate || null, items, share_token: shareToken })
                    .select()
                    .single()
                if (invoiceError) throw invoiceError

                // Send email immediately if saving as pending (Send Invoice)
                if (status === 'pending' && client.email) {
                    const invoiceWithClient = {
                        ...newInvoice,
                        clients: { name: client.name, email: client.email }
                    }
                    const emailResult = await emailService.sendInvoiceEmail(invoiceWithClient, 'invoice_sent')
                    if (!emailResult.success) { /* email failed silently; invoice already saved */ }
                }
            }
            navigate('/invoices')
        } catch (error) {
            setFormError('Failed to save invoice. Please try again.')
        } finally { setLoading(false) }
    }

    /* ─────────── Shared CSS token classes ─────────── */
    const inputCls = "w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
    const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5"
    const sectionTitleCls = "text-sm font-bold text-foreground mb-3 flex items-center gap-2"
    const cardCls = "bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm"
    const itemInputCls = "w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"

    return (
        <div ref={mainRef} className="-m-8 min-h-screen bg-background text-foreground" style={{ '--brand': brandColor }}>

            {/* ── Main content grid ── */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-6">

                {/* ── Top header bar — slides up on scroll ── */}
                <div
                    className="mb-5 transition-all duration-300 ease-in-out"
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        maxHeight: headerVisible ? '200px' : '0px',
                        marginBottom: headerVisible ? '20px' : '0px',
                        overflow: 'hidden',
                    }}
                >
                    <div className="bg-card rounded-2xl border border-border px-4 py-3 shadow-sm">
                        {/* Row 1: back button + title + (desktop: all actions) */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    onClick={() => navigate('/invoices')}
                                    aria-label="Back to invoices"
                                    className="h-8 w-8 shrink-0 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                                </button>
                                <h1 className="text-base font-bold text-foreground truncate">{editInvoice ? 'Edit Draft' : 'Create Invoice'}</h1>
                            </div>
                            {/* Desktop action buttons */}
                            <div className="hidden lg:flex items-center gap-2 shrink-0">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                        className="h-8 px-3 rounded-lg border border-border flex items-center gap-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                                    >
                                        <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: brandColor }} />
                                        <Palette className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="h-8 px-3.5 rounded-lg border border-border flex items-center gap-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                                >
                                    {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                                </button>
                                <button
                                    onClick={() => handleSubmit('draft')}
                                    disabled={loading}
                                    className="h-8 px-4 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-accent transition-colors flex items-center gap-1.5"
                                >
                                    <Save className="h-3.5 w-3.5" /> Save as Draft
                                </button>
                                <button
                                    onClick={() => handleSubmit('pending')}
                                    disabled={loading}
                                    className="h-8 px-5 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 shadow-md"
                                    style={{ backgroundColor: brandColor }}
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    {loading ? 'Sending...' : 'Save & Send Invoice'}
                                </button>
                            </div>
                            {/* Mobile: compact color + preview toggle */}
                            <div className="flex lg:hidden items-center gap-2 shrink-0">
                                <button
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="h-8 w-8 rounded-lg border border-border flex items-center justify-center transition-colors hover:bg-accent"
                                    title="Brand color"
                                >
                                    <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: brandColor }} />
                                </button>
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                                    title={showPreview ? 'Hide Preview' : 'Show Preview'}
                                >
                                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        {/* Error banner - all screen sizes */}
                        {formError && (
                            <div className="mt-2.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700">
                                {formError}
                            </div>
                        )}
                        {/* Row 2: mobile action buttons */}
                        <div className="flex lg:hidden items-center gap-2 mt-2.5">
                            <button
                                onClick={() => handleSubmit('draft')}
                                disabled={loading}
                                className="flex-1 h-9 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Save className="h-3.5 w-3.5" /> Save Draft
                            </button>
                            <button
                                onClick={() => handleSubmit('pending')}
                                disabled={loading}
                                className="flex-1 h-9 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                style={{ backgroundColor: brandColor }}
                            >
                                <Send className="h-3.5 w-3.5" />
                                {loading ? 'Sending...' : 'Send Invoice'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Color picker dropdown */}
                {showColorPicker && (
                    <div className="fixed top-auto bottom-4 right-4 sm:top-28 sm:bottom-auto sm:right-10 z-40 bg-card rounded-2xl border border-border shadow-xl p-4 w-64">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-foreground">Brand Color</span>
                            <button onClick={() => setShowColorPicker(false)} aria-label="Close color picker"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                        </div>
                        <div className="grid grid-cols-7 gap-2 mb-3">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c} onClick={() => setBrandColor(c)}
                                    className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${brandColor === c ? 'ring-2 ring-offset-2 ring-offset-card' : ''}`}
                                    style={{ backgroundColor: c, '--tw-ring-color': c }}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium">Custom:</span>
                            <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-7 w-7 rounded cursor-pointer border-0 p-0" />
                            <input type="text" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                                className="flex-1 h-7 rounded-lg border border-border bg-background px-2 text-xs font-mono text-foreground uppercase" />
                        </div>
                    </div>
                )}
                <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-[1fr_480px]' : ''}`}>

                    {/* ════════════ LEFT: FORM ════════════ */}
                    <div className="space-y-5">

                        {/* Header */}
                        <div className={cardCls}>
                            <div className={sectionTitleCls}><span>Header</span></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Invoice Number</label>
                                    <input className={inputCls} value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>Issue Date</label>
                                    <input type="date" className={inputCls} value={invoiceDetails.issueDate}
                                        onChange={(e) => setInvoiceDetails({ ...invoiceDetails, issueDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>Due Date</label>
                                    <input type="date" className={inputCls} value={invoiceDetails.dueDate}
                                        onChange={(e) => setInvoiceDetails({ ...invoiceDetails, dueDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>Currency</label>
                                    <select className={inputCls} value={invoiceDetails.currency}
                                        onChange={(e) => setInvoiceDetails({ ...invoiceDetails, currency: e.target.value })}>
                                        {Object.entries(CURRENCIES).map(([code, { label }]) => (
                                            <option key={code} value={code}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Your Company + Logo */}
                        <div className={cardCls}>
                            <div className={sectionTitleCls}><span>Your Company</span></div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Logo upload */}
                                <div className="col-span-2">
                                    <label className={labelCls}>Company Logo</label>
                                    <div
                                        onDrop={handleLogoDrop}
                                        onDragOver={handleLogoDragOver}
                                        onDragLeave={() => setLogoDrag(false)}
                                        onClick={() => logoInputRef.current?.click()}
                                        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all
                                            ${logoDrag ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-border hover:border-muted-foreground/30'}
                                            ${logo ? 'p-3' : 'p-5'}
                                        `}
                                    >
                                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                                            onChange={(e) => handleLogoFile(e.target.files?.[0])} />
                                        {logo ? (
                                            <div className="flex items-center gap-4">
                                                <img src={logo} alt="Company logo"
                                                    className="h-14 w-14 rounded-xl object-contain bg-muted border border-border p-1" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-semibold text-foreground">Logo uploaded</div>
                                                    <div className="text-[10px] text-muted-foreground">Click to change or drag a new file</div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); setLogo(null) }}
                                                    aria-label="Remove logo"
                                                    className="h-7 w-7 rounded-lg bg-muted hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <div className="mx-auto h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-2">
                                                    <Upload className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div className="text-xs font-semibold text-muted-foreground">
                                                    Drop your logo here or <span style={{ color: brandColor }}>browse</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground/60 mt-0.5">PNG, JPG, SVG up to 2 MB</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className={labelCls}>Company Name</label>
                                    <input className={inputCls} placeholder="Your Company LLC"
                                        value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className={labelCls}>Address</label>
                                    <input className={inputCls} placeholder="123 Business St, City"
                                        value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Client */}
                        <div className={cardCls}>
                            <div className={sectionTitleCls}><span>Client Details</span></div>

                            {/* ── Existing client picker ── */}
                            {existingClients.length > 0 && (
                                <div className="mb-4" ref={clientDropdownRef}>
                                    <label className={labelCls}>Pick an existing client</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                        <input
                                            className={inputCls + ' pl-8 pr-8'}
                                            placeholder="Search clients by name or email…"
                                            value={clientSearch}
                                            onFocus={() => setShowClientDropdown(true)}
                                            onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true) }}
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                        {showClientDropdown && filteredClients.length > 0 && (
                                            <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                                                {filteredClients.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => selectExistingClient(c)}
                                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-muted/60 transition-colors text-left"
                                                    >
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                                                            {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {showClientDropdown && clientSearch && filteredClients.length === 0 && (
                                            <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-xl px-4 py-3 text-xs text-muted-foreground">
                                                No clients match "{clientSearch}"
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-1.5">Or fill in the fields below to create a new client</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Client Name *</label>
                                    <input className={inputCls} placeholder="Acme Corp"
                                        value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>Email</label>
                                    <input type="email" className={inputCls} placeholder="billing@acme.com"
                                        value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>Address</label>
                                    <input className={inputCls} placeholder="456 Client Ave"
                                        value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelCls}>Phone</label>
                                    <input className={inputCls} placeholder="+1 234 567 890"
                                        value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className={cardCls}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={sectionTitleCls + ' mb-0'}><span>Items</span></div>
                                <button onClick={addItem}
                                    className="h-8 px-3.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ backgroundColor: brandColor }}>
                                    <Plus className="h-3.5 w-3.5" /> Add Item
                                </button>
                            </div>

                            <div className="grid grid-cols-12 gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                                <div className="col-span-5">Name / Description</div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-2 text-right">Rate</div>
                                <div className="col-span-2 text-right">Amount</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-3 items-center bg-muted/50 rounded-xl p-2">
                                        <div className="col-span-5">
                                            <input className={itemInputCls} placeholder="Enter item name"
                                                value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" min="1" className={itemInputCls + ' text-center'}
                                                value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} />
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" min="0" className={itemInputCls + ' text-right'}
                                                value={item.rate} onChange={(e) => updateItem(index, 'rate', Number(e.target.value))} />
                                        </div>
                                        <div className="col-span-2 text-right text-sm font-semibold text-foreground pr-1">
                                            {fmt(item.quantity * item.rate)}
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <button onClick={() => removeItem(index)}
                                                className="h-7 w-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="mt-5 pt-4 border-t border-border flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Subtotal</span><span>{fmt(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground items-center gap-3">
                                        <span>Tax</span>
                                        <div className="flex items-center gap-1.5">
                                            <input type="number" min="0" max="100"
                                                className="w-14 h-7 rounded-md border border-border bg-background px-2 text-xs text-center text-foreground outline-none focus:border-[var(--brand)]"
                                                value={invoiceDetails.taxRate}
                                                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, taxRate: Number(e.target.value) })} />
                                            <span className="text-xs text-muted-foreground">%</span>
                                        </div>
                                        <span className="ml-auto">{fmt(taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
                                        <span>Total</span>
                                        <span style={{ color: brandColor }}>{fmt(total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className={cardCls}>
                            <div className={sectionTitleCls}><span>Notes & Terms</span></div>
                            <textarea
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 resize-none"
                                rows="3" placeholder="Payment terms, thank you notes, or special instructions..."
                                value={invoiceDetails.notes}
                                onChange={(e) => setInvoiceDetails({ ...invoiceDetails, notes: e.target.value })} />
                        </div>


                    </div>

                    {/* ════════════ RIGHT: LIVE PREVIEW (larger) ════════════ */}
                    {showPreview && (
                        <div className="lg:sticky lg:top-4 lg:self-start">
                                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                                    {/* Preview header */}
                                    <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/40">
                                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Live Preview</span>
                                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                    </div>

                                    {/* The preview invoice — always white for print fidelity */}
                                    <div className="p-6">
                                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-left" style={{ fontSize: '12px', color: '#1a1a1a' }}>

                                            {/* Invoice header */}
                                            <div className="flex items-start justify-between mb-6">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        {logo ? (
                                                            <img src={logo} alt="Logo" className="h-11 w-11 rounded-lg object-contain bg-gray-50 border border-gray-100 p-0.5" />
                                                        ) : (
                                                            <div className="h-11 w-11 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                                                style={{ backgroundColor: brandColor }}>
                                                                {company.name ? company.name.charAt(0).toUpperCase() : 'D'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm">{company.name || 'Your Company'}</div>
                                                            <div className="text-[10px] text-gray-400">{company.address || 'Company Address'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-extrabold" style={{ color: brandColor }}>Invoice</div>
                                                    <div className="text-[10px] text-gray-500 mt-0.5">{invoiceNumber || 'INV-00000'}</div>
                                                    <div className="text-[10px] text-gray-400">
                                                        {invoiceDetails.issueDate
                                                            ? new Date(invoiceDetails.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                                            : 'Issue Date'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="h-[2px] rounded-full mb-5" style={{ backgroundColor: brandColor, opacity: 0.15 }} />

                                            {/* Bill To */}
                                            <div className="grid grid-cols-2 gap-4 mb-5">
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: brandColor }}>Bill To</div>
                                                    <div className="font-semibold text-gray-900 text-[13px]">{client.name || 'Client Name'}</div>
                                                    <div className="text-gray-400 text-[10px]">{client.email || 'client@email.com'}</div>
                                                    <div className="text-gray-400 text-[10px]">{client.address || 'Client Address'}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-gray-400 mb-0.5">Due Date</div>
                                                    <div className="text-[13px] font-semibold text-gray-700">
                                                        {invoiceDetails.dueDate
                                                            ? new Date(invoiceDetails.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                                            : '—'}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-1">Currency</div>
                                                    <div className="text-[13px] font-semibold text-gray-700">{invoiceDetails.currency}</div>
                                                </div>
                                            </div>

                                            {/* Items table */}
                                            <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: brandColor }}>Order Details</div>
                                            <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
                                                <div className="grid grid-cols-12 gap-0 text-[10px] font-bold text-white px-4 py-2" style={{ backgroundColor: brandColor }}>
                                                    <div className="col-span-5">Item</div>
                                                    <div className="col-span-2 text-center">Qty</div>
                                                    <div className="col-span-2 text-right">Rate</div>
                                                    <div className="col-span-3 text-right">Amount</div>
                                                </div>
                                                {items.map((item, i) => (
                                                    <div key={i} className={`grid grid-cols-12 gap-0 px-4 py-2 text-[10px] ${i % 2 === 0 ? 'bg-gray-50/60' : 'bg-white'}`}>
                                                        <div className="col-span-5 text-gray-700">{item.description || '—'}</div>
                                                        <div className="col-span-2 text-center text-gray-500">{item.quantity}</div>
                                                        <div className="col-span-2 text-right text-gray-500">{fmt(item.rate)}</div>
                                                        <div className="col-span-3 text-right font-semibold text-gray-700">{fmt(item.quantity * item.rate)}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Totals */}
                                            <div className="flex justify-end">
                                                <div className="w-48 space-y-1.5 text-[10px]">
                                                    <div className="flex justify-between text-gray-500">
                                                        <span>Subtotal</span><span>{fmt(subtotal)}</span>
                                                    </div>
                                                    {invoiceDetails.taxRate > 0 && (
                                                        <div className="flex justify-between text-gray-500">
                                                            <span>Tax ({invoiceDetails.taxRate}%)</span><span>{fmt(taxAmount)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between font-bold text-[13px] pt-1.5 border-t border-gray-200" style={{ color: brandColor }}>
                                                        <span>Total Due</span><span>{fmt(total)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {invoiceDetails.notes && (
                                                <div className="mt-5 pt-3 border-t border-gray-100">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</div>
                                                    <div className="text-[10px] text-gray-500 leading-relaxed whitespace-pre-wrap">{invoiceDetails.notes}</div>
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="mt-6 pt-3 border-t border-gray-100 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="h-3.5 w-3.5 rounded flex items-center justify-center text-white text-[7px] font-bold" style={{ backgroundColor: brandColor }}>D</div>
                                                    <span className="text-[10px] font-semibold text-gray-400">Powered by DustBill</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
