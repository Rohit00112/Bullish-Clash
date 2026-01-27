'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Users,
    UserPlus,
    Search,
    Mail,
    Phone,
    Calendar,
    CheckCircle,
    XCircle,
    Loader2,
    ArrowLeft,
    Eye,
    EyeOff,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { usersApi, authApi } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface User {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: string;
    phone?: string;
    isActive: boolean;
    lastLoginAt?: string;
    createdAt: string;
}

// Generate random password
function generatePassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        fullName: '',
        password: generatePassword(),
        phone: '',
    });

    // Fetch users
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const res = await usersApi.getAll({ limit: 100 });
            return res.data;
        },
    });

    // Create user mutation
    const createUserMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await authApi.createUser(data);
            return res.data;
        },
        onSuccess: (data) => {
            toast({
                title: 'User Created',
                description: data.emailSent
                    ? `Credentials sent to ${formData.email}`
                    : `User created. Email delivery failed - share password manually: ${formData.password}`,
                variant: data.emailSent ? 'success' : 'default',
            });
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setShowCreateModal(false);
            setFormData({
                email: '',
                username: '',
                fullName: '',
                password: generatePassword(),
                phone: '',
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to Create User',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive',
            });
        },
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await usersApi.deleteUser(userId);
            return res.data;
        },
        onSuccess: () => {
            toast({
                title: 'User Deleted',
                description: 'User has been removed successfully',
            });
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to Delete User',
                description: error.response?.data?.message || 'An error occurred',
                variant: 'destructive',
            });
        },
    });

    const handleDeleteUser = (user: User) => {
        if (user.role === 'admin') {
            toast({
                title: 'Cannot Delete Admin',
                description: 'Admin users cannot be deleted',
                variant: 'destructive',
            });
            return;
        }

        if (confirm(`Are you sure you want to delete ${user.fullName}? This action cannot be undone.`)) {
            deleteUserMutation.mutate(user.id);
        }
    };

    // Filter users
    const users = usersData?.data || [];
    const filteredUsers = users.filter((user: User) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            user.email.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query) ||
            user.fullName.toLowerCase().includes(query)
        );
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createUserMutation.mutate(formData);
    };

    const regeneratePassword = () => {
        setFormData(prev => ({ ...prev, password: generatePassword() }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/admin"
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            User Management
                        </h1>
                        <p className="text-muted-foreground">
                            Add and manage competition participants
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Add User
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Users</p>
                            <p className="text-2xl font-bold">{formatNumber(users.length)}</p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Active</p>
                            <p className="text-2xl font-bold">
                                {formatNumber(users.filter((u: User) => u.isActive).length)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-3">
                        <XCircle className="h-8 w-8 text-red-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Inactive</p>
                            <p className="text-2xl font-bold">
                                {formatNumber(users.filter((u: User) => !u.isActive).length)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="card">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search users by name, email, or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input pl-9 w-full"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Login</th>
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                        {searchQuery ? 'No users found' : 'No users yet'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user: User) => (
                                    <tr key={user.id} className="border-b border-border hover:bg-secondary/30">
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className="font-medium">{user.fullName}</p>
                                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="space-y-1">
                                                <p className="text-sm flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </p>
                                                {user.phone && (
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {user.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-500/20 text-purple-500'
                                                    : 'bg-blue-500/20 text-blue-500'
                                                    }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {user.isActive ? (
                                                <span className="flex items-center gap-1 text-green-500 text-sm">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-500 text-sm">
                                                    <XCircle className="h-4 w-4" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {user.lastLoginAt
                                                ? new Date(user.lastLoginAt).toLocaleDateString()
                                                : 'Never'}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    disabled={deleteUserMutation.isPending}
                                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Delete user"
                                                >
                                                    {deleteUserMutation.isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Add New User
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, fullName: e.target.value }))
                                    }
                                    className="input w-full"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, email: e.target.value }))
                                    }
                                    className="input w-full"
                                    placeholder="john@example.com"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Login credentials will be sent to this email
                                </p>
                            </div>

                            <div>
                                <label className="label">Username *</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData(prev => ({
                                            ...prev,
                                            username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                                        }))
                                    }
                                    className="input w-full"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Password *</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData(prev => ({ ...prev, password: e.target.value }))
                                            }
                                            className="input w-full pr-10"
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={regeneratePassword}
                                        className="btn-secondary p-2"
                                        title="Generate new password"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="label">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData(prev => ({ ...prev, phone: e.target.value }))
                                    }
                                    className="input w-full"
                                    placeholder="+977 9800000000"
                                />
                            </div>

                            <div className="bg-secondary/30 rounded-lg p-3 text-sm">
                                <p className="font-medium mb-1">What happens next:</p>
                                <ul className="text-muted-foreground space-y-1 text-xs">
                                    <li>• User account will be created</li>
                                    <li>• User will be added to the active competition</li>
                                    <li>• Login credentials will be emailed automatically</li>
                                </ul>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createUserMutation.isPending}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                                >
                                    {createUserMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4" />
                                            Create & Send Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
