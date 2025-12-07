/**
 * Storage utility for simulating backend persistence with localStorage
 */

export const STORAGE_KEYS = {
    PENDING_REGISTRATIONS: 'simr_pending_registrations',
    ATTENDEES: 'simr_attendees',
    TREASURY: 'treasury_data'
};

// -- Pending Registrations --

export const getPendingRegistrations = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PENDING_REGISTRATIONS);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error reading pending registrations", e);
        return [];
    }
};

export const addPendingRegistration = (registration) => {
    try {
        const current = getPendingRegistrations();
        const newRegistration = {
            id: `REG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: 'pending',
            ...registration
        };
        const updated = [newRegistration, ...current];
        localStorage.setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, JSON.stringify(updated));
        return newRegistration;
    } catch (e) {
        console.error("Error adding registration", e);
        return null;
    }
};

export const removePendingRegistration = (id) => {
    try {
        const current = getPendingRegistrations();
        const updated = current.filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEYS.PENDING_REGISTRATIONS, JSON.stringify(updated));
        return true;
    } catch (e) {
        console.error("Error removing registration", e);
        return false;
    }
};

// -- Attendees --

export const getAttendees = () => {
    // Note: In a real app this would merge mock data with local storage, 
    // but for now we might rely on the consumer to do that or just read LS if we move everything there.
    // However, to keep it simple, we'll just read LS attendees that we added.
    try {
        const data = localStorage.getItem(STORAGE_KEYS.ATTENDEES);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error reading attendees", e);
        return [];
    }
};

export const addAttendee = (attendee) => {
    try {
        const current = getAttendees();
        const updated = [attendee, ...current];
        localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify(updated));
        return true;
    } catch (e) {
        console.error("Error adding attendee", e);
        return false;
    }
};

// -- Treasury --

export const addTreasuryIncome = (amount, description, category) => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.TREASURY);
        const transactions = saved ? JSON.parse(saved) : [];
        const newTransaction = {
            id: Date.now(),
            type: 'income',
            amount: parseFloat(amount),
            description: description,
            category: category,
            date: new Date().toISOString().split('T')[0]
        };
        localStorage.setItem(STORAGE_KEYS.TREASURY, JSON.stringify([newTransaction, ...transactions]));
        return true;
    } catch (e) {
        console.error("Error adding treasury income", e);
        return false;
    }
};
