
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { Artist, Booking, Customer, MasterServicePackage, PayoutHistory, TeamMember, Notification, Promotion } from '@/types';
import { teamMembers as initialTeamMembers } from './team-data';


// Generic function to get a single document
async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as unknown as T) : null;
}

// Generic function to get a config document
async function getConfigDocument<T>(docId: string, defaultValue: T): Promise<T> {
    const docRef = doc(db, 'config', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // The nested key is the same as the docId, but plural
        const nestedKey = `${docId}s`;
        if (data && data[nestedKey]) {
            return data[nestedKey] as T;
        }
        // Handle cases like masterServices where the key is different ('packages')
        if (data && data.packages) {
            return data.packages as T;
        }
        if (data && data.members) {
            return data.members as T;
        }
         if (data && data.promos) {
            return data.promos as T;
        }
        // Fallback for flat config docs like companyProfile
        return docSnap.data() as T;
    }
    // If it doesn't exist, create it with the default value
    await setDoc(docRef, defaultValue);
    return defaultValue as T;
}

// Generic function to set a config document
async function setConfigDocument(docId: string, data: any): Promise<void> {
    const docRef = doc(db, 'config', docId);
    await setDoc(docRef, data);
}


// --- Listener Functions for Real-Time Data ---

export const listenToCollection = <T>(collectionName: string, callback: (data: T[]) => void): Unsubscribe => {
    // Special cases for data stored in single docs within 'config'
    const configCollections = ['masterServices', 'teamMembers', 'promotions'];
    if (configCollections.includes(collectionName)) {
        const docId = collectionName;
        const docRef = doc(db, 'config', docId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Data is nested under a key, e.g., { packages: [] } or { members: [] }
                const key = collectionName === 'masterServices' ? 'packages' : (collectionName === 'teamMembers' ? 'members' : 'promos');
                callback(data[key] || []);
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
    return id;
};
export const updateArtist = async (id: string, data: Partial<Artist>): Promise<void> => {
    const artistRef = doc(db, "artists", id);
    await updateDoc(artistRef, data);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }
};
export const deleteArtist = async (id: string): Promise<void> => {
    const artistRef = doc(db, "artists", id);
    await deleteDoc(artistRef);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
    }
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
    const config = await getConfigDocument<{ locations: Record<string, string[]> }>('availableLocations', { locations: {} });
    return config.locations;
};
export const getCompanyProfile = async () => {
    return getConfigDocument('companyProfile', {
        companyName: 'MehendiFy Platform',
        address: '123 Glamour Lane, Mumbai, MH, 400001',
        phone: '+91 98765 43210',
        email: 'contact@mehendify.com',
        gstin: '',
        website: 'https://www.mehendify.com',
    });
};
export const saveCompanyProfile = (data: any) => setConfigDocument('companyProfile', data);

export const getFinancialSettings = async () => {
    return getConfigDocument('financialSettings', {
        platformFeePercentage: 10,
        platformRefundFee: 500,
    });
};
export const saveFinancialSettings = (data: any) => setConfigDocument('financialSettings', data);

export const getTeamMembers = async (): Promise<TeamMember[]> => {
    const data = await getConfigDocument<{ members: TeamMember[] }>('teamMembers', { members: initialTeamMembers });
    return data.members || initialTeamMembers;
};
export const saveTeamMembers = (members: TeamMember[]) => setConfigDocument('teamMembers', { members });

export const getPromotions = async (): Promise<Promotion[]> => {
    const data = await getConfigDocument<{ promos: Promotion[] }>('promotions', { promos: [] });
    return data.promos || [];
};
export const savePromotions = (promos: Promotion[]) => setConfigDocument('promotions', { promos });


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

// Notifications
export const createNotification = async (data: Omit<Notification, 'id'>): Promise<string> => {
    const notificationsCollection = collection(db, "notifications");
    const docRef = await addDoc(notificationsCollection, data);
    return docRef.id;
};


// Generic function to get a collection
export async function getCollection<T>(collectionName: string): Promise<T[]> {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

export const getArtists = async (): Promise<Artist[]> => getCollection<Artist>('artists');
export const getBookings = async (): Promise<Booking[]> => getCollection<Booking>('bookings');
export const getCustomers = async (): Promise<Customer[]> => getCollection<Customer>('customers');

export const getMasterServices = async (): Promise<MasterServicePackage[]> => {
    const docSnap = await getDoc(doc(db, "config", "masterServices"));
    if (docSnap.exists()) {
        return docSnap.data().packages || [];
    }
    return [];
};
