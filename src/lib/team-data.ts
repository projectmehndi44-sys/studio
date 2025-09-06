
export type TeamMember = {
    id: string;
    name: string;
    username: string;
    password?: 'Abhi@123';
    role: 'admin' | 'team-member';
};

// In a real application, this data would be stored securely in a database.
// Passwords should always be hashed.
export const teamMembers: TeamMember[] = [
    {
        id: 'user_001',
        name: 'Abhishek Soni',
        username: 'admin',
        password: 'Abhi@123',
        role: 'admin',
    }
];
