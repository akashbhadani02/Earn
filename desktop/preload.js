'use strict';
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('aducateDesktop', {
  platform: process.platform,
  appName: 'Aducate'
});
