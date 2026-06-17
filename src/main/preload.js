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
  readClipboardText: () => ipcRenderer.invoke("clipboard:readText"),
  exportNote: (payload) => ipcRenderer.invoke("export:note", payload),
  onReminderSound: (callback) => {
    ipcRenderer.on("reminder:sound", (_event, sound) => callback(sound));
  },
  onReminderAlarm: (callback) => {
    ipcRenderer.on("reminder:alarm", (_event, payload) => callback(payload));
  },
  onOpenReminder: (callback) => {
    ipcRenderer.on("reminder:open", (_event, reminderId) => callback(reminderId));
  }
});
