'use strict';

const { app, BrowserWindow, Menu, shell, session } = require('electron');
const path = require('path');

// ── Live URLs ─────────────────────────────────────────────────────────────────
// Update APP_URL to your Hostinger domain once deployed.
const APP_URL     = 'https://nagartayouthcamp.netlify.app';
const BACKEND_URL = 'https://nagarta-youth-camp.onrender.com';

let mainWindow = null;
let splashWindow = null;

// ── Splash screen ────────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 480,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    skipTaskbar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// ── Main window ──────────────────────────────────────────────────────────────
function createMain() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    center: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    title: 'NAGARTA Youth Camp',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  buildMenu();
  mainWindow.loadURL(APP_URL);

  // Show main window and close splash once page is ready
  mainWindow.webContents.on('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // If page fails (offline), still show window
  mainWindow.webContents.on('did-fail-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow.show();
  });

  // Open external links in the system browser, not inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Application menu ─────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ label: app.name, submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { type: 'separator' },
      { role: 'quit' },
    ]}] : []),
    {
      label: 'NAGARTA',
      submenu: [
        { label: 'Home', accelerator: 'CmdOrCtrl+H', click: () => mainWindow?.loadURL(APP_URL) },
        { label: 'Register Camper', click: () => mainWindow?.loadURL(APP_URL + '/register') },
        { label: 'Dashboard', click: () => mainWindow?.loadURL(APP_URL + '/dashboard/parent') },
        { type: 'separator' },
        { label: 'Admin Portal', click: () => shell.openExternal('https://nagarta-youth-camp.onrender.com/admin') },
        { type: 'separator' },
        ...(!isMac ? [{ role: 'quit' }] : []),
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { type: 'separator' },
        { label: 'Zoom In',  accelerator: 'CmdOrCtrl+=', click: () => { const w = mainWindow?.webContents; w?.setZoomLevel((w.getZoomLevel() || 0) + 0.5); }},
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => { const w = mainWindow?.webContents; w?.setZoomLevel((w.getZoomLevel() || 0) - 0.5); }},
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.setZoomLevel(0) },
        { type: 'separator' },
        { label: 'Toggle Full Screen', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Open in Browser', click: () => shell.openExternal(APP_URL) },
        { label: 'Contact Support', click: () => shell.openExternal('mailto:support@nagartacamp.com') },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // ── Fix: redirect localhost:5000 API calls to the live Render backend ──────
  // Netlify bakes NEXT_PUBLIC_API_URL=http://localhost:5000 at build time.
  // This intercepts those calls inside Electron and sends them to Render.
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://localhost:5000/*', 'http://127.0.0.1:5000/*'] },
    (details, callback) => {
      const redirectURL = details.url
        .replace('http://localhost:5000', BACKEND_URL)
        .replace('http://127.0.0.1:5000', BACKEND_URL);
      callback({ redirectURL });
    }
  );

  // ── Fix: restore Origin header after the redirect ────────────────────────
  // Cross-scheme redirects (http→https) cause browsers to send Origin: null.
  // The backend CORS handler rejects that, so we reset it to the app origin.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${BACKEND_URL}/*`] },
    (details, callback) => {
      const headers = { ...details.requestHeaders };
      if (!headers['Origin'] || headers['Origin'] === 'null') {
        headers['Origin'] = APP_URL;
      }
      callback({ requestHeaders: headers });
    }
  );

  createSplash();
  createMain();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMain();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
