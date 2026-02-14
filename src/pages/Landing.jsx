import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import {
    ArrowRight, Check, Zap, BarChart3, Palette, Clock,
    FileText, Bell, ChevronRight, Mail, Phone, MapPin,
    Twitter, Github, Linkedin, Instagram
} from 'lucide-react'

/* ─── Reusable Pieces ─── */

const SectionBadge = ({ children }) => (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tracking-wide uppercase">
        {children}
    </span>
)

const CheckItem = ({ children }) => (
    <li className="flex items-start gap-3 text-[15px] text-gray-600">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-3 w-3 text-primary" />
        </span>
        {children}
    </li>
)

const FeatureCard = ({ icon: Icon, title, desc, iconColor = "text-primary" }) => (
    <div className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-1">
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 ${iconColor}`}>
            <Icon className="h-5 w-5" />
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
)

/* ─── Mockup Components ─── */

const DashboardMockup = () => (
    <div className="w-full h-full bg-white rounded-xl overflow-hidden flex flex-col text-left">
        {/* top bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">D</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">Dustbill</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-gray-100" />
                <div className="h-7 w-7 rounded-full bg-gray-100" />
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/20" />
                    <div className="h-3 w-16 rounded bg-gray-100" />
                </div>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* sidebar */}
            <div className="hidden md:flex w-44 flex-col border-r border-gray-100 p-3 gap-1">
                <div className="text-[10px] font-semibold uppercase text-gray-400 px-2 mb-1">Menu</div>
                {['Dashboard', 'Invoices', 'Clients', 'Reports', 'Settings'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${i === 1 ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}>
                        <div className={`h-3.5 w-3.5 rounded ${i === 1 ? 'bg-primary/20' : 'bg-gray-200'}`} />
                        {item}
                    </div>
                ))}
            </div>

            {/* main content */}
            <div className="flex-1 p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Invoice</h3>
                        <div className="flex gap-2 mt-1">
                            {['All Invoice', 'Paid', 'Pending', 'Overdue', 'Unpaid'].map((tab, i) => (
                                <span key={tab} className={`text-[10px] px-2 py-0.5 rounded-full ${i === 0 ? 'bg-primary text-white' : 'text-gray-400'}`}>{tab}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* table */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                {['INVOICE ID', 'CLIENT', 'EMAIL', 'START DATE', 'DUE DATE', 'AMOUNT'].map(h => (
                                    <th key={h} className="px-3 py-2 text-left font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { id: 'INV-9972', client: 'Jonnie Pay', email: 'esther@gmail.com', start: 'Jul 19, 2023', due: 'Jul 25, 2023', amount: '$1,200' },
                                { id: 'INV-9971', client: 'Jane Cooper', email: 'jane@gmail.com', start: 'Jul 18, 2023', due: 'Jul 23, 2023', amount: '$750' },
                                { id: 'INV-9970', client: 'Annette Black', email: 'annette@gmail.com', start: 'Jul 17, 2023', due: 'Jul 22, 2023', amount: '$12,000' },
                                { id: 'INV-9969', client: 'Marvin McKinney', email: 'marvin@gmail.com', start: 'Jul 16, 2023', due: 'Jul 19, 2023', amount: '$2,000' },
                                { id: 'INV-9968', client: 'Floyd Miles', email: 'floyd@gmail.com', start: 'Jul 15, 2023', due: 'Jul 20, 2023', amount: '$1,000' },
                            ].map((row) => (
                                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="px-3 py-2 font-medium text-gray-700">{row.id}</td>
                                    <td className="px-3 py-2 text-gray-600">{row.client}</td>
                                    <td className="px-3 py-2 text-gray-400">{row.email}</td>
                                    <td className="px-3 py-2 text-gray-400">{row.start}</td>
                                    <td className="px-3 py-2 text-gray-400">{row.due}</td>
                                    <td className="px-3 py-2 font-semibold text-gray-700">{row.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* right stats panel */}
            <div className="hidden lg:flex w-52 flex-col border-l border-gray-100 p-4 gap-4">
                <div>
                    <div className="text-xs text-gray-400 mb-1">August</div>
                    <div className="text-[10px] text-gray-300">120 total invoices</div>
                </div>
                {/* mini chart */}
                <div className="flex items-end gap-1 h-20">
                    {[40, 55, 30, 70, 45, 80, 60, 50].map((h, i) => (
                        <div key={i} className={`w-full rounded-t-sm ${i === 5 ? 'bg-primary' : 'bg-gray-200'}`} style={{ height: `${h}%` }} />
                    ))}
                </div>
                <div className="space-y-2">
                    {[
                        { label: 'Total Paid', color: 'bg-primary', val: '' },
                        { label: 'Total Unpaid', color: 'bg-red-400', val: '' },
                        { label: 'Total Overdue', color: 'bg-orange-400', val: '' },
                        { label: 'Total Pending', color: 'bg-yellow-400', val: '' },
                    ].map(s => (
                        <div key={s.label} className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span className={`h-2 w-2 rounded-full ${s.color}`} />
                            {s.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
)

const ReportsMockup = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-sm">
        <div className="text-xs text-gray-400 mb-1">Reports</div>
        <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">TOTAL REVENUE</div>
        <div className="text-3xl font-bold text-gray-900">$25,000<span className="text-lg text-gray-400">.90</span></div>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] text-green-600 font-medium">
            +25% since last month
        </div>
        <div className="mt-4 flex items-end gap-1 h-16">
            {[35, 50, 40, 65, 45, 70, 55, 80, 60, 50, 65, 40].map((h, i) => (
                <div key={i} className="w-full rounded-t-sm bg-primary/15 hover:bg-primary/30 transition-colors" style={{ height: `${h}%` }} />
            ))}
        </div>
    </div>
)

const InvoiceMockup = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-sm">
        <div className="flex items-center justify-between mb-4">
            <div>
                <div className="text-xs text-gray-400">Invoice</div>
                <div className="text-sm font-bold text-gray-900">#INV-0042</div>
            </div>
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-medium text-green-600">Paid</span>
        </div>
        <div className="space-y-3 border-t border-gray-100 pt-4">
            {[
                { label: 'Client', value: 'Acme Corp' },
                { label: 'Amount', value: '$2,400.00' },
                { label: 'Due Date', value: 'Aug 15, 2023' },
                { label: 'Status', value: 'Completed' },
            ].map(r => (
                <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-gray-400">{r.label}</span>
                    <span className="font-medium text-gray-700">{r.value}</span>
                </div>
            ))}
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-primary/40 via-purple-400/40 to-pink-400/40" />
    </div>
)

const CustomizationMockup = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-sm">
        <div className="text-xs text-gray-400 mb-3">Brand Colors</div>
        <div className="flex gap-2 mb-4">
            {['bg-primary', 'bg-purple-500', 'bg-pink-500', 'bg-orange-400', 'bg-green-500', 'bg-gray-800'].map((c, i) => (
                <div key={i} className={`h-8 w-8 rounded-lg ${c} ${i === 0 ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
            ))}
        </div>
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-purple-100/50 to-pink-100/50 p-4">
            <div className="h-3 w-20 rounded bg-gray-300 mb-2" />
            <div className="h-2 w-32 rounded bg-gray-200 mb-3" />
            <div className="h-2 w-24 rounded bg-gray-200" />
        </div>
    </div>
)

