

import type { Permissions } from '@/lib/types';

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



// This data is used to define permissions for a new Super Admin.
// It is no longer used to seed the database directly.
export const initialSuperAdminPermissions: Permissions = {
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
};

// This data is used to seed the Firestore database for team members if it's empty.
// The password is set in the login page's one-time setup effect.
export const initialTeamMembers: TeamMember[] = [
    // The initial user is now created entirely from the setup form to ensure IDs match.
    // This array is kept for structural reference but should not be relied upon for seeding.
];
