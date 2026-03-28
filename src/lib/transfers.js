import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TRANSFERS_FILE = path.join(process.cwd(), 'data', 'transfers.json');

function ensureDataDir() {
    const dir = path.dirname(TRANSFERS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(TRANSFERS_FILE)) {
        fs.writeFileSync(TRANSFERS_FILE, '[]', 'utf-8');
    }
}

export function getAllTransfers() {
    ensureDataDir();
    const data = fs.readFileSync(TRANSFERS_FILE, 'utf-8');
    return JSON.parse(data);
}

export function getTransferById(id) {
    const transfers = getAllTransfers();
    return transfers.find((t) => t.id === id) || null;
}

export function createTransfer({ name, notionDatabaseId, databaseName, properties, mappingPrompt, inputDescription }) {
    const transfers = getAllTransfers();
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
    fs.writeFileSync(TRANSFERS_FILE, JSON.stringify(transfers, null, 2), 'utf-8');
    return newTransfer;
}

export function updateTransfer(id, updates) {
    const transfers = getAllTransfers();
    const index = transfers.findIndex((t) => t.id === id);
    if (index === -1) return null;
    transfers[index] = { ...transfers[index], ...updates };
    fs.writeFileSync(TRANSFERS_FILE, JSON.stringify(transfers, null, 2), 'utf-8');
    return transfers[index];
}

export function deleteTransfer(id) {
    const transfers = getAllTransfers();
    const filtered = transfers.filter((t) => t.id !== id);
    if (filtered.length === transfers.length) return false;
    fs.writeFileSync(TRANSFERS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
}
