const { app, BrowserWindow, Notification, ipcMain, clipboard, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const time = require("../shared/validators");
const { createStorageService } = require("./storage-service");

let mainWindow;
let notificationTimer;
let keepRunningInBackground = false;
const notificationThrottle = new Map();
let storage;

function getDataDir() {
  return app.getPath("userData");
}

function getStorage() {
  if (!storage) {
    storage = createStorageService({
      dataDir: getDataDir(),
      defaultConfigPath: path.join(__dirname, "..", "data", "default_config.json")
    });
  }
  return storage;
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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
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

ipcMain.handle("storage:getDataDir", () => getDataDir());

ipcMain.handle("storage:getHealth", () => getStorage().getHealth());

ipcMain.handle("storage:read", async (_event, key) => {
  return getStorage().read(key);
});

ipcMain.handle("storage:write", async (_event, key, value) => {
  const saved = await getStorage().write(key, value);
  if (key === "settings") {
    applySystemSettings(saved);
  }
  if (key === "reminders") {
    notificationThrottle.clear();
  }
  return saved;
});

ipcMain.handle("clipboard:writeText", (_event, text) => {
  clipboard.writeText(String(text || ""));
  return true;
});

ipcMain.handle("clipboard:readText", () => clipboard.readText());

ipcMain.handle("export:note", async (_event, { fileName, content, extension }) => {
  const safeExtension = extension === "txt" ? "txt" : "md";
  const defaultPath = `${fileName || "callflow-note"}.${safeExtension}`;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export note",
    defaultPath,
    filters: [{ name: safeExtension.toUpperCase(), extensions: [safeExtension] }]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await fs.writeFile(result.filePath, content || "", "utf8");
  return { canceled: false, filePath: result.filePath };
});
