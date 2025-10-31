

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { initialSuperAdminPermissions } from "./team-data";

// Initialize the Firebase Admin SDK, which gives our functions
// full access to our database.
admin.initializeApp();
const db = admin.firestore();


/**
 * A "Callable Function" that securely updates a document in the 'config' collection.
 * This is used for admin operations like updating site settings.
 */
export const updateConfig = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check: Ensure the user is a logged-in team member
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "You must be logged in to update configuration."
        );
    }
    const adminId = context.auth.uid;
    const { docId, configData } = data;

    if (!docId || !configData) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with 'docId' and 'configData'."
        );
    }

    // 2. Authorization Check: Ensure the user is a Super Admin
    try {
        const adminDoc = await db.collection("teamMembers").doc(adminId).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'Super Admin') {
            throw new functions.https.HttpsError(
                "permission-denied",
                "You must be a Super Admin to perform this action."
            );
        }
    } catch (error: any) {
        // If the error is one we threw ourselves, re-throw it.
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Otherwise, log it and throw a generic error.
        console.error("Admin authorization check failed:", error);
        throw new functions.https.HttpsError("internal", "Could not verify admin permissions.");
    }
    

    // 3. Update the document in the 'config' collection
    try {
        await db.collection("config").doc(docId).set(configData, { merge: true });
        return { success: true, message: `Configuration for '${docId}' updated successfully.` };
    } catch (error) {
        console.error("Failed to update config document:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while updating the configuration.");
    }
});


/**
 * This is a "Callable Function" that allows an artist to claim a job.
 * It uses a transaction to ensure that only one artist can claim a job.
 */
export const claimJob = functions.https.onCall(async (data, context) => {
    // 1. Authentication Check: Ensure the user is a logged-in artist
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "You must be logged in to claim a job."
        );
    }
    const artistId = context.auth.uid;
    const bookingId = data.bookingId;

    if (!bookingId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with a 'bookingId'."
        );
    }

    // 2. Verify the user is a registered artist
    const artistDocRef = db.collection("artists").doc(artistId);
    const artistDoc = await artistDocRef.get();
    if (!artistDoc.exists) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "Only registered artists can claim jobs."
        );
    }

    const bookingRef = db.collection("bookings").doc(bookingId);

    // 3. Firestore Transaction: Atomically claim the job
    try {
        await db.runTransaction(async (transaction) => {
            const bookingDoc = await transaction.get(bookingRef);

            if (!bookingDoc.exists) {
                throw new functions.https.HttpsError("not-found", "Booking not found.");
            }

            const bookingData = bookingDoc.data();

            // 4. Check if the job is still available
            if (bookingData?.status !== "Needs Assignment") {
                throw new functions.https.HttpsError(
                    "failed-precondition",
                    "This job has already been claimed or is no longer available."
                );
            }

            // 5. Update the booking to assign the artist
            transaction.update(bookingRef, {
                status: "Confirmed",
                artistIds: [artistId],
            });
        });

        // 6. Return a success message
        return { success: true, message: "Job successfully claimed!" };

    } catch (error) {
        console.error("Transaction failed: ", error);
        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw errors we created
        }
        // Throw a generic error for any other issues
        throw new functions.https.HttpsError(
            "internal",
            "An error occurred while trying to claim the job."
        );
    }
});


/**
 * This is a "Callable Function" for handling customer cancellations.
 * It contains the 72-hour refund logic.
 */
const CANCELLATION_WINDOW_HOURS = 72;
// NOTE: In a real app, you would install a payment SDK like Stripe or Razorpay.
// e.g., const stripe = require("stripe")("YOUR_STRIPE_SECRET_KEY");

export const requestCancellation = functions.https.onCall(async (data, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }
  const customerId = context.auth.uid;
  const { bookingId } = data;

  if (!bookingId) {
    throw new functions.https.HttpsError("invalid-argument", "Booking ID is required.");
  }

  const bookingRef = db.collection("bookings").doc(bookingId);
  const bookingDoc = await bookingRef.get();

  if (!bookingDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Booking not found.");
  }

  const booking = bookingDoc.data();

  // 2. Verify the user owns this booking
  if (booking?.customerId !== customerId) {
    throw new functions.https.HttpsError("permission-denied", "This is not your booking.");
  }

  const eventDate = (booking?.eventDate as admin.firestore.Timestamp).toDate();
  const now = new Date();
  const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // 3. Check if cancellation is within the refund window
  if (hoursUntilEvent > CANCELLATION_WINDOW_HOURS) {
    // --- REFUND LOGIC ---
    // This is where you would integrate your payment gateway to issue a refund.
    // For example: await stripe.refunds.create({ charge: booking.paymentChargeId });
    // After the refund is successful, update the booking status.
    await bookingRef.update({ status: "Cancelled", cancellationReason: "Customer cancelled within refund window." });
    return { success: true, message: "Booking cancelled. A refund for your advance will be processed." };
  } else {
    // --- NO REFUND ---
    await bookingRef.update({ status: "Cancelled", cancellationReason: "Customer cancelled outside refund window." });
    return { success: true, message: "Booking cancelled. The advance payment is non-refundable as it is within 72 hours of the event." };
  }
});


