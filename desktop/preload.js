'use strict';
// Preload runs in a sandboxed context — expose only what the renderer needs.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
  version: process.env.npm_package_version || '1.0.0',
});
