import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
    Plus, FileText, Search, MoreHorizontal,
    Eye, Pencil, Trash2, Copy, Send, ExternalLink,
    Clock, CheckCircle2, AlertCircle, FileEdit, Inbox
} from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const TABS = [
    { key: 'all', label: 'All Invoices', icon: Inbox },
    { key: 'draft', label: 'Drafts', icon: FileEdit },
    { key: 'pending', label: 'Sent', icon: Send },
    { key: 'approved', label: 'Approved', icon: CheckCircle2 },
    { key: 'paid', label: 'Paid', icon: CheckCircle2 },
    { key: 'rejected', label: 'Rejected', icon: AlertCircle },
    { key: 'overdue', label: 'Overdue', icon: AlertCircle },
]

const STATUS_CONFIG = {
    draft: { label: 'Draft', cls: 'bg-muted text-muted-foreground', dot: 'bg-gray-400' },
    pending: { label: 'Sent', cls: 'bg-blue-500/10 text-blue-600', dot: 'bg-blue-500' },
    approved: { label: 'Approved', cls: 'bg-green-500/10 text-green-600', dot: 'bg-green-500' },
    paid: { label: 'Paid', cls: 'bg-green-500/10 text-green-600', dot: 'bg-green-500' },
    rejected: { label: 'Rejected', cls: 'bg-red-500/10 text-red-600', dot: 'bg-red-500' },
    overdue: { label: 'Overdue', cls: 'bg-red-500/10 text-red-600', dot: 'bg-red-500' },
}

