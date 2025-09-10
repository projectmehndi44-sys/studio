
'use client';

import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Artist, Booking, Customer, MasterServicePackage, Notification, PayoutHistory, Promotion, TeamMember } from '@/types';
import { artists as initialArtists } from './data';
import { masterServices as initialMasterServices } from './packages-data';
import { teamMembers as initialTeamMembers } from './team-data';
import { AVAILABLE_LOCATIONS } from './available-locations';

// This function can be used to one-time seed the initial data into Firestore.
// It should be called cautiously, e.g., from a protected admin route.
export const seedInitialData = async () => {
    console.log("Starting to seed data...");
    const artistsRef = collection(db, "artists");
    for (const artist of initialArtists) {
        await setDoc(doc(artistsRef, artist.id), artist);
    }
    console.log("Artists seeded.");

    const servicesRef = collection(db, "masterServices");
    for (const service of initialMasterServices) {
        await setDoc(doc(servicesRef, service.id), service);
    }
    console.log("Master services seeded.");
    
    const teamRef = collection(db, "teamMembers");
    for (const member of initialTeamMembers) {
        await setDoc(doc(teamRef, member.id), member);
    }
    console.log("Team members seeded.");

    // Seed config data in a 'config' collection
    const configRef = collection(db, "config");
    await setDoc(doc(configRef, "availableLocations"), { locations: AVAILABLE_LOCATIONS });
    console.log("Available locations seeded.");

    console.log("Data seeding complete.");
};

// Generic function to fetch a collection from Firestore
async function getCollection<T>(collectionName: string): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
}

// Generic function to get a single document
async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as unknown as T) : null;
}


// --- Specific Functions ---

// Artists
export const getArtists = async (): Promise<Artist[]> => getCollection<Artist>('artists');
export const getArtist = async (id: string): Promise<Artist | null> => getDocument<Artist>('artists', id);
export const updateArtist = async (id: string, data: Partial<Artist>): Promise<void> => {
    const artistRef = doc(db, "artists", id);
    await updateDoc(artistRef, data);
};

// Bookings
export const getBookings = async (): Promise<Booking[]> => {
    const bookings = await getCollection<Booking>('bookings');
    // Convert Firestore Timestamps to JS Dates
    return bookings.map(b => ({
        ...b,
        date: b.date ? (b.date as unknown as Timestamp).toDate() : new Date(),
        eventDate: b.eventDate ? (b.eventDate as unknown as Timestamp).toDate() : new Date(),
        serviceDates: b.serviceDates?.map(d => (d as unknown as Timestamp).toDate()) || [],
    }));
};

export const createBooking = async (data: Omit<Booking, 'id'>): Promise<string> => {
    const bookingsCollection = collection(db, "bookings");
    const docRef = await addDoc(bookingsCollection, data);
    return docRef.id;
};
export const updateBooking = async (id: string, data: Partial<Booking>): Promise<void> => {
    const bookingRef = doc(db, "bookings", id);
    await updateDoc(bookingRef, data);
};

// Customers
export const getCustomers = async (): Promise<Customer[]> => getCollection<Customer>('customers');
export const getCustomer = async (id: string): Promise<Customer | null> => getDocument<Customer>('customers', id);
export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
    const q = query(collection(db, "customers"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
};
export const createCustomer = async (data: Omit<Customer, 'id'> & {id?: string}): Promise<string> => {
    const customerId = data.id || data.phone;
    const customerRef = doc(db, "customers", customerId);
    await setDoc(customerRef, data, { merge: true }); // Merge to avoid overwriting if doc exists
    return customerId;
};

// Master Services
export const getMasterServices = async (): Promise<MasterServicePackage[]> => getCollection<MasterServicePackage>('masterServices');

// Team Members
export const getTeamMembers = async (): Promise<TeamMember[]> => getCollection<TeamMember>('teamMembers');

// Available Locations
export const getAvailableLocations = async (): Promise<Record<string, string[]>> => {
    const docSnap = await getDoc(doc(db, "config", "availableLocations"));
    return docSnap.exists() ? docSnap.data().locations : {};
};

// Pending Artists
export const getPendingArtists = async (): Promise<any[]> => getCollection('pendingArtists');
export const createPendingArtist = async (data: any): Promise<string> => {
     const pendingArtistsCollection = collection(db, "pendingArtists");
     const docRef = await addDoc(pendingArtistsCollection, data);
     return docRef.id;
};
export const deletePendingArtist = async (id: string): Promise<void> => {
    const artistRef = doc(db, "pendingArtists", id);
    await deleteDoc(artistRef);
};
export const createArtistFromPending = async (data: Artist): Promise<string> => {
    const artistRef = doc(db, "artists", data.id);
    await setDoc(artistRef, data);
    return data.id;
}
