'use strict';

const { app, BrowserWindow, shell, Menu, Notification, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const waitOn = require('wait-on');

// ─── electron-store ───────────────────────────────────────────────────────────
let Store;
try {
  Store = require('electron-store');
} catch (_) {
  // Minimal in-memory fallback (packaged app should always have electron-store)
  Store = class {
    constructor() { this._d = {}; }
    get(k, def) { return this._d[k] !== undefined ? this._d[k] : (def !== undefined ? def : ''); }
    set(k, v) { this._d[k] = v; }
    get store() { return { ...this._d }; }
  };
}
const store = new Store({ name: 'monica-ai-hub' });

const PORT = 9002;
let mainWindow;
let nextProcess;

// ─── Credential keys ──────────────────────────────────────────────────────────
const ENV_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
  'GROK_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
];

// ─── Seed bundled credentials into store (first launch only) ─────────────────
function seedBundledCredentials() {
  // bundled-credentials.js is written by scripts/embed-credentials.js at build time
  const credPath = path.join(__dirname, 'bundled-credentials.js');
  if (!fs.existsSync(credPath)) return;
  try {
    const bundled = require(credPath);
    for (const key of ENV_KEYS) {
      // Only seed if store doesn't already have a real value
      if (!store.get(key) && bundled[key]) {
        store.set(key, bundled[key]);
      }
    }
  } catch (err) {
    console.warn('[main] Could not load bundled-credentials.js:', err.message);
  }
}

// ─── Write .env.local so Next.js picks up credentials at runtime ──────────────
function writeEnvFile() {
  const envPath = path.join(app.getPath('userData'), '.env.local');
  const lines = ENV_KEYS.map(k => {
    const v = store.get(k) || process.env[k] || '';
    return v ? `${k}=${v}` : null;
  }).filter(Boolean);
  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf-8');
  return envPath;
}

// ─── Start Next.js production server ─────────────────────────────────────────
function startNextServer(envPath) {
  return new Promise((resolve, reject) => {
    // In packaged app, Next.js lives in extraResources/app
    const appDir = app.isPackaged
      ? path.join(process.resourcesPath, 'app')
      : path.join(__dirname, '..');

    const nextBin = path.join(appDir, 'node_modules', '.bin', 'next');

    const env = {
      ...process.env,
      NODE_ENV: 'production',
      DOTENV_CONFIG_PATH: envPath,
    };

    // Inject env vars directly into the server process environment
    for (const k of ENV_KEYS) {
      const v = store.get(k) || process.env[k] || '';
      if (v) env[k] = v;
    }

    console.log('[main] Starting Next.js server at', appDir);
    nextProcess = exec(`"${nextBin}" start -p ${PORT}`, { cwd: appDir, env });
    nextProcess.stdout.on('data', d => console.log('[Next]', d.trim()));
    nextProcess.stderr.on('data', d => console.error('[Next]', d.trim()));
    nextProcess.on('error', reject);

    waitOn({ resources: [`http://localhost:${PORT}`], timeout: 90000 })
      .then(resolve)
      .catch(reject);
  });
}

// ─── Create main window ───────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#1E3A8A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  // Show branded loading screen immediately while Next.js boots
  mainWindow.loadFile(path.join(__dirname, 'loading.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://localhost:${PORT}`) && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  return mainWindow;
}

// ─── Native Mac menu ──────────────────────────────────────────────────────────
function buildMenu() {
  const go = (route) => () => {
    if (mainWindow) mainWindow.loadURL(`http://localhost:${PORT}${route}`);
  };

  const template = [
    {
      label: 'Monica AI Hub',
      submenu: [
        { label: 'About Monica AI Hub', role: 'about' },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'Cmd+,', click: go('/settings') },
        { type: 'separator' },
        { label: 'Hide Monica AI Hub', accelerator: 'Cmd+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Cmd+Alt+H', role: 'hideOthers' },
        { type: 'separator' },
        { label: 'Quit Monica AI Hub', accelerator: 'Cmd+Q', role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Home', accelerator: 'Cmd+1', click: go('/') },
        { label: 'My Leads', accelerator: 'Cmd+2', click: go('/contacts') },
        { label: 'Pipeline', accelerator: 'Cmd+3', click: go('/pipeline') },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-config', (_, key) => store.get(key, ''));
ipcMain.handle('set-config', (_, key, value) => { store.set(key, value); return true; });
ipcMain.handle('get-all-config', () => store.store);
ipcMain.handle('save-all-config', (_, config) => {
  for (const [k, v] of Object.entries(config)) {
    if (ENV_KEYS.includes(k)) store.set(k, v);
  }
  return true;
});
ipcMain.handle('is-configured', () => !!(store.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID')));
ipcMain.handle('config-complete', () => {
  // Called from config-setup.html after user saves credentials on first launch
  writeEnvFile();
  if (mainWindow) {
    startNextServer(path.join(app.getPath('userData'), '.env.local'))
      .then(() => mainWindow.loadURL(`http://localhost:${PORT}`))
      .catch(() => mainWindow.loadFile(path.join(__dirname, 'error.html')));
  }
  return true;
});
ipcMain.handle('update-dock-badge', (_, count) => {
  if (process.platform === 'darwin') {
    app.dock.setBadge(count > 0 ? String(count) : '');
  }
  return true;
});

// ─── 8 AM morning notification ────────────────────────────────────────────────
function scheduleMorningNotification() {
  if (!Notification.isSupported()) return;
  const now = new Date();
  const target = new Date(now);
  target.setHours(8, 0, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  setTimeout(() => {
    new Notification({
      title: 'Good morning, Monica!',
      body: 'Your daily call list is ready. Open Monica AI Hub to start your day.',
    }).show();
    setInterval(() => {
      new Notification({
        title: 'Good morning, Monica!',
        body: 'Your daily call list is ready.',
      }).show();
    }, 24 * 60 * 60 * 1000);
  }, target.getTime() - now.getTime());
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  buildMenu();
  seedBundledCredentials();

  const isConfigured = !!(store.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID'));
  createWindow();

  if (!isConfigured) {
    // First launch with no credentials — show setup screen
    mainWindow.once('ready-to-show', () => {
      mainWindow.loadFile(path.join(__dirname, 'config-setup.html'));
    });
    return;
  }

  try {
    const envPath = writeEnvFile();
    await startNextServer(envPath);
    mainWindow.loadURL(`http://localhost:${PORT}`);
    scheduleMorningNotification();
  } catch (err) {
    console.error('[main] Startup failed:', err);
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  }
});

app.on('window-all-closed', () => {
  if (nextProcess) nextProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (nextProcess) nextProcess.kill();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
