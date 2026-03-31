#!/usr/bin/env node
'use strict';

const minimist = require('minimist');
const chalk = require('chalk');

const { parseProspects } = require('./parser');
const { loadTemplate, renderTemplate } = require('./template');
const { assertMacOS, sendMessage } = require('./messenger');
const { loadLog, saveLog, markSent, markFailed, markDryRun, alreadyContacted } = require('./logger');
const { randomDelay, sampleDelaySec } = require('./delay');

// ─── CLI argument parsing ────────────────────────────────────────────────────

const argv = minimist(process.argv.slice(2), {
  string: ['csv', 'template', 'log'],
  boolean: ['dry-run', 'help'],
  default: {
    csv: 'prospects.csv',
    template: 'templates/default.txt',
    log: 'sent_log.json',
    'delay-min': 30,
    'delay-max': 90,
    'dry-run': false,
    help: false,
  },
  alias: {
    h: 'help',
  },
});

if (argv.help) {
  console.log(`
${chalk.bold('iMessage Automation Bot')}

${chalk.dim('Usage:')}
  node src/index.js [options]

${chalk.dim('Options:')}
  --csv <path>          Path to prospects CSV          [default: prospects.csv]
  --template <path>     Path to message template       [default: templates/default.txt]
  --dry-run             Log messages only; do NOT send via iMessage
  --delay-min <sec>     Minimum delay between sends    [default: 30]
  --delay-max <sec>     Maximum delay between sends    [default: 90]
  --log <path>          Path to sent log JSON          [default: sent_log.json]
  --help, -h            Show this help text
`);
  process.exit(0);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function die(msg) {
  console.error(chalk.red(`\n✖  ${msg}\n`));
  process.exit(1);
}

function info(msg) {
  console.log(chalk.cyan(`ℹ  ${msg}`));
}

function success(msg) {
  console.log(chalk.green(`✔  ${msg}`));
}

function warn(msg) {
  console.log(chalk.yellow(`⚠  ${msg}`));
}

function fail(msg) {
  console.log(chalk.red(`✖  ${msg}`));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const isDryRun = argv['dry-run'];
  const delayMin = Number(argv['delay-min']);
  const delayMax = Number(argv['delay-max']);

  if (delayMin < 0 || delayMax < 0 || delayMin > delayMax) {
    die(`Invalid delay range: --delay-min ${delayMin} --delay-max ${delayMax}`);
  }

  // Gate: must be macOS for live runs
  if (!isDryRun) {
    try {
      assertMacOS();
    } catch (err) {
      die(err.message);
    }
  }

  console.log(chalk.bold('\n📨 iMessage Automation Bot'));
  console.log(chalk.dim('─'.repeat(48)));

  if (isDryRun) {
    info('DRY-RUN mode — no messages will be sent.');
  }

  // ── Load prospects ────────────────────────────────────────────────────────
  info(`Loading prospects from: ${argv.csv}`);
  let prospects, parseWarnings;
  try {
    ({ prospects, warnings: parseWarnings } = parseProspects(argv.csv));
  } catch (err) {
    die(err.message);
  }

  parseWarnings.forEach((w) => warn(w));
  info(`Loaded ${prospects.length} prospect(s).`);

  // ── Load template ─────────────────────────────────────────────────────────
  info(`Loading template from: ${argv.template}`);
  let template;
  try {
    template = loadTemplate(argv.template);
  } catch (err) {
    die(err.message);
  }

  // ── Load sent log ─────────────────────────────────────────────────────────
  info(`Using sent log: ${argv.log}`);
  let log;
  try {
    log = loadLog(argv.log);
  } catch (err) {
    die(err.message);
  }

  // ── Filter already-contacted ──────────────────────────────────────────────
  const pending = prospects.filter((p) => !alreadyContacted(log, p.phone));
  const skippedCount = prospects.length - pending.length;

  if (skippedCount > 0) {
    info(`Skipping ${skippedCount} already-contacted prospect(s).`);
  }

  if (pending.length === 0) {
    console.log(chalk.bold('\n✅ Nothing to do — all prospects already contacted.\n'));
    process.exit(0);
  }

  info(`Preparing to process ${pending.length} prospect(s).`);
  console.log(chalk.dim('─'.repeat(48)));

  // ── Send loop ─────────────────────────────────────────────────────────────
  let sentCount = 0;
  let failedCount = 0;
  let dryRunCount = 0;

  for (let i = 0; i < pending.length; i++) {
    const prospect = pending[i];
    const { phone, contact_name, business_name } = prospect;

    const label = `[${i + 1}/${pending.length}] ${contact_name} @ ${business_name} (${phone})`;

    // Render the message
    const { message, warnings: templateWarnings } = renderTemplate(template, prospect);
    templateWarnings.forEach((w) => warn(`${label} — ${w}`));

    if (isDryRun) {
      console.log(chalk.bold(`\n${label}`));
      console.log(chalk.dim('── Message preview ──'));
      console.log(chalk.white(message));
      console.log(chalk.dim('─────────────────────'));
      markDryRun(log, phone, prospect, message);
      saveLog(argv.log, log);
      dryRunCount++;
      continue;
    }

    // Live send
    process.stdout.write(chalk.cyan(`→  ${label} ... `));
    try {
      sendMessage(phone, message);
      console.log(chalk.green('sent ✔'));
      markSent(log, phone, prospect, message);
      saveLog(argv.log, log);
      sentCount++;
    } catch (err) {
      console.log(chalk.red('failed ✖'));
      fail(`   Error: ${err.message}`);
      markFailed(log, phone, prospect, err.message);
      saveLog(argv.log, log);
      failedCount++;
    }

    // Delay before next message (not after the last one)
    if (i < pending.length - 1) {
      const delaySec = sampleDelaySec(delayMin, delayMax);
      info(`Waiting ${delaySec}s before next message...`);
      await randomDelay(delaySec, delaySec); // already sampled; pass exact value
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(chalk.dim('\n' + '─'.repeat(48)));
  console.log(chalk.bold('Summary'));
  if (isDryRun) {
    console.log(chalk.cyan(`  Dry-run logged : ${dryRunCount}`));
  } else {
    console.log(chalk.green(`  Sent           : ${sentCount}`));
    console.log(chalk.red(`  Failed         : ${failedCount}`));
  }
  console.log(chalk.dim(`  Skipped        : ${skippedCount}`));
  console.log();
}

main().catch((err) => {
  console.error(chalk.red(`\nUnhandled error: ${err.message}\n`));
  process.exit(1);
});
