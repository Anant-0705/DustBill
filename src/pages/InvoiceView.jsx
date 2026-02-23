import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Download, CreditCard, XCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function InvoiceView() {
    const { token } = useParams()
    const [invoice, setInvoice] = useState(null)
    const [freelancerProfile, setFreelancerProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [isOwner, setIsOwner] = useState(false)
    const [notification, setNotification] = useState(null)

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type })
        setTimeout(() => setNotification(null), 4000)
    }

    useEffect(() => {
        async function fetchInvoice() {
            if (!token) return

            try {
                const { data, error } = await supabase
                    .from('invoices')
                    .select(`
                        *,
                        clients (name, email, address, phone)
                    `)
                    .eq('share_token', token)
                    .single()

                if (error) throw error
                setInvoice(data)

                // Check if viewer is the freelancer/owner
                const { data: { user } } = await supabase.auth.getUser()
                if (user && user.id === data.user_id) setIsOwner(true)

                // Fetch freelancer profile separately (no direct FK from invoices to profiles)
                if (data?.user_id) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('first_name, last_name, business_name, email')
                        .eq('id', data.user_id)
                        .single()
                    if (profileData) setFreelancerProfile(profileData)
                }
            } catch (error) {
            } finally {
                setLoading(false)
            }
        }

        fetchInvoice()
    }, [token])

    // Helper to escape user-provided text before interpolating into email HTML
    const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))

    const handleApprove = async () => {
        setActionLoading(true)
        try {
            const { error } = await supabase
                .from('invoices')
                .update({
                    status: 'approved',
                    approved_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', invoice.id)

            if (error) throw error

            if (freelancerProfile?.email) {
                await supabase.functions.invoke('send-email', {
                    body: {
                        to: freelancerProfile.email,
                        subject: `Invoice Approved: #${invoice.id.slice(0, 8)}`,
                        html: `<p>Your invoice <strong>#${escapeHtml(invoice.id.slice(0, 8))}</strong> has been approved by ${escapeHtml(invoice.clients?.name || 'your client')}. Payment is being processed.</p>`
                    }
                })
            }

            const approvedInvoice = { ...invoice, status: 'approved', approved_date: new Date().toISOString() }
            setInvoice(approvedInvoice)
            showNotification('Invoice approved! Redirecting to payment...')
            // Pass the fresh invoice directly to avoid stale-closure issue
            handlePayment(approvedInvoice)
        } catch (err) {
            showNotification('Failed to approve invoice. Please try again.', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async () => {
        if (!rejectionReason.trim()) return
        setActionLoading(true)
        try {
            const { error } = await supabase
                .from('invoices')
                .update({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                    rejection_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', invoice.id)

            if (error) throw error

            if (freelancerProfile?.email) {
                await supabase.functions.invoke('send-email', {
                    body: {
                        to: freelancerProfile.email,
                        subject: `Invoice Rejected: #${invoice.id.slice(0, 8)}`,
                        html: `<p>Your invoice <strong>#${escapeHtml(invoice.id.slice(0, 8))}</strong> was rejected by ${escapeHtml(invoice.clients?.name || 'your client')}.</p><p><strong>Reason:</strong> ${escapeHtml(rejectionReason)}</p>`
                    }
                })
            }

            setInvoice({ ...invoice, status: 'rejected', rejection_reason: rejectionReason, rejection_date: new Date().toISOString() })
            setShowRejectModal(false)
            showNotification('Invoice rejected. The freelancer will be notified.')
        } catch (err) {
            showNotification('Failed to reject invoice. Please try again.', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    const handlePayment = (inv = invoice) => {
        if (inv.status !== 'approved' && inv.status !== 'pending') return

        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
        if (existing) { initializeRazorpay(inv); return }

        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => initializeRazorpay(inv)
        script.onerror = () => showNotification('Failed to load payment gateway. Please try again.', 'error')
        document.body.appendChild(script)
    }

    const initializeRazorpay = async (inv = invoice) => {
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
        if (!razorpayKey) {
            showNotification('Payment gateway is not configured. Please contact support.', 'error')
            return
        }
        try {
            const options = {
                key: razorpayKey,
                amount: Math.round(parseFloat(String(inv.amount)) * 100),
                currency: inv.currency || 'USD',
                name: freelancerProfile?.business_name || 'Dustbill',
                description: `Invoice #${inv.id.slice(0, 8)}`,
                image: '/logo.png',
                handler: async function (response) {
                    await handlePaymentSuccess(response)
                },
                prefill: {
                    name: inv.clients?.name,
                    email: inv.clients?.email,
                    contact: inv.clients?.phone
                },
                notes: {
                    invoice_id: inv.id,
                    invoice_number: inv.id.slice(0, 8)
                },
                theme: { color: '#A582F7' },
                modal: { ondismiss: function() {} }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.on('payment.failed', function (response) {
                handlePaymentFailure(response)
            })
            razorpay.open()
        } catch (error) {
            showNotification('Failed to initialize payment. Please try again.', 'error')
        }
    }

    const handlePaymentSuccess = async (response) => {
        try {
            // Update invoice status to paid
            const { error: invoiceError } = await supabase
                .from('invoices')
                .update({ 
                    status: 'paid',
                    updated_at: new Date().toISOString()
                })
                .eq('id', invoice.id)

            if (invoiceError) throw invoiceError

            // Record payment
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    invoice_id: invoice.id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id || null,
                    razorpay_signature: response.razorpay_signature || null,
                    amount: invoice.amount,
                    currency: invoice.currency,
                    status: 'success',
                    payment_method: 'razorpay'
                })

            if (paymentError) throw paymentError

            // Notify freelancer directly via edge function (public clients can't insert email_logs)
            if (freelancerProfile?.email) {
                await supabase.functions.invoke('send-email', {
                    body: {
                        to: freelancerProfile.email,
                        subject: `Payment Received: Invoice #${invoice.id.slice(0, 8)}`,
                        html: `<p>Payment has been successfully received for invoice <strong>#${escapeHtml(invoice.id.slice(0, 8))}</strong> from ${escapeHtml(invoice.clients?.name || 'your client')}. Amount: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}</p>`
                    }
                })
            }

            setInvoice({ ...invoice, status: 'paid' })
            showNotification('Payment successful! Thank you.')
        } catch (err) {
            showNotification('Payment received but failed to update status. Contact support.', 'error')
        }
    }

    const handlePaymentFailure = async (response) => {
        try {
            await supabase.from('payments').insert({
                invoice_id: invoice.id,
                razorpay_payment_id: response.error.metadata?.payment_id || null,
                amount: invoice.amount,
                currency: invoice.currency,
                status: 'failed',
                payment_method: 'razorpay'
            })
        } catch (err) {
        }
        showNotification(response.error.description || 'Payment failed. Please try again.', 'error')
    }

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading invoice...</div>
    }

    if (!invoice) {
        return <div className="flex h-screen items-center justify-center">Invoice not found or expired.</div>
    }

    return (
        <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
            {/* Notification banner */}
            {notification && (
                <div className={`max-w-4xl mx-auto mb-4 rounded-xl px-4 py-3 text-sm font-medium no-print flex items-center gap-2
                    ${notification.type === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                    {notification.msg}
                </div>
            )}

            {/* Action Bar */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Invoice #{invoice.id.slice(0, 8)}</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {invoice.status === 'pending' && !isOwner ? 'Review the invoice below and approve or reject it.' : `Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        <Download className="h-4 w-4" /> Print / Save as PDF
                    </button>

                    {isOwner && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            Preview Mode — action buttons are hidden for you as the sender
                        </span>
                    )}

                    {invoice.status === 'paid' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                        </span>
                    )}
                    {invoice.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                            <XCircle className="h-3.5 w-3.5" /> Rejected
                        </span>
                    )}
                    {invoice.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                        </span>
                    )}

                    {!isOwner && invoice.status === 'pending' && (
                        <>
                            <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                                <XCircle className="h-4 w-4" /> Reject
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {actionLoading ? 'Processing...' : 'Approve & Pay'}
                            </button>
                        </>
                    )}
                    {!isOwner && invoice.status === 'approved' && (
                        <button
                            onClick={handlePayment}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                            <CreditCard className="h-4 w-4" /> Pay Now
                        </button>
                    )}
                </div>
            </div>

            {/* Invoice Card */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none" id="invoice-content">
                {/* Purple accent header strip */}
                <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600" />

                <div className="p-8 sm:p-10">
                    {/* Invoice Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 pb-8 border-b border-slate-100">
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                                {freelancerProfile?.business_name || `${freelancerProfile?.first_name ?? ''} ${freelancerProfile?.last_name ?? ''}`.trim() || 'Dustbill User'}
                            </h2>
                            {freelancerProfile?.email && (
                                <p className="text-sm text-slate-500 mt-1">{freelancerProfile.email}</p>
                            )}
                        </div>
                        <div className="sm:text-right">
                            <div className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-2 mb-3">
                                <span className="text-xs font-semibold text-violet-500 uppercase tracking-wider">Invoice</span>
                                <span className="text-sm font-bold text-violet-700">#{invoice.id.slice(0, 8)}</span>
                            </div>
                            <div className="space-y-1 text-sm text-slate-500">
                                <div className="flex sm:justify-end gap-2">
                                    <span className="font-medium text-slate-700">Issued:</span>
                                    <span>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</span>
                                </div>
                                {invoice.due_date && (
                                    <div className="flex sm:justify-end gap-2">
                                        <span className="font-medium text-slate-700">Due:</span>
                                        <span>{format(new Date(invoice.due_date), 'MMM d, yyyy')}</span>
                                    </div>
                                )}
                                <div className="flex sm:justify-end gap-2 pt-1">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize
                                        ${invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                                          invoice.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                          invoice.status === 'approved' ? 'bg-blue-50 text-blue-700' :
                                          'bg-amber-50 text-amber-700'}`}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill From / Bill To */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-100">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">From</p>
                            <p className="font-semibold text-slate-800">
                                {freelancerProfile?.business_name || `${freelancerProfile?.first_name ?? ''} ${freelancerProfile?.last_name ?? ''}`.trim() || 'Dustbill User'}
                            </p>
                            {freelancerProfile?.email && <p className="text-sm text-slate-500">{freelancerProfile.email}</p>}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
                            <p className="font-semibold text-slate-800">{invoice.clients?.name}</p>
                            {invoice.clients?.email && <p className="text-sm text-slate-500">{invoice.clients.email}</p>}
                            {invoice.clients?.address && <p className="text-sm text-slate-500">{invoice.clients.address}</p>}
                            {invoice.clients?.phone && <p className="text-sm text-slate-500">{invoice.clients.phone}</p>}
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="py-8">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 rounded-xl">
                                    <th className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 px-4 py-3 rounded-l-xl">Description</th>
                                    <th className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Qty</th>
                                    <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-400 px-4 py-3">Unit Price</th>
                                    <th className="text-right text-xs font-bold uppercase tracking-wider text-slate-400 px-4 py-3 rounded-r-xl">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items?.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-50">
                                        <td className="py-4 px-4 text-slate-700 font-medium">{item.description}</td>
                                        <td className="py-4 px-4 text-center text-slate-600">{item.quantity}</td>
                                        <td className="py-4 px-4 text-right text-slate-600">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(item.rate)}
                                        </td>
                                        <td className="py-4 px-4 text-right font-semibold text-slate-800">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(item.quantity * item.rate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end pt-4">
                        <div className="w-72 space-y-2">
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>Subtotal</span>
                                <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}</span>
                            </div>
                            <div className="flex justify-between items-center border-t-2 border-slate-100 pt-3 mt-3">
                                <span className="text-base font-bold text-slate-800">Total Due</span>
                                <span className="text-xl font-extrabold text-violet-600">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer note */}
                    <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">Thank you for your business · Powered by <span className="font-semibold text-violet-400">Dustbill</span></p>
                    </div>
                </div>
            </div>

            {/* Rejection Banner */}
            {invoice.status === 'rejected' && invoice.rejection_reason && (
                <div className="max-w-4xl mx-auto mt-5 no-print">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-4">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-red-900 mb-1">Rejection Reason</h4>
                            <p className="text-sm text-red-800">{invoice.rejection_reason}</p>
                            {invoice.rejection_date && (
                                <p className="text-xs text-red-500 mt-2">
                                    Rejected on {format(new Date(invoice.rejection_date), 'MMM d, yyyy')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Reject Invoice</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Please provide a reason for rejection. This will be shared with the sender.
                        </p>
                        <textarea
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none"
                            rows={4}
                            placeholder="Explain why you're rejecting this invoice..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading || !rejectionReason.trim()}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? 'Rejecting...' : 'Reject Invoice'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @media print {
            .no-print { display: none; }
            body { background: white; }
            #invoice-content { box-shadow: none; border: none; }
        }
      `}</style>
        </div>
    )
}
