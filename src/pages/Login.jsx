import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const { setSession, setUser } = useAuthStore()

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError(null)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/dashboard` },
            })
            if (error) throw error
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            setSession(data.session)
            setUser(data.user)
            navigate('/dashboard')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const inputCls = "w-full h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Left panel — branding (hidden on small screens) */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#A582F7] to-[#7c3aed] flex-col justify-between p-12 text-white">
                <div>
                    <h1 className="text-3xl font-bold">Dustbill</h1>
                    <p className="text-white/70 mt-1 text-sm">Invoicing for freelancers</p>
                </div>
                <div className="space-y-6">
                    {[
                        { title: 'Create professional invoices', desc: 'Beautiful, branded invoices in seconds.' },
                        { title: 'Get paid faster', desc: 'Clients approve & pay directly via link.' },
                        { title: 'Track everything', desc: 'Revenue, clients, contracts — all in one place.' },
                    ].map((f, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs font-bold">{i + 1}</span>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{f.title}</p>
                                <p className="text-white/60 text-xs mt-0.5">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-white/40 text-xs">© 2026 Dustbill. All rights reserved.</p>
            </div>

            {/* Right panel — form */}
            <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="md:hidden mb-8 text-center">
                        <h1 className="text-2xl font-bold" style={{ color: '#A582F7' }}>Dustbill</h1>
                        <p className="text-sm text-muted-foreground mt-1">Invoicing for freelancers</p>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            Sign in to continue to your dashboard
                        </p>
                    </div>

                    {/* Google OAuth */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full h-11 rounded-xl border border-border bg-background flex items-center justify-center gap-3 text-sm font-semibold text-foreground hover:bg-muted transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:scale-100 mb-6"
                    >
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-background px-3 text-xs text-muted-foreground">or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email address</label>
                            <input
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className={`${inputCls} pr-11`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs font-medium text-destructive">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? 'Signing in...' : <>Sign in <ArrowRight className="h-4 w-4" /></>}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-semibold text-primary hover:underline">
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
