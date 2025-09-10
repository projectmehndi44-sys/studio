
import { getDb } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { Artist, Booking, Customer, MasterServicePackage, PayoutHistory, TeamMember, Notification, Promotion } from '@/types';
import { teamMembers as initialTeamMembers } from './team-data';


// Generic function to get a single document
async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    const db = await getDb();
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return { id: docSnap.id, ...data } as T;
}

// Generic function to get a config document
async function getConfigDocument<T>(docId: string): Promise<T | null> {
    const db = await getDb();
    const docRef = doc(db, 'config', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.hasOwnProperty('packages')) return data.packages as T;
        if (data && data.hasOwnProperty('members')) return data.members as T;
        if (data && data.hasOwnProperty('promos')) return data.promos as T;
        if (data && data.hasOwnProperty('locations')) return data.locations as T;
        return data as T; // Fallback for flat config docs
    }
    return null;
}

// Generic function to set a config document
async function setConfigDocument(docId: string, data: any): Promise<void> {
    const db = await getDb();
    const docRef = doc(db, 'config', docId);
    
    let dataToSet = data;
    if(docId === 'teamMembers') dataToSet = { members: data };
    else if (docId === 'masterServices') dataToSet = { packages: data };
    else if (docId === 'promotions') dataToSet = { promos: data };
    else if (docId === 'availableLocations') dataToSet = { locations: data };
    
    await setDoc(docRef, dataToSet);
}


// --- Listener Functions for Real-Time Data ---

export const listenToCollection = <T>(collectionName: string, callback: (data: T[]) => void): Unsubscribe => {
    let unsub: Unsubscribe = () => {};
    getDb().then(db => {
        // Special handling for config collections
        if (['masterServices', 'teamMembers', 'promotions', 'availableLocations'].includes(collectionName)) {
             unsub = onSnapshot(doc(db, "config", collectionName), (docSnap) => {
                 if (docSnap.exists()) {
                    const data = docSnap.data();
                    let result: T[] = [];
                    if (collectionName === 'masterServices' && data.packages) result = data.packages;
                    else if (collectionName === 'teamMembers' && data.members) result = data.members;
                    else if (collectionName === 'promotions' && data.promos) result = data.promos;
                    else if (collectionName === 'availableLocations' && data.locations) result = data.locations as any; // This is an object, not array
                    callback(result);
                 }
             });
        } else {
             const q = query(collection(db, collectionName));
            unsub = onSnapshot(q, (querySnapshot) => {
                const data: T[] = querySnapshot.docs.map(doc => {
                    const docData = doc.data();
                    // Convert Firestore Timestamps to JS Dates for client-side consistency
                    Object.keys(docData).forEach(key => {
                        if (docData[key] instanceof Timestamp) {
                            docData[key] = docData[key].toDate();
                        } else if (Array.isArray(docData[key])) {
                            docData[key] = docData[key].map(item => item instanceof Timestamp ? item.toDate() : item);
                        }
                    });
                    return { id: doc.id, ...docData } as T;
                });
                callback(data);
            }, (error) => {
                console.error(`Error listening to ${collectionName}: `, error);
            });
        }
    }).catch(error => {
        console.error("Failed to get DB for listener:", error);
    });
    return () => unsub();
};


// --- Specific Functions ---

// Artists
export const getArtist = async (id: string): Promise<Artist | null> => {
    const artist = await getDocument<Artist>('artists', id);
    if (artist && !artist.charges) {
        artist.charges = {};
    }
    return artist;
};
export const createArtist = async (id: string, data: Omit<Artist, 'id'>): Promise<string> => {
    const db = await getDb();
    const artistRef = doc(db, "artists", id);
    await setDoc(artistRef, data);
    return id;
};
export const updateArtist = async (id: string, data: Partial<Artist>): Promise<void> => {
    const db = await getDb();
    const artistRef = doc(db, "artists", id);
    await updateDoc(artistRef, data);
};
export const deleteArtist = async (id: string): Promise<void> => {
    const db = await getDb();
    const artistRef = doc(db, "artists", id);
    await deleteDoc(artistRef);
}


