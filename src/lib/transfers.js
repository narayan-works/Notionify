import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'notionify_transfers';

function getStoredTransfers() {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveTransfers(transfers) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transfers));
    } catch (err) {
        console.error('Failed to save transfers to localStorage', err);
    }
}

export function getAllTransfers() {
    return getStoredTransfers();
}

export function getTransferById(id) {
    const transfers = getStoredTransfers();
    return transfers.find((t) => t.id === id) || null;
}

export function createTransfer({ name, notionDatabaseId, databaseName, properties, mappingPrompt, inputDescription }) {
    if (typeof window === 'undefined') return null;

    const transfers = getStoredTransfers();
    const newTransfer = {
        id: uuidv4(),
        name,
        notionDatabaseId,
        databaseName: databaseName || 'Untitled Database',
        properties: properties || [],
        mappingPrompt: mappingPrompt || '',
        inputDescription: inputDescription || '',
        createdAt: new Date().toISOString(),
        lastRunAt: null,
        runCount: 0,
    };
    
    transfers.push(newTransfer);
    saveTransfers(transfers);
    return newTransfer;
}

export function updateTransfer(id, updates) {
    if (typeof window === 'undefined') return null;

    const transfers = getStoredTransfers();
    const index = transfers.findIndex((t) => t.id === id);
    if (index === -1) return null;
    
    transfers[index] = { ...transfers[index], ...updates };
    saveTransfers(transfers);
    return transfers[index];
}

export function deleteTransfer(id) {
    if (typeof window === 'undefined') return false;

    const transfers = getStoredTransfers();
    const filtered = transfers.filter((t) => t.id !== id);
    
    if (filtered.length === transfers.length) return false;
    
    saveTransfers(filtered);
    return true;
}
