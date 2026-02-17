import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ligqlapofzlecjmqpfdg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZ3FsYXBvZnpsZWNqbXFwZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTE3NzIsImV4cCI6MjA4NjEyNzc3Mn0.AP9BN4-CUMADx6HnhKeYvEW0Xlh9RZKMdh-kV_osdEc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLogs() {
  console.log('Checking email logs...\n')
  
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error fetching logs:', error)
    return
  }
  
  console.log('Latest 5 email logs:')
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
