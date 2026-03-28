import { NextResponse } from 'next/server';
import { getAllTransfers, createTransfer } from '@/lib/transfers';

export async function GET() {
    try {
        const transfers = getAllTransfers();
        return NextResponse.json(transfers);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, notionDatabaseId, databaseName, properties, mappingPrompt, inputDescription } = body;

        if (!name || !notionDatabaseId) {
            return NextResponse.json(
                { error: 'Name and Notion Database ID are required' },
                { status: 400 }
            );
        }

        const transfer = createTransfer({
            name,
            notionDatabaseId,
            databaseName,
            properties,
            mappingPrompt,
            inputDescription,
        });

        return NextResponse.json(transfer, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
