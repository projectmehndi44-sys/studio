
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user'; // Use the specific user hook
import { getTeamMembers } from '@/lib/services';
import type { TeamMember, Permission, PermissionLevel } from '@/lib/types';
import { initialSuperAdminPermissions } from '@/lib/team-data';

interface AdminAuth {
  user: TeamMember | null;
  adminUser: TeamMember | null; // Keep for backward compatibility if needed
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (module: keyof TeamMember['permissions'], level: 'edit' | 'view') => boolean;
}

export const AdminAuthContext = React.createContext<AdminAuth | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
    const { user: authUser, isUserLoading: isAuthLoading } = useUser();
    const [adminUser, setAdminUser] = React.useState<TeamMember | null>(null);
    const [isCheckingAdmin, setIsCheckingAdmin] = React.useState(true);
    
    React.useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (!authUser) {
            setAdminUser(null);
            setIsCheckingAdmin(false);
            return;
        }

        const checkAdminStatus = async () => {
            const teamMembers = await getTeamMembers();
            const memberProfile = teamMembers.find(m => m.id === authUser.uid);
            
            // Logic for the very first user becoming Super Admin
            if (teamMembers.length === 0 && memberProfile === undefined) {
                 const newSuperAdmin: TeamMember = {
                    id: authUser.uid,
                    name: authUser.displayName || 'Super Admin',
                    username: authUser.email || '',
                    role: 'Super Admin',
                    permissions: initialSuperAdminPermissions,
                };
                // This is a simplified bootstrap. In a real app, this might be a secure Cloud Function.
                // For now, we assume the first login through the admin portal claims the role.
                setAdminUser(newSuperAdmin);
            } else {
                 setAdminUser(memberProfile || null);
            }
            setIsCheckingAdmin(false);
        };

        checkAdminStatus();

    }, [authUser, isAuthLoading]);

    const hasPermission = (module: keyof TeamMember['permissions'], level: 'edit' | 'view'): boolean => {
        if (!adminUser) return false;
        if (adminUser.role === 'Super Admin') return true;
        
        const userPermission = adminUser.permissions[module];
        if (level === 'edit') {
            return userPermission === 'edit';
        }
        if (level === 'view') {
            return userPermission === 'edit' || userPermission === 'view';
        }
        return false;
    };

    const value = { 
        user: adminUser, 
        adminUser,
        isAuthLoading: isAuthLoading || isCheckingAdmin,
        isAuthenticated: !!adminUser,
        hasPermission 
    };

    return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}


export function useAdminAuth(): AdminAuth {
  const context = React.useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
