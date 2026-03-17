'use strict';

const { app, BrowserWindow, shell, Menu, ipcMain, Notification } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const waitOn = require('wait-on');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';
const PORT = 9002;

let mainWindow = null;
let configWindow = null;
let nextProcess = null;

// ─── electron-store setup ────────────────────────────────────────────────────
let Store;
try {
  Store = require('electron-store');
} catch (e) {
  // Fallback if electron-store is not available
  Store = class {
    constructor() { this.data = {}; }
    get(key, def) { return this.data[key] !== undefined ? this.data[key] : def; }
    set(key, val) { this.data[key] = val; }
    get store() { return this.data; }
    has(key) { return this.data[key] !== undefined && this.data[key] !== ''; }
  };
}
const store = new Store({ name: 'monica-ai-hub-config' });

// ─── Env file writer ─────────────────────────────────────────────────────────

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
  'SPARK_API_KEY',
];

function writeEnvFile() {
  const envPath = path.join(__dirname, '../.env.local');
  const lines = ENV_KEYS
    .map(key => {
      const val = store.get(key, process.env[key] || '');
      return val ? `${key}=${val}` : null;
    })
    .filter(Boolean);
  try {
    fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf-8');
    console.log('[Monica] .env.local written with', lines.length, 'keys');
  } catch (err) {
    console.error('[Monica] Failed to write .env.local:', err.message);
  }
}

// ─── IPC handlers ────────────────────────────────────────────────────────────

ipcMain.handle('get-config', (_event, key) => store.get(key, ''));
ipcMain.handle('set-config', (_event, key, value) => {
  store.set(key, value);
  writeEnvFile();
  return true;
});
ipcMain.handle('get-all-config', () => store.store);
ipcMain.handle('save-all-config', (_event, config) => {
  Object.entries(config).forEach(([k, v]) => store.set(k, v));
  writeEnvFile();
  return true;
});
ipcMain.handle('is-configured', () => {
  // App is configured if Firebase project ID is set
  const projectId = store.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID', '');
  return !!projectId;
});
ipcMain.handle('config-complete', () => {
  // Called from config-setup.html when user saves
  if (configWindow) {
    configWindow.close();
    configWindow = null;
  }
  createMainWindow();
});
ipcMain.handle('update-dock-badge', (_event, count) => {
  if (app.dock) app.dock.setBadge(count > 0 ? String(count) : '');
});

// ─── Menu builder ────────────────────────────────────────────────────────────

function buildMenu() {
  const template = [
    {
      label: 'Monica AI Hub',
      submenu: [
        { label: 'About Monica AI Hub', role: 'about' },
        { type: 'separator' },
        { label: 'Hide Monica AI Hub', accelerator: 'Cmd+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Option+Cmd+H', role: 'hideOthers' },
        { type: 'separator' },
        { label: 'Quit Monica AI Hub', accelerator: 'Cmd+Q', role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
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
        { type: 'separator' },
        { role: 'window' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── Next.js server ──────────────────────────────────────────────────────────

function startNextServer() {
  return new Promise((resolve, reject) => {
    const nextBin = path.join(__dirname, '../node_modules/.bin/next');
    const appDir = path.join(__dirname, '..');

    console.log('[Monica] Starting Next.js server on port', PORT);

    nextProcess = exec(
      `"${nextBin}" start -p ${PORT}`,
      {
        cwd: appDir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: String(PORT),
        },
      }
    );

    nextProcess.stdout.on('data', data => process.stdout.write('[Next] ' + data));
    nextProcess.stderr.on('data', data => process.stderr.write('[Next ERR] ' + data));
    nextProcess.on('error', reject);

    waitOn({
      resources: [`http://localhost:${PORT}`],
      timeout: 120000,
      interval: 500,
    })
      .then(resolve)
      .catch(reject);
  });
}

// ─── Config window ───────────────────────────────────────────────────────────

function createConfigWindow() {
  configWindow = new BrowserWindow({
    width: 680,
    height: 760,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#1E3A8A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  configWindow.loadFile(path.join(__dirname, 'config-setup.html'));

  configWindow.once('ready-to-show', () => {
    configWindow.show();
    configWindow.focus();
  });
}

// ─── Main window ─────────────────────────────────────────────────────────────

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#F9FAFB',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  // Show loading screen immediately
  mainWindow.loadFile(path.join(__dirname, 'loading.html'));

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

  // Reload shortcut in dev
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (isDev && input.key === 'r' && input.meta) {
      mainWindow.webContents.reload();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Update dock badge when window focuses
  mainWindow.on('focus', () => {
    mainWindow.webContents.executeJavaScript(`
      (function() {
        try {
          const contacts = JSON.parse(localStorage.getItem('overdue_count') || '0');
          window.electronAPI && window.electronAPI.updateDockBadge(Number(contacts));
        } catch(e) {}
      })()
    `).catch(() => {});
  });

  return mainWindow;
}

// ─── Morning notification ─────────────────────────────────────────────────────

function scheduleMorningNotification() {
  const now = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();
  setTimeout(() => {
    if (Notification.isSupported()) {
      new Notification({
        title: 'Good morning, Monica!',
        body: "Open Monica AI Hub to see who to call today.",
        silent: false,
      }).show();
    }
    // Reschedule for tomorrow
    scheduleMorningNotification();
  }, delay);
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  buildMenu();

  const isConfigured = !!(store.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID', ''));

  if (!isConfigured) {
    // First launch — show config screen
    createConfigWindow();
    return;
  }

  // Write env file before starting Next.js
  writeEnvFile();

  if (isDev) {
    // Dev mode: Next.js is already running
    createMainWindow();
    mainWindow.loadURL(`http://localhost:${PORT}`);
    return;
  }

  // Production: start Next.js server, then swap to app
  const win = createMainWindow();
  try {
    await startNextServer();
    win.loadURL(`http://localhost:${PORT}`);
    scheduleMorningNotification();
  } catch (err) {
    console.error('[Monica] Server failed to start:', err);
    win.loadFile(path.join(__dirname, 'error.html'));
  }
});

app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill('SIGTERM');
    nextProcess = null;
  }
  app.quit();
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill('SIGTERM');
    nextProcess = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const isConfigured = !!(store.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID', ''));
    if (isConfigured) createMainWindow();
  }
});
