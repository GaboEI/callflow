const { app, BrowserWindow, Notification, ipcMain, clipboard, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const time = require("../renderer/scripts/validators");

const DATA_FILES = {
  settings: "settings.json",
  calls: "calls.json",
  templates: "templates.json",
  reminders: "reminders.json",
  knowledgeBase: "knowledge_base.json",
  workTimer: "work_timer.json"
};

const DEFAULT_DATA = {
  calls: [],
  templates: [],
  reminders: [],
  knowledgeBase: [],
  workTimer: {
    status: "idle",
    previousStatus: null,
    workElapsedMs: 0,
    workStartedAt: null,
    currentBreakStartedAt: null,
    breaks: []
  }
};

let mainWindow;
let notificationTimer;
let keepRunningInBackground = false;
const notificationThrottle = new Map();
const dataHealthEvents = [];

function backupTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
}

function cloneFallback(fallback) {
  if (fallback === null || fallback === undefined) return fallback;
  return JSON.parse(JSON.stringify(fallback));
}

async function backupCorruptFile(filePath, reason) {
  const backupPath = `${filePath}.corrupt-${backupTimestamp()}.json`;
  try {
    await fs.rename(filePath, backupPath);
    dataHealthEvents.push({
      type: "corrupt-json-recovered",
      file: path.basename(filePath),
      backupFile: path.basename(backupPath),
      message: reason.message || String(reason),
      createdAt: new Date().toISOString()
    });
    return backupPath;
  } catch (error) {
    dataHealthEvents.push({
      type: "corrupt-json-backup-failed",
      file: path.basename(filePath),
      message: error.message || String(error),
      createdAt: new Date().toISOString()
    });
    return null;
  }
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return cloneFallback(fallback);
    }
    if (error instanceof SyntaxError) {
      console.error(`Corrupt JSON recovered from ${filePath}`, error);
      await backupCorruptFile(filePath, error);
    } else {
      console.error(`Failed to read ${filePath}`, error);
    }
    return cloneFallback(fallback);
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const json = `${JSON.stringify(value, null, 2)}\n`;
  JSON.parse(json);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tempPath, json, "utf8");
  await fs.rename(tempPath, filePath);
  return value;
}

async function loadDefaultConfig() {
  const configPath = path.join(__dirname, "..", "data", "default_config.json");
  return readJson(configPath, {});
}

function getDataDir() {
  return app.getPath("userData");
}

function getDataFile(key) {
  if (!DATA_FILES[key]) {
    throw new Error(`Unknown data key: ${key}`);
  }
  return path.join(getDataDir(), DATA_FILES[key]);
}

function validateStorageValue(key, value) {
  if (["calls", "templates", "reminders", "knowledgeBase"].includes(key) && !Array.isArray(value)) {
    throw new Error(`Invalid ${key} payload: expected array`);
  }
  if (["settings", "workTimer"].includes(key) && (!value || typeof value !== "object" || Array.isArray(value))) {
    throw new Error(`Invalid ${key} payload: expected object`);
  }
  return value;
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
  const defaults = await loadDefaultConfig();
  const settings = await readJson(getDataFile("settings"), defaults);
  return { ...defaults, ...settings };
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
  const reminders = await readJson(getDataFile("reminders"), []);
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

async function ensureDataFiles() {
  const defaultConfig = await loadDefaultConfig();
  const settingsPath = getDataFile("settings");
  const settings = await readJson(settingsPath, null);

  if (!settings || !(await fileExists(settingsPath))) {
    await writeJson(settingsPath, defaultConfig);
  }

  await Promise.all(
    Object.entries(DEFAULT_DATA).map(async ([key, value]) => {
      const filePath = getDataFile(key);
      const existing = await readJson(filePath, null);
      if (!existing || !(await fileExists(filePath))) {
        await writeJson(filePath, value);
      }
    })
  );
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (_error) {
    return false;
  }
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
      sandbox: false
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
  await ensureDataFiles();
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

ipcMain.handle("storage:getHealth", () => dataHealthEvents);

ipcMain.handle("storage:read", async (_event, key) => {
  if (key === "settings") {
    return loadSettings();
  }
  return readJson(getDataFile(key), DEFAULT_DATA[key] || null);
});

ipcMain.handle("storage:write", async (_event, key, value) => {
  const saved = await writeJson(getDataFile(key), validateStorageValue(key, value));
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