/* ── Floating dropdown portal ── */
function ActionMenu({ invoice, anchorRef, onClose, onAction }) {
    const menuRef = useRef(null)
    const [pos, setPos] = useState({ top: 0, left: 0 })

    useEffect(() => {
        if (!anchorRef?.current) return
        const rect = anchorRef.current.getBoundingClientRect()
        setPos({
            top: rect.bottom + 4,
            left: rect.right - 192,       // 192 = menu width (w-48)
        })
    }, [anchorRef])

    // Close on click outside
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) &&
                anchorRef.current && !anchorRef.current.contains(e.target)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [onClose, anchorRef])

    // Close on scroll
    useEffect(() => {
        const handler = () => onClose()
        window.addEventListener('scroll', handler, true)
        return () => window.removeEventListener('scroll', handler, true)
    }, [onClose])

    return createPortal(
        <div
            ref={menuRef}
            className="fixed w-48 bg-card rounded-xl border border-border shadow-2xl z-[100] py-1.5"
            style={{ top: pos.top, left: pos.left }}
        >
            {/* View */}
            {invoice.share_token && (
                <button
                    onClick={() => onAction('view')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
                >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Invoice
                </button>
            )}

            {/* Edit Draft */}
            {invoice.status === 'draft' && (
                <button
                    onClick={() => onAction('edit')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
                >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit Draft
                </button>
            )}

            {/* Mark as Sent */}
            {invoice.status === 'draft' && (
                <button
                    onClick={() => onAction('send')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
                >
                    <Send className="h-3.5 w-3.5 text-muted-foreground" /> Mark as Sent
                </button>
            )}

            {/* Copy Link */}
            {invoice.share_token && (
                <button
                    onClick={() => onAction('copy')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
                >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Copy Link
                </button>
            )}

            {/* Duplicate */}
            <button
                onClick={() => onAction('duplicate')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
            >
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> Duplicate
            </button>

            <div className="my-1.5 border-t border-border" />

            {/* Delete */}
            <button
                onClick={() => onAction('delete')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-500 hover:bg-red-500/5 transition-colors text-left"
            >
                <Trash2 className="h-3.5 w-3.5" /> Delete Invoice
            </button>
        </div>,
        document.body
    )
}

/* ── Row-level action button ── */
function RowActions({ invoice, isOpen, onToggle, onAction }) {
    const btnRef = useRef(null)

    return (
        <>
            <button
                ref={btnRef}
                onClick={onToggle}
                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors
                    ${isOpen
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground opacity-0 group-hover:opacity-100'
                    }
                `}
            >
                <MoreHorizontal className="h-4 w-4" />
            </button>
            {isOpen && (
                <ActionMenu
                    invoice={invoice}
                    anchorRef={btnRef}
                    onClose={() => onToggle()}
                    onAction={onAction}
                />
            )}
        </>
    )
}

export default function Invoices() {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [openMenu, setOpenMenu] = useState(null)
    const { user } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        fetchInvoices()
    }, [user])

    async function fetchInvoices() {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*, clients (name, email)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            setInvoices(data || [])
        } catch (error) {
            console.error('Error fetching invoices:', error)
        } finally {
            setLoading(false)
        }
    }

    async function deleteInvoice(id) {
        if (!confirm('Are you sure you want to delete this invoice?')) return
        try {
            const { error } = await supabase.from('invoices').delete().eq('id', id)
            if (error) throw error
            setInvoices(prev => prev.filter(inv => inv.id !== id))
        } catch (error) {
            console.error('Delete error:', error)
            alert('Failed to delete invoice.')
        }
    }

    async function duplicateInvoice(invoice) {
        try {
            const { data, error } = await supabase.from('invoices').insert({
                user_id: user.id,
                client_id: invoice.client_id,
                status: 'draft',
                amount: invoice.amount,
                currency: invoice.currency,
                due_date: invoice.due_date,
                items: invoice.items,
                share_token: crypto.randomUUID(),
            }).select('*, clients (name, email)').single()
            if (error) throw error
            setInvoices(prev => [data, ...prev])
        } catch (error) {
            console.error('Duplicate error:', error)
            alert('Failed to duplicate invoice.')
        }
    }

    async function markAsSent(id) {
        try {
            const { error } = await supabase.from('invoices').update({ status: 'pending' }).eq('id', id)
            if (error) throw error
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'pending' } : inv))
        } catch (error) {
            console.error('Update error:', error)
        }
    }

    const handleRowAction = useCallback((invoice, action) => {
        setOpenMenu(null)
        switch (action) {
            case 'view':
                window.open(`/invoice/${invoice.share_token}`, '_blank')
                break
            case 'edit':
                navigate('/invoices/new', { state: { editInvoice: invoice } })
                break
            case 'send':
                markAsSent(invoice.id)
                break
            case 'copy':
                navigator.clipboard.writeText(`${window.location.origin}/invoice/${invoice.share_token}`)
                break
            case 'duplicate':
                duplicateInvoice(invoice)
                break
            case 'delete':
                deleteInvoice(invoice.id)
                break
        }
    }, [navigate])

    const fmt = (amount, currency = 'USD') =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0)

    // Filter
    const filtered = invoices.filter(inv => {
        if (activeTab !== 'all' && inv.status !== activeTab) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return (inv.clients?.name || '').toLowerCase().includes(q) ||
                (inv.id || '').toLowerCase().includes(q)
        }
        return true
    })

    // Counts
    const counts = {
        all: invoices.length,
        draft: invoices.filter(i => i.status === 'draft').length,
        pending: invoices.filter(i => i.status === 'pending').length,
        paid: invoices.filter(i => i.status === 'paid').length,
        overdue: invoices.filter(i => i.status === 'overdue').length,
    }

    /* ─── Loading skeleton ─── */
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
                <div className="grid gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-card rounded-xl border border-border animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Invoices</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage, track, and edit your invoices.
                    </p>
                </div>
                <Link
                    to="/invoices/new"
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                >
                    <Plus className="h-4 w-4" /> New Invoice
                </Link>
            </div>

            {/* ── Tabs + Search ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Tabs */}
                <div className="flex gap-1 bg-muted/50 rounded-xl p-1 flex-1 overflow-x-auto">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.key
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`
                                    flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                                    ${isActive
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                                    }
                                `}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {tab.label}
                                {counts[tab.key] > 0 && (
                                    <span className={`ml-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center
                                        ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                                    `}>
                                        {counts[tab.key]}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search invoices..."
                        className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Invoice List ── */}
            {filtered.length === 0 ? (
                <div className="bg-card rounded-2xl border border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                        {activeTab === 'all' ? 'No invoices yet' : `No ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()} invoices`}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mb-5">
                        {activeTab === 'all'
                            ? 'Create your first invoice to get started tracking your earnings.'
                            : `You don't have any invoices with this status yet.`}
                    </p>
                    {activeTab === 'all' && (
                        <Link
                            to="/invoices/new"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-accent transition-colors"
                        >
                            <Plus className="h-4 w-4" /> Create Invoice
                        </Link>
                    )}
                </div>
            ) : (
                <div className="bg-card rounded-2xl border border-border shadow-sm">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30 rounded-t-2xl">
                        <div className="col-span-4">Client</div>
                        <div className="col-span-2">Invoice</div>
                        <div className="col-span-2 text-right">Amount</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Rows */}
                    {filtered.map((invoice, idx) => {
                        const statusCfg = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft
                        const isLast = idx === filtered.length - 1
                        return (
                            <div
                                key={invoice.id}
                                className={`
                                    grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors hover:bg-muted/30 group
                                    ${!isLast ? 'border-b border-border' : ''}
                                `}
                            >
                                {/* Client */}
                                <div className="col-span-4 flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-primary">
                                            {(invoice.clients?.name || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            {invoice.clients?.name || 'Unknown Client'}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {invoice.clients?.email || '—'}
                                        </p>
                                    </div>
                                </div>

                                {/* Invoice number */}
                                <div className="col-span-2">
                                    <p className="text-xs font-mono text-muted-foreground">
                                        #{invoice.id.slice(0, 8)}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                        {invoice.due_date
                                            ? format(new Date(invoice.due_date), 'MMM d, yyyy')
                                            : '—'}
                                    </p>
                                </div>

                                {/* Amount */}
                                <div className="col-span-2 text-right">
                                    <p className="text-sm font-bold text-foreground">
                                        {fmt(invoice.amount, invoice.currency)}
                                    </p>
                                </div>

                                {/* Status badge */}
                                <div className="col-span-2 flex justify-center">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusCfg.cls}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                        {statusCfg.label}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 flex items-center justify-end gap-1.5">
                                    {/* Quick view button */}
                                    {invoice.share_token && (
                                        <button
                                            onClick={() => window.open(`/invoice/${invoice.share_token}`, '_blank')}
                                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                                            title="View invoice"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </button>
                                    )}

                                    {/* More actions */}
                                    <RowActions
                                        invoice={invoice}
                                        isOpen={openMenu === invoice.id}
                                        onToggle={() => setOpenMenu(openMenu === invoice.id ? null : invoice.id)}
                                        onAction={(action) => handleRowAction(invoice, action)}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Summary stats ── */}
            {invoices.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Invoiced', value: fmt(invoices.reduce((a, i) => a + (i.amount || 0), 0)), color: 'text-foreground' },
                        { label: 'Paid', value: fmt(invoices.filter(i => i.status === 'paid').reduce((a, i) => a + (i.amount || 0), 0)), color: 'text-green-500' },
                        { label: 'Pending', value: fmt(invoices.filter(i => i.status === 'pending').reduce((a, i) => a + (i.amount || 0), 0)), color: 'text-blue-500' },
                        { label: 'Overdue', value: fmt(invoices.filter(i => i.status === 'overdue').reduce((a, i) => a + (i.amount || 0), 0)), color: 'text-red-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-card rounded-xl border border-border p-4">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
