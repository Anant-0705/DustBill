import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ligqlapofzlecjmqpfdg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZ3FsYXBvZnpsZWNqbXFwZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTE3NzIsImV4cCI6MjA4NjEyNzc3Mn0.AP9BN4-CUMADx6HnhKeYvEW0Xlh9RZKMdh-kV_osdEc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkContracts() {
  console.log('Checking contracts...\n')
  
  const { data, error } = await supabase
    .from('contracts')
    .select('id, title, status, client_id, share_token, clients (name, email)')
    .order('created_at', { ascending: false })
    .limit(3)
  
  if (error) {
    console.error('Error fetching contracts:', error)
    return
  }
  
  console.log('Latest 3 contracts:')
  data.forEach((contract, i) => {
    console.log(`\n${i + 1}. Contract:`)
    console.log(`   ID: ${contract.id}`)
    console.log(`   Title: ${contract.title}`)
    console.log(`   Status: ${contract.status}`)
    console.log(`   Client ID: ${contract.client_id || 'NULL (no client assigned!)'}`)
    console.log(`   Client Name: ${contract.clients?.name || 'N/A'}`)
    console.log(`   Client Email: ${contract.clients?.email || 'MISSING!'}`)
    console.log(`   Share Token: ${contract.share_token || 'N/A'}`)
  })
}

checkContracts()
