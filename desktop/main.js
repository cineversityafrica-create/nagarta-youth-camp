'use strict';

const { app, BrowserWindow, Menu, shell } = require('electron');
const http  = require('http');
const https = require('https');
const path  = require('path');

// ── Live URLs ─────────────────────────────────────────────────────────────────
const APP_URL     = 'https://nagartayouthcamp.netlify.app';
const BACKEND_HOST = 'nagarta-youth-camp.onrender.com';

let mainWindow  = null;
let splashWindow = null;
let proxyServer  = null;

// ── Local proxy server on :5000 → Render ─────────────────────────────────────
// The Netlify build bakes localhost:5000 as the API URL. Instead of
// fighting redirects and CORS issues, we run a real HTTP proxy here so the
// frontend calls hit localhost:5000, the proxy forwards them to Render with
// the correct headers, and everything just works.
function startProxy() {
  return new Promise((resolve) => {
    proxyServer = http.createServer((req, res) => {
      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin':      req.headers['origin'] || APP_URL,
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
        headers:  {
          ...req.headers,
          host:   BACKEND_HOST,
          origin: APP_URL,         // always send a valid whitelisted origin
        },
      };

      const proxy = https.request(options, (proxyRes) => {
        const cors = {
          'Access-Control-Allow-Origin':      req.headers['origin'] || APP_URL,
          'Access-Control-Allow-Credentials': 'true',
        };
        res.writeHead(proxyRes.statusCode, { ...proxyRes.headers, ...cors });
        proxyRes.pipe(res, { end: true });
      });

      proxy.on('error', () => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Could not reach the server. Please try again.' }));
      });

      req.pipe(proxy, { end: true });
    });

    proxyServer.listen(5000, '127.0.0.1', () => {
      console.log('[NAGARTA] Proxy ready: localhost:5000 → https://' + BACKEND_HOST);
      resolve();
    });

    proxyServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log('[NAGARTA] Port 5000 already in use — skipping proxy (dev server?)');
      }
      resolve(); // not fatal
    });
  });
}

// ── Splash screen ─────────────────────────────────────────────────────────────
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
    width: 1360, height: 860,
    minWidth: 960, minHeight: 640,
    show: false, center: true,
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

  mainWindow.webContents.on('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.destroy(); splashWindow = null; }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-fail-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.destroy(); splashWindow = null; }
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Menu ──────────────────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ label: app.name, submenu: [
      { role: 'about' }, { type: 'separator' }, { role: 'services' },
      { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' },
      { type: 'separator' }, { role: 'quit' },
    ]}] : []),
    { label: 'NAGARTA', submenu: [
      { label: 'Home',           accelerator: 'CmdOrCtrl+H', click: () => mainWindow?.loadURL(APP_URL) },
      { label: 'Register Camper', click: () => mainWindow?.loadURL(APP_URL + '/register') },
      { label: 'Dashboard',      click: () => mainWindow?.loadURL(APP_URL + '/dashboard/parent') },
      { type: 'separator' },
      { label: 'Admin Portal', click: () => shell.openExternal('https://' + BACKEND_HOST + '/admin') },
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
    ]},
    { label: 'Help', submenu: [
      { label: 'Open in Browser',  click: () => shell.openExternal(APP_URL) },
      { label: 'Contact Support',  click: () => shell.openExternal('mailto:support@nagartacamp.com') },
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
