import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Ticket, Mountain, BarChart3, LogOut, Search, User } from 'lucide-react';
import clsx from 'clsx';

export default function DashboardLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: Calendar, label: 'Calendar', path: '/' },
        { icon: Ticket, label: 'Bookings', path: '/bookings' },
        { icon: Mountain, label: 'Tours', path: '/tours' },
        { icon: BarChart3, label: 'Stats', path: '/stats' },
    ];

    return (
        <div className="flex h-screen w-full p-4 gap-4">
            {/* Floating Sidebar */}
            <aside className="w-20 flex flex-col items-center py-6 glass-panel rounded-full h-full justify-between">
                <div className="flex flex-col gap-8 items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="font-bold text-white text-lg">N</span>
                    </div>

                    <nav className="flex flex-col gap-4">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    clsx(
                                        "p-3 rounded-xl transition-all duration-300 group relative",
                                        isActive
                                            ? "bg-white/10 text-white shadow-lg"
                                            : "text-white/60 hover:bg-white/5 hover:text-white"
                                    )
                                }
                            >
                                <item.icon size={24} />
                                <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {item.label}
                                </span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-3 text-white/60 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-all"
                    title="Logout"
                >
                    <LogOut size={24} />
                </button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col gap-4 h-full overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 glass-panel rounded-2xl flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4 text-white/80">
                        <h1 className="font-medium text-lg">Dashboard</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="glass-input pl-10 w-64"
                            />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                            <User size={20} className="text-white/80" />
                        </div>
                    </div>
                </header>

                {/* Content Container */}
                <div className="flex-1 glass-panel rounded-2xl overflow-auto p-6 relative">
                    {/* Background ambient glow for content */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px]" />
                    </div>

                    <Outlet />
                </div>
            </main>
        </div>
    );
}
