

'use client';

import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { Artist, Booking, Customer, MasterServicePackage, PayoutHistory, TeamMember } from '@/types';


// Generic function to get a single document
async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as unknown as T) : null;
}

// --- Listener Functions for Real-Time Data ---

export const listenToCollection = <T>(collectionName: string, callback: (data: T[]) => void): Unsubscribe => {
    // Special case for masterServices which is a single doc in the 'config' collection
    if (collectionName === 'masterServices') {
        const docRef = doc(db, 'config', 'masterServices');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                callback(data.packages || []);
            } else {
                callback([]);
            }
        }, (error) => {
            console.error(`Error listening to ${collectionName}: `, error);
        });
        return unsubscribe;
    }


    const q = query(collection(db, collectionName));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data: T[] = querySnapshot.docs.map(doc => {
            const docData = doc.data();
            // Basic date conversion for top-level fields, can be expanded
            if (docData.date && docData.date instanceof Timestamp) {
                docData.date = docData.date.toDate();
            }
             if (docData.eventDate && docData.eventDate instanceof Timestamp) {
                docData.eventDate = docData.eventDate.toDate();
            }
             if (docData.serviceDates && Array.isArray(docData.serviceDates)) {
                docData.serviceDates = docData.serviceDates.map(d => (d instanceof Timestamp ? d.toDate() : d));
            }
             if (docData.submissionDate && docData.submissionDate instanceof Timestamp) {
                docData.submissionDate = docData.submissionDate.toDate();
            }
             if (docData.paymentDate && docData.paymentDate instanceof Timestamp) {
                docData.paymentDate = docData.paymentDate.toDate();
            }
            return { id: doc.id, ...docData } as T;
        });
        callback(data);
    }, (error) => {
        console.error(`Error listening to ${collectionName}: `, error);
        // You could also have a global error state update here
    });
    return unsubscribe;
};


// --- Specific Functions ---

// Artists
export const getArtist = async (id: string): Promise<Artist | null> => getDocument<Artist>('artists', id);
export const createArtist = async (id: string, data: Omit<Artist, 'id'>): Promise<string> => {
    // Use email as the document ID for artists created via admin onboarding
    const artistRef = doc(db, "artists", id);
    await setDoc(artistRef, data);
    window.dispatchEvent(new Event('storage'));
    return id;
};
export const updateArtist = async (id: string, data: Partial<Artist>): Promise<void> => {
    const artistRef = doc(db, "artists", id);
    await updateDoc(artistRef, data);
    window.dispatchEvent(new Event('storage'));
};
export const deleteArtist = async (id: string): Promise<void> => {
    const artistRef = doc(db, "artists", id);
    await deleteDoc(artistRef);
    window.dispatchEvent(new Event('storage'));
}


// Bookings
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
export const getCustomer = async (id: string): Promise<Customer | null> => getDocument<Customer>('customers', id);
export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    const q = query(collection(db, "customers"), where("phone", "==", phone));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
}
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
    const customerId = data.id || data.phone; // Use UID from Google or phone number
    const customerRef = doc(db, "customers", customerId);
    await setDoc(customerRef, { ...data }, { merge: true });
    return customerId;
};

// Config
export const getAvailableLocations = async (): Promise<Record<string, string[]>> => {
    const docSnap = await getDoc(doc(db, "config", "availableLocations"));
    return docSnap.exists() ? docSnap.data().locations : {};
};

// Pending Artists
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
    window.dispatchEvent(new Event('storage'));
    return data.id;
};
