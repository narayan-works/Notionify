import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * Unified AI interface supporting Gemini, Claude, and OpenAI.
 * All keys are passed per-request from the client — nothing stored on the server.
 */

// ---- Provider: Gemini ----
async function callGemini(apiKey, systemPrompt, userMessage) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite-preview',
        systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userMessage);
    return result.response.text();
}

// ---- Provider: Claude ----
async function callClaude(apiKey, systemPrompt, userMessage) {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
    });
    return response.content[0].text;
}

// ---- Provider: OpenAI ----
async function callOpenAI(apiKey, systemPrompt, userMessage) {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
    });
    return response.choices[0].message.content;
}

// ---- Dispatch to selected provider ----
async function callAI(provider, apiKey, systemPrompt, userMessage) {
    if (!apiKey) {
        throw new Error(`No API key provided for ${provider}. Please add it in Settings.`);
    }

    switch (provider) {
        case 'gemini':
            return callGemini(apiKey, systemPrompt, userMessage);
        case 'claude':
            return callClaude(apiKey, systemPrompt, userMessage);
        case 'openai':
            return callOpenAI(apiKey, systemPrompt, userMessage);
        default:
            throw new Error(`Unknown AI provider: "${provider}". Supported: gemini, claude, openai`);
    }
}

// ---- Parse JSON from AI response ----
function parseJSON(text) {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    const jsonStr = jsonMatch[1].trim();
    try {
        return JSON.parse(jsonStr);
    } catch (err) {
        throw new Error(`Failed to parse AI response as JSON: ${err.message}\n\nRaw: ${text}`);
    }
}

/**
 * Extract structured data from content using the selected AI provider.
 */
export async function extractData(provider, apiKey, content, properties, mappingPrompt, inputDescription) {
    const propertyList = properties
        .map((p) => {
            let desc = `- "${p.name}" (${p.type})`;
            if (p.options && p.options.length > 0) {
                desc += ` — options: ${p.options.map((o) => o.name).join(', ')}`;
            }
            return desc;
        })
        .join('\n');

    const systemPrompt = `You are a data extraction assistant. Extract structured data from given content and map it to a Notion database schema.

Return ONLY valid JSON where each key is a property name from the schema, and each value is the extracted value. Set to null if not found.

For date properties, use ISO 8601 (YYYY-MM-DD). If no date is found, use today: ${new Date().toISOString().split('T')[0]}.
For select properties with predefined options, try to match an existing option.

Database Schema:
${propertyList}

${mappingPrompt ? `Mapping instructions: ${mappingPrompt}` : ''}
${inputDescription ? `Expected input type: ${inputDescription}` : ''}`;

    const userMessage = `Extract structured data from:\n\n${content}`;
    const text = await callAI(provider, apiKey, systemPrompt, userMessage);
    return parseJSON(text);
}

/**
 * Generate mapping instructions using the selected AI provider.
 */
export async function generateMappingPrompt(provider, apiKey, properties, inputDescription) {
    const propertyList = properties.map((p) => `- "${p.name}" (${p.type})`).join('\n');

    const userMessage = `I have a Notion database with these properties:

${propertyList}

I want to automatically extract data from: ${inputDescription}

Generate clear, concise mapping instructions describing how to extract each property from the input content. Be specific about what to look for and any special handling.

Return just the mapping instructions as plain text, no JSON or code blocks.`;

    return callAI(provider, apiKey, '', userMessage);
}

/**
 * Check if the newly extracted data matches any of the existing entries.
 */
export async function findDuplicate(provider, apiKey, newEntry, existingEntries) {
    if (!existingEntries || existingEntries.length === 0) {
        return { isDuplicate: false, matchPercentage: 0, matchedSummary: '' };
    }

    const systemPrompt = `You are a strict data duplication detection system. 
You are given a freshly extracted job/item and a list of recently added items.
Calculate the likelihood that the new item is already in the list.
Consider titles, companies, and URLs as strong indicators.

Return ONLY a valid JSON object in this format:
{
  "isDuplicate": true/false, // Set to true ONLY if you are highly confident (>85% match) it is the exact same underlying item.
  "matchPercentage": 0-100, // An integer
  "matchedSummary": "briefly mention what matched (e.g. 'Software Engineer at Google') or empty string if none"
}`;

    const userMessage = `NEWLY EXTRACTED ITEM:
${JSON.stringify(newEntry, null, 2)}

RECENT ITEMS IN DATABASE:
${JSON.stringify(existingEntries.map(e => e.data), null, 2)}

Is the new item a duplicate of any recent items?`;

    try {
        const text = await callAI(provider, apiKey, systemPrompt, userMessage);
        return parseJSON(text);
    } catch (err) {
        console.error('Error in findDuplicate:', err);
        return { isDuplicate: false, matchPercentage: 0, matchedSummary: '' };
    }
}