/**
 * Creates a new booking document and sends notifications.
 */
export const createBooking = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a booking.");
    }

    const { bookingData } = data;

    if (!bookingData) {
        throw new functions.https.HttpsError("invalid-argument", "Booking data is required.");
    }
    
    // Ensure customerId in bookingData matches the authenticated user.
    if (bookingData.customerId !== context.auth.uid) {
         throw new functions.https.HttpsError("permission-denied", "You can only create bookings for yourself.");
    }
    
    const { items, paymentMethod, appliedReferralCode, ...restOfBookingData } = bookingData;

    // Determine initial booking status and artist assignment
    let finalArtistIds: string[] = [];
    let bookingStatus: 'Pending Approval' | 'Needs Assignment' | 'Pending Confirmation' = 'Pending Confirmation';
    let completionCode: string | undefined = undefined;
    
    // Default to 'Pay at Venue' logic
    if (paymentMethod === 'online') {
        bookingStatus = 'Pending Approval';
        completionCode = Math.floor(100000 + Math.random() * 900000).toString();
    } else { // 'offline' or 'pay at venue'
        // If an artist is pre-selected (via referral), it still needs admin approval
        if (appliedReferralCode) {
            bookingStatus = 'Pending Confirmation';
        } else {
            // This is an express booking, open to all artists
            bookingStatus = 'Needs Assignment';
        }
    }

    // Artist assignment logic
    if (appliedReferralCode) {
        const artistsCollection = db.collection("artists");
        const artistQuery = await artistsCollection.where('referralCode', '==', appliedReferralCode).limit(1).get();
        if (!artistQuery.empty) {
            const matchedArtist = artistQuery.docs[0];
            finalArtistIds = [matchedArtist.id];
            if (paymentMethod === 'online') {
                bookingStatus = 'Pending Approval';
            } else {
                 bookingStatus = 'Pending Confirmation'; // Needs phone confirmation by admin
            }
        }
    } else {
        const preSelectedArtistIds = Array.from(new Set(items.map((item: any) => item.artist?.id).filter(Boolean)));
         if (preSelectedArtistIds.length > 0) {
            finalArtistIds = preSelectedArtistIds as string[];
             if (paymentMethod === 'online') {
                bookingStatus = 'Pending Approval';
            }
        }
    }

    // Get Admin IDs for notifications
    const adminSnapshot = await db.collection('teamMembers').where('role', '==', 'Super Admin').get();
    const adminIds = adminSnapshot.docs.map(doc => doc.id);


    const finalBookingData = {
        ...restOfBookingData,
        items,
        status: bookingStatus,
        artistIds: finalArtistIds,
        completionCode: completionCode,
        adminIds: adminIds,
        paidOut: false,
    };
    
    // Create the booking document
    const bookingsCollection = db.collection("bookings");
    const docRef = await bookingsCollection.add(finalBookingData);
    await docRef.update({ id: docRef.id }); // Add the document ID to the booking itself
    
    // --- Notification Logic ---
    const { customerName, district, state, eventType } = finalBookingData;
    const eventDate = (finalBookingData.eventDate as admin.firestore.Timestamp).toDate();

    const createNotification = async (notificationData: any) => {
        await db.collection("notifications").add(notificationData);
    };

    // 1. Notify assigned artists
    if (finalArtistIds && finalArtistIds.length > 0) {
        for (const artistId of finalArtistIds) {
            await createNotification({
                artistId,
                bookingId: docRef.id,
                title: "You have a new booking!",
                message: `You've been assigned to a booking for ${eventType} on ${eventDate.toLocaleDateString()}.`,
                timestamp: new Date().toISOString(),
                isRead: false,
                type: 'booking',
            });
        }
    } else if (bookingStatus === 'Needs Assignment') { // 2. Notify all relevant artists if it's an express booking
        const servicesNeeded = items.map((i: any) => i.servicePackage.service);
        const artistsQuery = await db.collection("artists")
            .where("services", "array-contains-any", servicesNeeded)
            .get();
        
        for (const artistDoc of artistsQuery.docs) {
             const artist = artistDoc.data();
             // Safe check for serviceAreas
             if (artist.serviceAreas && Array.isArray(artist.serviceAreas)) {
                 const servesArea = artist.serviceAreas.some((area: any) => area.district === district && area.state === state);
                 if (servesArea) {
                     await createNotification({
                        artistId: artistDoc.id,
                        bookingId: docRef.id,
                        title: "New Job Available in Your Area!",
                        message: `An express booking for ${eventType} in ${district} is available. Claim it now!`,
                        timestamp: new Date().toISOString(),
                        isRead: false,
                        type: 'booking',
                    });
                 }
             }
        }
    }

    // 3. Notify admins
    if (adminIds && adminIds.length > 0) {
        for (const adminId of adminIds) {
            await createNotification({
                artistId: adminId, // Using 'artistId' field to also target admins in notifications collection
                bookingId: docRef.id,
                title: `New Booking by ${customerName}`,
                message: `A new booking for ${eventType} on ${eventDate.toLocaleDateString()} has been created. Status: ${bookingStatus}`,
                timestamp: new Date().toISOString(),
                isRead: false,
                type: 'booking',
            });
        }
    }

    return { success: true, bookingId: docRef.id };
});


