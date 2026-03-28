import { NextResponse } from 'next/server';
import { writeToDatabase } from '@/lib/notion';
import { getTransferById, updateTransfer } from '@/lib/transfers';

export async function POST(request) {
    try {
        const notionKey = request.headers.get('x-notion-key');
        const { transferId, properties: propertyValues } = await request.json();

        if (!notionKey) {
            return NextResponse.json(
                { error: 'No Notion API key configured. Go to Settings to add it.' },
                { status: 401 }
            );
        }

        if (!transferId || !propertyValues) {
            return NextResponse.json(
                { error: 'Transfer ID and properties are required' },
                { status: 400 }
            );
        }

        const transfer = getTransferById(transferId);
        if (!transfer) {
            return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
        }

        const result = await writeToDatabase(
            notionKey,
            transfer.notionDatabaseId,
            propertyValues,
            transfer.properties
        );

        updateTransfer(transferId, {
            lastRunAt: new Date().toISOString(),
            runCount: (transfer.runCount || 0) + 1,
        });

        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
