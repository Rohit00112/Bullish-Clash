'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import {
    TrendingUp,
    LayoutDashboard,
    LineChart,
    Briefcase,
    Trophy,
    History,
    Settings,
    LogOut,
    Shield,
    Menu,
    X,
    Calendar,
    BarChart3,
    Users,
    Newspaper,
    Star,
    Award,
    MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useWebSocket } from '@/hooks/use-websocket';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Trade', href: '/dashboard/trade', icon: LineChart },
    { name: 'Charts', href: '/dashboard/chart', icon: BarChart3 },
    { name: 'Watchlist', href: '/dashboard/watchlist', icon: Star },
    { name: 'Portfolio', href: '/dashboard/portfolio', icon: Briefcase },
    { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
    { name: 'Achievements', href: '/dashboard/achievements', icon: Award },
    { name: 'News', href: '/dashboard/news', icon: Newspaper },
    { name: 'History', href: '/dashboard/history', icon: History },
];

const adminNavigation = [
    { name: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/dashboard/admin/users', icon: Users },
    { name: 'Events', href: '/dashboard/admin/events', icon: Calendar },
    { name: 'Symbols', href: '/dashboard/admin/symbols', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
    { name: 'Remarks', href: '/dashboard/admin/remarks', icon: MessageSquare },
    { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isAuthenticated, logout, initialize } = useAuthStore();
    const { connect, disconnect, authenticate } = useWebSocket();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        initialize();
        setIsInitializing(false);
    }, [initialize]);

    // Connect WebSocket when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            connect();
            // Authenticate with token from cookies for user-specific updates
            const token = Cookies.get('accessToken');
            if (token) {
                authenticate(token);
            }
        }

        return () => {
            disconnect();
        };
    }, [isAuthenticated, connect, disconnect, authenticate]);

    // Redirect to login if not authenticated (after initialization)
    useEffect(() => {
        if (!isInitializing && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isInitializing, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (isInitializing || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-md bg-secondary text-foreground"
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-2 p-6 border-b border-border">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold">Bullish Clash</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1">
                        {/* Show admin navigation for admins, regular navigation for participants */}
                        {user?.role === 'admin' ? (
                            <>
                                <div className="pb-2">
                                    <p className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Admin Panel
                                    </p>
                                </div>
                                {adminNavigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <>
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </>
                        )}
                    </nav>

                    {/* User section */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-medium">
                                    {user?.fullName?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user?.role === 'admin' ? (
                                        <span className="text-primary">Admin</span>
                                    ) : (
                                        `@${user?.username}`
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="mt-2 space-y-1">
                            {user?.role !== 'admin' && (
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                                >
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors w-full"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Main content */}
            <main className="lg:pl-64">
                <div className="p-6 pt-16 lg:pt-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
