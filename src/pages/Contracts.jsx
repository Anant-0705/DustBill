import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
    Plus, FileText, Search, MoreHorizontal,
    Eye, Pencil, Trash2, Copy, Send, ExternalLink,
    Clock, CheckCircle2, AlertCircle, FileEdit, Inbox, XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { emailService } from '../lib/emailService'

const TABS = [
    { key: 'all', label: 'All Contracts', icon: Inbox },
    { key: 'draft', label: 'Drafts', icon: FileEdit },
    { key: 'sent', label: 'Sent', icon: Send },
    { key: 'accepted', label: 'Accepted', icon: CheckCircle2 },
    { key: 'rejected', label: 'Rejected', icon: XCircle },
]

const STATUS_CONFIG = {
    draft: { label: 'Draft', cls: 'bg-muted text-muted-foreground', dot: 'bg-gray-400' },
    sent: { label: 'Sent', cls: 'bg-blue-500/10 text-blue-600', dot: 'bg-blue-500' },
    accepted: { label: 'Accepted', cls: 'bg-green-500/10 text-green-600', dot: 'bg-green-500' },
    rejected: { label: 'Rejected', cls: 'bg-red-500/10 text-red-600', dot: 'bg-red-500' },
}

/* ── Floating dropdown portal ── */
function ActionMenu({ contract, anchorRef, onClose, onAction }) {
    const menuRef = useRef(null)
    const [pos, setPos] = useState({ top: 0, left: 0 })

    useEffect(() => {
        if (!anchorRef?.current) return
        const rect = anchorRef.current.getBoundingClientRect()
        setPos({
            top: rect.bottom + 4,
            left: rect.right - 192,
        })
    }, [anchorRef])

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
            {contract.share_token && (
                <button
                    onClick={() => onAction('view')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
                >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Contract
                </button>
            )}

            {/* Edit Draft */}
            {contract.status === 'draft' && (
                <button
                    onClick={() => onAction('edit')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
                >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit Draft
                </button>
            )}

            {/* Send to Client */}
            {(contract.status === 'draft' || contract.status === 'rejected') && (
                <button
                    onClick={() => onAction('send')}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors text-left"
                >
                    <Send className="h-3.5 w-3.5 text-muted-foreground" /> Send to Client
                </button>
            )}

            {/* Copy Link */}
            {contract.share_token && (
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
                <Trash2 className="h-3.5 w-3.5" /> Delete Contract
            </button>
        </div>,
        document.body
    )
}

/* ── Row-level action button ── */
function RowActions({ contract, isOpen, onToggle, onAction }) {
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
                    contract={contract}
                    anchorRef={btnRef}
                    onClose={() => onToggle()}
                    onAction={onAction}
                />
            )}
        </>
    )
}

