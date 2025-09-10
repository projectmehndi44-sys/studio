
'use client';

import type { Artist, Booking, Customer, MasterServicePackage, Notification, PayoutHistory, Promotion, TeamMember } from '@/types';
import { artists as initialArtists, allBookings as initialBookings, initialCustomers } from './data';
import { masterServices as initialMasterServices } from './packages-data';
import { teamMembers as initialTeamMembers } from './team-data';
import { AVAILABLE_LOCATIONS } from './available-locations';

// Helper function to get data from localStorage or return initial data
function getFromStorage<T>(key: string, initialData: T[]): T[] {
    if (typeof window === 'undefined') {
        return initialData;
    }
    const storedData = localStorage.getItem(key);
    if (storedData) {
        try {
            return JSON.parse(storedData);
        } catch (e) {
            console.error(`Failed to parse ${key} from localStorage`, e);
            return initialData; // fallback to initial data on parsing error
        }
    }
    return initialData;
}

// Helper to combine initial data with localStorage data, prioritizing localStorage
function getCombinedData<T extends { id: string }>(storageKey: string, initialData: T[]): T[] {
    const storedItems = getFromStorage<T>(storageKey, []);
    const initialItems = initialData;

    const allItemsMap = new Map<string, T>();
    
    // First, add all initial items to the map
    initialItems.forEach(item => {
        allItemsMap.set(item.id, item);
    });

    // Then, overwrite with any stored items (which might be updated versions or new items)
    storedItems.forEach(item => {
        allItemsMap.set(item.id, item);
    });

    return Array.from(allItemsMap.values());
}


// --- Specific Functions ---

// Artists
export const getArtists = async (): Promise<Artist[]> => {
    return Promise.resolve(getCombinedData<Artist>('artists', initialArtists));
};

export const getArtist = async (id: string): Promise<Artist | null> => {
    const artists = await getArtists();
    return Promise.resolve(artists.find(a => a.id === id) || null);
};

export const updateArtist = async (id: string, data: Partial<Artist>): Promise<void> => {
    let artists = await getArtists();
    const artistIndex = artists.findIndex(a => a.id === id);
    if (artistIndex !== -1) {
        artists[artistIndex] = { ...artists[artistIndex], ...data };
        localStorage.setItem('artists', JSON.stringify(artists));
    }
    return Promise.resolve();
};

// Bookings
export const getBookings = async (): Promise<Booking[]> => {
    return Promise.resolve(getCombinedData<Booking>('bookings', initialBookings));
};
export const createBooking = async (data: Booking): Promise<string> => {
    const bookings = await getBookings();
    const newBookings = [data, ...bookings];
    localStorage.setItem('bookings', JSON.stringify(newBookings));
    return Promise.resolve(data.id);
};
export const updateBooking = async (id: string, data: Partial<Booking>): Promise<void> => {
    let bookings = await getBookings();
    const bookingIndex = bookings.findIndex(b => b.id === id);
    if (bookingIndex !== -1) {
        bookings[bookingIndex] = { ...bookings[bookingIndex], ...data };
        localStorage.setItem('bookings', JSON.stringify(bookings));
    }
     return Promise.resolve();
};

// Customers
export const getCustomers = async (): Promise<Customer[]> => {
    return Promise.resolve(getCombinedData<Customer>('customers', initialCustomers));
};

export const getCustomer = async (id: string): Promise<Customer | null> => {
    const customers = await getCustomers();
    return Promise.resolve(customers.find(c => c.id === id) || null);
};

export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
    const customers = await getCustomers();
    return Promise.resolve(customers.find(c => c.email === email) || null);
};

export const createCustomer = async (data: Customer): Promise<string> => {
    const customers = await getCustomers();
    // Use phone as ID for manually created customers, otherwise use provided ID (e.g., from Google Auth)
    const newId = data.id || data.phone; 
    const newCustomer = { ...data, id: newId };
    const existingIndex = customers.findIndex(c => c.id === newId);
    
    if (existingIndex > -1) {
        customers[existingIndex] = newCustomer; // Update if exists
    } else {
        customers.push(newCustomer);
    }
    localStorage.setItem('customers', JSON.stringify(customers));
    return Promise.resolve(newId);
};


// General purpose settings/config from localStorage
export const getConfig = async <T>(configId: string, defaultValue: T): Promise<T> => {
    if (typeof window === 'undefined') {
        return Promise.resolve(defaultValue);
    }
    const storedValue = localStorage.getItem(configId);
    if (storedValue) {
        try {
            return Promise.resolve(JSON.parse(storedValue));
        } catch (e) {
            return Promise.resolve(defaultValue);
        }
    }
    return Promise.resolve(defaultValue);
}

export const saveConfig = async <T>(configId: string, value: T): Promise<void> => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(configId, JSON.stringify(value));
    }
    return Promise.resolve();
}


// Master Services
export const getMasterServices = async (): Promise<MasterServicePackage[]> => getConfig('masterServices', initialMasterServices);
export const saveMasterServices = async (services: MasterServicePackage[]): Promise<void> => saveConfig('masterServices', services);

// Available Locations
export const getAvailableLocations = async (): Promise<Record<string, string[]>> => getConfig('availableLocations', AVAILABLE_LOCATIONS);
export const saveAvailableLocations = async (locations: Record<string, string[]>): Promise<void> => saveConfig('availableLocations', locations);

// Team Members
export const getTeamMembers = async (): Promise<TeamMember[]> => getConfig('teamMembers', initialTeamMembers);
export const saveTeamMembers = async (members: TeamMember[]): Promise<void> => saveConfig('teamMembers', members);

// Promotions
export const getPromotions = async (): Promise<Promotion[]> => getConfig('promotions', []);
export const savePromotions = async (promos: Promotion[]): Promise<void> => saveConfig('promotions', promos);

// Company Profile
export const getCompanyProfile = async () => getConfig('companyProfile', {
    companyName: 'MehendiFy Platform',
    address: '123 Glamour Lane, Mumbai, MH, 400001',
    gstin: '',
});
export const saveCompanyProfile = async (profile: any): Promise<void> => saveConfig('companyProfile', profile);

// Financial Settings
export const getFinancialSettings = async () => getConfig('financialSettings', {
    platformFeePercentage: 10,
    platformRefundFee: 500
});
export const saveFinancialSettings = async (settings: any): Promise<void> => saveConfig('financialSettings', settings);


// Payouts
export const getPayoutHistory = async (): Promise<PayoutHistory[]> => getConfig('payoutHistory', []);
export const createPayoutHistory = async (data: PayoutHistory): Promise<string> => {
    const history = await getPayoutHistory();
    const newHistory = [data, ...history];
    await saveConfig('payoutHistory', newHistory);
    return Promise.resolve(data.id);
};


// Notifications
export const getNotifications = async (): Promise<Notification[]> => getConfig('notifications', []);
export const saveNotifications = async (notifications: Notification[]): Promise<void> => saveConfig('notifications', notifications);


// Pending Artists
export const getPendingArtists = async (): Promise<any[]> => getConfig('pendingArtists', []);
export const savePendingArtists = async (artists: any[]): Promise<void> => saveConfig('pendingArtists', artists);

// This is a minimal implementation to show the logic.
// In a real app, you might want more robust error handling or data validation.

