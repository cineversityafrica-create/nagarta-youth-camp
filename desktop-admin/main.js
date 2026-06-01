'use strict';

const { app, BrowserWindow, Menu, shell, session } = require('electron');
const path = require('path');

// ── Admin portal URL ──────────────────────────────────────────────────────────
// Update to your Hostinger domain once deployed, e.g. https://nagartacamp.com/admin
const ADMIN_URL   = 'https://nagarta-youth-camp.onrender.com/admin';
const BACKEND_URL = 'https://nagarta-youth-camp.onrender.com';

let mainWindow = null;
let splashWindow = null;

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

function createMain() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    center: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    title: 'NAGARTA Admin Portal',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  buildMenu();
  mainWindow.loadURL(ADMIN_URL);

  mainWindow.webContents.on('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-fail-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow.show();
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ label: app.name, submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'hide' }, { role: 'hideOthers' },
      { type: 'separator' },
      { role: 'quit' },
    ]}] : []),
    {
      label: 'Admin',
      submenu: [
        { label: 'Dashboard',       click: () => mainWindow?.loadURL(ADMIN_URL) },
        { label: 'Registrations',   click: () => mainWindow?.loadURL(ADMIN_URL + '/registrations') },
        { label: 'Payments',        click: () => mainWindow?.loadURL(ADMIN_URL + '/payments') },
        { label: 'Users',           click: () => mainWindow?.loadURL(ADMIN_URL + '/users') },
        { label: 'Announcements',   click: () => mainWindow?.loadURL(ADMIN_URL + '/announcements') },
        { label: 'Messages',        click: () => mainWindow?.loadURL(ADMIN_URL + '/messages') },
        { label: 'Site Content',    click: () => mainWindow?.loadURL(ADMIN_URL + '/site-content') },
        { label: 'Schedule',        click: () => mainWindow?.loadURL(ADMIN_URL + '/schedule') },
        { type: 'separator' },
        { label: 'Sign Out',        click: () => mainWindow?.loadURL(ADMIN_URL + '/logout') },
        { type: 'separator' },
        ...(!isMac ? [{ role: 'quit' }] : []),
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload',            accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { type: 'separator' },
        { label: 'Zoom In',           accelerator: 'CmdOrCtrl+=', click: () => { const w = mainWindow?.webContents; w?.setZoomLevel((w.getZoomLevel() || 0) + 0.5); }},
        { label: 'Zoom Out',          accelerator: 'CmdOrCtrl+-', click: () => { const w = mainWindow?.webContents; w?.setZoomLevel((w.getZoomLevel() || 0) - 0.5); }},
        { label: 'Reset Zoom',        accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.setZoomLevel(0) },
        { type: 'separator' },
        { label: 'Toggle Full Screen',accelerator: 'F11',          click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
        { label: 'Open DevTools',     accelerator: 'F12',          click: () => mainWindow?.webContents.openDevTools() },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Open in Browser', click: () => shell.openExternal(ADMIN_URL) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  // Redirect any localhost:5000 API calls to the live backend
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://localhost:5000/*', 'http://127.0.0.1:5000/*'] },
    (details, callback) => {
      const redirectURL = details.url
        .replace('http://localhost:5000', BACKEND_URL)
        .replace('http://127.0.0.1:5000', BACKEND_URL);
      callback({ redirectURL });
    }
  );

  // Restore Origin header after cross-scheme redirect (http→https sets Origin: null)
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${BACKEND_URL}/*`] },
    (details, callback) => {
      const headers = { ...details.requestHeaders };
      if (!headers['Origin'] || headers['Origin'] === 'null') {
        headers['Origin'] = 'https://nagartayouthcamp.netlify.app';
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
