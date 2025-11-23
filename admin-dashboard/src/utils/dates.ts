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

// Format date in UTC to avoid timezone shifts (off-by-one error)
export function formatDateUTC(dateInput: Date | string | any): string {
    if (!dateInput) return '';
    const date = firestoreTimestampToDate(dateInput);
    return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
}

