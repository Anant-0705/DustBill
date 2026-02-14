import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { motion } from 'framer-motion'

export default function DashboardLayout() {
    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Outlet />
                </motion.div>
            </main>
        </div>
    )
}
