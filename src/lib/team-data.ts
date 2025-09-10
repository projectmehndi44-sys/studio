
import type { Permissions } from "@/types";

export type TeamMember = {
    id: string;
    name: string;
    username: string;
    role: 'Super Admin' | 'team-member';
    permissions: Permissions;
};

export type PermissionLevel = 'edit' | 'view' | 'hidden';

export const PERMISSION_MODULES: { key: keyof Permissions, label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'artists', label: 'Artists' },
    { key: 'customers', label: 'Customers' },
    { key: 'artistDirectory', label: 'Artist Directory' },
    { key: 'payouts', label: 'Payouts' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'packages', label: 'Packages' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'settings', label: 'Settings (Promos, Locations etc.)' },
];


// This data is used to seed the Firestore database for team members if it's empty.
// The password is set in the login page's one-time setup effect.
export const teamMembers: TeamMember[] = [
    {
        id: 'user_001',
        name: 'Abhishek Soni',
        username: 'projectmehndi44@gmail.com',
        role: 'Super Admin',
        permissions: { // Admin has all rights by default, this is illustrative
            dashboard: 'edit',
            bookings: 'edit',
            artists: 'edit',
            customers: 'edit',
            artistDirectory: 'edit',
            payouts: 'edit',
            transactions: 'edit',
            packages: 'edit',
            settings: 'edit',
            notifications: 'edit',
        }
    }
];
