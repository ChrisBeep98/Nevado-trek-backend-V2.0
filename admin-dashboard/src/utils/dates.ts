// Utility function to convert Firestore timestamps to JavaScript Date objects
export function firestoreTimestampToDate(timestamp: any): Date {
    if (typeof timestamp === 'string') {
        return new Date(timestamp);
    }
    if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
        return new Date(timestamp._seconds * 1000);
    }
    return new Date(timestamp);
}
