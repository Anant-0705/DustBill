import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        // Exchange the code in the URL for a session (PKCE flow)
        supabase.auth.exchangeCodeForSession(window.location.href).then(({ error }) => {
            if (error) {
                console.error('Auth callback error:', error.message)
                navigate('/login?error=auth_failed')
            } else {
                navigate('/dashboard', { replace: true })
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
