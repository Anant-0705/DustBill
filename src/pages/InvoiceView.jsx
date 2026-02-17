import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Download, CreditCard, XCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export default function InvoiceView() {
    const { token } = useParams()
    const [invoice, setInvoice] = useState(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')

    useEffect(() => {
        async function fetchInvoice() {
            if (!token) return

            try {
                const { data, error } = await supabase
                    .from('invoices')
                    .select(`
                        *,
                        clients (name, email, address, phone),
                        profiles (first_name, last_name, business_name)
                    `)
                    .eq('share_token', token)
                    .single()

                if (error) throw error
                setInvoice(data)
            } catch (error) {
                console.error('Error fetching invoice:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchInvoice()
    }, [token])

    const handleApprove = async () => {
        if (!confirm('Do you approve this invoice and agree to proceed with payment?')) return
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

            // Log email notification
            await supabase.from('email_logs').insert({
                invoice_id: invoice.id,
                recipient_email: invoice.profiles?.business_name || 'freelancer',
                email_type: 'invoice_approved',
                subject: `Invoice Approved: #${invoice.id.slice(0, 8)}`,
                status: 'pending'
            })

            setInvoice({ ...invoice, status: 'approved', approved_date: new Date().toISOString() })
            alert('Invoice approved! Redirecting to payment...')
            // Trigger payment after approval
            setTimeout(() => handlePayment(), 1000)
        } catch (err) {
            console.error('Error approving invoice:', err)
            alert('Failed to approve invoice. Please try again.')
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
                .from('invoices')
                .update({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                    rejection_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', invoice.id)

            if (error) throw error

            // Log email notification
            await supabase.from('email_logs').insert({
                invoice_id: invoice.id,
                recipient_email: invoice.profiles?.business_name || 'freelancer',
                email_type: 'invoice_rejected',
                subject: `Invoice Rejected: #${invoice.id.slice(0, 8)}`,
                status: 'pending'
            })

            setInvoice({ ...invoice, status: 'rejected', rejection_reason: rejectionReason })
            setShowRejectModal(false)
            alert('Invoice rejected. The freelancer will be notified with your feedback.')
        } catch (err) {
            console.error('Error rejecting invoice:', err)
            alert('Failed to reject invoice. Please try again.')
        } finally {
            setActionLoading(false)
        }
    }

    const handlePayment = () => {
        // Check if invoice is approved or pending
        if (invoice.status !== 'approved' && invoice.status !== 'pending') {
            alert('This invoice cannot be paid at this time.')
            return
        }

        // Load Razorpay script
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => initializeRazorpay()
        script.onerror = () => alert('Failed to load payment gateway. Please try again later.')
        document.body.appendChild(script)
    }

    const initializeRazorpay = async () => {
        try {
            // Create Razorpay order (in production, this should be done via your backend)
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1234567890',
                amount: Math.round(invoice.amount * 100), // Amount in paise
                currency: invoice.currency || 'USD',
                name: invoice.profiles?.business_name || 'Dustbill',
                description: `Invoice #${invoice.id.slice(0, 8)}`,
                image: '/logo.png', // Optional: Add your logo
                handler: async function (response) {
                    await handlePaymentSuccess(response)
                },
                prefill: {
                    name: invoice.clients?.name,
                    email: invoice.clients?.email,
                    contact: invoice.clients?.phone
                },
                notes: {
                    invoice_id: invoice.id,
                    invoice_number: invoice.id.slice(0, 8)
                },
                theme: {
                    color: '#A582F7'
                },
                modal: {
                    ondismiss: function() {
                        console.log('Payment cancelled by user')
                    }
                }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.on('payment.failed', function (response) {
                handlePaymentFailure(response)
            })
            razorpay.open()
        } catch (error) {
            console.error('Payment initialization error:', error)
            alert('Failed to initialize payment. Please try again.')
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

            // Log email notification
            await supabase.from('email_logs').insert({
                invoice_id: invoice.id,
                recipient_email: invoice.profiles?.business_name || 'freelancer',
                email_type: 'payment_received',
                subject: `Payment Received: Invoice #${invoice.id.slice(0, 8)}`,
                status: 'pending'
            })

            setInvoice({ ...invoice, status: 'paid' })
            alert('Payment Successful! Thank you for your payment.')
        } catch (err) {
            console.error('Error updating payment:', err)
            alert('Payment received but there was an error updating the system. Please contact support.')
        }
    }

    const handlePaymentFailure = async (response) => {
        console.error('Payment failed:', response.error)
        
        // Record failed payment attempt
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
            console.error('Error recording failed payment:', err)
        }

        alert(`Payment Failed: ${response.error.description || 'Please try again or contact support.'}`)
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex justify-between items-center no-print">
                    <div>
                        <h1 className="text-2xl font-bold">Invoice #{invoice.id.slice(0, 8)}</h1>
                        {invoice.status === 'pending' && (
                            <p className="text-sm text-muted-foreground mt-1">Please review and approve this invoice to proceed with payment</p>
                        )}
                    </div>
                    <div className="space-x-2 flex items-center">
                        <Button variant="outline" onClick={handlePrint}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                        
                        {/* Show status badges */}
                        {invoice.status === 'paid' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
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
                        
                        {/* Action buttons for pending invoices */}
                        {invoice.status === 'pending' && (
                            <>
                                <Button 
                                    variant="destructive" 
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={actionLoading}
                                >
                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                </Button>
                                <Button 
                                    onClick={handleApprove}
                                    disabled={actionLoading}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {actionLoading ? 'Processing...' : 'Approve & Pay'}
                                </Button>
                            </>
                        )}
                        
                        {/* Pay button for approved invoices */}
                        {invoice.status === 'approved' && (
                            <Button onClick={handlePayment}>
                                <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                            </Button>
                        )}
                    </div>
                </div>

                <Card className="p-8 bg-white shadow-lg print:shadow-none print:border-0" id="invoice-content">
                    <div className="flex justify-between items-start border-b pb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{invoice.profiles?.business_name || 'Dustbill User'}</h2>
                            <p className="text-gray-500">{invoice.profiles?.email}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-lg font-medium text-gray-900">Invoice</h3>
                            <p className="text-gray-500">#{invoice.id.slice(0, 8)}</p>
                            <p className="text-gray-500">Date: {format(new Date(invoice.created_at), 'MMM d, yyyy')}</p>
                            {invoice.due_date && <p className="text-gray-500">Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 py-8 border-b">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Bill To</h4>
                            <p className="mt-2 font-medium text-gray-900">{invoice.clients?.name}</p>
                            <p className="text-gray-500">{invoice.clients?.email}</p>
                            {invoice.clients?.address && <p className="text-gray-500">{invoice.clients.address}</p>}
                        </div>
                    </div>

                    <div className="py-8">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm font-medium text-gray-500">
                                    <th className="pb-4">Description</th>
                                    <th className="pb-4 text-right">Qty</th>
                                    <th className="pb-4 text-right">Price</th>
                                    <th className="pb-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoice.items?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-4">{item.description}</td>
                                        <td className="py-4 text-right">{item.quantity}</td>
                                        <td className="py-4 text-right">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(item.rate)}
                                        </td>
                                        <td className="py-4 text-right font-medium">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(item.quantity * item.rate)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-8 border-t">
                        <div className="w-64 space-y-4">
                            <div className="flex justify-between border-t pt-4">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-bold text-lg">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.amount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Rejection Reason Display */}
                {invoice.status === 'rejected' && invoice.rejection_reason && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-red-900 mb-1">Rejection Reason</h4>
                                    <p className="text-sm text-red-800">{invoice.rejection_reason}</p>
                                    {invoice.rejection_date && (
                                        <p className="text-xs text-red-600 mt-2">
                                            Rejected on {format(new Date(invoice.rejection_date), 'MMM d, yyyy')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Reject Invoice</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Please provide a reason for rejecting this invoice. This will help the freelancer understand your concerns.
                        </p>
                        <textarea
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                            rows={4}
                            placeholder="Explain why you're rejecting this invoice..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={actionLoading || !rejectionReason.trim()}
                            >
                                {actionLoading ? 'Rejecting...' : 'Reject Invoice'}
                            </Button>
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
