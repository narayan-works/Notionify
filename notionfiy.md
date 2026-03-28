# Notionify
**Product Requirements Document**

| | |
|---|---|
| **Status** | Draft |
| **Version** | 0.1 |
| **Author** | Personal Project |
| **Last Updated** | March 2026 |

---

## 1. Overview

Notionify is a personal web app that eliminates manual data entry into Notion databases. You define a transfer once — connecting a Notion database and describing the kind of data you'll paste — and from then on, a single paste action extracts, maps, and writes structured data into Notion automatically.

The initial use case is job descriptions: paste a URL, get a parsed record written to your jobs database. Additional use cases (recipes, contacts, etc.) follow the same pattern and can be added over time without changing the core app.

---

## 2. Problem

Manual Notion data entry is slow and error-prone for repetitive structured data. Copying a job description into a multi-property Notion database requires opening the page, reading through the JD, finding each field, formatting it correctly, and repeating this for every application. The same problem will recur for other data types.

There is no existing tool that lets you define a personal, reusable parsing pipeline tied to a specific Notion database without code or complex setup.

---

## 3. Goals

### 3.1 In Scope

- Define named use cases ("transfers") tied to a specific Notion database
- Auto-fetch Notion database schema (properties and types) via API
- AI-generated mapping logic per use case, editable before saving
- Paste URL or raw text to trigger extraction at runtime
- Confirmation step: review extracted values before writing to Notion
- Partial success handling: write matched fields, skip unmatched ones, report what was skipped
- Basic mismatch detection: flag when pasted content doesn't match the expected use case

### 3.2 Out of Scope

- Multi-user support or authentication
- Mobile app
- Scheduling or automated triggers
- Editing existing Notion records
- Image or file attachment handling

---

## 4. User Flows

### 4.1 Create a Transfer (One-time Setup)

| Step | Action | System Response |
|---|---|---|
| 1 | Click "New Transfer" | Show form: transfer name + Notion Database ID field |
| 2 | Paste Notion Database ID | Fetch schema via Notion API, display properties and types |
| 3 | Review schema | User confirms properties look correct |
| 4 | Describe input data | e.g. "Job descriptions from job board URLs" |
| 5 | Review AI mapping logic | AI shows how it plans to map input → each property. User can edit. |
| 6 | Save transfer | Transfer saved, appears on dashboard |

### 4.2 Run a Transfer

| Step | Action | System Response |
|---|---|---|
| 1 | Select transfer from dashboard | Show input box |
| 2 | Paste URL or raw text | Scrape if URL; extract text if raw |
| 3 | AI parses input | Maps content to Notion properties as JSON |
| 4 | Review extracted values | Show each property + extracted value. User can edit inline. |
| 5 | Confirm | Write to Notion. Show success summary: X properties written, Y skipped. |

---

## 5. Technical Architecture

### 5.1 Stack

| Layer | Choice |
|---|---|
| **Frontend** | Single-page web app (React or plain HTML/JS), runs locally |
| **Backend** | Node.js or Python local server |
| **Scraping** | Firecrawl API (handles anti-bot, returns clean markdown) |
| **AI Extraction** | Claude API — schema-aware extraction prompt per transfer |
| **Storage** | Notion API (database as data store); transfer configs in local JSON file |

### 5.2 Request Flow

```
Frontend → Backend → [Firecrawl if URL] → Claude API (extract to JSON) → Confirm → Notion API
```

### 5.3 Transfer Config Schema

Each saved transfer stores:

```json
{
  "name": "string",
  "notionDatabaseId": "string",
  "properties": [
    { "name": "string", "type": "string", "notionId": "string" }
  ],
  "mappingPrompt": "string",
  "createdAt": "timestamp"
}
```

---

## 6. Edge Cases & Failure Handling

| Scenario | Behavior |
|---|---|
| URL cannot be scraped (bot protection) | Show error: "Could not retrieve page. Try pasting the text directly." |
| AI cannot extract a required property | Skip that property, note it in the summary ("Salary: not found") |
| Pasted content doesn't match use case | Show warning: "This doesn't look like [transfer name] data. Proceed anyway?" |
| Notion API write fails | Show error with specific field that failed; don't partially commit silently |
| Notion database schema changed | Detect mismatch on next run and prompt user to re-sync schema |

---

## 7. First Use Case: Job Descriptions

### 7.1 Notion Database Schema

| Property | Type |
|---|---|
| Posting Title | Title |
| Company | Text |
| Role | Text |
| Date | Date |
| Status | Select |
| Salary | Text |
| Location | Text |
| Link | URL |
| Remarks | Text |

### 7.2 Expected Input

A URL to a job posting on any job board (LinkedIn, Greenhouse, Lever, Workday, company site). Raw text paste as fallback.

### 7.3 Known Constraints

- LinkedIn blocks most scrapers — raw text paste is the fallback for LinkedIn jobs
- Salary is frequently absent from job postings — this is expected and not a failure
- Date will default to today's date if not found in the posting

---

## 8. Future Use Cases (Reference Only)

These are not in scope for v1 but inform the architecture decisions above.

- Recipes → Notion recipe database (ingredients, steps, cuisine, cook time)
- Contacts → Notion CRM (name, company, email, how we met)
- Books → Reading list database (title, author, genre, notes)

Each would follow the same setup flow: new transfer, database ID, mapping prompt.

---

## 9. Open Questions

| Question | Notes |
|---|---|
| Where are transfer configs stored? | Local JSON file is simplest. No database needed for personal use. |
| Should mapping prompt be free-text or structured? | Free-text is flexible but harder to validate. Decide after first use case works. |
| How to handle Notion select/multi-select options? | Fetch existing options from schema. If AI extracts a value not in the list, flag it or auto-create. |
| Run history? | Useful for debugging. Low priority for v1. |

---

## 10. Success Metric

Time to add one job application to Notion drops from ~3 minutes (manual) to under 30 seconds. Everything else is secondary.