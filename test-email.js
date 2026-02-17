// Quick test script to invoke the Edge Function directly
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ligqlapofzlecjmqpfdg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZ3FsYXBvZnpsZWNqbXFwZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTE3NzIsImV4cCI6MjA4NjEyNzc3Mn0.AP9BN4-CUMADx6HnhKeYvEW0Xlh9RZKMdh-kV_osdEc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testEmail() {
  console.log('Testing email function with your verified email...')
  
  // Test with a simple direct call
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'vanshs2234@gmail.com',
        subject: 'Test Email from Dustbill',
        html: '<h1>🎉 Success!</h1><p>Your email system is working perfectly!</p><p>You can now send contracts and invoices.</p>'
      }
    })

    if (error) {
      console.error('❌ Error:', error)
      // Try to get response body
      if (error.context) {
        const body = await error.context.text()
        console.log('Response body:', body)
      }
    } else {
      console.log('✅ Success! Email sent to vanshs2234@gmail.com')
      console.log('Response:', data)
      console.log('\n📬 Check your Gmail inbox!')
    }
  } catch (err) {
    console.error('❌ Caught error:', err)
  }
}

testEmail()
