'use client';
import { collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, Firestore, doc, limit } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { WpConnection } from "./types";

export async function addOrUpdateConnection(
    db: Firestore,
    userId: string,
    connection: Omit<WpConnection, 'id' | 'lastUsed'>
) {
    if (!userId) return;

    const connectionsRef = collection(db, 'users', userId, 'connections');
    const q = query(
        connectionsRef, 
        where("wpUrl", "==", connection.wpUrl), 
        where("wpUsername", "==", connection.wpUsername),
        limit(1)
    );

    try {
        const querySnapshot = await getDocs(q);
        const dataToUpdate = { ...connection, lastUsed: serverTimestamp() };

        if (!querySnapshot.empty) {
            // Update existing connection
            const docId = querySnapshot.docs[0].id;
            const docRef = doc(db, 'users', userId, 'connections', docId);
            updateDoc(docRef, dataToUpdate)
                .catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                      path: docRef.path,
                      operation: 'update',
                      requestResourceData: dataToUpdate,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
        } else {
            // Add new connection
            addDoc(connectionsRef, dataToUpdate)
                .catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                      path: connectionsRef.path,
                      operation: 'create',
                      requestResourceData: dataToUpdate,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                });
        }
    } catch (error) {
        console.error("Error adding or updating connection:", error);
        // Don't throw, as this is a background task.
    }
}
