# iMessage Bot — Setup Guide for macOS

## Prerequisites

### 1. macOS & Node.js

- macOS 10.14 Mojave or later
- Node.js 18 or later (`node --version` to check)
- npm 9+ (comes with Node.js)

### 2. iMessage Must Be Active

Open **Messages.app** and sign in with your Apple ID. Confirm iMessage is enabled:
`Messages → Preferences → iMessage → Enable Messages in iCloud` (optional but recommended).

---

## Required macOS Permission: Full Disk Access

The bot shells out to `osascript`, which drives the Messages app via AppleScript.
macOS requires the terminal emulator that runs the script to have **Automation**
(and optionally **Full Disk Access**) permissions.

### Step-by-step

1. Open **System Settings** (macOS Ventura+) or **System Preferences** (earlier).
2. Navigate to **Privacy & Security → Automation**.
3. Find your terminal app (Terminal, iTerm2, Warp, VS Code, etc.).
4. Enable the toggle next to **Messages**.

If you see an "Assistive Access" or "Automation" pop-up while running the script,
click **OK** to grant access permanently.

#### Full Disk Access (if Automation alone isn't enough)

1. Go to **Privacy & Security → Full Disk Access**.
2. Click the **+** button.
3. Navigate to `/Applications/Utilities/Terminal.app` (or your terminal of choice).
4. Click **Open** then re-lock the preference pane.

> **iTerm2 path:** `/Applications/iTerm.app`
> **VS Code integrated terminal path:** `/Applications/Visual Studio Code.app`

---

## Installation

```bash
cd imessage-bot
npm install
```

This installs three packages:
- `csv-parse` — parses the prospects CSV
- `minimist` — parses CLI flags
- `chalk` — colours the terminal output

---

## Prepare Your Prospect List

Copy your data into `imessage-bot/prospects.csv` with these columns:

```csv
phone,business_name,contact_name,industry
+15551234567,Acme Corp,Jane Smith,SaaS
jane@example.com,Globex,John Doe,E-commerce
```

- `phone` accepts **E.164 phone numbers** (`+15551234567`) or **Apple ID emails**.
- All four columns are required (industry can be blank but the column must exist).

---

## Write Your Message Template

Edit `templates/default.txt` or create a new `.txt` file:

```
Hi {{contact_name}}, I came across {{business_name}} in the {{industry}} space
and was really impressed. I'd love to connect — do you have 15 minutes this week?
```

Available tokens match your CSV column headers exactly.

---

## Running the Bot

### Dry run (safe — no messages sent)

```bash
node src/index.js --dry-run
```

This prints every rendered message to the console and writes `dry_run` entries to
`sent_log.json`. Re-running with `--dry-run` again will skip already-logged entries.
Remove or clear `sent_log.json` to reset.

### Live run

```bash
node src/index.js
```

Sends messages via iMessage with a 30–90 second randomized delay between each one.

### Custom options

```bash
node src/index.js \
  --csv /path/to/my-list.csv \
  --template templates/follow-up.txt \
  --delay-min 45 \
  --delay-max 120 \
  --log sent_log.json \
  --dry-run
```

---

## Resuming After Interruption

If the script is stopped mid-run (Ctrl+C, crash, etc.), simply re-run the same
command. The bot reads `sent_log.json` on startup and skips any contact with
status `sent` or `failed`. Only `dry_run` entries are re-processed on a live run.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `osascript: not found` | You are not on macOS. The bot requires macOS. |
| `Not authorized to send Apple events to Messages` | Grant Automation permission (see above). |
| Messages app opens but nothing sends | Make sure iMessage is signed in and active. |
| Contact marked `failed` | The number/email is not registered on iMessage, or Apple blocked the send. |
| Rate-limited by Apple | Increase `--delay-min` / `--delay-max` values. |

---

## Resetting the Log

To re-send to everyone (e.g., for testing):

```bash
rm sent_log.json
```

Or edit `sent_log.json` and remove specific entries under `"contacts"`.

---

## npm Dependencies

```json
{
  "csv-parse": "^5.5.6",
  "minimist": "^1.2.8",
  "chalk": "^4.1.2"
}
```

> **Note:** `chalk` v4 is used intentionally because it is CommonJS-compatible
> and does not require ESM. The bot is plain CommonJS (`require()`).
