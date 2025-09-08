

'use client';

import * as React from 'react';
import { teamMembers as initialTeamMembers, TeamMember, Permissions } from '@/lib/team-data';

interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: TeamMember | null;
}

const authContext = React.createContext<AuthState & { hasPermission: (module: keyof Permissions, level: 'view' | 'edit') => boolean; } | null>(null);


export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = React.useState<AuthState>({
        isLoading: true,
        isAuthenticated: false,
        user: null,
    });

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
        if (isAdminAuthenticated) {
            const username = localStorage.getItem('adminUsername');
            const teamMembersData = localStorage.getItem('teamMembers');
            const teamMembers: TeamMember[] = teamMembersData ? JSON.parse(teamMembersData) : initialTeamMembers;
            const currentUser = teamMembers.find((m: TeamMember) => m.username === username);

            if (currentUser) {
                setAuthState({ isLoading: false, isAuthenticated: true, user: currentUser });
            } else {
                localStorage.removeItem('isAdminAuthenticated');
                localStorage.removeItem('adminRole');
                localStorage.removeItem('adminUsername');
                setAuthState({ isLoading: false, isAuthenticated: false, user: null });
            }
        } else {
            setAuthState({ isLoading: false, isAuthenticated: false, user: null });
        }
    }, []);

    const hasPermission = React.useCallback((module: keyof Permissions, level: 'view' | 'edit'): boolean => {
        const { user } = authState;
        if (!user) return false;
        
        if (user.role === 'admin') return true;
        
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
