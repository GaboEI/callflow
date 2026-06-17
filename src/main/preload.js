const { contextBridge, ipcRenderer } = require("electron");

const validKeys = new Set(["settings", "calls", "templates", "reminders", "knowledgeBase", "workTimer"]);

function assertKey(key) {
  if (!validKeys.has(key)) {
    throw new Error(`Invalid storage key: ${key}`);
  }
}

contextBridge.exposeInMainWorld("callflow", {
  getDataDir: () => ipcRenderer.invoke("storage:getDataDir"),
  read: (key) => {
    assertKey(key);
    return ipcRenderer.invoke("storage:read", key);
  },
  write: (key, value) => {
    assertKey(key);
    return ipcRenderer.invoke("storage:write", key, value);
  },
  copyText: (text) => ipcRenderer.invoke("clipboard:writeText", text),
  exportNote: (payload) => ipcRenderer.invoke("export:note", payload)
});
