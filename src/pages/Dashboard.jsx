import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
    DollarSign, FileText, CheckCircle2, Clock,
    TrendingUp, TrendingDown, Plus, ArrowUpRight, Users
} from 'lucide-react'
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const STATUS_COLORS = {
    draft: { fill: '#94a3b8', label: 'Draft' },
    pending: { fill: '#3b82f6', label: 'Sent' },
    approved: { fill: '#10b981', label: 'Approved' },
    paid: { fill: '#22c55e', label: 'Paid' },
    rejected: { fill: '#ef4444', label: 'Rejected' },
    overdue: { fill: '#ef4444', label: 'Overdue' },
}

export default function Dashboard() {
    const { user } = useAuthStore()
    const [invoices, setInvoices] = useState([])
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return
        async function load() {
            try {
                const [invRes, clientRes] = await Promise.all([
                    supabase.from('invoices').select('*, clients (name, email)').eq('user_id', user.id).order('created_at', { ascending: false }),
                    supabase.from('clients').select('*').eq('user_id', user.id),
                ])
                if (invRes.error) throw invRes.error
                if (clientRes.error) throw clientRes.error
                setInvoices(invRes.data || [])
                setClients(clientRes.data || [])
            } catch (err) {
                console.error('Dashboard fetch error:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [user])

    const fmt = (v, currency = 'USD') =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v)

    // ── Computed stats ──
    const stats = useMemo(() => {
        const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + (i.amount || 0), 0)
        const totalPending = invoices.filter(i => i.status === 'pending').reduce((a, i) => a + (i.amount || 0), 0)
        const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((a, i) => a + (i.amount || 0), 0)

        // This month vs last month
        const now = new Date()
        const thisMonthStart = startOfMonth(now)
        const thisMonthEnd = endOfMonth(now)
        const lastMonthStart = startOfMonth(subMonths(now, 1))
        const lastMonthEnd = endOfMonth(subMonths(now, 1))

        const thisMonthRevenue = invoices
            .filter(i => i.status === 'paid' && i.created_at && isWithinInterval(new Date(i.created_at), { start: thisMonthStart, end: thisMonthEnd }))
            .reduce((a, i) => a + (i.amount || 0), 0)
        const lastMonthRevenue = invoices
            .filter(i => i.status === 'paid' && i.created_at && isWithinInterval(new Date(i.created_at), { start: lastMonthStart, end: lastMonthEnd }))
            .reduce((a, i) => a + (i.amount || 0), 0)

        const revenueChange = lastMonthRevenue > 0
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
            : thisMonthRevenue > 0 ? 100 : 0

        return { totalRevenue, totalPending, totalOverdue, revenueChange, thisMonthRevenue }
    }, [invoices])

    // ── Revenue chart data (last 6 months) ──
    const revenueChartData = useMemo(() => {
        const months = []
        const now = new Date()
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(now, i)
            const start = startOfMonth(d)
            const end = endOfMonth(d)
            const paid = invoices
                .filter(inv => inv.status === 'paid' && inv.created_at && isWithinInterval(new Date(inv.created_at), { start, end }))
                .reduce((a, inv) => a + (inv.amount || 0), 0)
            const pending = invoices
                .filter(inv => (inv.status === 'pending' || inv.status === 'overdue') && inv.created_at && isWithinInterval(new Date(inv.created_at), { start, end }))
                .reduce((a, inv) => a + (inv.amount || 0), 0)
            months.push({
                name: format(d, 'MMM'),
                paid,
                pending,
            })
        }
        return months
    }, [invoices])

    // ── Status distribution ──
    const statusData = useMemo(() => {
        const counts = { draft: 0, pending: 0, paid: 0, overdue: 0 }
        invoices.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++ })
        return Object.entries(counts).map(([key, value]) => ({
            name: STATUS_COLORS[key].label,
            value,
            fill: STATUS_COLORS[key].fill,
        }))
    }, [invoices])

    // ── Recent invoices ──
    const recentInvoices = invoices.slice(0, 5)

    // ── Custom tooltip ──
    const ChartTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null
        return (
            <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                <p className="font-bold text-foreground mb-1">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color }} className="font-medium">
                        {p.name}: {fmt(p.value)}
                    </p>
                ))}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 bg-card rounded-2xl border border-border animate-pulse" />
                    ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-7">
                    <div className="lg:col-span-4 h-80 bg-card rounded-2xl border border-border animate-pulse" />
                    <div className="lg:col-span-3 h-80 bg-card rounded-2xl border border-border animate-pulse" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Overview of your invoicing activity.
                    </p>
                </div>
                <Link
                    to="/invoices/new"
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                >
                    <Plus className="h-4 w-4" /> New Invoice
                </Link>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        title: 'Total Revenue',
                        value: fmt(stats.totalRevenue),
                        icon: DollarSign,
                        change: stats.revenueChange,
                        desc: 'from paid invoices',
                        accent: 'text-green-500 bg-green-500/10',
                    },
                    {
                        title: 'Total Invoices',
                        value: invoices.length,
                        icon: FileText,
                        desc: `${invoices.filter(i => i.status === 'paid').length} paid`,
                        accent: 'text-primary bg-primary/10',
                    },
                    {
                        title: 'Pending',
                        value: fmt(stats.totalPending),
                        icon: Clock,
                        desc: `${invoices.filter(i => i.status === 'pending').length} invoices`,
                        accent: 'text-blue-500 bg-blue-500/10',
                    },
                    {
                        title: 'Clients',
                        value: clients.length,
                        icon: Users,
                        desc: 'total clients',
                        accent: 'text-purple-500 bg-purple-500/10',
                    },
                ].map((stat, idx) => {
                    const Icon = stat.icon
                    return (
                        <div key={idx} className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                                <div className={`h-8 w-8 rounded-lg ${stat.accent} flex items-center justify-center`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            <div className="flex items-center gap-2 mt-1">
                                {stat.change !== undefined && (
                                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {stat.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {Math.abs(stat.change).toFixed(1)}%
                                    </span>
                                )}
                                <span className="text-[11px] text-muted-foreground">{stat.desc}</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid gap-4 lg:grid-cols-7">
                {/* Revenue Chart */}
                <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Revenue Overview</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Last 6 months</p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-semibold">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Paid</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> Pending</span>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                <Tooltip content={<ChartTooltip />} />
                                <Area type="monotone" dataKey="paid" name="Paid" stroke="#22c55e" strokeWidth={2} fill="url(#paidGrad)" />
                                <Area type="monotone" dataKey="pending" name="Pending" stroke="#60a5fa" strokeWidth={2} fill="url(#pendingGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-foreground">Invoice Status</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Distribution of all invoices</p>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="value" name="Invoices" radius={[6, 6, 0, 0]} barSize={36}>
                                    {statusData.map((entry, idx) => (
                                        <Cell key={idx} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        {statusData.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.fill }} />
                                <span className="text-muted-foreground">{s.name}</span>
                                <span className="font-bold text-foreground ml-auto">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Recent Invoices ── */}
            <div className="bg-card rounded-2xl border border-border shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Recent Invoices</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Your latest invoicing activity</p>
                    </div>
                    <Link to="/invoices" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        View all <ArrowUpRight className="h-3 w-3" />
                    </Link>
                </div>

                {recentInvoices.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <p className="text-sm text-muted-foreground">No invoices yet. Create your first one!</p>
                    </div>
                ) : (
                    <div>
                        {recentInvoices.map((inv, idx) => {
                            const statusCfg = STATUS_COLORS[inv.status] || STATUS_COLORS.draft
                            return (
                                <div key={inv.id} className={`flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors ${idx < recentInvoices.length - 1 ? 'border-b border-border' : ''}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-primary">
                                                {(inv.clients?.name || 'U').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{inv.clients?.name || 'Unknown'}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">#{inv.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold`}
                                            style={{ backgroundColor: statusCfg.fill + '1a', color: statusCfg.fill }}>
                                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusCfg.fill }} />
                                            {statusCfg.label}
                                        </span>
                                        <p className="text-sm font-bold text-foreground w-24 text-right">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'USD' }).format(inv.amount)}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
