import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ligqlapofzlecjmqpfdg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZ3FsYXBvZnpsZWNqbXFwZmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU1MTc3MiwiZXhwIjoyMDg2MTI3NzcyfQ.ZGCzy4E51uX0wZ3D3nX9cC_sZLhyUVRbi56G3eP9gh4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkClient() {
  const clientId = '4aa87f84-e98b-4356-8c29-92f14e896466'
  
  console.log('Checking client data (with service role key)...\n')
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Client Data:')
  console.log('  ID:', data.id)
  console.log('  Name:', data.name)
  console.log('  Email:', data.email || 'NULL/EMPTY ❌')
  console.log('  Phone:', data.phone)
  console.log('  Address:', data.address)
}

checkClient()