export default function Contracts() {
    const [contracts, setContracts] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [openMenu, setOpenMenu] = useState(null)
    const { user } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        fetchContracts()
    }, [user])

    async function fetchContracts() {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('*, clients (name, email)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            setContracts(data || [])
        } catch (error) {
            console.error('Error fetching contracts:', error)
        } finally {
            setLoading(false)
        }
    }

    async function deleteContract(id) {
        if (!confirm('Are you sure you want to delete this contract?')) return
        try {
            const { error } = await supabase.from('contracts').delete().eq('id', id)
            if (error) throw error
            setContracts(prev => prev.filter(c => c.id !== id))
        } catch (error) {
            console.error('Delete error:', error)
            alert('Failed to delete contract.')
        }
    }

    async function duplicateContract(contract) {
        try {
            const { data, error } = await supabase.from('contracts').insert({
                user_id: user.id,
                client_id: contract.client_id,
                title: `${contract.title} (Copy)`,
                description: contract.description,
                content: contract.content,
                terms: contract.terms,
                status: 'draft',
                share_token: crypto.randomUUID(),
            }).select('*, clients (name, email)').single()
            if (error) throw error
            setContracts(prev => [data, ...prev])
        } catch (error) {
            console.error('Duplicate error:', error)
            alert('Failed to duplicate contract.')
        }
    }

    async function sendContract(id) {
        if (!confirm('Send this contract to the client? They will receive an email with a link to review and sign.')) return
        try {
            // Get the full contract details first
            const contractToSend = contracts.find(c => c.id === id)
            if (!contractToSend) throw new Error('Contract not found')
            
            console.log('📝 Contract to send:', contractToSend)
            console.log('📧 Client email:', contractToSend.clients?.email)

            // Update contract status
            const { error } = await supabase.from('contracts').update({ 
                status: 'sent',
                updated_at: new Date().toISOString()
            }).eq('id', id)
            if (error) throw error
            
            // Send email notification
            console.log('📤 Calling sendContractEmail...')
            const emailResult = await emailService.sendContractEmail(contractToSend, 'contract_sent')
            console.log('📬 Email result:', emailResult)
            
            if (emailResult.success) {
                console.log('✅ Email notification logged:', emailResult.data)
                console.log('📧 Check your Supabase email_logs table to verify')
            } else {
                console.error('⚠️ Email notification failed:', emailResult.error)
            }
            
            setContracts(prev => prev.map(c => c.id === id ? { ...c, status: 'sent' } : c))
            
            // Show helpful message
            const message = emailResult.success 
                ? '✅ Contract sent!\n\n📧 Email notification sent to ' + (contractToSend.clients?.email || 'client') + '.\n💡 Check email_logs table to verify.'
                : '⚠️ Contract status updated, but email failed:\n' + (emailResult.error?.message || JSON.stringify(emailResult.error))
            
            alert(message)
        } catch (error) {
            console.error('Send error:', error)
            alert('Failed to send contract: ' + error.message)
        }
    }

    const handleRowAction = useCallback((contract, action) => {
        setOpenMenu(null)
        switch (action) {
            case 'view':
                window.open(`/contract/${contract.share_token}`, '_blank')
                break
            case 'edit':
                navigate('/contracts/new', { state: { editContract: contract } })
                break
            case 'send':
                sendContract(contract.id)
                break
            case 'copy':
                navigator.clipboard.writeText(`${window.location.origin}/contract/${contract.share_token}`)
                alert('Contract link copied to clipboard!')
                break
            case 'duplicate':
                duplicateContract(contract)
                break
            case 'delete':
                deleteContract(contract.id)
                break
        }
    }, [navigate])

    const filtered = contracts.filter(c => {
        if (activeTab !== 'all' && c.status !== activeTab) return false
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (c.title || '').toLowerCase().includes(q) ||
            (c.clients?.name || '').toLowerCase().includes(q)
    })

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
                <div className="h-10 w-full max-w-sm bg-card rounded-xl border border-border animate-pulse" />
                <div className="space-y-2">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Contracts</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage and send contracts to clients
                    </p>
                </div>
                <Link
                    to="/contracts/new"
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" /> New Contract
                </Link>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {TABS.map(tab => {
                    const Icon = tab.icon
                    const count = tab.key === 'all' ? contracts.length : contracts.filter(c => c.status === tab.key).length
                    const isActive = activeTab === tab.key
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                                ${isActive
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border'
                                }
                            `}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-muted'}`}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* ── Search ── */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search contracts..."
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {/* ── Contracts List ── */}
            {filtered.length === 0 ? (
                <div className="bg-card rounded-2xl border border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                        {searchQuery ? 'No contracts found' : 'No contracts yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mb-5">
                        {searchQuery ? 'Try adjusting your search query.' : 'Create your first contract to send to clients.'}
                    </p>
                    {!searchQuery && (
                        <Link
                            to="/contracts/new"
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-accent transition-colors"
                        >
                            <Plus className="h-4 w-4" /> New Contract
                        </Link>
                    )}
                </div>
            ) : (
                <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                    {/* Desktop table header */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
                        <div className="col-span-4">Title</div>
                        <div className="col-span-3">Client</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Created</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {filtered.map((contract, idx) => {
                        const statusConfig = STATUS_CONFIG[contract.status] || STATUS_CONFIG.draft
                        const isLast = idx === filtered.length - 1
                        return (
                            <div
                                key={contract.id}
                                className={`transition-colors hover:bg-muted/30 group ${
                                    !isLast ? 'border-b border-border' : ''
                                }`}
                            >
                                {/* Mobile card */}
                                <div className="sm:hidden flex items-center gap-3 px-4 py-3.5">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <FileText className="h-4.5 w-4.5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-foreground truncate">{contract.title}</p>
                                            <RowActions
                                                contract={contract}
                                                isOpen={openMenu === contract.id}
                                                onToggle={() => setOpenMenu(openMenu === contract.id ? null : contract.id)}
                                                onAction={(action) => handleRowAction(contract, action)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-muted-foreground truncate">{contract.clients?.name || 'No client'}</p>
                                            <span className="text-muted-foreground/40">·</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusConfig.cls}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop row */}
                                <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-4 items-center">
                                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <FileText className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{contract.title}</p>
                                            {contract.description && (
                                                <p className="text-xs text-muted-foreground truncate">{contract.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <p className="text-sm text-foreground">{contract.clients?.name || 'N/A'}</p>
                                        {contract.clients?.email && (
                                            <p className="text-xs text-muted-foreground truncate">{contract.clients.email}</p>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.cls}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">
                                        {format(new Date(contract.created_at), 'MMM d, yyyy')}
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <RowActions
                                            contract={contract}
                                            isOpen={openMenu === contract.id}
                                            onToggle={() => setOpenMenu(openMenu === contract.id ? null : contract.id)}
                                            onAction={(action) => handleRowAction(contract, action)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
