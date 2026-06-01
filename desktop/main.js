'use strict';

const { app, BrowserWindow, Menu, shell, nativeImage } = require('electron');
const path = require('path');

// ── Live app URL ─────────────────────────────────────────────────────────────
// Update this to your Hostinger domain once deployed.
const APP_URL = 'https://nagartayouthcamp.netlify.app';

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
  createSplash();
  createMain();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMain();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
