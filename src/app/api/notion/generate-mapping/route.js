import { NextResponse } from 'next/server';
import { generateMappingPrompt } from '@/lib/ai';

export async function POST(request) {
    try {
        const aiProvider = request.headers.get('x-ai-provider') || 'gemini';
        const aiKey = request.headers.get('x-ai-key');
        const { properties, description } = await request.json();

        if (!aiKey) {
            return NextResponse.json(
                { error: `No ${aiProvider} API key configured. Go to Settings to add it.` },
                { status: 401 }
            );
        }

        if (!properties || !description) {
            return NextResponse.json(
                { error: 'Properties and description are required' },
                { status: 400 }
            );
        }

        const mappingPrompt = await generateMappingPrompt(aiProvider, aiKey, properties, description);
        return NextResponse.json({ mappingPrompt });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
