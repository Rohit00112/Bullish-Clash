'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error, clearError, isAuthenticated, initialize } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Check if already authenticated on mount
    useEffect(() => {
        initialize();
        setIsChecking(false);
    }, [initialize]);

    // Redirect if already authenticated
    useEffect(() => {
        if (!isChecking && isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, isChecking, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login(email, password);
            toast({
                title: 'Welcome back!',
                description: 'Login successful',
                variant: 'success',
            });
            router.push('/dashboard');
        } catch (err) {
            toast({
                title: 'Login failed',
                description: error || 'Invalid credentials',
                variant: 'destructive',
            });
        }
    };

    // Show loading while checking auth status
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Don't show login form if authenticated (while redirecting)
    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <TrendingUp className="h-10 w-10 text-primary" />
                        <span className="text-2xl font-bold">Bullish Clash</span>
                    </Link>
                    <p className="text-muted-foreground mt-2">Sign in to start trading</p>
                </div>

                {/* Login Form */}
                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input pl-10"
                                    placeholder="trader@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pl-10 pr-10"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-3 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Contact admin notice */}
                    <p className="text-center mt-6 text-sm text-muted-foreground">
                        Don&apos;t have an account? Contact your administrator.
                    </p>

                    {/* Demo credentials */}
                    <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Demo Credentials:</p>
                        <p className="text-xs text-muted-foreground">Email: demo@bullishclash.com</p>
                        <p className="text-xs text-muted-foreground">Password: demo123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
