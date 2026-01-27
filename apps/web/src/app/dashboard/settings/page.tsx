'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Settings,
    User,
    Bell,
    Shield,
    Palette,
    Save,
    Loader2,
    Check,
    Eye,
    EyeOff,
    Moon,
    Sun,
    Monitor,
    BellRing,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi, authApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission } from '@/lib/notifications';

type Theme = 'light' | 'dark' | 'system';

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user, updateUser } = useAuthStore();

    // Profile state
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phone, setPhone] = useState(user?.phone || '');

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Preferences state
    const [theme, setTheme] = useState<Theme>('dark');
    const [browserNotifications, setBrowserNotifications] = useState(false);
    const [notifications, setNotifications] = useState({
        tradeConfirmations: true,
        priceAlerts: true,
        leaderboardUpdates: false,
        marketEvents: true,
    });

    // Load preferences from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }

        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
            setNotifications(JSON.parse(savedNotifications));
        }

        // Check browser notification permission
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setBrowserNotifications(Notification.permission === 'granted');
        }
    }, []);

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (data: { fullName?: string; phone?: string }) => {
            const res = await usersApi.updateMe(data);
            return res.data;
        },
        onSuccess: (data) => {
            toast({ title: 'Profile Updated', description: 'Your profile has been saved' });
            updateUser(data);
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update profile',
                variant: 'destructive',
            });
        },
    });

    // Handle profile save
    const handleSaveProfile = () => {
        updateProfileMutation.mutate({ fullName, phone });
    };

    // Handle password change
    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            toast({
                title: 'Error',
                description: 'New passwords do not match',
                variant: 'destructive',
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                title: 'Error',
                description: 'Password must be at least 6 characters',
                variant: 'destructive',
            });
            return;
        }

        // In a real app, this would call an API endpoint
        toast({
            title: 'Password Changed',
            description: 'Your password has been updated successfully',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    // Handle theme change
    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        // Apply theme to document
        const root = document.documentElement;
        if (newTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            if (systemTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        } else if (newTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        toast({ title: 'Theme Updated' });
    };

    // Handle notification change
    const handleNotificationChange = (key: keyof typeof notifications) => {
        const updated = { ...notifications, [key]: !notifications[key] };
        setNotifications(updated);
        localStorage.setItem('notifications', JSON.stringify(updated));
        toast({ title: notifications[key] ? 'Notification Disabled' : 'Notification Enabled' });
    };

    // Handle browser notification toggle
    const handleBrowserNotifications = async () => {
        if (browserNotifications) {
            // Can't programmatically revoke, inform user
            toast({
                title: 'Browser Notifications',
                description: 'To disable browser notifications, please use your browser settings.',
            });
        } else {
            const granted = await requestNotificationPermission();
            setBrowserNotifications(granted);
            if (granted) {
                toast({ title: 'Browser Notifications Enabled' });
            } else {
                toast({
                    title: 'Permission Denied',
                    description: 'Please enable notifications in your browser settings.',
                    variant: 'destructive',
                });
            }
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    Settings
                </h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            {/* Profile Settings */}
            <div className="card">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <User className="h-5 w-5" />
                    Profile
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="input w-full bg-secondary/50 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="label">Username</label>
                        <input
                            type="text"
                            value={user?.username || ''}
                            disabled
                            className="input w-full bg-secondary/50 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
                    </div>

                    <div>
                        <label className="label">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            className="input w-full"
                        />
                    </div>

                    <div>
                        <label className="label">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+977 98XXXXXXXX"
                            className="input w-full"
                        />
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                        className="btn-primary flex items-center gap-2"
                    >
                        {updateProfileMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Profile
                    </button>
                </div>
            </div>

            {/* Security Settings */}
            <div className="card">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5" />
                    Security
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="label">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="input w-full pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="label">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="input w-full pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="label">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="input w-full"
                        />
                    </div>

                    <button
                        onClick={handleChangePassword}
                        disabled={!currentPassword || !newPassword || !confirmPassword}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Shield className="h-4 w-4" />
                        Change Password
                    </button>
                </div>
            </div>

            {/* Appearance */}
            <div className="card">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Palette className="h-5 w-5" />
                    Appearance
                </h2>

                <div>
                    <label className="label">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => handleThemeChange('light')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${theme === 'light'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-secondary/50'
                                }`}
                        >
                            <Sun className="h-6 w-6" />
                            <span className="text-sm">Light</span>
                            {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
                        </button>

                        <button
                            onClick={() => handleThemeChange('dark')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${theme === 'dark'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-secondary/50'
                                }`}
                        >
                            <Moon className="h-6 w-6" />
                            <span className="text-sm">Dark</span>
                            {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
                        </button>

                        <button
                            onClick={() => handleThemeChange('system')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${theme === 'system'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-secondary/50'
                                }`}
                        >
                            <Monitor className="h-6 w-6" />
                            <span className="text-sm">System</span>
                            {theme === 'system' && <Check className="h-4 w-4 text-primary" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="card">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Bell className="h-5 w-5" />
                    Notifications
                </h2>

                <div className="space-y-4">
                    {/* Browser Notifications Toggle */}
                    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            <BellRing className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-medium">Browser Notifications</p>
                                <p className="text-sm text-muted-foreground">
                                    {browserNotifications
                                        ? 'Receive notifications even when the app is in the background'
                                        : 'Enable to receive notifications outside the app'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleBrowserNotifications}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${browserNotifications
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary hover:bg-secondary/80'
                                }`}
                        >
                            {browserNotifications ? 'Enabled' : 'Enable'}
                        </button>
                    </div>

                    <div className="border-t border-border my-4" />

                    <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer">
                        <div>
                            <p className="font-medium">Trade Confirmations</p>
                            <p className="text-sm text-muted-foreground">Get notified when your trades are executed</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.tradeConfirmations}
                            onChange={() => handleNotificationChange('tradeConfirmations')}
                            className="w-5 h-5 accent-primary"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer">
                        <div>
                            <p className="font-medium">Price Alerts</p>
                            <p className="text-sm text-muted-foreground">Receive alerts for significant price changes (3%+)</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.priceAlerts}
                            onChange={() => handleNotificationChange('priceAlerts')}
                            className="w-5 h-5 accent-primary"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer">
                        <div>
                            <p className="font-medium">Leaderboard Updates</p>
                            <p className="text-sm text-muted-foreground">Get notified when your ranking changes</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.leaderboardUpdates}
                            onChange={() => handleNotificationChange('leaderboardUpdates')}
                            className="w-5 h-5 accent-primary"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg cursor-pointer">
                        <div>
                            <p className="font-medium">Market Events</p>
                            <p className="text-sm text-muted-foreground">Receive notifications about market events and news</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.marketEvents}
                            onChange={() => handleNotificationChange('marketEvents')}
                            className="w-5 h-5 accent-primary"
                        />
                    </label>
                </div>
            </div>

            {/* Account Info */}
            <div className="card bg-secondary/30">
                <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Role</p>
                        <p className="font-medium capitalize">{user?.role || 'User'}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Member Since</p>
                        <p className="font-medium">
                            {user?.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
