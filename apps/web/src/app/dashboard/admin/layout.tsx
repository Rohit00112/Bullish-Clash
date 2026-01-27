'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check if user is admin (case-insensitive)
        if (user?.role?.toLowerCase() !== 'admin') {
            router.push('/dashboard');
        }
    }, [isAuthenticated, user, router]);

    // Don't render admin content for non-admins
    if (!user || user.role?.toLowerCase() !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">Access denied. Admin only.</p>
            </div>
        );
    }

    return <>{children}</>;
}
