'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Trophy, Users, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, initialize } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        initialize();
        setIsChecking(false);
    }, [initialize]);

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (!isChecking && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, isChecking, router]);

    // Show loading while checking auth
    if (isChecking || isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
            {/* Navigation */}
            <nav className="border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-8 w-8 text-primary" />
                            <span className="text-xl font-bold">Bullish Clash</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="btn-primary">
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Nepal&apos;s Premier
                        <span className="text-primary block">Stock Trading Competition</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        Trade NEPSE stocks in real-time. Compete with traders across Nepal.
                        Climb the leaderboard and prove your trading skills.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login" className="btn-primary text-lg px-8 py-3">
                            Start Trading
                        </Link>
                        <Link href="/leaderboard" className="btn-secondary text-lg px-8 py-3">
                            View Leaderboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-4 bg-secondary/30">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Bullish Clash?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="card text-center">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Real-Time Trading</h3>
                            <p className="text-muted-foreground">
                                Execute trades instantly with live price updates powered by WebSocket technology.
                            </p>
                        </div>
                        <div className="card text-center">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trophy className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Live Leaderboard</h3>
                            <p className="text-muted-foreground">
                                Track your rank in real-time. See how you stack up against other traders.
                            </p>
                        </div>
                        <div className="card text-center">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">NEPSE Stocks</h3>
                            <p className="text-muted-foreground">
                                Trade real NEPSE-listed companies. All sectors from Banking to Hydropower.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Competition Info */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Competition Rules</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="card">
                            <h3 className="font-semibold mb-2">Starting Capital</h3>
                            <p className="text-2xl font-bold text-primary">रू 10,00,000</p>
                            <p className="text-sm text-muted-foreground mt-1">Virtual NPR to start trading</p>
                        </div>
                        <div className="card">
                            <h3 className="font-semibold mb-2">Commission Rate</h3>
                            <p className="text-2xl font-bold text-primary">0.4%</p>
                            <p className="text-sm text-muted-foreground mt-1">Per trade (realistic NEPSE rate)</p>
                        </div>
                        <div className="card">
                            <h3 className="font-semibold mb-2">Market Orders</h3>
                            <p className="text-2xl font-bold text-primary">Instant Execution</p>
                            <p className="text-sm text-muted-foreground mt-1">Orders fill at current market price</p>
                        </div>
                        <div className="card">
                            <h3 className="font-semibold mb-2">No Short Selling</h3>
                            <p className="text-2xl font-bold text-primary">Buy Low, Sell High</p>
                            <p className="text-sm text-muted-foreground mt-1">Traditional long-only trading</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-primary/10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Trade?</h2>
                    <p className="text-xl text-muted-foreground mb-8">
                        Join traders competing in Nepal&apos;s biggest virtual stock trading event.
                        Contact admin to get your account.
                    </p>
                    <Link href="/login" className="btn-primary text-lg px-8 py-3">
                        Login to Start
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-primary" />
                        <span className="font-semibold">Bullish Clash</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © 2026 Bullish Clash. Educational trading simulator. Not real financial advice.
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <Link href="/about" className="hover:text-foreground">About</Link>
                        <Link href="/rules" className="hover:text-foreground">Rules</Link>
                        <Link href="/contact" className="hover:text-foreground">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
