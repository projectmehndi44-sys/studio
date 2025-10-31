
'use client';

import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirebaseServices } from './init';

const { firebaseApp } = getFirebaseServices();
const functions = getFunctions(firebaseApp);

/**
 * A helper function to easily call a Firebase Cloud Function.
 * @param functionName The name of the callable function to execute.
 * @param data The data to pass to the function.
 * @returns The result from the Cloud Function.
 */
export const callFirebaseFunction = async (functionName: string, data: any) => {
    const callable = httpsCallable(functions, functionName);
    return callable(data);
};

export { functions };
