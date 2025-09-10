
'use client';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, writeBatch, query, where, deleteDoc } from 'firebase/firestore';
import type { Artist, Booking, Customer, MasterServicePackage, Notification, PayoutHistory, Promotion, TeamMember } from '@/types';
import { artists as initialArtists, allBookings as initialBookings, initialCustomers } from './data';
import { masterServices as initialMasterServices } from './packages-data';
import { teamMembers as initialTeamMembers } from './team-data';
import { AVAILABLE_LOCATIONS } from './available-locations';


// A helper to check if a collection is empty and seed it if needed.
// This should be used cautiously to avoid re-seeding data.
async function seedCollection<T extends {id: string}>(collectionName: string, initialData: T[]) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    if (querySnapshot.empty) {
        console.log(`Seeding ${collectionName}...`);
        const batch = writeBatch(db);
        initialData.forEach(item => {
            const docRef = doc(db, collectionName, item.id);
            batch.set(docRef, item);
        });
        await batch.commit();
        return initialData;
    }
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}


// Generic fetch function
async function getCollection<T>(collectionName: string): Promise<T[]> {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
        console.error(`Error getting collection ${collectionName}:`, error);
        return [];
    }
}

// Generic set function
async function setDocument<T>(collectionName: string, id: string, data: T): Promise<void> {
    await setDoc(doc(db, collectionName, id), data);
}

// Generic add function
async function addDocument<T>(collectionName: string, data: T): Promise<string> {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
}


// --- Specific Functions ---

// Artists
export const getArtists = async (): Promise<Artist[]> => {
    // This seeds the data if the collection is empty.
    return seedCollection<Artist>('artists', initialArtists);
}
export const getArtist = async (id: string): Promise<Artist | null> => {
    const docRef = doc(db, 'artists', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Artist : null;
}
export const updateArtist = async (id: string, data: Partial<Artist>): Promise<void> => setDocument('artists', id, data);

// Bookings
export const getBookings = async (): Promise<Booking[]> => getCollection<Booking>('bookings');
export const createBooking = async (data: Booking): Promise<string> => addDocument('bookings', data);
export const updateBooking = async (id: string, data: Partial<Booking>): Promise<void> => setDocument('bookings', id, data);

// Customers
export const getCustomers = async (): Promise<Customer[]> => seedCollection('customers', initialCustomers);

export const getCustomer = async (id: string): Promise<Customer | null> => {
     const docRef = doc(db, 'customers', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Customer : null;
};
export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
    const q = query(collection(db, "customers"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docData = querySnapshot.docs[0];
    return { id: docData.id, ...docData.data() } as Customer;
}
export const createCustomer = async (data: Customer): Promise<string> => {
    // Since we use email as ID from Google Auth sometimes, we handle that here.
    if(data.id) {
        await setDoc(doc(db, "customers", data.id), data);
        return data.id;
    }
    const docRef = await addDoc(collection(db, "customers"), data);
    return docRef.id;
}


// General purpose settings/config
export const getConfig = async <T>(configId: string, defaultValue: T): Promise<T> => {
    const docRef = doc(db, 'config', configId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().value as T;
    }
    // If it doesn't exist, set the default value and return it
    await setDoc(docRef, { value: defaultValue });
    return defaultValue;
}

export const saveConfig = async <T>(configId: string, value: T): Promise<void> => {
    await setDoc(doc(db, 'config', configId), { value });
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
export const getPayoutHistory = async (): Promise<PayoutHistory[]> => getCollection<PayoutHistory>('payoutHistory');
export const createPayoutHistory = async (data: PayoutHistory): Promise<string> => addDocument('payoutHistory', data);


// Notifications
export const getNotifications = async (): Promise<Notification[]> => getCollection<Notification>('notifications');
export const createNotification = async (data: Notification): Promise<string> => addDocument('notifications', data);
export const updateNotification = async (id: string, data: Partial<Notification>): Promise<void> => setDocument('notifications', id, data);


// Pending Artists
export const getPendingArtists = async (): Promise<any[]> => getCollection('pendingArtists');
export const createPendingArtist = async (data: any): Promise<string> => addDocument('pendingArtists', data);
export const deletePendingArtist = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "pendingArtists", id));
}
