import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Download, CreditCard, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export default function InvoiceView() {
    const { token } = useParams()
    const [invoice, setInvoice] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchInvoice() {
            if (!token) return

            try {
                const { data, error } = await supabase
                    .from('invoices')
                    .select(`
            *,
            clients (name, email, address, phone),
            profiles (first_name, last_name, business_name, email)
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

    const handlePayment = () => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1234567890', // Replace with valid test key if available
            amount: invoice.amount * 100, // Amount in paise
            currency: invoice.currency,
            name: invoice.profiles?.business_name || 'Dustbill User',
            description: `Invoice #${invoice.id.slice(0, 8)}`,
            handler: async function (response) {
                try {
                    await supabase
                        .from('invoices')
                        .update({ status: 'paid' })
                        .eq('id', invoice.id)

                    await supabase
                        .from('payments')
                        .insert({
                            invoice_id: invoice.id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            amount: invoice.amount,
                            status: 'success'
                        })

                    setInvoice({ ...invoice, status: 'paid' })
                    alert('Payment Successful!')
                } catch (err) {
                    console.error('Error updating payment:', err)
                    alert('Payment recorded but error updating system.')
                }
            },
            prefill: {
                name: invoice.clients?.name,
                email: invoice.clients?.email,
                contact: invoice.clients?.phone
            },
            theme: {
                color: "#3399cc"
            }
        };
        const rzp1 = new window.Razorpay(options);
        rzp1.open();
    }

    const handleReject = async () => {
        if (!confirm('Are you sure you want to reject this invoice?')) return;

        try {
            await supabase
                .from('invoices')
                .update({ status: 'rejected' })
                .eq('id', invoice.id)

            setInvoice({ ...invoice, status: 'rejected' })
        } catch (err) {
            console.error('Error rejecting invoice:', err)
            alert('Failed to reject invoice.')
        }
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
                    <h1 className="text-2xl font-bold">Invoice #{invoice.id.slice(0, 8)}</h1>
                    <div className="space-x-4">
                        <Button variant="outline" onClick={handlePrint}>
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                        {invoice.status !== 'paid' && invoice.status !== 'rejected' && (
                            <>
                                <Button variant="destructive" onClick={handleReject}>
                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                </Button>
                                <Button onClick={handlePayment}>
                                    <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                                </Button>
                            </>
                        )}
                        {invoice.status === 'paid' && (
                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Paid</span>
                        )}
                        {invoice.status === 'rejected' && (
                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">Rejected</span>
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
            </div>

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
