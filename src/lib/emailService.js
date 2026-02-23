import { supabase } from './supabase'

/**
 * Email service utility for sending notifications
 * This is a client-side interface that logs emails to the database
 * Actual email sending should be handled by Supabase Edge Functions
 */

export const emailService = {
    /**
     * Send invoice notification email to client
     */
    async sendInvoiceEmail(invoice, type = 'invoice_sent') {
        try {
            const { data, error } = await supabase.from('email_logs').insert({
                invoice_id: invoice.id,
                recipient_email: invoice.clients?.email,
                email_type: type,
                subject: getEmailSubject(type, invoice),
                status: 'pending'
            }).select().single()

            if (error) throw error

            // Trigger Edge Function to send the email
            const { data: functionResult, error: functionError } = await supabase.functions.invoke('send-email', { 
                body: { emailLogId: data.id } 
            })
            
            if (functionError) {
                let details = functionError.message || 'Unknown error'
                try {
                    if (functionError.context) {
                        const body = await functionError.context.json()
                        details = body.error || body.details || details
                    }
                } catch (_) {}
                console.error('Edge Function error:', details)
                await supabase.from('email_logs').update({ status: 'failed' }).eq('id', data.id)
                throw new Error(details)
            }
            
            return { success: true, data }
        } catch (error) {
            console.error('Email service error:', error)
            return { success: false, error }
        }
    },

    /**
     * Send contract notification email to client
     */
    async sendContractEmail(contract, type = 'contract_sent') {
        try {
            const { data, error } = await supabase.from('email_logs').insert({
                contract_id: contract.id,
                recipient_email: contract.clients?.email,
                email_type: type,
                subject: getEmailSubject(type, contract),
                status: 'pending'
            }).select().single()

            if (error) throw error

            // Trigger Edge Function to send the email
            const { data: functionResult, error: functionError } = await supabase.functions.invoke('send-email', { 
                body: { emailLogId: data.id } 
            })
            
            if (functionError) {
                let details = functionError.message || 'Unknown error'
                try {
                    if (functionError.context) {
                        const body = await functionError.context.json()
                        details = body.error || body.details || details
                    }
                } catch (_) {}
                console.error('Edge Function error:', details)
                await supabase.from('email_logs').update({ status: 'failed' }).eq('id', data.id)
                throw new Error(details)
            }
            
            return { success: true, data }
        } catch (error) {
            console.error('Email service error:', error)
            return { success: false, error }
        }
    },

    /**
     * Send payment confirmation email
     */
    async sendPaymentConfirmation(invoice) {
        return this.sendInvoiceEmail(invoice, 'payment_received')
    },

    /**
     * Notify freelancer of invoice approval
     */
    async notifyInvoiceApproved(invoice, freelancerEmail) {
        try {
            const { data, error } = await supabase.from('email_logs').insert({
                invoice_id: invoice.id,
                recipient_email: freelancerEmail,
                email_type: 'invoice_approved',
                subject: `Invoice Approved: #${invoice.id?.slice(0, 8)}`,
                status: 'pending'
            }).select().single()

            if (error) throw error
            
            // Trigger Edge Function to send the email
            await supabase.functions.invoke('send-email', { body: { emailLogId: data.id } })
            
            return { success: true, data }
        } catch (error) {
            console.error('Email service error:', error)
            return { success: false, error }
        }
    },

    /**
     * Notify freelancer of invoice rejection
     */
    async notifyInvoiceRejected(invoice, freelancerEmail, rejectionReason) {
        try {
            const { data, error } = await supabase.from('email_logs').insert({
                invoice_id: invoice.id,
                recipient_email: freelancerEmail,
                email_type: 'invoice_rejected',
                subject: `Invoice Rejected: #${invoice.id?.slice(0, 8)} - ${rejectionReason}`,
                status: 'pending'
            }).select().single()

            if (error) throw error
            
            // Trigger Edge Function to send the email
            await supabase.functions.invoke('send-email', { body: { emailLogId: data.id } })
            
            return { success: true, data }
        } catch (error) {
            console.error('Email service error:', error)
            return { success: false, error }
        }
    }
}

/**
 * Generate email subject based on type
 */
function getEmailSubject(type, item) {
    const id = item.id?.slice(0, 8) || 'XXXXXX'
    
    const subjects = {
        'invoice_sent': `New Invoice #${id} - Please Review`,
        'invoice_approved': `Invoice #${id} Approved`,
        'invoice_rejected': `Invoice #${id} Rejected`,
        'contract_sent': `New Contract: ${item.title} - Please Review`,
        'contract_accepted': `Contract Accepted: ${item.title}`,
        'contract_rejected': `Contract Rejected: ${item.title}`,
        'payment_received': `Payment Received for Invoice #${id}`,
    }

    return subjects[type] || 'Notification from Dustbill'
}

/**
 * Generate email body/content
 * This would be used by the Edge Function to create the actual email
 */
export function generateEmailContent(type, data) {
    const { invoice, contract, client, freelancer, rejectionReason, approveUrl, rejectUrl, payUrl } = data

    const templates = {
        'invoice_sent': `
            <h2>New Invoice Received</h2>
            <p>Hello ${client?.name},</p>
            <p>You have received a new invoice from ${freelancer?.name}.</p>
            <p><strong>Invoice #:</strong> ${invoice?.id?.slice(0, 8)}</p>
            <p><strong>Amount:</strong> ${formatCurrency(invoice?.amount, invoice?.currency)}</p>
            <p><strong>Due Date:</strong> ${invoice?.due_date || 'N/A'}</p>
            <div style="margin: 30px 0;">
                <a href="${approveUrl}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-right: 10px;">Approve & Pay</a>
                <a href="${rejectUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Reject</a>
            </div>
            <p>Or view the invoice: <a href="${approveUrl}">${approveUrl}</a></p>
        `,
        'invoice_approved': `
            <h2>Invoice Approved</h2>
            <p>Hello ${freelancer?.name},</p>
            <p>Good news! Your invoice #${invoice?.id?.slice(0, 8)} has been approved by ${client?.name}.</p>
            <p>Payment is being processed.</p>
        `,
        'invoice_rejected': `
            <h2>Invoice Rejected</h2>
            <p>Hello ${freelancer?.name},</p>
            <p>Your invoice #${invoice?.id?.slice(0, 8)} was rejected by ${client?.name}.</p>
            <p><strong>Reason:</strong> ${rejectionReason}</p>
            <p>Please review the feedback and make necessary adjustments.</p>
        `,
        'contract_sent': `
            <h2>New Contract for Review</h2>
            <p>Hello ${client?.name},</p>
            <p>You have received a new contract from ${freelancer?.name}.</p>
            <p><strong>Contract:</strong> ${contract?.title}</p>
            <p>${contract?.description || ''}</p>
            <div style="margin: 30px 0;">
                <a href="${approveUrl}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-right: 10px;">Accept Contract</a>
                <a href="${rejectUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Reject</a>
            </div>
        `,
        'payment_received': `
            <h2>Payment Received</h2>
            <p>Hello ${freelancer?.name},</p>
            <p>Great news! Payment has been received for invoice #${invoice?.id?.slice(0, 8)}.</p>
            <p><strong>Amount:</strong> ${formatCurrency(invoice?.amount, invoice?.currency)}</p>
            <p>Thank you for your business!</p>
        `
    }

    return templates[type] || '<p>Notification from Dustbill</p>'
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount)
}
