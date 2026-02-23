import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        // With flowType: 'pkce', the Supabase client automatically exchanges
        // the ?code= param in the URL when getSession() is called.
        // Do NOT call exchangeCodeForSession manually — it conflicts.
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error('Auth callback error:', error.message)
                navigate('/login?error=auth_failed', { replace: true })
            } else if (session) {
                navigate('/dashboard', { replace: true })
            } else {
                // Fallback: listen for the SIGNED_IN event in case exchange is still in progress
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        subscription.unsubscribe()
                        navigate('/dashboard', { replace: true })
                    }
                })
                // Safety timeout — redirect to login if nothing happens in 5s
                setTimeout(() => {
                    subscription.unsubscribe()
                    navigate('/login?error=auth_timeout', { replace: true })
                }, 5000)
            }
        })
    }, [navigate])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Signing you in…</p>
            </div>
        </div>
    )
}
