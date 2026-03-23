'use strict';

const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// Load env vars from the right location
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env.local')
  : path.join(__dirname, '..', '.env.local');

require('dotenv').config({ path: envPath });

// The port Next.js runs on
const PORT = 3000;

let mainWindow = null;
let splashWindow = null;
let nextProcess = null;

// ── Window state persistence ──────────────────────────────────────────────────
let Store;
let store;

async function loadStore() {
  const { default: ElectronStore } = await import('electron-store');
  Store = ElectronStore;
  store = new Store({
    defaults: {
      windowBounds: { width: 1400, height: 900, x: undefined, y: undefined },
    },
  });
}

// ── Wait for Next.js server ───────────────────────────────────────────────────
async function waitForServer(port, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}`, resolve);
        req.on('error', reject);
        req.setTimeout(1000, () => reject(new Error('timeout')));
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

// ── Splash screen ─────────────────────────────────────────────────────────────
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 300,
    center: true,
    frame: false,
    transparent: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.show();
}

// ── Main application window ───────────────────────────────────────────────────
async function createMainWindow() {
  const bounds = store ? store.get('windowBounds') : { width: 1400, height: 900 };

  mainWindow = new BrowserWindow({
    width: bounds.width || 1400,
    height: bounds.height || 900,
    x: bounds.x,
    y: bounds.y,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0A0A0A',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Save window bounds on close
  mainWindow.on('close', () => {
    if (store) {
      store.set('windowBounds', mainWindow.getBounds());
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.show();
  mainWindow.focus();

  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

// ── Spawn Next.js server ──────────────────────────────────────────────────────
function startNextServer() {
  return new Promise((resolve, reject) => {
    const nextBin = app.isPackaged
      ? path.join(process.resourcesPath, 'app', 'node_modules', '.bin', 'next')
      : path.join(__dirname, '..', 'node_modules', '.bin', 'next');

    const appDir = app.isPackaged
      ? path.join(process.resourcesPath, 'app')
      : path.join(__dirname, '..');

    // In packaged app use `next start`, in dev use `next dev`
    const args = app.isPackaged
      ? ['start', '--port', String(PORT)]
      : ['dev', '--turbopack', '--port', String(PORT)];

    nextProcess = spawn(nextBin, args, {
      cwd: appDir,
      env: {
        ...process.env,
        PORT: String(PORT),
        ELECTRON_RUN_AS_NODE: '1',
      },
      stdio: 'pipe',
    });

    nextProcess.stdout.on('data', data => {
      process.stdout.write(`[Next] ${data}`);
    });

    nextProcess.stderr.on('data', data => {
      process.stderr.write(`[Next:err] ${data}`);
    });

    nextProcess.on('error', err => {
      console.error('Failed to start Next.js:', err);
      reject(err);
    });

    nextProcess.on('exit', code => {
      if (code !== 0 && code !== null) {
        console.error(`Next.js exited with code ${code}`);
      }
    });

    resolve();
  });
}

// ── Native Mac menu ───────────────────────────────────────────────────────────
function buildMenu() {
  const isDev = !app.isPackaged;
  const template = [
    {
      label: app.name,
      submenu: [
        {
          label: `About ${app.name}`,
          role: 'about',
        },
        { type: 'separator' },
        {
          label: 'Preferences…',
          accelerator: 'Cmd+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('open-preferences');
            }
          },
        },
        { type: 'separator' },
        { label: `Hide ${app.name}`, accelerator: 'Cmd+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Cmd+Option+H', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit Monica AI Hub', accelerator: 'Cmd+Q', role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Prospect',
          accelerator: 'Cmd+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('new-prospect');
            }
          },
        },
        { type: 'separator' },
        { label: 'Close Window', accelerator: 'Cmd+W', role: 'close' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Cmd+R',
          click: () => {
            if (mainWindow) mainWindow.reload();
          },
        },
        ...(isDev
          ? [
              {
                label: 'Developer Tools',
                accelerator: 'Cmd+Option+I',
                click: () => {
                  if (mainWindow) mainWindow.webContents.openDevTools();
                },
              },
            ]
          : []),
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'Cmd+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'Cmd+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'Cmd+-', role: 'zoomOut' },
        { type: 'separator' },
        {
          label: 'Enter Full Screen',
          accelerator: 'Ctrl+Cmd+F',
          role: 'togglefullscreen',
        },
      ],
    },
    {
      label: 'Window',
      role: 'windowMenu',
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Visit FrontlineAIHub.com',
          click: () => shell.openExternal('https://frontlineaihub.com'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  await loadStore();

  createSplashWindow();
  buildMenu();

  try {
    await startNextServer();
    const ready = await waitForServer(PORT);

    if (!ready) {
      dialog.showErrorBox(
        'Startup Error',
        'Monica AI Hub failed to start the web server. Please try relaunching the app.'
      );
      app.quit();
      return;
    }

    await createMainWindow();
  } catch (err) {
    console.error('Startup error:', err);
    dialog.showErrorBox('Startup Error', String(err));
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null) {
    await createMainWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill('SIGTERM');
    nextProcess = null;
  }
});
