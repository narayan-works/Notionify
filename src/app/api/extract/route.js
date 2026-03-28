import { NextResponse } from 'next/server';
import { extractData } from '@/lib/ai';
import { execSync } from 'child_process';
import path from 'path';

function isUrl(str) {
    try {
        const url = new URL(str.trim());
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function scrapeUrl(url) {
    const scriptPath = path.join(process.cwd(), 'scripts', 'scrape.py');
    try {
        const result = execSync(`python3 "${scriptPath}" "${url}"`, {
            encoding: 'utf-8',
            timeout: 30000,
            maxBuffer: 5 * 1024 * 1024,
        });
        return result;
    } catch (err) {
        throw new Error(
            `Could not retrieve page. Try pasting the text directly.\n\nDetails: ${err.message}`
        );
    }
}

export async function POST(request) {
    try {
        const aiProvider = request.headers.get('x-ai-provider') || 'gemini';
        const aiKey = request.headers.get('x-ai-key');
        const { transfer, input } = await request.json();

        if (!aiKey) {
            return NextResponse.json(
                { error: `No ${aiProvider} API key configured. Go to Settings to add it.` },
                { status: 401 }
            );
        }

        if (!transfer || !input) {
            return NextResponse.json(
                { error: 'Transfer object and input are required' },
                { status: 400 }
            );
        }

        // Get content (scrape if URL)
        let content;
        const inputTrimmed = input.trim();

        if (isUrl(inputTrimmed)) {
            try {
                content = scrapeUrl(inputTrimmed);
            } catch (scrapeErr) {
                return NextResponse.json(
                    { error: scrapeErr.message, scrapeError: true },
                    { status: 422 }
                );
            }
        } else {
            content = inputTrimmed;
        }

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { error: 'No content could be extracted from the input.' },
                { status: 422 }
            );
        }

        // Extract using selected AI provider
        const extracted = await extractData(
            aiProvider,
            aiKey,
            content,
            transfer.properties,
            transfer.mappingPrompt,
            transfer.inputDescription
        );

        return NextResponse.json({
            extracted,
            sourceUrl: isUrl(inputTrimmed) ? inputTrimmed : null,
            contentLength: content.length,
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
