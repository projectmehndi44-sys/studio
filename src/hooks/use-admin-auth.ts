
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { teamMembers as initialTeamMembers, TeamMember } from '@/lib/team-data';

interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: TeamMember | null;
}

export function useAdminAuth(): AuthState {
    const [authState, setAuthState] = React.useState<AuthState>({
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
                const teamMembers = teamMembersData ? JSON.parse(teamMembersData) : initialTeamMembers;
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

    return authState;
}
