// Supabase Edge Function for sending emails
// Deploy this using: supabase functions deploy send-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Allow CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    })
  }

  let emailLogId = null
  
  try {
    // Get auth header - Supabase automatically validates JWT
    const authHeader = req.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    
    const { emailLogId: logId, to, subject, html, from } = await req.json()
    emailLogId = logId

    // Initialize Supabase client with service role for database operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    let emailData
    
    // If emailLogId is provided, fetch the email details from database
    if (emailLogId) {
      const { data, error } = await supabase
        .from('email_logs')
        .select(`
          *,
          invoices (*, clients (*)),
          contracts (*, clients (*))
        `)
        .eq('id', emailLogId)
        .single()

      if (error) {
        console.error('Failed to fetch email log:', error)
        throw error
      }
      
      console.log('Email data fetched:', JSON.stringify(emailData, null, 2))
      emailData = data
    }

    // Prepare email content
    const emailTo = to || emailData?.recipient_email
    const emailSubject = subject || emailData?.subject
    // Use Resend's test email for free tier, or your verified domain
    const emailFrom = from || 'Dustbill <onboarding@resend.dev>'
    
    console.log('Sending email to:', emailTo)
    console.log('Subject:', emailSubject)
    console.log('From:', emailFrom)
    
    if (!emailTo) {
      throw new Error('No recipient email address provided')
    }
    
    // Generate HTML content based on email type
    const emailHtml = html || generateEmailHtml(emailData)

    // Send email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailFrom,
        to: emailTo,
        subject: emailSubject,
        html: emailHtml
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email')
    }

    // Update email log status
    if (emailLogId) {
      await supabase
        .from('email_logs')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', emailLogId)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        } 
      }
    )
  } catch (error) {
    console.error('Email sending error:', error)
    
    // Update email log with failure status
    if (emailLogId) {
      try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
        await supabase
          .from('email_logs')
          .update({ 
            status: 'failed',
            sent_at: new Date().toISOString()
          })
          .eq('id', emailLogId)
      } catch (updateError) {
        console.error('Failed to update email log:', updateError)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*'
        } 
      }
    )
  }
})

function generateEmailHtml(emailData) {
  const { email_type, invoices, contracts } = emailData
  const invoice = invoices
  const contract = contracts
  const client = invoice?.clients || contract?.clients
  
  const baseUrl = Deno.env.get('PUBLIC_URL') || 'http://localhost:5173'
  
  const invoiceUrl = invoice?.share_token 
    ? `${baseUrl}/invoice/${invoice.share_token}`
    : null
    
  const contractUrl = contract?.share_token
    ? `${baseUrl}/contract/${contract.share_token}`
    : null

  const styles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #A582F7 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
      .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
      .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; background: #A582F7; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
      .button.success { background: #22c55e; }
      .button.danger { background: #ef4444; }
      .info-box { background: #f9fafb; border-left: 4px solid #A582F7; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
  `

  const templates = {
    'invoice_sent': `
      ${styles}
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">New Invoice from Dustbill</h1>
        </div>
        <div class="content">
          <p>Hello ${client?.name},</p>
          <p>You have received a new invoice. Please review the details below:</p>
          
          <div class="info-box">
            <strong>Invoice #:</strong> ${invoice?.id?.slice(0, 8)}<br>
            <strong>Amount:</strong> ${formatCurrency(invoice?.amount, invoice?.currency)}<br>
            <strong>Due Date:</strong> ${invoice?.due_date || 'N/A'}
          </div>
          
          <p>Please review and approve the invoice to proceed with payment.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invoiceUrl}" class="button success">Approve & Pay</a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">Or copy this link: ${invoiceUrl}</p>
        </div>
        <div class="footer">
          <p>This is an automated email from Dustbill. Please do not reply.</p>
        </div>
      </div>
    `,
    'invoice_approved': `
      ${styles}
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✅ Invoice Approved!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Great news! Your invoice has been approved by ${client?.name}.</p>
          
          <div class="info-box">
            <strong>Invoice #:</strong> ${invoice?.id?.slice(0, 8)}<br>
            <strong>Amount:</strong> ${formatCurrency(invoice?.amount, invoice?.currency)}<br>
            <strong>Client:</strong> ${client?.name}
          </div>
          
          <p>Payment is being processed and you should receive it shortly.</p>
        </div>
        <div class="footer">
          <p>Thank you for using Dustbill!</p>
        </div>
      </div>
    `,
    'invoice_rejected': `
      ${styles}
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
          <h1 style="margin: 0;">Invoice Rejected</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your invoice #${invoice?.id?.slice(0, 8)} was rejected by ${client?.name}.</p>
          
          <div class="info-box" style="border-left-color: #ef4444;">
            <strong>Rejection Reason:</strong><br>
            ${invoice?.rejection_reason || 'No reason provided'}
          </div>
          
          <p>Please review the feedback and make necessary adjustments before resubmitting.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/invoices" class="button">View All Invoices</a>
          </div>
        </div>
        <div class="footer">
          <p>Need help? Contact support at support@dustbill.app</p>
        </div>
      </div>
    `,
    'contract_sent': `
      ${styles}
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">New Contract for Review</h1>
        </div>
        <div class="content">
          <p>Hello ${client?.name},</p>
          <p>You have received a new contract from Dustbill.</p>
          
          <div class="info-box">
            <strong>Contract Title:</strong> ${contract?.title}<br>
            ${contract?.description ? `<strong>Description:</strong> ${contract?.description}<br>` : ''}
          </div>
          
          <p>Please review the contract carefully before accepting.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${contractUrl}" class="button">Review Contract</a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">Or copy this link: ${contractUrl}</p>
        </div>
        <div class="footer">
          <p>This is an automated email from Dustbill.</p>
        </div>
      </div>
    `,
    'payment_received': `
      ${styles}
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
          <h1 style="margin: 0;">💰 Payment Received!</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Excellent news! Payment has been successfully received for your invoice.</p>
          
          <div class="info-box" style="border-left-color: #22c55e;">
            <strong>Invoice #:</strong> ${invoice?.id?.slice(0, 8)}<br>
            <strong>Amount Paid:</strong> ${formatCurrency(invoice?.amount, invoice?.currency)}<br>
            <strong>Client:</strong> ${client?.name}
          </div>
          
          <p>Thank you for your business!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/invoices" class="button success">View Invoice</a>
          </div>
        </div>
        <div class="footer">
          <p>Keep up the great work!</p>
        </div>
      </div>
    `
  }

  return templates[email_type] || '<p>Notification from Dustbill</p>'
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount || 0)
}
