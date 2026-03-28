import { NextResponse } from 'next/server';
import { writeToDatabase } from '@/lib/notion';

export async function POST(request) {
    try {
        const notionKey = request.headers.get('x-notion-key');
        const { notionDatabaseId, properties: propertyValues, schema } = await request.json();

        if (!notionKey) {
            return NextResponse.json(
                { error: 'No Notion API key configured. Go to Settings to add it.' },
                { status: 401 }
            );
        }

        if (!notionDatabaseId || !propertyValues || !schema) {
            return NextResponse.json(
                { error: 'Database ID, properties, and schema are required' },
                { status: 400 }
            );
        }

        const result = await writeToDatabase(
            notionKey,
            notionDatabaseId,
            propertyValues,
            schema
        );

        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