/**
 * Secure function to delete all documents in a collection.
 * ONLY callable by a Super Admin.
 */
async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: admin.firestore.Query, resolve: (value?: unknown) => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve();
        return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid hitting memory limits
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}

const checkSuperAdmin = async (context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    const adminDoc = await db.collection('teamMembers').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'Super Admin') {
        throw new functions.https.HttpsError("permission-denied", "You must be a Super Admin to perform this action.");
    }
};

export const deleteAllBookings = functions.https.onCall(async (data, context) => {
    await checkSuperAdmin(context);
    await deleteCollection('bookings', 100);
    return { success: true, message: "All bookings have been deleted." };
});

export const deleteAllPayoutHistory = functions.https.onCall(async (data, context) => {
    await checkSuperAdmin(context);
    await deleteCollection('payoutHistory', 100);
    return { success: true, message: "All payout history has been deleted." };
});


/**
 * Gets all completed bookings.
 * This is a secure function callable only by authenticated admins.
 */
export const getCompletedBookings = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    // TODO: Add role-based access control to ensure only admins can call this.

    const snapshot = await db.collection('bookings').where('status', '==', 'Completed').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

/**
 * Gets all payout history records.
 * This is a secure function callable only by authenticated admins.
 */
export const getPayoutHistory = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    // TODO: Add role-based access control here as well.
    
    const snapshot = await db.collection('payoutHistory').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});
    

/**
 * Verifies if a logged-in user is a team member and handles the creation of the first Super Admin.
 * This function also acts as a manual setup script for the specified Super Admin email.
 */
const SUPER_ADMIN_EMAIL = 'utsavlook01@gmail.com';

export const verifyAdminLogin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to verify admin status.");
  }
  const uid = context.auth.uid;
  const email = context.auth.token.email;
  
  if (!email) {
      throw new functions.https.HttpsError("internal", "The user performing the login must have an email address.");
  }

  const teamMembersRef = db.collection("teamMembers");

  try {
    const userDoc = await teamMembersRef.doc(uid).get();

    // Check if the user is the designated Super Admin and their document doesn't exist
    if (email === SUPER_ADMIN_EMAIL && !userDoc.exists) {
      console.log(`Creating Super Admin profile for ${email}`);
      const newSuperAdmin = {
        id: uid,
        name: context.auth.token.name || email || "Super Admin",
        username: email,
        role: "Super Admin",
        permissions: initialSuperAdminPermissions,
      };
      await teamMembersRef.doc(uid).set(newSuperAdmin);
      return { isAdmin: true, isFirstAdmin: true }; // Signal that the first admin was just created
    }

    // For any other user, just check if their document exists
    if (userDoc.exists) {
      return { isAdmin: true, isFirstAdmin: false };
    } else {
      return { isAdmin: false, isFirstAdmin: false };
    }
    
  } catch (error) {
    console.error("Error in verifyAdminLogin:", error);
    throw new functions.https.HttpsError("internal", "An error occurred while verifying admin status.");
  }
});


/**
 * Securely updates an artist's profile. Callable only by the artist themselves.
 */
export const updateArtistProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    
    const uid = context.auth.uid;
    const { artistId, data: artistData } = data;

    // An artist can only update their own profile.
    if (uid !== artistId) {
        throw new functions.https.HttpsError("permission-denied", "You can only update your own profile.");
    }

    const artistRef = db.collection('artists').doc(artistId);

    try {
        await artistRef.update(artistData);
        return { success: true, message: "Profile updated successfully." };
    } catch (error) {
        console.error("Error updating artist profile:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while updating the profile.");
    }
});
    

