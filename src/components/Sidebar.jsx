import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    LogOut,
    FileSignature,
    X
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { ThemeToggle } from './ThemeProvider'

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'Invoices', href: '/invoices' },
    { icon: FileSignature, label: 'Contracts', href: '/contracts' },
    { icon: Users, label: 'Clients', href: '/clients' },
    { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function Sidebar({ onClose }) {
    const location = useLocation()
    const { signOut } = useAuthStore()

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card">
            <div className="flex h-16 items-center justify-between border-b px-6">
                <h1 className="text-2xl font-bold" style={{ color: '#A582F7' }}>Dustbill</h1>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
            <div className="p-4 border-t flex items-center justify-between">
                <button
                    onClick={() => signOut()}
                    className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                </button>
                <ThemeToggle />
            </div>
        </div>
    )
}
