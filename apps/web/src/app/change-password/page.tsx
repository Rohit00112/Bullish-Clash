'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';

export default function ChangePasswordPage() {
    const router = useRouter();
    const { user, isAuthenticated, initialize, updateUser } = useAuthStore();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Check auth status
    useEffect(() => {
        initialize();
        setIsChecking(false);
    }, [initialize]);

    // Redirect if not authenticated
    useEffect(() => {
        if (!isChecking && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, isChecking, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            toast({
                title: 'Invalid password',
                description: 'Password must be at least 8 characters long',
                variant: 'destructive',
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: 'Passwords do not match',
                description: 'Please ensure both passwords match',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            await authApi.changePassword(password);

            // Update local state
            updateUser({ mustChangePassword: false });

            toast({
                title: 'Password updated',
                description: 'Your password has been changed successfully',
                variant: 'success',
            });

            router.push('/dashboard');
        } catch (err: any) {
            toast({
                title: 'Update failed',
                description: err.response?.data?.message || 'Failed to change password',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isChecking || !isAuthenticated) {
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
                        <span className="text-2xl font-bold">Bullish Battle</span>
                    </Link>
                    <p className="text-muted-foreground mt-2">Create a new secure password</p>
                </div>

                {/* Form */}
                <div className="card">
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                        <Lock className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium text-yellow-500 mb-1">Security Update Required</p>
                            <p className="text-muted-foreground">
                                For your security, please update your password before accessing the dashboard.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* New Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                New Password
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
                                    minLength={8}
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

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input pl-10"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-3 disabled:opacity-50 mt-2"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Updating Password...
                                </span>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
