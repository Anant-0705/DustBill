import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    LogOut,
    FileSignature
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

export default function Sidebar() {
    const location = useLocation()
    const { signOut } = useAuthStore()

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card">
            <div className="flex h-16 items-center border-b px-6">
                <h1 className="text-2xl font-bold text-A582F7">Dustbill</h1>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
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
