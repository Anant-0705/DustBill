import { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
    Users, Plus, Search, MoreHorizontal, Mail,
    Phone, MapPin, FileText, Trash2, Pencil, X, Eye
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export default function Clients() {
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [openMenu, setOpenMenu] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [editingClient, setEditingClient] = useState(null)
    const [expandedClient, setExpandedClient] = useState(null)
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
    const { user } = useAuthStore()

    useEffect(() => { fetchClients() }, [user])

    async function fetchClients() {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            setClients(data || [])
        } catch (err) {
            console.error('Error fetching clients:', err)
        } finally {
            setLoading(false)
        }
    }

    async function saveClient() {
        if (!form.name.trim()) return alert('Client name is required.')
        try {
            if (editingClient) {
                const { error } = await supabase
                    .from('clients')
                    .update({ name: form.name, email: form.email, phone: form.phone, address: form.address })
                    .eq('id', editingClient.id)
                if (error) throw error
                setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...form } : c))
            } else {
                const { data, error } = await supabase
                    .from('clients')
                    .insert({ user_id: user.id, name: form.name, email: form.email, phone: form.phone, address: form.address })
                    .select().single()
                if (error) throw error
                setClients(prev => [data, ...prev])
            }
            closeModal()
        } catch (err) {
            console.error('Save error:', err)
            alert('Failed to save client.')
        }
    }

    async function deleteClient(id) {
        if (!confirm('Delete this client? This will not delete their invoices.')) return
        try {
            const { error } = await supabase.from('clients').delete().eq('id', id)
            if (error) throw error
            setClients(prev => prev.filter(c => c.id !== id))
        } catch (err) {
            console.error('Delete error:', err)
            alert('Failed to delete client.')
        }
    }

    function openAddModal() {
        setEditingClient(null)
        setForm({ name: '', email: '', phone: '', address: '' })
        setShowModal(true)
    }

    function openEditModal(client) {
        setEditingClient(client)
        setForm({ name: client.name || '', email: client.email || '', phone: client.phone || '', address: client.address || '' })
        setShowModal(true)
        setOpenMenu(null)
    }

    function closeModal() {
        setShowModal(false)
        setEditingClient(null)
        setForm({ name: '', email: '', phone: '', address: '' })
    }

    const filtered = clients.filter(c => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q)
    })

    const inputCls = "w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-card rounded-xl border border-border animate-pulse" />
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
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Clients</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {clients.length} {clients.length === 1 ? 'client' : 'clients'} total
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" /> Add Client
                </button>
            </div>

            {/* ── Search ── */}
            <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search clients..."
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {/* ── Client Grid ── */}
            {filtered.length === 0 ? (
                <div className="bg-card rounded-2xl border border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                        {searchQuery ? 'No clients found' : 'No clients yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mb-5">
                        {searchQuery ? 'Try adjusting your search query.' : 'Add your first client to start creating invoices.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={openAddModal}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-accent transition-colors"
                        >
                            <Plus className="h-4 w-4" /> Add Client
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(client => (
                        <div key={client.id} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow group relative">
                            {/* Top row: avatar + name + actions */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-primary">
                                            {(client.name || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                                        {client.email && (
                                            <p className="text-[11px] text-muted-foreground truncate">{client.email}</p>
                                        )}
                                    </div>
                                </div>
                                {/* Actions — always visible on mobile, hover on desktop */}
                                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(client)}
                                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => deleteClient(client.id)}
                                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Contact details */}
                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                {client.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{client.phone}</span>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{client.address}</span>
                                    </div>
                                )}
                                {!client.phone && !client.address && !client.email && (
                                    <p className="text-muted-foreground/60 italic">No contact info</p>
                                )}
                            </div>

                            {/* Created date */}
                            <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-[10px] text-muted-foreground/60">
                                    Added {client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Add / Edit Modal ── */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

                    {/* Modal */}
                    <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-foreground">
                                {editingClient ? 'Edit Client' : 'Add New Client'}
                            </h3>
                            <button onClick={closeModal} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Name *</label>
                                <input className={inputCls} placeholder="Client name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
                                <input className={inputCls} type="email" placeholder="client@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone</label>
                                <input className={inputCls} placeholder="+1 (555) 123-4567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Address</label>
                                <input className={inputCls} placeholder="123 Main St, City" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button onClick={closeModal} className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors">
                                Cancel
                            </button>
                            <button onClick={saveClient} className="flex-1 h-10 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-all shadow-sm">
                                {editingClient ? 'Update Client' : 'Add Client'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}
