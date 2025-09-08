
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { teamMembers as initialTeamMembers, TeamMember, Permissions } from '@/lib/team-data';

interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: TeamMember | null;
    hasPermission: (module: keyof Permissions, level: 'view' | 'edit') => boolean;
}

export function useAdminAuth(): AuthState {
    const [authState, setAuthState] = React.useState<Omit<AuthState, 'hasPermission'>>({
        isLoading: true,
        isAuthenticated: false,
        user: null,
    });
    const router = useRouter();

    React.useEffect(() => {
        // This check is to prevent running this logic on the server.
        if (typeof window !== 'undefined') {
            const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
            
            if (isAdminAuthenticated) {
                const username = localStorage.getItem('adminUsername');
                const teamMembersData = localStorage.getItem('teamMembers');
                const teamMembers: TeamMember[] = teamMembersData ? JSON.parse(teamMembersData) : initialTeamMembers;
                const currentUser = teamMembers.find((m: TeamMember) => m.username === username);

                if (currentUser) {
                    setAuthState({ isLoading: false, isAuthenticated: true, user: currentUser });
                } else {
                    // Mismatch or data corruption, log out
                    localStorage.removeItem('isAdminAuthenticated');
                    localStorage.removeItem('adminRole');
                    localStorage.removeItem('adminUsername');
                    setAuthState({ isLoading: false, isAuthenticated: false, user: null });
                }
            } else {
                 setAuthState({ isLoading: false, isAuthenticated: false, user: null });
            }
        }
    }, []);

    const hasPermission = React.useCallback((module: keyof Permissions, level: 'view' | 'edit'): boolean => {
        const { user } = authState;
        if (!user) return false;
        
        // Super admin has all permissions
        if (user.role === 'admin') return true;
        
        const userPermission = user.permissions?.[module];
        if (!userPermission) return false;

        if (level === 'view') {
            return userPermission === 'view' || userPermission === 'edit';
        }
        
        if (level === 'edit') {
            return userPermission === 'edit';
        }

        return false;
    }, [authState.user]);

    return { ...authState, hasPermission };
}
