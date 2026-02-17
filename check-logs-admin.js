import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ligqlapofzlecjmqpfdg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZ3FsYXBvZnpsZWNqbXFwZmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU1MTc3MiwiZXhwIjoyMDg2MTI3NzcyfQ.ZGCzy4E51uX0wZ3D3nX9cC_sZLhyUVRbi56G3eP9gh4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkLogs() {
  console.log('Checking email logs (with service role)...\n')
  
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error fetching logs:', error)
    return
  }
  
  if (data.length === 0) {
    console.log('No email logs found in database.')
    return
  }
  
  console.log(`Latest ${data.length} email logs:`)
  data.forEach((log, i) => {
    console.log(`\n${i + 1}. Email Log:`)
    console.log(`   ID: ${log.id}`)
    console.log(`   Type: ${log.email_type}`)
    console.log(`   Status: ${log.status}`)
    console.log(`   To: ${log.recipient_email}`)
    console.log(`   Sent at: ${log.sent_at}`)
    if (log.invoice_id) console.log(`   Invoice ID: ${log.invoice_id}`)
    if (log.contract_id) console.log(`   Contract ID: ${log.contract_id}`)
  })
}

checkLogs()