// Bookings
export const createBooking = async (data: Omit<Booking, 'id'>): Promise<string> => {
    const db = await getDb();
    const bookingsCollection = collection(db, "bookings");
    const docRef = await addDoc(bookingsCollection, data);
    return docRef.id;
};
export const updateBooking = async (id: string, data: Partial<Booking>): Promise<void> => {
    const db = await getDb();
    const bookingRef = doc(db, "bookings", id);
    await updateDoc(bookingRef, data);
};

// Customers
export const getCustomer = async (id: string): Promise<Customer | null> => getDocument<Customer>('customers', id);
export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    const db = await getDb();
    const q = query(collection(db, "customers"), where("phone", "==", phone));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
}
export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
    const db = await getDb();
    const q = query(collection(db, "customers"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Customer;
};
export const createCustomer = async (data: Omit<Customer, 'id'> & {id: string}): Promise<string> => {
    const db = await getDb();
    const customerId = data.id; // Use UID from Google or phone auth
    const customerRef = doc(db, "customers", customerId);
    const { id, ...dataToSave } = data;
    await setDoc(customerRef, dataToSave, { merge: true });
    return customerId;
};

// Config
export const getAvailableLocations = async (): Promise<Record<string, string[]>> => {
    return await getConfigDocument<Record<string, string[]>>('availableLocations') || {};
};
export const saveAvailableLocations = async (locations: Record<string, string[]>): Promise<void> => {
    await setConfigDocument('availableLocations', locations);
};

export const getCompanyProfile = async () => {
    return await getConfigDocument<any>('companyProfile') || {
        companyName: 'MehendiFy Platform',
        address: '123 Glamour Lane, Mumbai, MH, 400001',
        phone: '+91 98765 43210',
        email: 'contact@mehendify.com',
        gstin: '',
        website: 'https://www.mehendify.com',
        ownerName: 'Your Name'
    };
};
export const saveCompanyProfile = (data: any) => setConfigDocument('companyProfile', data);

export const getFinancialSettings = async () => {
    return await getConfigDocument<any>('financialSettings') || {
        platformFeePercentage: 10,
        platformRefundFee: 500,
    };
};
export const saveFinancialSettings = (data: any) => setConfigDocument('financialSettings', data);

export const getTeamMembers = async (): Promise<TeamMember[]> => {
    return await getConfigDocument<TeamMember[]>('teamMembers') || initialTeamMembers;
};
export const saveTeamMembers = (members: TeamMember[]) => setConfigDocument('teamMembers', members);

export const getPromotions = async (): Promise<Promotion[]> => {
    return await getConfigDocument<Promotion[]>('promotions') || [];
};
export const savePromotions = (promos: Promotion[]) => setConfigDocument('promotions', promos);


// Pending Artists
export const createPendingArtist = async (data: any): Promise<string> => {
    const db = await getDb();
    const pendingArtistsCollection = collection(db, "pendingArtists");
    const docRef = await addDoc(pendingArtistsCollection, data);
    return docRef.id;
};
export const deletePendingArtist = async (id: string): Promise<void> => {
    const db = await getDb();
    const artistRef = doc(db, "pendingArtists", id);
    await deleteDoc(artistRef);
};

// Notifications
export const createNotification = async (data: Omit<Notification, 'id'>): Promise<string> => {
    const db = await getDb();
    const notificationsCollection = collection(db, "notifications");
    const docRef = await addDoc(notificationsCollection, data);
    return docRef.id;
};


// Generic function to get a collection
export async function getCollection<T>(collectionName: string): Promise<T[]> {
  const db = await getDb();
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

export const getArtists = async (): Promise<Artist[]> => {
    const artists = await getCollection<Artist>('artists');
    return artists.map(artist => ({
        ...artist,
        charges: artist.charges || {}, // Ensure charges object exists
    }));
};
export const getBookings = async (): Promise<Booking[]> => getCollection<Booking>('bookings');
export const getCustomers = async (): Promise<Customer[]> => getCollection<Customer>('customers');

export const getMasterServices = async (): Promise<MasterServicePackage[]> => {
    const data = await getConfigDocument<MasterServicePackage[]>('masterServices') || [];
    return data;
};
