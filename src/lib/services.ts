

import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp, onSnapshot, Unsubscribe, runTransaction } from 'firebase/firestore';
import type { Artist, Booking, Customer, MasterServicePackage, PayoutHistory, TeamMember, Notification, Promotion, ImagePlaceholder, BenefitImage, HeroSettings } from '@/lib/types';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getFirebaseServices } from '@/firebase/init';
import { callFirebaseFunction } from '@/firebase/functions';
import { compressImage } from './utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { masterServicePackages, promotions, heroSettings, benefitImages as localBenefitImages } from './data';
import { INDIA_LOCATIONS } from './india-locations';
import { PlaceHolderImages } from './placeholder-images';

// Use the singleton instance of Firestore from the central firebase module
const { db, app } = getFirebaseServices();
const getDb = () => db;


// New function to upload images to Firebase Storage
export const uploadSiteImage = async (file: File, path: string, compress: boolean = true): Promise<string> => {
    const storage = getStorage(app);

    // Conditionally compress the image before uploading
    const fileToUpload = compress ? await compressImage(file) : file;
    
    // Use a unique name to prevent overwrites
    const fileName = `${Date.now()}-${fileToUpload.name.replace(/\s+/g, '-')}`;
    const storageRef = ref(storage, `${path}/${fileName}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, fileToUpload);
    
    // Get the permanent download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
};

// New function to delete images from Firebase Storage
export const deleteSiteImage = async (imageUrl: string): Promise<void> => {
    if (!imageUrl.includes('firebasestorage.googleapis.com')) {
        // Don't try to delete non-firebase images (like picsum)
        console.log("Skipping deletion for non-Firebase image.");
        return;
    }
    const storage = getStorage(app);
    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error: any) {
        // It's okay if the file doesn't exist.
        if (error.code === 'storage/object-not-found') {
            console.warn(`Image not found in storage, but proceeding with DB removal: ${imageUrl}`);
        } else {
            // For other errors, we should probably throw
            throw error;
        }
    }
}


// Generic function to get a single document
export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(getDb(), collectionName, id);
    
    try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as T;
    } catch (serverError) {
         const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // Re-throw the error to be caught by the caller
    }
}


// Generic function to get a config document
async function getConfigDocument<T>(docId: string): Promise<T | null> {
    const docRef = doc(getDb(), 'config', docId);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as T;
        }
        return null;
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
}


// REFACTORED: This function now calls a Cloud Function for secure writes.
export async function setConfigDocument(docId: string, configData: any): Promise<void> {
    try {
        // The data is passed directly, and the cloud function handles the structure.
        const result = await callFirebaseFunction('updateConfig', { docId, configData });
        if ((result.data as any)?.success === false) {
             throw new Error((result.data as any).message || 'Unknown function error');
        }
    } catch (error) {
        console.error(`Failed to update config for ${docId}:`, error);
        // The callable function will throw its own detailed error.
        // We re-throw it so the component's catch block can handle it.
        throw error;
    }
}


// --- Listener Functions for Real-Time Data ---

export const listenToCollection = <T>(collectionName: string, callback: (data: T[]) => void, q?: any): Unsubscribe => {
    const queryToUse = q || query(collection(getDb(), collectionName));
    const unsub = onSnapshot(queryToUse, (querySnapshot) => {
        const data: T[] = querySnapshot.docs.map(doc => {
            const docData = doc.data();
            // Convert Firestore Timestamps to JS Dates
            Object.keys(docData).forEach(key => {
                if (docData[key] instanceof Timestamp) {
                    docData[key] = (docData[key] as Timestamp).toDate();
                } else if (Array.isArray(docData[key])) {
                    docData[key] = docData[key].map(item => item instanceof Timestamp ? item.toDate() : item);
                }
            });
            return { id: doc.id, ...docData } as T;
        });
        callback(data);
    }, (serverError) => {
         const permissionError = new FirestorePermissionError({
            path: q ? `query on ${collectionName}` : collectionName,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        console.error(`Error listening to ${collectionName}: `, serverError);
    });
    return unsub;
};


// --- Specific Functions ---

// Artists
export const getArtist = async (id: string): Promise<Artist | null> => {
    const artist = await getDocument<Artist>('artists', id);
    if (!artist) return null;
    
    // Convert Timestamps to JS Dates for client-side consistency
    const data = artist as any;
     Object.keys(data).forEach(key => {
        if (data[key] instanceof Timestamp) {
            data[key] = (data[key] as Timestamp).toDate();
        } else if (Array.isArray(data[key])) {
            data[key] = data[key].map(item => item instanceof Timestamp ? item.toDate() : item);
        }
    });

    // Ensure charges is an object, even if it's empty.
    data.charges = data.charges || {};

    return data as Artist;
};
export const getArtistByEmail = async (email: string): Promise<Artist | null> => {
    const q = query(collection(getDb(), 'artists'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const doc = querySnapshot.docs[0];
    const data = doc.data();
     // Convert Firestore Timestamps to JS Dates
    Object.keys(data).forEach(key => {
        if (data[key] instanceof Timestamp) {
            data[key] = (data[key] as Timestamp).toDate();
        } else if (Array.isArray(data[key])) {
            data[key] = data[key].map(item => item instanceof Timestamp ? item.toDate() : item);
        }
    });
    return { id: doc.id, ...data } as Artist;
};

// This function is now just for client-side data shaping. The actual creation happens in a Cloud Function.
export const createArtistWithId = async (data: Omit<Artist, 'id'> & {id: string}): Promise<void> => {
    // This function will now call a cloud function to securely create an artist
    // For now, it will do nothing to prevent security rule violations from the client
    console.log("createArtistWithId should be a cloud function call.");
    // In a real scenario, you'd do:
    // await callFirebaseFunction('createArtist', { artistData: data });
};


export const updateArtist = async (id: string, data: Partial<Artist>): Promise<void> => {
    const artistRef = doc(getDb(), "artists", id);
    // This will be blocked by security rules. This action should be a Cloud Function.
    console.warn("Client-side artist update attempted. This should be a Cloud Function.");
};
export const deleteArtist = async (id: string): Promise<void> => {
    const artistRef = doc(getDb(), "artists", id);
    // This will be blocked by security rules. This action should be a Cloud Function.
    console.warn("Client-side artist delete attempted. This should be a Cloud Function.");
};


// Bookings
export const updateBooking = async (id: string, data: Partial<Booking>): Promise<void> => {
    // This is a secure operation that should be handled by a Cloud Function.
    // Client-side updates are disallowed by the new rules.
    await callFirebaseFunction('updateBookingStatus', { bookingId: id, ...data });
};

// Customers
export const getCustomer = async (id: string): Promise<Customer | null> => getDocument<Customer>('customers', id);
export const getCustomerByPhone = async (phone: string): Promise<Customer | null> => {
    const q = query(collection(getDb(), "customers"), where("phone", "==", phone));
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Customer;
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: `customers collection query`,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        return null;
    }
}
export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
    const q = query(collection(getDb(), "customers"), where("email", "==", email));
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return null;
        }
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Customer;
    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: `customers collection query`,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        return null;
    }
};
export const createCustomer = (data: Omit<Customer, 'id'> & {id: string}): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const customerId = data.id; // Use UID from Google or phone auth
        const customerRef = doc(getDb(), "customers", customerId);
        const { id, ...dataToSave } = data;
        const finalData = { ...dataToSave, status: 'Active', createdOn: Timestamp.now() };

        setDoc(customerRef, finalData, { merge: true })
            .then(() => resolve(customerId))
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: customerRef.path,
                    operation: 'create',
                    requestResourceData: finalData,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                reject(permissionError); // Reject the promise so the calling function knows it failed
            });
    });
};


export const updateCustomer = (id: string, data: Partial<Customer>): Promise<void> => {
     return new Promise(async (resolve, reject) => {
        const customerRef = doc(getDb(), "customers", id);
        
        updateDoc(customerRef, data)
            .then(() => resolve())
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: customerRef.path,
                    operation: 'update',
                    requestResourceData: data,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
                reject(permissionError);
            });
    });
};

export const deleteCustomer = async (id: string): Promise<void> => {
    const customerRef = doc(getDb(), "customers", id);
    deleteDoc(customerRef).catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: customerRef.path,
            operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
};


// Config
export const getPlaceholderImages = async (): Promise<ImagePlaceholder[]> => {
    return Promise.resolve(PlaceHolderImages);
};
export const savePlaceholderImages = (images: ImagePlaceholder[]) => setConfigDocument('placeholderImages', { placeholderImages: images });


export const getBenefitImages = async (): Promise<BenefitImage[]> => {
    // This now reads from the local data file instead of Firestore.
    return Promise.resolve(localBenefitImages);
};
export const saveBenefitImages = (images: BenefitImage[]) => setConfigDocument('benefitImages', { benefitImages: images } );

export const getPromotionalImage = async (): Promise<{ imageUrl: string } | null> => {
    return await getConfigDocument<{ imageUrl: string }>('promotionalImage');
};

export const savePromotionalImage = async (data: { imageUrl: string }): Promise<void> => {
    return setConfigDocument('promotionalImage', data);
};

export const getHeroSettings = async (): Promise<HeroSettings> => {
    return Promise.resolve(heroSettings);
};
export const saveHeroSettings = async (data: HeroSettings): Promise<void> => {
    await setConfigDocument('heroSettings', data);
};

export const getAvailableLocations = async (): Promise<Record<string, string[]>> => {
    const config = await getConfigDocument<{ locations: Record<string, string[]> }>('availableLocations');
    return config?.locations || INDIA_LOCATIONS; // Fallback to full list if not configured
};
export const saveAvailableLocations = (locations: Record<string, string[]>) => setConfigDocument('availableLocations', { locations });

export const getCompanyProfile = async () => {
    return await getConfigDocument<any>('companyProfile') || {
        companyName: 'UtsavLook',
        ownerName: 'Abhishek Jaiswal',
        address: '123 Glamour Lane, Mumbai, MH, 400001',
        phone: '+91 98765 43210',
        email: 'contact@utsavlook.com',
        gstin: '27ABCDE1234F1Z5',
        website: 'https://www.utsavlook.com',
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
    const querySnapshot = await getDocs(collection(getDb(), 'teamMembers'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as TeamMember);
};
export const saveTeamMembers = (members: TeamMember[]) => {
    const db = getDb();
    const batch = runTransaction(db, async (transaction) => {
        members.forEach(member => {
            const memberRef = doc(db, "teamMembers", member.id);
            transaction.set(memberRef, member);
        });
    });
    return batch;
};
export const addOrUpdateTeamMember = async (member: TeamMember) => {
    await callFirebaseFunction('addOrUpdateTeamMember', { memberData: member });
}
export const deleteTeamMember = async (id: string) => {
    await callFirebaseFunction('deleteTeamMember', { userId: id });
}


export const getPromotions = async (): Promise<Promotion[]> => {
    // This now reads from the local data file instead of Firestore.
    return Promise.resolve(promotions);
};

export const savePromotions = (promos: Promotion[]) => setConfigDocument('promotions', { promos });


// Pending Artists
export const createPendingArtist = async (data: any): Promise<string> => {
    const pendingArtistsCollection = collection(getDb(), "pendingArtists");
    const docRef = await addDoc(pendingArtistsCollection, data);
    return docRef.id;
};
export const deletePendingArtist = async (id: string): Promise<void> => {
    await callFirebaseFunction('deletePendingArtist', { pendingId: id });
};

// New secure data fetching functions
export const fetchCompletedBookings = async (): Promise<Booking[]> => {
    const result = await callFirebaseFunction('getCompletedBookings', {});
    return result.data as Booking[];
}

export const fetchPayoutHistory = async (): Promise<PayoutHistory[]> => {
    const result = await callFirebaseFunction('getPayoutHistory', {});
    return result.data as PayoutHistory[];
}


// To be DEPRECATED. Use listeners instead for performance.
async function getCollection<T>(collectionName: string): Promise<T[]> {
  const querySnapshot = await getDocs(collection(getDb(), collectionName));
  return querySnapshot.docs.map(doc => {
       const data = doc.data();
        // Convert Timestamps
        Object.keys(data).forEach(key => {
            if (data[key] instanceof Timestamp) {
                data[key] = (data[key] as Timestamp).toDate();
            } else if (Array.isArray(data[key])) {
                data[key] = data[key].map(item => item instanceof Timestamp ? item.toDate() : item);
            }
        });
        return { id: doc.id, ...data } as T;
  });
}

// DEPRECATED - use listeners instead.
export const getArtists = async (): Promise<Artist[]> => {
    const artists = await getCollection<Artist>('artists');
    return artists.map(artist => ({
        ...artist,
        charges: artist.charges || {}, // Ensure charges object exists
    }));
};
// DEPRECATED - use listeners instead.
export const getBookings = async (): Promise<Booking[]> => getCollection<Booking>('bookings');


export const getMasterServices = async (): Promise<MasterServicePackage[]> => {
    // This now reads from the local data file instead of Firestore.
    return Promise.resolve(masterServicePackages);
};
export const saveMasterServices = (packages: MasterServicePackage[]) => {
    // This now calls the secure cloud function to update the config.
    return setConfigDocument('masterServices', { packages });
};

export { getDb };
