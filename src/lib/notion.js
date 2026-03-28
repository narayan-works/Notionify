import { Client } from '@notionhq/client';

/**
 * Create a Notion client with a user-provided API key.
 */
function getNotionClient(apiKey) {
    if (!apiKey) {
        throw new Error('No Notion API key provided. Please add it in Settings.');
    }
    return new Client({ auth: apiKey });
}

/**
 * Fetch database schema (properties & types) from Notion.
 * Handles standard databases AND newer data-source-backed databases.
 */
export async function getDatabaseSchema(apiKey, databaseId) {
    const notion = getNotionClient(apiKey);
    let database;
    try {
        database = await notion.databases.retrieve({ database_id: databaseId });
    } catch (err) {
        throw err;
    }

    const dbTitle = database.title?.map((t) => t.plain_text).join('') || 'Untitled';

    // Standard database — has properties directly
    if (database.properties) {
        const properties = Object.entries(database.properties).map(([name, prop]) => ({
            name,
            type: prop.type,
            notionId: prop.id,
            options: prop.select?.options || prop.multi_select?.options || null,
        }));
        return { id: database.id, title: dbTitle, properties };
    }

    // Data-source-backed database — infer schema by querying pages
    // The Notion API doesn't return properties for these databases directly,
    // so we query a few pages and infer the property names and types.
    const properties = await inferSchemaFromPages(apiKey, databaseId);
    if (properties.length > 0) {
        return { id: database.id, title: dbTitle, properties };
    }

    // Nothing worked
    if (database.object === 'page') {
        throw new Error('This link points to a Notion Page, not a Database. If your database is inline, click "Open as page" on the database table, then copy that link.');
    }
    throw new Error('Could not read properties from this database. It may be empty or unsupported.');
}

/**
 * Infer schema by querying pages from the database and reading their property types.
 * We query a few pages to discover select/multi_select options too.
 */
async function inferSchemaFromPages(apiKey, databaseId) {
    try {
        const resp = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28',
            },
            body: JSON.stringify({ page_size: 10 }),
        });
        const data = await resp.json();

        if (!data.results || data.results.length === 0) return [];

        // Build a map of property name -> { type, options set }
        const propMap = {};
        for (const page of data.results) {
            for (const [name, prop] of Object.entries(page.properties)) {
                if (!propMap[name]) {
                    propMap[name] = { name, type: prop.type, notionId: prop.id, optionSet: new Set() };
                }
                // Collect select/multi_select values as potential options
                if (prop.type === 'select' && prop.select?.name) {
                    propMap[name].optionSet.add(prop.select.name);
                }
                if (prop.type === 'multi_select' && prop.multi_select) {
                    for (const opt of prop.multi_select) {
                        propMap[name].optionSet.add(opt.name);
                    }
                }
            }
        }

        return Object.values(propMap).map(({ name, type, notionId, optionSet }) => ({
            name,
            type,
            notionId,
            options: optionSet.size > 0 ? [...optionSet].map((n) => ({ name: n })) : null,
        }));
    } catch {
        return [];
    }
}

/**
 * Write a page to a Notion database.
 */
export async function writeToDatabase(apiKey, databaseId, propertyValues, schema) {
    const notion = getNotionClient(apiKey);

    const properties = {};
    const written = [];
    const skipped = [];

    for (const prop of schema) {
        const value = propertyValues[prop.name];

        if (value === undefined || value === null || value === '') {
            skipped.push({ name: prop.name, reason: 'No value extracted' });
            continue;
        }

        try {
            properties[prop.name] = formatPropertyValue(prop.type, value, prop.options);
            written.push(prop.name);
        } catch (err) {
            skipped.push({ name: prop.name, reason: err.message });
        }
    }

    const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties,
    });

    return {
        pageId: response.id,
        pageUrl: response.url,
        written,
        skipped,
    };
}

function formatPropertyValue(type, value, options) {
    switch (type) {
        case 'title':
            return { title: [{ type: 'text', text: { content: String(value) } }] };
        case 'rich_text':
            return { rich_text: [{ type: 'text', text: { content: String(value) } }] };
        case 'number':
            return { number: Number(value) || null };
        case 'select':
            return { select: { name: String(value) } };
        case 'multi_select':
            const items = Array.isArray(value) ? value : String(value).split(',').map((s) => s.trim());
            return { multi_select: items.map((name) => ({ name })) };
        case 'date':
            return { date: { start: String(value) } };
        case 'url':
            return { url: String(value) };
        case 'email':
            return { email: String(value) };
        case 'phone_number':
            return { phone_number: String(value) };
        case 'checkbox':
            return { checkbox: Boolean(value) };
        default:
            return { rich_text: [{ type: 'text', text: { content: String(value) } }] };
    }
}

/**
 * Fetch the most recent entries from the database to check for duplicates.
 * Flattens properties to simple text values for the AI.
 */
export async function getRecentDatabaseEntries(apiKey, databaseId, limit = 30) {
    const notion = getNotionClient(apiKey);
    
    try {
        const response = await notion.databases.query({
            database_id: databaseId,
            page_size: limit,
            sorts: [
                {
                    timestamp: 'created_time',
                    direction: 'descending'
                }
            ]
        });

        const entries = response.results.map(page => {
            const flattened = {};
            for (const [key, prop] of Object.entries(page.properties)) {
                flattened[key] = extractSimpleValue(prop);
            }
            return { id: page.id, data: flattened };
        });

        return entries;
    } catch (err) {
        console.error('Error fetching recent entries:', err);
        return []; // fail gracefully if we can't fetch recents
    }
}

function extractSimpleValue(prop) {
    switch (prop.type) {
        case 'title':
            return prop.title?.map(t => t.plain_text).join('') || '';
        case 'rich_text':
            return prop.rich_text?.map(t => t.plain_text).join('') || '';
        case 'number':
            return prop.number;
        case 'select':
            return prop.select?.name || '';
        case 'multi_select':
            return prop.multi_select?.map(s => s.name).join(', ') || '';
        case 'date':
            return prop.date?.start || '';
        case 'url':
            return prop.url || '';
        case 'email':
            return prop.email || '';
        case 'phone_number':
            return prop.phone_number || '';
        case 'checkbox':
            return prop.checkbox;
        default:
            return '';
    }
}
