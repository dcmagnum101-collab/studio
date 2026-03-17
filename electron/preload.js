'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  getAllConfig: () => ipcRenderer.invoke('get-all-config'),
  saveAllConfig: (config) => ipcRenderer.invoke('save-all-config', config),
  isConfigured: () => ipcRenderer.invoke('is-configured'),
  configComplete: () => ipcRenderer.invoke('config-complete'),
  updateDockBadge: (count) => ipcRenderer.invoke('update-dock-badge', count),
});
