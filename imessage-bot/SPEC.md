# iMessage Automation Bot — Specification

## Overview

A production-ready Node.js CLI bot that sends personalized iMessages to a list of
business prospects loaded from a CSV file. It runs entirely on macOS, using
`osascript` (AppleScript) under the hood to drive the Messages app.

---

## Project Structure

```
imessage-bot/
├── SPEC.md                  ← this file
├── CLAUDE.md                ← setup & permissions guide
├── package.json
├── prospects.csv            ← your prospect list (user-supplied)
├── sent_log.json            ← auto-generated; tracks sent/failed contacts
├── src/
│   ├── index.js             ← CLI entry point
│   ├── parser.js            ← CSV ingestion & validation
│   ├── template.js          ← message personalization engine
│   ├── messenger.js         ← osascript iMessage sender
│   ├── logger.js            ← sent_log.json read/write helpers
│   └── delay.js             ← randomized human-like delay
└── templates/
    └── default.txt          ← default message template
```

---

## CSV Format (`prospects.csv`)

| Column         | Required | Description                                   |
|----------------|----------|-----------------------------------------------|
| `phone`        | Yes      | Phone number **or** Apple ID email            |
| `business_name`| Yes      | Company / business name                       |
| `contact_name` | Yes      | First name (or full name) of the contact      |
| `industry`     | No       | Industry vertical — usable in templates       |

Any additional columns are accessible as `{{column_name}}` tokens in templates.

---

## Message Template System

Templates live in plain-text `.txt` files under `templates/`. Tokens use
double-curly-brace syntax and map 1-to-1 to CSV column headers:

```
Hi {{contact_name}}, I saw what you're doing at {{business_name}} in the
{{industry}} space and wanted to reach out. Would love to connect!
```

Rules:
- Unknown tokens are left as-is and a warning is printed.
- Leading/trailing whitespace in token values is trimmed.
- Multi-line templates are supported.

---

## CLI Interface

```
node src/index.js [options]

Options:
  --csv <path>          Path to prospects CSV  [default: prospects.csv]
  --template <path>     Path to message template  [default: templates/default.txt]
  --dry-run             Print messages to console; do NOT send via iMessage
  --delay-min <sec>     Minimum delay between sends (seconds)  [default: 30]
  --delay-max <sec>     Maximum delay between sends (seconds)  [default: 90]
  --log <path>          Path to sent log JSON  [default: sent_log.json]
  --help                Show this help text
```

---

## Execution Flow

```
1. Parse CLI args
2. Load & validate prospects.csv → array of prospect objects
3. Load sent_log.json (create empty log if missing)
4. Filter out prospects already in log (status: sent | failed_permanent)
5. For each remaining prospect:
   a. Render template with prospect fields
   b. [dry-run] Print rendered message → mark as dry_run in log
   c. [live]    Call osascript to send iMessage
                - On success  → mark as sent in log
                - On AS error → mark as failed in log, log error, continue
   d. Wait randomized delay (skipped on dry-run)
6. Print summary: sent / skipped / failed counts
```

---

## Safety & Compliance Design

| Concern                   | Mitigation                                                 |
|---------------------------|------------------------------------------------------------|
| Apple anti-spam detection | Randomized delay 30–90 s (configurable) between messages   |
| Double-messaging          | `sent_log.json` checked before every send                  |
| Script crashes            | Log is written immediately after each send attempt         |
| Non-iMessage numbers      | AppleScript error caught; logged as `failed`; loop continues|
| Accidental live sends     | `--dry-run` mode; console output only                      |

---

## sent_log.json Schema

```json
{
  "meta": {
    "created": "2025-01-01T00:00:00.000Z",
    "lastUpdated": "2025-01-01T00:05:00.000Z"
  },
  "contacts": {
    "+15551234567": {
      "contact_name": "Jane Smith",
      "business_name": "Acme Corp",
      "status": "sent",
      "sentAt": "2025-01-01T00:01:00.000Z",
      "message": "Hi Jane, ..."
    },
    "jane@example.com": {
      "contact_name": "Jane Smith",
      "business_name": "Acme Corp",
      "status": "failed",
      "failedAt": "2025-01-01T00:01:00.000Z",
      "error": "AppleScript error: message was not sent (error -9)"
    }
  }
}
```

Possible status values:
- `sent` — message delivered successfully
- `failed` — AppleScript returned an error (non-iMessage, blocked, etc.)
- `dry_run` — logged during a dry-run; will be re-processed on a live run

---

## Error Handling Strategy

| Error Type                          | Behavior                                          |
|-------------------------------------|---------------------------------------------------|
| CSV parse error                     | Abort with clear message; no messages sent        |
| Missing required column             | Abort with list of missing columns                |
| Template file not found             | Abort with path hint                              |
| osascript not available             | Abort with message (must run on macOS)            |
| AppleScript delivery error          | Log as `failed`; continue to next prospect        |
| Process killed mid-run              | Log is already persisted; safe to resume          |

---

## Dependencies

| Package       | Purpose                              |
|---------------|--------------------------------------|
| `csv-parse`   | Streaming CSV parser                 |
| `minimist`    | Lightweight CLI argument parsing     |
| `chalk`       | Coloured terminal output             |

No build step required — plain CommonJS, runs directly with `node`.

---

## Platform Requirements

- macOS 10.14 Mojave or later (Messages app with iMessage enabled)
- Node.js 18+
- Terminal app granted **Full Disk Access** in System Preferences
- iMessage signed in and active in the Messages app