const TrackingMockup = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-sm">
        <div className="text-xs text-gray-400 mb-4">Invoice Timeline</div>
        <div className="space-y-0">
            {[
                { label: 'Sent', time: 'Jul 15, 10:30 AM', active: true, done: true },
                { label: 'Viewed', time: 'Jul 15, 2:15 PM', active: true, done: true },
                { label: 'Paid', time: 'Jul 16, 9:00 AM', active: true, done: true },
            ].map((step, i) => (
                <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${step.done ? 'bg-primary' : 'bg-gray-200'}`}>
                            {step.done && <Check className="h-3 w-3 text-white" />}
                        </div>
                        {i < 2 && <div className={`w-0.5 h-8 ${step.done ? 'bg-primary/30' : 'bg-gray-200'}`} />}
                    </div>
                    <div className="pb-6">
                        <div className="text-sm font-semibold text-gray-900">{step.label}</div>
                        <div className="text-[11px] text-gray-400">{step.time}</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
)

const RequestMockup = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-md">
        <div className="text-sm font-bold text-gray-900 mb-4">New Invoice Request</div>
        <div className="space-y-3">
            {['Client Name', 'Project Description', 'Amount'].map(f => (
                <div key={f}>
                    <div className="text-[11px] text-gray-400 mb-1">{f}</div>
                    <div className="h-9 rounded-lg border border-gray-200 bg-gray-50" />
                </div>
            ))}
            <div className="flex gap-3 pt-1">
                <div className="h-9 flex-1 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-semibold">Submit Request</div>
                <div className="h-9 flex-1 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium">Cancel</div>
            </div>
        </div>
    </div>
)

const ReminderMockup = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-sm">
        <div className="text-xs text-gray-400 mb-3">Upcoming Reminders</div>
        <div className="space-y-3">
            {[
                { title: 'Invoice #1042 — Due Tomorrow', desc: 'Acme Corp · $2,400', color: 'border-l-orange-400' },
                { title: 'Invoice #1038 — Overdue', desc: 'Globex Inc · $890', color: 'border-l-red-400' },
                { title: 'Invoice #1045 — Due in 3 days', desc: 'Initech · $5,200', color: 'border-l-primary' },
            ].map(r => (
                <div key={r.title} className={`rounded-lg border border-gray-100 border-l-4 ${r.color} p-3`}>
                    <div className="text-xs font-semibold text-gray-800">{r.title}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{r.desc}</div>
                </div>
            ))}
        </div>
    </div>
)

/* ─── Scroll-Animated Hero Card with Floating Layers ─── */

const FloatingCard = ({ children, className = '', delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, delay }}
        className={className}
    >
        {children}
    </motion.div>
)

const HeroCard = () => {
    const ref = useRef(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
    const rotateX = useTransform(scrollYProgress, [0, 0.5], [12, 0])
    const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1])
    const opacity = useTransform(scrollYProgress, [0, 0.3], [0.9, 1])

    return (
        <div ref={ref} className="relative mt-16 px-4 mb-[-120px]" style={{ perspective: '1200px' }}>

            {/* ── Main Dashboard (center piece) ── */}
            <motion.div
                style={{ rotateX, scale, opacity }}
                className="relative z-20 mx-auto max-w-5xl rounded-2xl bg-white p-1.5 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.3)]"
            >
                <div className="rounded-xl overflow-hidden h-[28rem] md:h-[32rem]">
                    <DashboardMockup />
                </div>
            </motion.div>

            {/* ── Floating Card: Revenue (top-left) ── */}
            <FloatingCard
                delay={0.3}
                className="absolute z-30 top-6 -left-2 md:left-4 lg:left-[2%] hidden md:block"
            >
                <div className="bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.15)] border border-gray-100 p-5 w-56 backdrop-blur-sm">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Total Revenue</div>
                    <div className="text-2xl font-bold text-gray-900">$48,250<span className="text-base text-gray-400">.00</span></div>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] text-green-600 font-medium">
                        <ArrowRight className="h-2.5 w-2.5 -rotate-45" /> +18.2% this month
                    </div>
                    <div className="mt-3 flex items-end gap-0.5 h-10">
                        {[30, 45, 35, 60, 50, 75, 55, 80, 65, 50, 70, 45].map((h, i) => (
                            <div key={i} className="w-full rounded-t-sm bg-primary/20" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>
            </FloatingCard>

            {/* ── Floating Card: Invoice Stats (top-right) ── */}
            <FloatingCard
                delay={0.45}
                className="absolute z-30 top-10 -right-2 md:right-4 lg:right-[2%] hidden md:block"
            >
                <div className="bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.15)] border border-gray-100 p-5 w-52 backdrop-blur-sm">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Invoice Status</div>
                    <div className="flex items-center gap-3">
                        {/* Mini donut chart */}
                        <div className="relative h-14 w-14 shrink-0">
                            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#A582F7" strokeWidth="4" strokeDasharray="60 28" strokeLinecap="round" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="18 70" strokeDashoffset="-60" strokeLinecap="round" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="10 78" strokeDashoffset="-78" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-gray-700">128</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            {[
                                { label: 'Paid', color: 'bg-[#A582F7]', val: '78' },
                                { label: 'Pending', color: 'bg-amber-400', val: '32' },
                                { label: 'Overdue', color: 'bg-red-400', val: '18' },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                                    {s.label} <span className="font-semibold text-gray-700">{s.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </FloatingCard>

            {/* ── Floating Card: Recent Activity (bottom-right) ── */}
            <FloatingCard
                delay={0.6}
                className="absolute z-30 bottom-[80px] -right-2 md:right-8 lg:right-[5%] hidden lg:block"
            >
                <div className="bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.15)] border border-gray-100 p-5 w-60 backdrop-blur-sm">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Recent Activity</div>
                    <div className="space-y-2.5">
                        {[
                            { text: 'Invoice #1042 paid', time: '2m ago', color: 'bg-green-400' },
                            { text: 'New client added', time: '15m ago', color: 'bg-blue-400' },
                            { text: 'Reminder sent', time: '1h ago', color: 'bg-amber-400' },
                        ].map(a => (
                            <div key={a.text} className="flex items-start gap-2.5">
                                <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${a.color}`} />
                                <div>
                                    <div className="text-[11px] font-medium text-gray-700">{a.text}</div>
                                    <div className="text-[10px] text-gray-400">{a.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </FloatingCard>

            {/* Glow underneath */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
        </div>
    )
}

/* ─── Feature Section (reusable two-col) ─── */

const FeatureSection = ({ badge, title, desc, checks, mockup, reversed = false, bgClass = "bg-white" }) => (
    <section className={`py-20 md:py-28 ${bgClass}`}>
        <div className={`mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 md:gap-20 items-center ${reversed ? '' : ''}`}>
            <motion.div
                initial={{ opacity: 0, x: reversed ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
                className={reversed ? 'md:order-2' : ''}
            >
                {badge && <SectionBadge>{badge}</SectionBadge>}
                <h2 className="mt-4 text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{title}</h2>
                <p className="mt-4 text-gray-500 leading-relaxed max-w-lg">{desc}</p>
                {checks && (
                    <ul className="mt-6 space-y-3">
                        {checks.map((c, i) => <CheckItem key={i}>{c}</CheckItem>)}
                    </ul>
                )}
            </motion.div>
            <motion.div
                initial={{ opacity: 0, x: reversed ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className={`flex ${reversed ? 'md:order-1 justify-start' : 'justify-end'}`}
            >
                {mockup}
            </motion.div>
        </div>
    </section>
)

/* ─── Main Component ─── */

export default function Landing() {
    const { user } = useAuthStore()
    const navigate = useNavigate()

    const handleCreateInvoice = () => {
        navigate(user ? '/invoices/new' : '/login')
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

            {/* ── SECTION 1: NAVBAR (transparent, merges into hero) ── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm">
                <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
                    <Link to="/" className="flex items-center gap-2">

                        <span className="font-bold text-white text-lg tracking-tight">DustBill</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        {['Features', 'Pricing', 'Resources'].map(link => (
                            <a key={link} href={`#${link.toLowerCase()}`} className="text-sm text-gray-400 hover:text-white transition-colors">{link}</a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Login</Link>
                        <Link to="/signup" className="text-sm font-semibold text-white bg-[#A582F7] hover:bg-[#A582F7]/90 px-5 py-2 rounded-full transition-colors">
                            Try it Free
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── SECTION 2: HERO (black bg + grid) ── */}
            <section className="relative bg-black pt-32 pb-10 overflow-hidden">
                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)
                        `,
                        backgroundSize: '60px 60px',
                    }}
                />
                {/* Radial fade so grid fades at edges */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 40%, black 100%)',
                    }}
                />

                {/* Colored glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#A582F7]/8 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-purple-600/6 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 mx-auto max-w-4xl text-center px-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold text-white leading-[1.1] tracking-tight"
                    >
                        Powerful Invoicing Platform{' '}
                        <br className="hidden sm:block" />
                        for Your Business
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="mt-6 text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
                    >
                        Our user-friendly invoicing platform designed to revolutionize the way you handle
                        your invoicing tasks with our intuitive interface and powerful features.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="mt-8"
                    >
                        <button
                            onClick={handleCreateInvoice}
                            className="inline-flex items-center gap-2 bg-[#A582F7] hover:bg-[#A582F7]/90 text-white font-semibold px-7 py-3.5 rounded-full text-base shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Create Invoice
                        </button>
                    </motion.div>
                </div>

                <HeroCard />
            </section>

            {/* ── SECTION 3: TRUST LOGOS ── */}
            <section className="pt-36 pb-14 border-b border-gray-100 bg-white">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-40 grayscale">
                        {['upwork', 'slack', 'PayPal', 'ClassID', 'stripe', 'Wise'].map(name => (
                            <span key={name} className="text-xl font-bold text-gray-900 tracking-wide select-none">{name}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION 4: CREATE INVOICES (custom layout) ── */}
            <section className="py-20 md:py-28 bg-gray-50/50">
                <div className="mx-auto max-w-6xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Main card */}
                        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                            <div className="grid md:grid-cols-2 items-stretch">

                                {/* Left — Text & CTA */}
                                <div className="flex flex-col justify-center p-10 md:p-14 lg:p-16">
                                    <h2 className="text-3xl md:text-[2.75rem] font-extrabold text-gray-900 leading-[1.15]">
                                        Create Invoices In<br />Seconds
                                    </h2>
                                    <p className="mt-5 text-gray-500 leading-relaxed max-w-md">
                                        Try our platform today and experience the convenience
                                        and efficiency of creating invoices in seconds with
                                        customizable templates.
                                    </p>
                                    <div className="mt-8">
                                        <button
                                            onClick={handleCreateInvoice}
                                            className="inline-flex items-center gap-2 bg-[#A582F7] hover:bg-[#b060be] text-white font-semibold px-7 py-3.5 rounded-2xl text-base shadow-lg shadow-[#A582F7]/20 transition-all hover:shadow-[#A582F7]/35 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Create Invoice
                                        </button>
                                    </div>
                                </div>

                                {/* Right — Invoice Form Mockup */}
                                <div className="bg-gray-50 p-6 md:p-8 flex items-center justify-center">
                                    <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-left">
                                        {/* Top row: logo upload + "Invoice" title */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-semibold text-gray-500">Upload your logo</div>
                                                    <div className="text-[9px] text-gray-400">240 x 240 pixels @ 72 DPI<br />Maximum size of 1MB</div>
                                                </div>
                                            </div>
                                            <div className="text-xl font-bold text-gray-900">Invoice</div>
                                        </div>

                                        {/* Company name field */}
                                        <div className="mb-1">
                                            <div className="h-8 rounded-lg border border-[#A582F7]/40 bg-white px-3 flex items-center">
                                                <span className="text-[11px] text-gray-400">Your company name</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-gray-400 mb-3">Company's address</div>

                                        {/* Billed to block (right aligned) */}
                                        <div className="text-right mb-4">
                                            <div className="text-[10px] text-gray-400">Billed to,</div>
                                            <div className="text-[10px] text-gray-500">Your client's name<br />Client's address<br />City, State ZIP<br />Country</div>
                                        </div>

                                        {/* Form fields */}
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 text-[10px]">
                                            <div>
                                                <div className="font-semibold text-gray-700">Subject</div>
                                                <div className="text-gray-400">Enter subject</div>
                                            </div>
                                            <div></div>
                                            <div>
                                                <div className="font-semibold text-gray-700">Invoice ID</div>
                                                <div className="text-gray-400">INV-Number</div>
                                            </div>
                                            <div></div>
                                            <div>
                                                <div className="font-semibold text-gray-700">Date</div>
                                                <div className="text-gray-400 flex items-center gap-1">
                                                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    DD-MM-YYYY
                                                </div>
                                            </div>
                                            <div></div>
                                            <div>
                                                <div className="font-semibold text-gray-700">Due date</div>
                                                <div className="text-gray-400 flex items-center gap-1">
                                                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    DD-MM-YYYY
                                                </div>
                                            </div>
                                        </div>

                                        {/* Line items table */}
                                        <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                                            <table className="w-full text-[9px]">
                                                <thead>
                                                    <tr className="border-b border-gray-200 bg-gray-50">
                                                        <th className="px-2 py-1.5 text-left font-semibold text-gray-600">ITEM/DESCRIPTION</th>
                                                        <th className="px-2 py-1.5 text-center font-semibold text-gray-600 w-10">QTY</th>
                                                        <th className="px-2 py-1.5 text-right font-semibold text-gray-600 w-12">RATE</th>
                                                        <th className="px-2 py-1.5 text-right font-semibold text-gray-600 w-14">AMOUNT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[1, 2].map(i => (
                                                        <tr key={i} className="border-b border-gray-100">
                                                            <td className="px-2 py-1.5 text-gray-400">Enter item name/description</td>
                                                            <td className="px-2 py-1.5 text-center text-gray-500">1</td>
                                                            <td className="px-2 py-1.5 text-right text-gray-500">$0.00</td>
                                                            <td className="px-2 py-1.5 text-right text-gray-500">$0.00</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Totals */}
                                        <div className="flex justify-end mb-2">
                                            <div className="w-40 space-y-1 text-[10px]">
                                                <div className="flex justify-between"><span className="font-semibold text-gray-600">Sub Total</span><span className="text-gray-500">$0.00</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500">GST(10%)</span><span className="text-gray-500">$1.00</span></div>
                                                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                                                    <span className="font-bold text-gray-700">Total (USD)</span>
                                                    <span className="font-bold text-[#A582F7] text-sm">$0.00</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Add item */}
                                        <div className="flex items-center gap-1 text-[10px] text-[#A582F7] font-medium mb-3 cursor-pointer">
                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#A582F7]/10 text-[#A582F7]">+</span>
                                            Add Item
                                        </div>

                                        {/* Notes & Terms */}
                                        <div className="grid grid-cols-2 gap-4 text-[10px]">
                                            <div>
                                                <div className="font-semibold text-gray-600 mb-0.5">Notes</div>
                                                <div className="text-gray-400">Add notes here</div>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-600 mb-0.5">Terms and condition</div>
                                                <div className="text-gray-400">Add your terms and condition</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Check items row below the card */}
                        <div className="mt-10 grid md:grid-cols-3 gap-6 md:gap-10">
                            {[
                                "Create one or more invoice templates",
                                "Insert your logo and set payment terms",
                                "Add a standard message or insert more fields",
                            ].map(text => (
                                <div key={text} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#A582F7]">
                                        <Check className="h-3 w-3 text-white" />
                                    </span>
                                    <span className="text-[15px] text-gray-600">{text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── SECTION 5: ANALYTICS (custom layout) ── */}
            <section className="py-20 md:py-28 bg-gray-50/50">
                <div className="mx-auto max-w-6xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Main card */}
                        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                            <div className="grid md:grid-cols-2 items-stretch">

                                {/* Left — Reports Mockup */}
                                <div className="bg-gray-50 p-6 md:p-10 flex items-center justify-center">
                                    <div className="w-full max-w-md">
                                        {/* Reports header area */}
                                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                            <div className="text-lg font-bold text-gray-900 mb-4">Reports</div>

                                            <div className="flex gap-4 items-start">
                                                {/* Left stats */}
                                                <div className="flex-1">
                                                    <div className="text-[10px] uppercase tracking-wider text-gray-400">Total Revenue</div>
                                                    <div className="text-3xl font-bold text-gray-900 mt-1">$25,000</div>
                                                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] text-green-600 font-medium">
                                                        +25% since last month
                                                    </div>
                                                </div>

                                                {/* Right panel — February */}
                                                <div className="bg-gray-50 rounded-xl p-4 w-44">
                                                    <div className="text-sm font-semibold text-gray-900">February</div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">120 total invoices</div>
                                                    <div className="mt-3">
                                                        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</div>
                                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                                            {[
                                                                { label: 'Paid', val: '30', color: 'bg-[#A582F7]' },
                                                                { label: 'Overdue', val: '25', color: 'bg-purple-300' },
                                                                { label: 'Unpaid', val: '15', color: 'bg-[#7c3aed]' },
                                                                { label: 'Pending', val: '35', color: 'bg-purple-200' },
                                                            ].map(s => (
                                                                <div key={s.label} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                                                    <span className={`h-2 w-2 rounded-full ${s.color}`} />
                                                                    {s.label} <span className="text-gray-400">{s.val}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bar chart */}
                                            <div className="mt-6">
                                                <div className="flex items-end gap-3 h-28">
                                                    {[
                                                        { month: 'Jan', bars: [35, 25, 15] },
                                                        { month: 'Feb', bars: [65, 45, 30] },
                                                        { month: 'Mar', bars: [45, 30, 20] },
                                                        { month: 'Apr', bars: [50, 35, 22] },
                                                        { month: 'May', bars: [40, 28, 18] },
                                                        { month: 'Jun', bars: [55, 38, 25] },
                                                    ].map(({ month, bars }) => (
                                                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                                                            <div className="flex gap-[2px] items-end w-full h-full">
                                                                <div className="w-full rounded-t-sm bg-purple-200 transition-all" style={{ height: `${bars[0]}%` }} />
                                                                <div className="w-full rounded-t-sm bg-[#A582F7] transition-all" style={{ height: `${bars[1]}%` }} />
                                                                <div className="w-full rounded-t-sm bg-[#7c3aed] transition-all" style={{ height: `${bars[2]}%` }} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Month labels */}
                                                <div className="flex gap-3 mt-2">
                                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                                                        <div key={m} className={`flex-1 text-center text-[10px] ${m === 'Feb' ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                                                            {m}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right — Text */}
                                <div className="flex flex-col justify-center p-10 md:p-14 lg:p-16">
                                    <h2 className="text-3xl md:text-[2.75rem] font-extrabold text-gray-900 leading-[1.15]">
                                        Analyze to Grow<br />Your Business
                                    </h2>
                                    <p className="mt-5 text-gray-500 leading-relaxed max-w-md">
                                        Ensure every incident becomes a learning opportunity.
                                        DustBill automatically captures your incident activity and
                                        include a guide.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Check items row below the card */}
                        <div className="mt-10 grid md:grid-cols-3 gap-6 md:gap-10">
                            {[
                                "Enjoy track stages and milestone of your deals.",
                                "One-click calling, call script and voicemail automation",
                                "Close more deals with single page contact management.",
                            ].map(text => (
                                <div key={text} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#A582F7]">
                                        <Check className="h-3 w-3 text-white" />
                                    </span>
                                    <span className="text-[15px] text-gray-600">{text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── SECTION 6 & 7: TWO-COL FEATURES ── */}
            <section id="features" className="py-20 md:py-28 bg-gray-50/50">
                <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-8">

                    {/* ── Left Card: Customizable Invoices ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6 }}
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10 flex flex-col"
                    >
                        <h2 className="text-3xl md:text-[2.5rem] font-extrabold text-gray-900 leading-[1.15]">
                            Create<br />Customizable<br />Invoices
                        </h2>
                        <p className="mt-4 text-gray-500 leading-relaxed max-w-sm">
                            Design your invoices to match your brand color
                            style and making you look like the professional
                            you are.
                        </p>

                        {/* Invoice preview + color picker */}
                        <div className="mt-8 relative flex-1">
                            {/* Mini invoice preview */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-left max-w-[260px]">
                                {/* Company header */}
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-6 w-6 rounded-full bg-[#A582F7]/20 flex items-center justify-center">
                                        <span className="text-[8px] text-[#A582F7] font-bold">H</span>
                                    </div>
                                    <div className="text-[11px] font-bold text-[#A582F7]">HAV Productions</div>
                                </div>
                                <div className="text-[8px] text-gray-400 mb-3">4345 Forest Avenue, New York, 10004,<br />United States</div>

                                <div className="text-[8px] text-gray-400 mb-0.5">Subject</div>
                                <div className="text-[9px] font-semibold text-gray-700 mb-2">Responsive web design</div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[8px] mb-3">
                                    <div><span className="text-gray-400">Invoice ID</span><br /><span className="font-semibold text-gray-700">INV-057</span></div>
                                    <div></div>
                                    <div><span className="text-gray-400">Date</span><br /><span className="font-semibold text-gray-700">19 July 2023</span></div>
                                    <div></div>
                                    <div><span className="text-gray-400">Due date</span><br /><span className="text-red-500 font-semibold">25 July 2023</span></div>
                                    <div></div>
                                </div>

                                {/* Mini table */}
                                <div className="border border-gray-200 rounded text-[7px] mb-2">
                                    <div className="flex border-b border-gray-100 bg-gray-50 px-2 py-1">
                                        <div className="flex-1 font-semibold text-gray-500">ITEM/DESCRIPTION</div>
                                        <div className="w-8 text-center font-semibold text-gray-500">QTY</div>
                                    </div>
                                    {['Item Name', 'Item Name'].map((item, i) => (
                                        <div key={i} className="flex border-b border-gray-50 px-2 py-1">
                                            <div className="flex-1 text-gray-500">{item}</div>
                                            <div className="w-8 text-center text-gray-500">1</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-4 text-[7px] mb-1">
                                    <span className="text-gray-500">Sub Total</span>
                                    <span className="text-gray-500">GST(10%)</span>
                                </div>
                                <div className="flex justify-end text-[7px] mb-3">
                                    <span className="font-bold text-[#A582F7]">Total ——</span>
                                </div>

                                <div className="text-[7px] text-gray-400 mb-1">Notes</div>
                                <div className="text-[7px] text-gray-400 leading-relaxed mb-3">Lorem ipsum dolor sit amet, consectetur adipiscing<br />elit. Nisi id turpis molestie odio nih.</div>

                                <div className="text-[7px] text-gray-400">Payment Details</div>
                                <div className="text-[7px] text-gray-500">Paypal: <span className="font-semibold">example@email.com</span></div>
                                <div className="text-[7px] text-gray-500">UPI: <span className="font-semibold">userid@okibank</span></div>
                            </div>

                            {/* Overlapping color picker panel */}
                            <div className="absolute top-4 right-0 md:right-2 bg-white rounded-xl border border-gray-200 shadow-lg p-4 w-44">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-bold text-gray-900">Invoice</div>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-[11px] font-semibold text-gray-700">Color</div>
                                    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </div>
                                {/* Gradient swatch */}
                                <div className="w-full h-24 rounded-lg mb-3 relative overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), transparent), linear-gradient(to right, #A582F7, #7c3aed)'
                                    }}
                                >
                                    <div className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-white shadow-md bg-[#A582F7]" />
                                </div>
                                {/* Color bar */}
                                <div className="flex gap-0.5 h-3 rounded-full overflow-hidden mb-3">
                                    {['bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-green-500', 'bg-cyan-400', 'bg-blue-500', 'bg-[#A582F7]', 'bg-pink-500'].map((c, i) => (
                                        <div key={i} className={`flex-1 ${c} ${i === 6 ? 'ring-2 ring-white ring-offset-1' : ''}`} />
                                    ))}
                                </div>
                                {/* Hex */}
                                <div className="flex items-center gap-2 text-[10px] mb-2">
                                    <span className="text-gray-500">Hex</span>
                                    <div className="h-4 w-4 rounded bg-[#A582F7]" />
                                    <span className="font-mono font-semibold text-gray-700">#A582F7</span>
                                </div>
                                {/* Visibility */}
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-gray-500">Visibility</span>
                                    <span className="font-semibold text-gray-700">100%</span>
                                    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Right Card: Real-Time Tracking ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10 flex flex-col"
                    >
                        <h2 className="text-3xl md:text-[2.5rem] font-extrabold text-gray-900 leading-[1.15]">
                            Real-Time<br />Invoice Status<br />Tracking
                        </h2>
                        <p className="mt-4 text-gray-500 leading-relaxed max-w-sm">
                            Keep track of your invoices statuses in real-time
                            so you can manage your finances more
                            effectively.
                        </p>

                        {/* Status timeline */}
                        <div className="mt-8 space-y-4 flex-1">
                            {[
                                {
                                    icon: (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    ),
                                    title: 'Invoice is created',
                                    date: 'July 19, 2023',
                                    desc: 'Invoice was created for Jennie Puy',
                                    inv: 'INV-9972',
                                },
                                {
                                    icon: (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    ),
                                    title: 'Invoice is sent',
                                    date: 'July 19, 2023',
                                    desc: 'Invoice was delivered to Jennie Puy',
                                    inv: 'INV-9972',
                                },
                                {
                                    icon: (
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    ),
                                    title: 'Invoice is viewed',
                                    date: 'July 20, 2023',
                                    desc: 'Invoice was viewed by Jennie Puy',
                                    inv: 'INV-9972',
                                },
                            ].map((item, i) => (
                                <div key={i} className="bg-gray-50 rounded-2xl p-5 flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 shrink-0 shadow-sm">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold text-gray-900">{item.title}</div>
                                            <div className="text-[11px] text-gray-400">{item.date}</div>
                                        </div>
                                        <div className="text-[12px] text-gray-500 mt-0.5">{item.desc}</div>
                                        <div className="text-[12px] text-[#A582F7] font-semibold mt-1">{item.inv}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── SECTION 8: INVOICE REQUESTS (custom layout) ── */}
            <section className="py-20 md:py-28 bg-gray-50/50">
                <div className="mx-auto max-w-6xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Main card */}
                        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                            <div className="grid md:grid-cols-2 items-stretch">

                                {/* Left — Send Invoice Mockup */}
                                <div className="bg-gray-50 p-6 md:p-10 flex items-center justify-center">
                                    <div className="w-full max-w-md relative">
                                        {/* Send Invoice panel */}
                                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-[280px]">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-base font-bold text-gray-900">Send Invoice</div>
                                                <div className="h-7 w-7 rounded-full bg-[#A582F7] flex items-center justify-center text-white text-sm font-bold">+</div>
                                            </div>

                                            {/* Search bar */}
                                            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 mb-5">
                                                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                <span className="text-[11px] text-gray-400">Search by name, email, phone</span>
                                            </div>

                                            {/* Recent invoice */}
                                            <div className="text-[11px] font-semibold text-gray-900 mb-3">Recent invoice</div>

                                            <div className="space-y-4">
                                                {[
                                                    { initials: 'AF', name: 'Albert Flores', email: 'albertfloresss@gm', inv: 'INV-9072' },
                                                    { initials: 'JP', name: 'Jennie Puy', email: 'estherhoward10@a', inv: 'INV-9972' },
                                                    { initials: 'TW', name: 'Theresa Webb', email: 'theresaw@gmail.com', inv: 'INV-3072' },
                                                ].map((person, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                                                            {person.initials}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[12px] font-semibold text-gray-900">{person.name}</div>
                                                            <div className="text-[10px] text-gray-400 truncate">{person.email}</div>
                                                            <div className="text-[10px] text-[#A582F7] font-semibold mt-0.5">{person.inv}</div>
                                                        </div>
                                                        {i === 2 && (
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <span className="text-gray-400 text-[10px]">›</span>
                                                                <span className="text-gray-400 text-base">···</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Overlapping "Send invoice to" panel */}
                                        <div className="absolute top-16 right-0 md:right-4 bg-white rounded-xl border border-gray-200 shadow-lg p-4 w-48">
                                            <div className="text-[11px] font-semibold text-gray-700 mb-3">Send invoice to</div>

                                            {/* Invoice dropdown */}
                                            <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 mb-2">
                                                <span className="text-[11px] text-[#A582F7] font-medium">INV-8900</span>
                                                <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                            </div>

                                            {/* Email field */}
                                            <div className="border border-gray-200 rounded-lg px-3 py-2 mb-3">
                                                <span className="text-[11px] text-gray-400">Enter email</span>
                                            </div>

                                            {/* Send Now button */}
                                            <button className="w-full bg-[#A582F7] hover:bg-[#b060be] text-white text-[12px] font-semibold py-2.5 rounded-lg transition-colors shadow-sm">
                                                Send Now
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right — Text */}
                                <div className="flex flex-col justify-center p-10 md:p-14 lg:p-16">
                                    <h2 className="text-3xl md:text-[2.75rem] font-extrabold text-gray-900 leading-[1.15]">
                                        Submit Invoice<br />Requests
                                    </h2>
                                    <p className="mt-5 text-gray-500 leading-relaxed max-w-md">
                                        Experience the speed and efficiency of submitting
                                        invoice requests in seconds with our user-friendly
                                        platform.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Check items row below the card */}
                        <div className="mt-10 grid md:grid-cols-3 gap-6 md:gap-10">
                            {[
                                "Makes it easy to access and track your payment statuses.",
                                "Enhance professionalism and build trust with your clients.",
                                "Remind and make sure your clients never miss a deadline.",
                            ].map(text => (
                                <div key={text} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#A582F7]">
                                        <Check className="h-3 w-3 text-white" />
                                    </span>
                                    <span className="text-[15px] text-gray-600">{text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── SECTION 9: REMINDERS (custom layout) ── */}
            <section className="py-20 md:py-28 bg-gray-50/50">
                <div className="mx-auto max-w-6xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Main card */}
                        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                            <div className="grid md:grid-cols-2 items-stretch">

                                {/* Left — Text */}
                                <div className="flex flex-col justify-center p-10 md:p-14 lg:p-16">
                                    <h2 className="text-3xl md:text-[2.75rem] font-extrabold text-gray-900 leading-[1.15]">
                                        Never Miss an<br />Invoice with Helpful<br />Reminders
                                    </h2>
                                    <p className="mt-5 text-gray-500 leading-relaxed max-w-md">
                                        Get notified when clients view your invoices. Set up
                                        automatic reminders to stop chasing unpaid invoices.
                                    </p>
                                </div>

                                {/* Right — Overlapping mockups */}
                                <div className="bg-gray-50 p-6 md:p-10 flex items-center justify-center">
                                    <div className="relative w-full max-w-sm">

                                        {/* Back panel — Send Invoice (partial) */}
                                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 w-full">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-base font-bold text-gray-900">Send Invoice</div>
                                                <div className="h-7 w-7 rounded-full bg-[#A582F7] flex items-center justify-center text-white text-sm font-bold">+</div>
                                            </div>
                                            {/* Search bar */}
                                            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 mb-4">
                                                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                <span className="text-[11px] text-gray-400">Search by name, email, phone</span>
                                            </div>

                                            {/* Spacer for overlap area */}
                                            <div className="h-28"></div>

                                            {/* Partial contact visible below the overlap */}
                                            <div className="flex items-start gap-3 pt-2 border-t border-gray-100">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                                                    TW
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] text-gray-400 truncate">theresaw@gmail.com</div>
                                                    <div className="text-[10px] text-[#A582F7] font-semibold mt-0.5">INV-9072</div>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-gray-400 text-[10px]">›</span>
                                                    <span className="text-gray-400 text-base">···</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Front panel — Payment Reminders (overlaps) */}
                                        <div className="absolute top-24 left-4 right-4 bg-white rounded-2xl border border-gray-200 shadow-lg p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-sm font-bold text-gray-900">Payment Reminders</div>
                                                <span className="text-gray-400 text-base">···</span>
                                            </div>

                                            <div className="space-y-3">
                                                {[
                                                    {
                                                        icon: (
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        ),
                                                        title: 'Send Reminders',
                                                        desc: 'At customizable intervals',
                                                    },
                                                    {
                                                        icon: (
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        ),
                                                        title: 'Charge late fees',
                                                        desc: 'Percentage or flat-rate fees',
                                                    },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                                                            {item.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[12px] font-semibold text-gray-900">{item.title}</div>
                                                            <div className="text-[10px] text-gray-400">{item.desc}</div>
                                                        </div>
                                                        <div className="text-[11px] font-semibold text-gray-600">YES</div>
                                                        <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Check items row below the card */}
                        <div className="mt-10 grid md:grid-cols-3 gap-6 md:gap-10">
                            {[
                                "Choose how often you want reminders emailed",
                                "Remind customers before or after the payment due date",
                                "Implementing a fair and transparent late fee policy.",
                            ].map(text => (
                                <div key={text} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#A582F7]">
                                        <Check className="h-3 w-3 text-white" />
                                    </span>
                                    <span className="text-[15px] text-gray-600">{text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── SECTION 10: CTA CARD (light, overlaps dark footer) ── */}
            <section className="relative z-10 bg-white pt-20 md:pt-28 pb-0">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="mx-auto max-w-6xl px-6"
                    style={{ marginBottom: '-140px' }}
                >
                    <div className="relative rounded-3xl bg-white overflow-hidden shadow-[0_8px_60px_-12px_rgba(0,0,0,0.15)] border border-gray-100">
                        <div className="grid md:grid-cols-2 items-stretch min-h-[360px]">

                            {/* Left — Abstract Wave Art */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                                <svg
                                    viewBox="0 0 600 600"
                                    className="absolute inset-0 w-full h-full"
                                    preserveAspectRatio="xMidYMid slice"
                                >
                                    <defs>
                                        <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#A582F7" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="#9a5ab5" stopOpacity="0.15" />
                                        </linearGradient>
                                        <linearGradient id="wave2" x1="100%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#d8a0e0" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="#A582F7" stopOpacity="0.08" />
                                        </linearGradient>
                                        <linearGradient id="wave3" x1="0%" y1="100%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#e8c8f0" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                                        </linearGradient>
                                    </defs>

                                    {/* Flowing organic curves */}
                                    {[...Array(18)].map((_, i) => (
                                        <path
                                            key={i}
                                            d={`M ${-50 + i * 5} ${350 - i * 8} C ${100 + i * 12} ${150 - i * 15}, ${300 + i * 8} ${100 + i * 10}, ${650} ${250 - i * 5}`}
                                            fill="none"
                                            stroke={`url(#wave${(i % 3) + 1})`}
                                            strokeWidth={1.2 + i * 0.1}
                                            opacity={0.3 + i * 0.035}
                                        />
                                    ))}

                                    {/* Flowing ellipses for depth */}
                                    {[...Array(8)].map((_, i) => (
                                        <ellipse
                                            key={`e${i}`}
                                            cx={220 + i * 15}
                                            cy={300}
                                            rx={60 + i * 25}
                                            ry={100 + i * 18}
                                            fill="none"
                                            stroke={`url(#wave${(i % 3) + 1})`}
                                            strokeWidth={1}
                                            transform={`rotate(${-25 + i * 6} 280 300)`}
                                            opacity={0.2 + i * 0.05}
                                        />
                                    ))}
                                </svg>

                                {/* Soft gradient fade to right */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/80" />
                            </div>

                            {/* Right — Content */}
                            <div className="relative z-10 flex flex-col justify-center px-8 py-12 md:px-14 md:py-16">
                                <h2 className="text-3xl md:text-[2.5rem] font-bold text-gray-900 leading-tight">
                                    Get Started with<br />DustBill
                                </h2>
                                <p className="mt-4 text-gray-500 leading-relaxed max-w-md">
                                    Join the 500,000+ small businesses using DustBill
                                    to run their business their way.
                                </p>
                                <div className="mt-8">
                                    <Link
                                        to="/signup"
                                        className="inline-flex items-center gap-2 bg-[#A582F7] hover:bg-[#b060be] text-white font-semibold px-7 py-3.5 rounded-full text-base shadow-lg shadow-[#A582F7]/20 transition-all hover:shadow-[#A582F7]/35 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Try it Free
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── SECTION 11: FOOTER (dark bg, CTA overlaps into top) ── */}
            <footer className="relative bg-[#0a0a0a] text-gray-400 pt-[180px] pb-0">
                <div className="mx-auto max-w-6xl px-6">

                    {/* Footer columns with subtle vertical dividers */}
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-0 py-14">

                        {/* Brand column */}
                        <div className="col-span-2 pr-8 md:border-r md:border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-7 w-7 rounded-lg bg-[#A582F7] flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">D</span>
                                </div>
                                <span className="font-bold text-white text-lg">DustBill</span>
                            </div>
                            <p className="text-sm leading-relaxed text-gray-500 max-w-[220px]">
                                Generate professional-looking invoices, track payments,
                                and send reminders to clients who haven't yet paid.
                            </p>
                            <div className="mt-5 flex gap-2.5">
                                {[
                                    { Icon: Instagram, bg: 'bg-gradient-to-br from-pink-500 to-purple-600' },
                                    { Icon: () => <span className="text-xs font-bold">f</span>, bg: 'bg-blue-600' },
                                    { Icon: Twitter, bg: 'bg-sky-500' },
                                    { Icon: Linkedin, bg: 'bg-blue-700' },
                                ].map(({ Icon, bg }, i) => (
                                    <a key={i} href="#" className={`flex h-8 w-8 items-center justify-center rounded-full ${bg} text-white transition-opacity hover:opacity-80`}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Link columns with vertical dividers */}
                        {[
                            { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Pricing'] },
                            { title: 'Resources', links: ['Blog', 'Invoice Generator', 'Invoice Templates'] },
                            { title: 'Features', links: ['Invoices', 'Invoice App', 'Payments', 'Reports', 'Recurring Billing', 'Time Tracking'] },
                            { title: 'Support', links: ['Help Center', 'FAQ'] },
                            { title: 'Legal', links: ['Terms', 'Privacy Policy', 'Cookie Policy'] },
                        ].map((col, i) => (
                            <div key={col.title} className={`px-6 ${i < 4 ? 'md:border-r md:border-white/[0.06]' : ''}`}>
                                <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
                                <ul className="space-y-2.5">
                                    {col.links.map(link => (
                                        <li key={link}>
                                            <a href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{link}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Bottom bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between py-6 border-t border-white/[0.06] gap-4">
                        <p className="text-sm text-gray-600">
                            Copyright © 2026 DustBill. All right reserved.
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white text-black rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /></svg>
                                <div><div className="text-[8px] leading-none">Download on the</div><div className="text-xs font-semibold leading-tight">App Store</div></div>
                            </div>
                            <div className="flex items-center gap-2 bg-white text-black rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.6l2.807 1.626a1 1 0 0 1 0 1.734l-2.807 1.626-2.534-2.534 2.534-2.452zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" /></svg>
                                <div><div className="text-[8px] leading-none">GET IT ON</div><div className="text-xs font-semibold leading-tight">Google Play</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}



