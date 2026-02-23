import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, FileText, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ContractView() {
    const { token } = useParams()
    const navigate = useNavigate()
    const [contract, setContract] = useState(null)
    const [freelancerProfile, setFreelancerProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [isOwner, setIsOwner] = useState(false)

    useEffect(() => {
        fetchContract()
    }, [token])

    async function fetchContract() {
        if (!token) return
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select(`
                    *,
                    clients (name, email, address, phone)
                `)
                .eq('share_token', token)
                .single()

            if (error) throw error
            setContract(data)

            // Check if viewer is the freelancer/owner
            const { data: { user } } = await supabase.auth.getUser()
            if (user && user.id === data.user_id) setIsOwner(true)

            // Fetch freelancer profile separately (no direct FK from contracts to profiles)
            if (data?.user_id) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, business_name, email')
                    .eq('id', data.user_id)
                    .single()
                if (profileData) setFreelancerProfile(profileData)
            }
        } catch (error) {
            console.error('Error fetching contract:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async () => {
        if (!confirm('Do you accept the terms of this contract?')) return
        setActionLoading(true)
        try {
            const { error } = await supabase
                .from('contracts')
                .update({
                    status: 'accepted',
                    signed_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', contract.id)

            if (error) throw error

            // Notify freelancer directly via edge function (public clients can't insert email_logs)
            await supabase.functions.invoke('send-email', {
                body: {
                    to: freelancerProfile?.email,
                    subject: `Contract Accepted: ${contract.title}`,
                    html: `<p>Your contract <strong>${contract.title}</strong> has been accepted by ${contract.clients?.name || 'your client'}.</p>`
                }
            })

            setContract({ ...contract, status: 'accepted', signed_date: new Date().toISOString() })
            alert('Contract accepted successfully! The freelancer will be notified.')
        } catch (err) {
            console.error('Error accepting contract:', err)
            alert('Failed to accept contract. Please try again.')
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection.')
            return
        }
        setActionLoading(true)
        try {
            const { error } = await supabase
                .from('contracts')
                .update({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contract.id)

            if (error) throw error

            // Notify freelancer directly via edge function (public clients can't insert email_logs)
            await supabase.functions.invoke('send-email', {
                body: {
                    to: freelancerProfile?.email,
                    subject: `Contract Rejected: ${contract.title}`,
                    html: `<p>Your contract <strong>${contract.title}</strong> was rejected by ${contract.clients?.name || 'your client'}.</p><p><strong>Reason:</strong> ${rejectionReason}</p>`
                }
            })

            setContract({ ...contract, status: 'rejected', rejection_reason: rejectionReason })
            setShowRejectModal(false)
            alert('Contract rejected. The freelancer will be notified with your feedback.')
        } catch (err) {
            console.error('Error rejecting contract:', err)
            alert('Failed to reject contract. Please try again.')
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-lg text-muted-foreground">Loading contract...</div>
            </div>
        )
    }

    if (!contract) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Contract not found</h2>
                    <p className="text-sm text-muted-foreground">This contract may have been deleted or the link is invalid.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 no-print">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            {contract.status === 'accepted' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
                                </span>
                            )}
                            {contract.status === 'rejected' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600">
                                    <XCircle className="h-3.5 w-3.5" /> Rejected
                                </span>
                            )}
                            {contract.status === 'sent' && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600">
                                    Awaiting Response
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Contract Review</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Please review the contract details below
                        </p>
                    </div>
                    {isOwner ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            Preview Mode — action buttons are hidden for you as the sender
                        </span>
                    ) : contract.status === 'sent' && (
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={actionLoading}
                                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 flex-1 sm:flex-none"
                            >
                                <XCircle className="h-4 w-4" /> Reject
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={actionLoading}
                                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm flex-1 sm:flex-none"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {actionLoading ? 'Processing...' : 'Accept Contract'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Contract Content */}
                <div className="bg-card rounded-2xl border border-border shadow-lg p-8 print:shadow-none print:border-0">
                    {/* Header */}
                    <div className="border-b border-border pb-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-bold text-foreground mb-2">{contract.title}</h2>
                                {contract.description && (
                                    <p className="text-sm text-muted-foreground">{contract.description}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Contract Date</p>
                                <p className="text-sm font-medium text-foreground">
                                    {format(new Date(contract.created_at), 'MMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="grid md:grid-cols-2 gap-8 pb-6 mb-6 border-b border-border">
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Freelancer / Service Provider</h4>
                            <p className="font-semibold text-foreground">
                                {freelancerProfile?.business_name || 
                                 `${freelancerProfile?.first_name || ''} ${freelancerProfile?.last_name || ''}`.trim() ||
                                 'Freelancer'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Client</h4>
                            <p className="font-semibold text-foreground">{contract.clients?.name}</p>
                            <p className="text-sm text-muted-foreground">{contract.clients?.email}</p>
                            {contract.clients?.address && (
                                <p className="text-sm text-muted-foreground">{contract.clients.address}</p>
                            )}
                        </div>
                    </div>

                    {/* Contract Content */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-foreground mb-4">Scope of Work</h4>
                        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                            {contract.content}
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    {contract.terms && (
                        <div className="mb-8">
                            <h4 className="text-sm font-bold text-foreground mb-4">Terms & Conditions</h4>
                            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                                {contract.terms}
                            </div>
                        </div>
                    )}

                    {/* Signature Section */}
                    <div className="pt-8 border-t border-border">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <div className="h-20 border-b-2 border-dashed border-border mb-3" />
                                <p className="text-xs text-muted-foreground font-medium">Freelancer Signature</p>
                                <p className="text-sm text-foreground">
                                    {freelancerProfile?.business_name || 
                                     `${freelancerProfile?.first_name || ''} ${freelancerProfile?.last_name || ''}`.trim()}
                                </p>
                            </div>
                            <div>
                                <div className="h-20 border-b-2 border-dashed border-border mb-3" />
                                <p className="text-xs text-muted-foreground font-medium">Client Signature</p>
                                <p className="text-sm text-foreground">{contract.clients?.name}</p>
                                {contract.signed_date && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Signed on {format(new Date(contract.signed_date), 'MMM d, yyyy')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason Display */}
                    {contract.status === 'rejected' && contract.rejection_reason && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-xs font-semibold text-red-900 uppercase tracking-wider mb-1">Rejection Reason</p>
                            <p className="text-sm text-red-800">{contract.rejection_reason}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-foreground mb-4">Reject Contract</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Please provide a reason for rejecting this contract. This will help the freelancer understand your concerns.
                        </p>
                        <textarea
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                            rows={4}
                            placeholder="Explain why you're rejecting this contract..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="h-9 px-4 rounded-lg text-sm font-medium text-foreground border border-border hover:bg-accent transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading || !rejectionReason.trim()}
                                className="h-9 px-5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Rejecting...' : 'Reject Contract'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media print {
                    .no-print { display: none; }
                    body { background: white; }
                }
            `}</style>
        </div>
    )
}
