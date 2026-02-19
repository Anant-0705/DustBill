import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const { setSession, setUser } = useAuthStore()

    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { first_name: firstName, last_name: lastName } },
            })
            if (error) throw error
            setSession(data.session)
            setUser(data.user)
            if (data.session) {
                navigate('/dashboard')
            } else {
                alert('Check your email for a confirmation link!')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const inputCls = "w-full h-11 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Left panel — branding */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#A582F7] to-[#7c3aed] flex-col justify-between p-12 text-white">
                <div>
                    <h1 className="text-3xl font-bold">Dustbill</h1>
                    <p className="text-white/70 mt-1 text-sm">Invoicing for freelancers</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <p className="text-lg font-semibold leading-relaxed">
                        "Dustbill cut my invoicing time in half. My clients love the clean payment links."
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">A</div>
                        <div>
                            <p className="text-sm font-semibold">Anant S.</p>
                            <p className="text-white/60 text-xs">Freelance Developer</p>
                        </div>
                    </div>
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
                        <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
                        <p className="text-sm text-muted-foreground mt-1.5">
                            Start sending professional invoices today
                        </p>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="John"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Doe"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>
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
                                    autoComplete="new-password"
                                    required
                                    placeholder="Min 8 characters"
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
                            {loading ? 'Creating account...' : <>Create account <ArrowRight className="h-4 w-4" /></>}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
