import { storage } from '../services/storage';

/**
 * Storage utility for simulating backend persistence with localStorage
 * Refactored to use safe storage wrapper with sanitization.
 */

export const STORAGE_KEYS = {
    PENDING_REGISTRATIONS: 'simr_pending_registrations',
    ATTENDEES: 'simr_attendees',
    TREASURY: 'treasury_data'
};

// -- Pending Registrations --

export const getPendingRegistrations = () => {
    return storage.get(STORAGE_KEYS.PENDING_REGISTRATIONS, []);
};

export const addPendingRegistration = (registration) => {
    const current = getPendingRegistrations();
    const newRegistration = {
        id: `REG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...registration
    };
    const updated = [newRegistration, ...current];
    storage.set(STORAGE_KEYS.PENDING_REGISTRATIONS, updated);
    return newRegistration;
};

export const removePendingRegistration = (id) => {
    const current = getPendingRegistrations();
    const updated = current.filter(r => r.id !== id);
    return storage.set(STORAGE_KEYS.PENDING_REGISTRATIONS, updated);
};

// -- Attendees --

export const getAttendees = () => {
    return storage.get(STORAGE_KEYS.ATTENDEES, []);
};

export const addAttendee = (attendee) => {
    const current = getAttendees();
    const updated = [attendee, ...current];
    return storage.set(STORAGE_KEYS.ATTENDEES, updated);
};

// -- Treasury --

export const addTreasuryIncome = (amount, description, category) => {
    const transactions = storage.get(STORAGE_KEYS.TREASURY, []);
    const newTransaction = {
        id: Date.now(),
        type: 'income',
        amount: parseFloat(amount),
        description: description,
        category: category,
        date: new Date().toISOString().split('T')[0]
    };
    return storage.set(STORAGE_KEYS.TREASURY, [newTransaction, ...transactions]);
};
