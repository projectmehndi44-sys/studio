
'use client';

import * as React from 'react';
import type { TeamMember, Permissions } from '@/types';
import { getTeamMembers } from '@/lib/services';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: TeamMember | null;
    firebaseUser: User | null;
}

const authContext = React.createContext<AuthState & { hasPermission: (module: keyof Permissions, level: 'view' | 'edit') => boolean; } | null>(null);


export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = React.useState<AuthState>({
        isLoading: true,
        isAuthenticated: false,
        user: null,
        firebaseUser: null,
    });

    React.useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                 const username = localStorage.getItem('adminUsername');
                 if (username) {
                    try {
                        const teamMembers: TeamMember[] = await getTeamMembers();
                        const currentUser = teamMembers.find((m: TeamMember) => m.username === username);

                        if (currentUser) {
                            localStorage.setItem('isAdminAuthenticated', 'true');
                            setAuthState({ isLoading: false, isAuthenticated: true, user: currentUser, firebaseUser });
                        } else {
                            // If no matching team member, clear local storage and set unauthenticated state
                            localStorage.removeItem('isAdminAuthenticated');
                            localStorage.removeItem('adminRole');
                            localStorage.removeItem('adminUsername');
                            localStorage.removeItem('adminUserId');
                            setAuthState({ isLoading: false, isAuthenticated: false, user: null, firebaseUser: null });
                        }
                    } catch (error) {
                        console.error("Failed to load team members for auth check", error);
                        setAuthState({ isLoading: false, isAuthenticated: false, user: null, firebaseUser: null });
                    }
                 } else {
                    // Logged into Firebase, but not through our admin flow
                     setAuthState({ isLoading: false, isAuthenticated: false, user: null, firebaseUser: null });
                 }
            } else {
                // Not logged into Firebase
                localStorage.removeItem('isAdminAuthenticated');
                localStorage.removeItem('adminRole');
                localStorage.removeItem('adminUsername');
                localStorage.removeItem('adminUserId');
                setAuthState({ isLoading: false, isAuthenticated: false, user: null, firebaseUser: null });
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

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
