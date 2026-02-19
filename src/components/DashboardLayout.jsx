import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { ThemeToggle } from './ThemeProvider'

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Desktop sidebar */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile sidebar drawer */}
            <div className={`
                fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <div className="flex flex-1 flex-col min-w-0">
                {/* Mobile top bar */}
                <header className="md:hidden flex items-center justify-between h-14 px-4 border-b bg-card shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                    >
                        <Menu className="h-5 w-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground">Dustbill</h1>
                    <ThemeToggle />
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    )
}
