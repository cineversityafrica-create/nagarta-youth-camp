'use strict';
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
  isAdmin: true,
});
