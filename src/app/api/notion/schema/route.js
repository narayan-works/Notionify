import { NextResponse } from 'next/server';
import { getDatabaseSchema } from '@/lib/notion';

export async function POST(request) {
    try {
        const notionKey = request.headers.get('x-notion-key');
        const { databaseId } = await request.json();

        if (!notionKey) {
            return NextResponse.json(
                { error: 'No Notion API key configured. Go to Settings to add it.' },
                { status: 401 }
            );
        }

        if (!databaseId) {
            return NextResponse.json(
                { error: 'Database ID is required' },
                { status: 400 }
            );
        }

        const schema = await getDatabaseSchema(notionKey, databaseId);
        return NextResponse.json(schema);
    } catch (err) {
        let message = err.message;

        if (err.code === 'object_not_found') {
            message = 'Database not found. Make sure the database is shared with your Notion integration (Top right ... menu → Add connections).';
        } else if (err.code === 'validation_error') {
            message = 'Invalid Database ID. If your database is inline on a page, click "Open as page" on the database itself, then copy that link.';
        }

        return NextResponse.json({ error: message }, { status: 400 });
    }
}
