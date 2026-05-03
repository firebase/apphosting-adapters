'use client';
import { addDoc, collection, Firestore, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { HistoryEvent } from "./types";

export function addHistoryEvent(
    db: Firestore,
    userId: string,
    eventData: Omit<HistoryEvent, 'id' | 'timestamp'>
) {
    if (!userId) {
        console.error("Cannot add history event: user is not logged in.");
        return;
    }
    
    const historyCollectionRef = collection(db, 'users', userId, 'history');
    const dataToSave = {
        ...eventData,
        timestamp: serverTimestamp()
    };

    addDoc(historyCollectionRef, dataToSave)
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: historyCollectionRef.path,
              operation: 'create',
              requestResourceData: dataToSave,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
}
