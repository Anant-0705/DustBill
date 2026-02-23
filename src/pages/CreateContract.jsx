import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Save, ArrowLeft, Eye, EyeOff, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { emailService } from '../lib/emailService'

export default function CreateContract() {
    const navigate = useNavigate()
    const location = useLocation()
    const editContract = location.state?.editContract || null
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [showPreview, setShowPreview] = useState(true)
    const [formError, setFormError] = useState('')
    const [clients, setClients] = useState([])

    const [formData, setFormData] = useState({
        title: editContract?.title || '',
        description: editContract?.description || '',
        client_id: editContract?.client_id || '',
        content: editContract?.content || '',
        terms: editContract?.terms || `1. Payment Terms: Payment is due within 30 days of invoice date.
2. Scope of Work: As detailed in the project description above.
3. Revisions: Up to 2 rounds of revisions included in the quoted price.
4. Termination: Either party may terminate with 14 days written notice.
5. Confidentiality: Both parties agree to maintain confidentiality of proprietary information.
6. Intellectual Property: Upon full payment, all rights transfer to the client.`,
    })

    // Scroll-hide header
    const [headerVisible, setHeaderVisible] = useState(true)
    const lastScrollY = useRef(0)
    const mainRef = useRef(null)

    useEffect(() => {
        const scrollEl = mainRef.current?.closest('main') || window
        const handleScroll = () => {
            const currentY = scrollEl === window ? window.scrollY : scrollEl.scrollTop
            if (currentY > lastScrollY.current && currentY > 60) {
                setHeaderVisible(false)
            } else {
                setHeaderVisible(true)
            }
            lastScrollY.current = currentY
        }
        scrollEl.addEventListener('scroll', handleScroll, { passive: true })
        return () => scrollEl.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        fetchClients()
    }, [user])

    async function fetchClients() {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id)
                .order('name')
            if (error) throw error
            setClients(data || [])
        } catch (err) {
            // clients list is optional — fail silently
        }
    }

    const handleSubmit = async (status = 'draft') => {
        if (!user) return
        if (!formData.title.trim()) return setFormError('Contract title is required.')
        if (!formData.client_id) return setFormError('Please select a client.')
        if (!formData.content.trim()) return setFormError('Contract content is required.')
        setFormError('')

        setLoading(true)
        try {
            let contractData
            if (editContract?.id) {
                // Update existing contract
                const { data, error } = await supabase
                    .from('contracts')
                    .update({
                        title: formData.title,
                        description: formData.description,
                        client_id: formData.client_id,
                        content: formData.content,
                        terms: formData.terms,
                        status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editContract.id)
                    .select('*, clients (name, email)')
                    .single()
                if (error) throw error
                contractData = data
            } else {
                // Create new contract
                const { data, error } = await supabase
                    .from('contracts')
                    .insert({
                        user_id: user.id,
                        title: formData.title,
                        description: formData.description,
                        client_id: formData.client_id,
                        content: formData.content,
                        terms: formData.terms,
                        status,
                        share_token: crypto.randomUUID()
                    })
                    .select('*, clients (name, email)')
                    .single()
                if (error) throw error
                contractData = data
            }

            // Send email if status is 'sent'
            if (status === 'sent' && contractData) {
                await emailService.sendContractEmail(contractData, 'contract_sent')
            }

            navigate('/contracts')
        } catch (error) {
            setFormError('Failed to save contract. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const inputCls = "w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
    const labelCls = "block text-xs font-semibold text-muted-foreground mb-1.5"
    const cardCls = "bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm"
    const textareaCls = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"

    return (
        <div ref={mainRef} className="-m-8 min-h-screen bg-background text-foreground">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-6">
                {/* ── Top header bar ── */}
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
                        {formError && (
                            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700">
                                {formError}
                            </div>
                        )}
                        {/* Row 1: back + title + desktop actions */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    onClick={() => navigate('/contracts')}
                                    aria-label="Back to contracts"
                                    className="h-8 w-8 shrink-0 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                                </button>
                                <h1 className="text-base font-bold text-foreground truncate">{editContract ? 'Edit Contract' : 'Create Contract'}</h1>
                            </div>
                            {/* Desktop buttons */}
                            <div className="hidden lg:flex items-center gap-2 shrink-0">
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
                                    onClick={() => handleSubmit('sent')}
                                    disabled={loading}
                                    className="h-8 px-5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 shadow-md"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    {loading ? 'Saving...' : 'Save & Send'}
                                </button>
                            </div>
                            {/* Mobile: preview toggle icon */}
                            <div className="flex lg:hidden items-center shrink-0">
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                                    title={showPreview ? 'Hide Preview' : 'Show Preview'}
                                >
                                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
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
                                onClick={() => handleSubmit('sent')}
                                disabled={loading}
                                className="flex-1 h-9 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Send className="h-3.5 w-3.5" />
                                {loading ? 'Saving...' : 'Send Contract'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-[1fr_480px]' : ''}`}>
                    {/* ════════════ LEFT: FORM ════════════ */}
                    <div className="space-y-5">
                        {/* Basic Info */}
                        <div className={cardCls}>
                            <h3 className="text-sm font-bold text-foreground mb-4">Contract Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelCls}>Contract Title *</label>
                                    <input
                                        className={inputCls}
                                        placeholder="e.g., Web Development Agreement"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Description (Optional)</label>
                                    <input
                                        className={inputCls}
                                        placeholder="Brief description of the contract"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Client *</label>
                                    <select
                                        className={inputCls}
                                        value={formData.client_id}
                                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                    >
                                        <option value="">Select a client</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                    {clients.length === 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            No clients found. <button onClick={() => navigate('/clients')} className="text-primary hover:underline">Add a client first</button>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contract Content */}
                        <div className={cardCls}>
                            <h3 className="text-sm font-bold text-foreground mb-4">Contract Content *</h3>
                            <textarea
                                className={textareaCls}
                                rows={12}
                                placeholder="Describe the project scope, deliverables, timeline, and any other relevant details..."
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
                        </div>

                        {/* Terms & Conditions */}
                        <div className={cardCls}>
                            <h3 className="text-sm font-bold text-foreground mb-4">Terms & Conditions</h3>
                            <textarea
                                className={textareaCls}
                                rows={10}
                                placeholder="Enter terms and conditions..."
                                value={formData.terms}
                                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* ════════════ RIGHT: PREVIEW ════════════ */}
                    {showPreview && (
                        <div className="lg:sticky lg:top-6 lg:self-start">
                            <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
                                <div className="bg-primary/5 border-b border-border px-6 py-3">
                                    <h3 className="text-sm font-bold text-foreground">Preview</h3>
                                </div>
                                <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                                    {/* Header */}
                                    <div className="border-b border-border pb-6">
                                        <h1 className="text-2xl font-bold text-foreground mb-2">{formData.title || 'Contract Title'}</h1>
                                        {formData.description && (
                                            <p className="text-sm text-muted-foreground">{formData.description}</p>
                                        )}
                                    </div>

                                    {/* Client Info */}
                                    {formData.client_id && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Client</h4>
                                            <p className="text-sm font-medium text-foreground">
                                                {clients.find(c => c.id === formData.client_id)?.name || 'Client Name'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {clients.find(c => c.id === formData.client_id)?.email || ''}
                                            </p>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Scope of Work</h4>
                                        <div className="text-sm text-foreground whitespace-pre-wrap">
                                            {formData.content || 'Contract content will appear here...'}
                                        </div>
                                    </div>

                                    {/* Terms */}
                                    {formData.terms && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Terms & Conditions</h4>
                                            <div className="text-sm text-foreground whitespace-pre-wrap">
                                                {formData.terms}
                                            </div>
                                        </div>
                                    )}

                                    {/* Signature placeholder */}
                                    <div className="pt-6 border-t border-border">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <div className="h-16 border-b border-dashed border-border mb-2" />
                                                <p className="text-xs text-muted-foreground">Freelancer Signature</p>
                                            </div>
                                            <div>
                                                <div className="h-16 border-b border-dashed border-border mb-2" />
                                                <p className="text-xs text-muted-foreground">Client Signature</p>
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
