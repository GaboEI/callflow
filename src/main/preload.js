const { contextBridge, ipcRenderer } = require("electron");

const validKeys = new Set(["settings", "calls", "templates", "reminders", "knowledgeBase", "workTimer"]);

function assertKey(key) {
  if (!validKeys.has(key)) {
    throw new Error(`Invalid storage key: ${key}`);
  }
}

async function invoke(channel, ...args) {
  const response = await ipcRenderer.invoke(channel, ...args);
  if (response && response.ok === true) return response.value;
  if (response && response.ok === false) {
    const error = new Error(response.error.message || "CallFlow IPC error");
    error.code = response.error.code;
    error.details = response.error.details;
    throw error;
  }
  return response;
}

contextBridge.exposeInMainWorld("callflow", {
  getDataDir: () => invoke("storage:getDataDir"),
  getSystemLocale: () => invoke("app:getLocale"),
  getHealth: () => invoke("storage:getHealth"),
  read: (key) => {
    assertKey(key);
    return invoke("storage:read", key);
  },
  write: (key, value) => {
    assertKey(key);
    return invoke("storage:write", key, value);
  },
  copyText: (text) => invoke("clipboard:writeText", text),
  readClipboardText: () => invoke("clipboard:readText"),
  exportBackup: () => invoke("backup:export"),
  importBackup: () => invoke("backup:import"),
  resetLocalData: () => invoke("storage:clearAll"),
  restartApp: () => invoke("app:restart"),
  exportNote: (payload) => invoke("export:note", payload),
  importKnowledgeDocument: () => invoke("knowledge:import"),
  getDiagnostics: () => invoke("diagnostics:get"),
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
