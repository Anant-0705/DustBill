// Supabase Edge Function for sending emails
// Deploy this using: supabase functions deploy send-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  // Allow CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Early check: ensure all required secrets are present
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY secret is not set in Supabase Edge Function secrets')
    return new Response(
      JSON.stringify({ success: false, error: 'RESEND_API_KEY is not configured. Set it in Supabase Dashboard → Edge Functions → Manage secrets.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY secret is not set')
    return new Response(
      JSON.stringify({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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
          invoices (*, clients (*), user_id),
          contracts (*, clients (*), user_id)
        `)
        .eq('id', emailLogId)
        .single()

      if (error) {
        console.error('Failed to fetch email log:', error)
        throw error
      }
      
      emailData = data
      console.log('Email data fetched:', JSON.stringify(emailData, null, 2))
      
      // For freelancer-bound emails (approved, rejected, payment_received), 
      // fetch the freelancer's email from auth.users
      const freelancerEmailTypes = ['invoice_approved', 'invoice_rejected', 'payment_received']
      if (freelancerEmailTypes.includes(emailData.email_type)) {
        const userId = emailData.invoices?.user_id || emailData.contracts?.user_id
        if (userId) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
          if (!userError && userData?.user?.email) {
            emailData.freelancer_email = userData.user.email
            // Override recipient email to use actual freelancer email
            emailData.recipient_email = userData.user.email
          }
        }
      }
    }

    // Prepare email content
    const emailTo = to || emailData?.recipient_email
    const emailSubject = subject || emailData?.subject
    // Use verified custom domain
    const emailFrom = from || 'Dustbill <no-reply@dustbill.com>'
    
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
    console.log('Resend API response status:', response.status)
    console.log('Resend API response:', JSON.stringify(result))

    if (!response.ok) {
      const resendError = result.message || result.name || JSON.stringify(result)
      console.error('Resend API error:', resendError)
      throw new Error(`Resend API error (${response.status}): ${resendError}`)
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateEmailHtml(emailData) {
  const { email_type, invoices, contracts } = emailData
  const invoice = invoices
  const contract = contracts
  const client = invoice?.clients || contract?.clients
  
  const baseUrl = Deno.env.get('PUBLIC_URL') || 'https://dust-bill.vercel.app'
  
  const invoiceUrl = invoice?.share_token 
    ? `${baseUrl}/invoice/${invoice.share_token}`
    : null
    
  const contractUrl = contract?.share_token
    ? `${baseUrl}/contract/${contract.share_token}`
    : null

  // Shared wrapper & base styles
  const wrap = (accentColor: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Dustbill Notification</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Logo / Brand bar -->
        <tr>
          <td style="padding:0 0 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;">
                  <span style="font-size:22px;font-weight:800;color:#7c3aed;letter-spacing:-0.5px;">Dust<span style="color:#a78bfa;">bill</span></span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
            <!-- Accent strip -->
            <div style="height:5px;background:linear-gradient(90deg,${accentColor});"></div>
            <!-- Body -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:36px 40px 32px;">
                ${content}
              </td></tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0 0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Dustbill · <a href="${baseUrl}" style="color:#a78bfa;text-decoration:none;">dust-bill.vercel.app</a></p>
            <p style="margin:4px 0 0;font-size:12px;color:#cbd5e1;">This is an automated notification. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const badge = (label: string, color: string) =>
    `<span style="display:inline-block;padding:3px 10px;border-radius:20px;background:${color}15;color:${color};font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${label}</span>`

  const infoRow = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:130px;">${label}</td><td style="padding:8px 0;color:#1e293b;font-size:14px;font-weight:600;">${value}</td></tr>`

  const ctaButton = (text: string, href: string, bg: string) =>
    `<a href="${href}" style="display:inline-block;padding:14px 32px;background:${bg};color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px;">${text}</a>`

  const templates: Record<string, string> = {

    'invoice_sent': wrap('#7c3aed, #a78bfa', `
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;">New Invoice</p>
      <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#0f172a;">You have a new invoice</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;">Hi <strong>${client?.name || 'there'}</strong>, <strong>${invoice?.user_id ? 'your service provider' : 'someone'}</strong> has sent you an invoice via Dustbill. Please review the details below.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        ${infoRow('Invoice #', invoice?.id?.slice(0, 8) || '—')}
        ${infoRow('Amount Due', formatCurrency(invoice?.amount, invoice?.currency))}
        ${infoRow('Due Date', invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : 'Not specified')}
        ${infoRow('Status', badge('Pending Approval', '#f59e0b'))}
      </table>

      <div style="text-align:center;margin:0 0 24px;">
        ${ctaButton('Review & Approve Invoice →', invoiceUrl || '#', '#7c3aed')}
      </div>
      <p style="text-align:center;font-size:13px;color:#94a3b8;margin:0;">Or copy this link: <a href="${invoiceUrl}" style="color:#7c3aed;">${invoiceUrl}</a></p>
    `),

    'invoice_approved': wrap('#059669, #34d399', `
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1px;">Invoice Approved</p>
      <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#0f172a;">Your invoice was approved!</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;">Great news — <strong>${client?.name || 'your client'}</strong> has approved your invoice. Payment is being processed.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        ${infoRow('Invoice #', invoice?.id?.slice(0, 8) || '—')}
        ${infoRow('Amount', formatCurrency(invoice?.amount, invoice?.currency))}
        ${infoRow('Client', client?.name || '—')}
        ${infoRow('Status', badge('Approved', '#059669'))}
      </table>

      <div style="text-align:center;">
        ${ctaButton('View Invoice', `${baseUrl}/invoices`, '#059669')}
      </div>
    `),

    'invoice_rejected': wrap('#dc2626, #f87171', `
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:1px;">Invoice Rejected</p>
      <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#0f172a;">Invoice was rejected</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;"><strong>${client?.name || 'Your client'}</strong> has rejected invoice <strong>#${invoice?.id?.slice(0, 8)}</strong>. Please review their feedback below.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        ${infoRow('Invoice #', invoice?.id?.slice(0, 8) || '—')}
        ${infoRow('Client', client?.name || '—')}
        ${infoRow('Status', badge('Rejected', '#dc2626'))}
        ${infoRow('Reason', invoice?.rejection_reason || 'No reason provided')}
      </table>

      <div style="text-align:center;">
        ${ctaButton('View All Invoices', `${baseUrl}/invoices`, '#dc2626')}
      </div>
    `),

    'contract_sent': wrap('#7c3aed, #a78bfa', `
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;">New Contract</p>
      <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#0f172a;">You have a contract to review</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;">Hi <strong>${client?.name || 'there'}</strong>, a new contract has been shared with you. Please review it carefully before accepting.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        ${infoRow('Contract', contract?.title || '—')}
        ${contract?.description ? infoRow('Description', contract.description) : ''}
        ${infoRow('Status', badge('Awaiting Review', '#f59e0b'))}
      </table>

      <div style="text-align:center;margin:0 0 24px;">
        ${ctaButton('Review Contract →', contractUrl || '#', '#7c3aed')}
      </div>
      <p style="text-align:center;font-size:13px;color:#94a3b8;margin:0;">Or copy: <a href="${contractUrl}" style="color:#7c3aed;">${contractUrl}</a></p>
    `),

    'payment_received': wrap('#059669, #34d399', `
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1px;">Payment Received</p>
      <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;color:#0f172a;">Payment successfully received!</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;">Payment from <strong>${client?.name || 'your client'}</strong> has been received for invoice <strong>#${invoice?.id?.slice(0, 8)}</strong>.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        ${infoRow('Invoice #', invoice?.id?.slice(0, 8) || '—')}
        ${infoRow('Amount Paid', formatCurrency(invoice?.amount, invoice?.currency))}
        ${infoRow('Client', client?.name || '—')}
        ${infoRow('Status', badge('Paid', '#059669'))}
      </table>

      <div style="text-align:center;">
        ${ctaButton('View Invoice', `${baseUrl}/invoices`, '#059669')}
      </div>
    `)
  }

  return templates[email_type] || wrap('#7c3aed, #a78bfa', `<p style="color:#475569;">You have a new notification from Dustbill.</p>`)
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount || 0)
}
