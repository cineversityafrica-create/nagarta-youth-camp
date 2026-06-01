'use strict';

const { app, BrowserWindow, Menu, shell } = require('electron');
const http  = require('http');
const https = require('https');
const path  = require('path');

// ── URLs ──────────────────────────────────────────────────────────────────────
const ADMIN_URL    = 'https://nagarta-youth-camp.onrender.com/admin';
const BACKEND_HOST = 'nagarta-youth-camp.onrender.com';
const FRONTEND_URL = 'https://nagartayouthcamp.netlify.app';

let mainWindow  = null;
let splashWindow = null;
let proxyServer  = null;

// ── Local proxy :5000 → Render ────────────────────────────────────────────────
function startProxy() {
  return new Promise((resolve) => {
    proxyServer = http.createServer((req, res) => {
      if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin':      req.headers['origin'] || FRONTEND_URL,
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods':     'GET,POST,PUT,DELETE,PATCH,OPTIONS',
          'Access-Control-Allow-Headers':     'Content-Type,Authorization',
        });
        res.end();
        return;
      }

      const options = {
        hostname: BACKEND_HOST,
        port:     443,
        path:     req.url,
        method:   req.method,
        headers:  { ...req.headers, host: BACKEND_HOST, origin: FRONTEND_URL },
      };

      const proxy = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
          'Access-Control-Allow-Origin':      req.headers['origin'] || FRONTEND_URL,
          'Access-Control-Allow-Credentials': 'true',
        });
        proxyRes.pipe(res, { end: true });
      });

      proxy.on('error', () => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Could not reach the server. Please try again.' }));
      });

      req.pipe(proxy, { end: true });
    });

    proxyServer.listen(5000, '127.0.0.1', () => {
      console.log('[NAGARTA Admin] Proxy ready: localhost:5000 → https://' + BACKEND_HOST);
      resolve();
    });

    proxyServer.on('error', () => resolve()); // not fatal
  });
}

// ── Splash ────────────────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420, height: 480,
    frame: false, transparent: true, alwaysOnTop: true,
    center: true, resizable: false, skipTaskbar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// ── Main window ───────────────────────────────────────────────────────────────
function createMain() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900,
    minWidth: 1024, minHeight: 700,
    show: false, center: true,
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
    if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.destroy(); splashWindow = null; }
    mainWindow.show(); mainWindow.focus();
  });

  mainWindow.webContents.on('did-fail-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.destroy(); splashWindow = null; }
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url); return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ label: app.name, submenu: [
      { role: 'about' }, { type: 'separator' }, { role: 'hide' },
      { role: 'hideOthers' }, { type: 'separator' }, { role: 'quit' },
    ]}] : []),
    { label: 'Admin', submenu: [
      { label: 'Dashboard',     click: () => mainWindow?.loadURL(ADMIN_URL) },
      { label: 'Registrations', click: () => mainWindow?.loadURL(ADMIN_URL + '/registrations') },
      { label: 'Payments',      click: () => mainWindow?.loadURL(ADMIN_URL + '/payments') },
      { label: 'Users',         click: () => mainWindow?.loadURL(ADMIN_URL + '/users') },
      { label: 'Announcements', click: () => mainWindow?.loadURL(ADMIN_URL + '/announcements') },
      { label: 'Messages',      click: () => mainWindow?.loadURL(ADMIN_URL + '/messages') },
      { label: 'Site Content',  click: () => mainWindow?.loadURL(ADMIN_URL + '/site-content') },
      { label: 'Schedule',      click: () => mainWindow?.loadURL(ADMIN_URL + '/schedule') },
      { type: 'separator' },
      { label: 'Sign Out',      click: () => mainWindow?.loadURL(ADMIN_URL + '/logout') },
      { type: 'separator' },
      ...(!isMac ? [{ role: 'quit' }] : []),
    ]},
    { label: 'View', submenu: [
      { label: 'Reload',             accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
      { type: 'separator' },
      { label: 'Zoom In',            accelerator: 'CmdOrCtrl+=', click: () => { const w = mainWindow?.webContents; w?.setZoomLevel((w.getZoomLevel()||0)+0.5); }},
      { label: 'Zoom Out',           accelerator: 'CmdOrCtrl+-', click: () => { const w = mainWindow?.webContents; w?.setZoomLevel((w.getZoomLevel()||0)-0.5); }},
      { label: 'Reset Zoom',         accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.setZoomLevel(0) },
      { type: 'separator' },
      { label: 'Toggle Full Screen', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
      { label: 'Open DevTools',      accelerator: 'F12', click: () => mainWindow?.webContents.openDevTools() },
    ]},
    { label: 'Help', submenu: [
      { label: 'Open in Browser', click: () => shell.openExternal(ADMIN_URL) },
    ]},
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  await startProxy();
  createSplash();
  createMain();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMain(); });
});

app.on('window-all-closed', () => {
  if (proxyServer) proxyServer.close();
  if (process.platform !== 'darwin') app.quit();
});
