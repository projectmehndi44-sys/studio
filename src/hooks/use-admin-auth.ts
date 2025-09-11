
'use client';

import * as React from 'react';
import type { TeamMember, Permissions } from '@/types';
import { getTeamMembers } from '@/lib/services';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: TeamMember | null;
}

const authContext = React.createContext<AuthState & { hasPermission: (module: keyof Permissions, level: 'view' | 'edit') => boolean; } | null>(null);


export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authState, setAuthState] = React.useState<AuthState>({
        isLoading: true,
        isAuthenticated: false,
        user: null,
    });
    
    React.useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in via Firebase Auth.
                // Now, fetch their profile from our Firestore team list to get roles/permissions.
                try {
                    const teamMembers = await getTeamMembers();
                    const memberProfile = teamMembers.find(m => m.id === user.uid);

                    if (memberProfile) {
                        // Successfully found the user's profile. They are a valid admin/team member.
                        localStorage.setItem('adminAuthenticated', 'true');
                        setAuthState({ isLoading: false, isAuthenticated: true, user: memberProfile });
                        if (pathname === '/admin/login') {
                            router.push('/admin');
                        }
                    } else {
                        // This person is logged into Firebase, but is NOT in our team list.
                        // This could be a customer or artist. Log them out of the admin context.
                        await auth.signOut();
                        localStorage.removeItem('adminAuthenticated');
                        setAuthState({ isLoading: false, isAuthenticated: false, user: null });
                        router.push('/admin/login');
                    }
                } catch (error) {
                    console.error("Failed to fetch team members for auth check", error);
                    setAuthState({ isLoading: false, isAuthenticated: false, user: null });
                     if (pathname !== '/admin/login') {
                        router.push('/admin/login');
                    }
                }
            } else {
                // No user is signed in.
                localStorage.removeItem('adminAuthenticated');
                setAuthState({ isLoading: false, isAuthenticated: false, user: null });
                 if (pathname !== '/admin/login') {
                    router.push('/admin/login');
                }
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [router, pathname]);

    const hasPermission = React.useCallback((module: keyof Permissions, level: 'view' | 'edit'): boolean => {
        const { user } = authState;
        if (!user) return false;
        
        if (user.role === 'Super Admin') return true;
        
        const userPermission = user.permissions?.[module];
        if (!userPermission || userPermission === 'hidden') return false;

        if (level === 'view') {
            return userPermission === 'view' || userPermission === 'edit';
        }
        
        if (level === 'edit') {
            return userPermission === 'edit';
        }

        return false;
    }, [authState.user]);

    const value = React.useMemo(() => ({ ...authState, hasPermission }), [authState, hasPermission]);
    
    return React.createElement(authContext.Provider, { value }, children);
}

export function useAdminAuth() {
    const context = React.useContext(authContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
}
