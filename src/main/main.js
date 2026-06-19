const { app, BrowserWindow, Notification, ipcMain, clipboard, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const time = require("../shared/validators");
const { createStorageService } = require("./storage-service");
const { createLogger } = require("./logger");

let mainWindow;
let notificationTimer;
let keepRunningInBackground = false;
const notificationThrottle = new Map();
let storage;
let logger;

const IPC_LIMITS = {
  clipboardText: 50000,
  exportContent: 200000,
  fileName: 120
};

function getDataDir() {
  return app.getPath("userData");
}

function getLogger() {
  if (!logger) {
    logger = createLogger({ dataDir: getDataDir() });
  }
  return logger;
}

function getStorage() {
  if (!storage) {
    storage = createStorageService({
      dataDir: getDataDir(),
      defaultConfigPath: path.join(__dirname, "..", "data", "default_config.json"),
      logger: getLogger()
    });
  }
  return storage;
}

function structuredOk(value) {
  return { ok: true, value };
}

function structuredError(error, fallbackCode = "CALLFLOW_ERROR") {
  return {
    ok: false,
    error: {
      code: error.code || fallbackCode,
      message: error.message || String(error),
      details: error.details || null
    }
  };
}

function ipcHandler(fn, code) {
  return async (...args) => {
    try {
      return structuredOk(await fn(...args));
    } catch (error) {
      await getLogger().error("ipc-handler-failed", { code, message: error.message || String(error) });
      return structuredError(error, code);
    }
  };
}

function assertSize(name, value, max) {
  if (String(value || "").length > max) {
    const error = new Error(`${name} exceeds maximum size`);
    error.code = "PAYLOAD_TOO_LARGE";
    throw error;
  }
}

function sanitizeFileName(value, fallback = "callflow") {
  const cleaned = String(value || fallback)
    .split("")
    .map((char) => (char.charCodeAt(0) < 32 || /[<>:"/\\|?*]/.test(char) ? "-" : char))
    .join("")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim()
    .slice(0, IPC_LIMITS.fileName);
  return cleaned || fallback;
}

function reminderDueDate(reminder) {
  return time.reminderDueDate(reminder);
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function isValidReminder(reminder) {
  if (!reminder || reminder.status === "completed" || reminder.status === "deleted") return false;
  return isValidDate(reminderDueDate(reminder));
}

async function loadSettings() {
  return getStorage().loadSettings();
}

function applySystemSettings(settings) {
  keepRunningInBackground = Boolean(settings.runInBackground);
  if (app.isPackaged || process.platform !== "linux") {
    app.setLoginItemSettings({
      openAtLogin: Boolean(settings.startOnLogin),
      path: process.execPath
    });
  } else {
    app.setLoginItemSettings({ openAtLogin: Boolean(settings.startOnLogin) });
  }
}

function focusMainWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.focus();
}

function openReminder(reminderId) {
  focusMainWindow();
  mainWindow.webContents.send("reminder:open", reminderId);
}

function isReminderSuppressed(reminder, now) {
  const snoozedUntil = reminder.snoozedUntil ? new Date(reminder.snoozedUntil) : null;
  const mutedUntil = reminder.mutedUntil ? new Date(reminder.mutedUntil) : null;
  return (snoozedUntil && snoozedUntil > now) || (mutedUntil && mutedUntil > now);
}

function sendReminderAlarm(reminder, phase) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("reminder:alarm", { reminder, phase });
  }
}

function sendReminderNotification(reminder, phase, settings) {
  if (!Notification.isSupported()) return;
  const key = `${reminder.id}:${phase}`;
  const now = Date.now();
  const lastSent = notificationThrottle.get(key) || 0;
  if (now - lastSent < 60000) return;
  notificationThrottle.set(key, now);

  const title = phase === "early" ? "Recordatorio próximo" : "Recordatorio";
  const bodyParts = [];
  if (reminder.time) bodyParts.push(reminder.time);
  if (reminder.callId) bodyParts.push(`ID ${reminder.callId}`);
  if (reminder.note) bodyParts.push(reminder.note);
  const notification = new Notification({
    title,
    body: bodyParts.join(" - "),
    silent: settings.reminderSound === "none"
  });
  notification.on("click", () => openReminder(reminder.id));
  notification.show();
}

async function checkReminderNotifications() {
  const settings = await loadSettings();
  const reminders = await getStorage().read("reminders");
  const now = new Date();
  const beforeMs = Math.max(0, Number(settings.notifyBeforeMinutes) || 0) * 60 * 1000;

  reminders
    .filter(isValidReminder)
    .forEach((reminder) => {
      if (isReminderSuppressed(reminder, now)) return;
      const due = reminderDueDate(reminder);
      const diff = due - now;
      if (beforeMs > 0 && diff > 0 && diff <= beforeMs) {
        sendReminderAlarm(reminder, "early");
        sendReminderNotification(reminder, "early", settings);
      }
      if (settings.notifyAtExactTime !== false && diff <= 0) {
        sendReminderAlarm(reminder, diff < -60 * 1000 ? "overdue" : "exact");
        sendReminderNotification(reminder, diff < -60 * 1000 ? "overdue" : "exact", settings);
      }
    });
}

function startReminderNotifications() {
  if (notificationTimer) clearInterval(notificationTimer);
  notificationTimer = setInterval(() => {
    checkReminderNotifications().catch((error) => console.error("Reminder notification check failed", error));
  }, 15000);
  checkReminderNotifications().catch((error) => console.error("Reminder notification check failed", error));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 620,
    height: 760,
    minWidth: 520,
    minHeight: 620,
    backgroundColor: "#0F172A",
    icon: path.join(__dirname, "..", "..", "build", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: app.isPackaged || process.platform !== "linux"
    }
  });

  mainWindow.on("close", (event) => {
    if (keepRunningInBackground && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

app.whenReady().then(async () => {
  await getLogger().info("app-started", {
    version: app.getVersion(),
    electron: process.versions.electron,
    platform: process.platform,
    packaged: app.isPackaged
  });
  await getStorage().ensureDataFiles();
  applySystemSettings(await loadSettings());
  createWindow();
  startReminderNotifications();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && !keepRunningInBackground) {
    app.quit();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

ipcMain.handle("storage:getDataDir", ipcHandler(() => getDataDir(), "GET_DATA_DIR_FAILED"));

ipcMain.handle("storage:getHealth", ipcHandler(() => getStorage().getHealth(), "GET_STORAGE_HEALTH_FAILED"));

ipcMain.handle("storage:read", ipcHandler(async (_event, key) => {
  return getStorage().read(key);
}, "STORAGE_READ_FAILED"));

ipcMain.handle("storage:write", ipcHandler(async (_event, key, value) => {
  const saved = await getStorage().write(key, value);
  if (key === "settings") {
    applySystemSettings(saved);
  }
  if (key === "reminders") {
    notificationThrottle.clear();
  }
  return saved;
}, "STORAGE_WRITE_FAILED"));

ipcMain.handle("clipboard:writeText", ipcHandler((_event, text) => {
  const safeText = String(text || "");
  assertSize("Clipboard text", safeText, IPC_LIMITS.clipboardText);
  clipboard.writeText(safeText);
  return true;
}, "CLIPBOARD_WRITE_FAILED"));

ipcMain.handle("clipboard:readText", ipcHandler(() => clipboard.readText(), "CLIPBOARD_READ_FAILED"));

ipcMain.handle("export:note", ipcHandler(async (_event, payload = {}) => {
  const { fileName, content, extension } = payload;
  const safeExtension = extension === "txt" ? "txt" : "md";
  const safeContent = String(content || "");
  assertSize("Export content", safeContent, IPC_LIMITS.exportContent);
  const defaultPath = `${sanitizeFileName(fileName, "callflow-note")}.${safeExtension}`;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export note",
    defaultPath,
    filters: [{ name: safeExtension.toUpperCase(), extensions: [safeExtension] }]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await fs.writeFile(result.filePath, safeContent, "utf8");
  return { canceled: false, filePath: result.filePath };
}, "EXPORT_NOTE_FAILED"));

ipcMain.handle("backup:export", ipcHandler(async () => {
  const defaultPath = `${sanitizeFileName(`callflow-backup-${new Date().toISOString().slice(0, 10)}`)}.callflow-backup.json`;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export CallFlow backup",
    defaultPath,
    filters: [{ name: "CallFlow Backup", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }
  await getStorage().exportBackup(result.filePath);
  return { canceled: false, filePath: result.filePath };
}, "BACKUP_EXPORT_FAILED"));

ipcMain.handle("backup:import", ipcHandler(async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Import CallFlow backup",
    properties: ["openFile"],
    filters: [{ name: "CallFlow Backup", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePaths.length) {
    return { canceled: true };
  }
  const data = await getStorage().importBackup(result.filePaths[0]);
  applySystemSettings(data.settings);
  notificationThrottle.clear();
  return { canceled: false, data };
}, "BACKUP_IMPORT_FAILED"));

ipcMain.handle("diagnostics:get", ipcHandler(async () => {
  return getStorage().getDiagnostics({
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    packaged: app.isPackaged
  });
}, "DIAGNOSTICS_FAILED"));
