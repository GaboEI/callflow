const { app, BrowserWindow, ipcMain, clipboard, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");

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
    workElapsedMs: 0,
    workStartedAt: null,
    currentBreakStartedAt: null,
    breaks: []
  }
};

let mainWindow;

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Failed to read ${filePath}`, error);
    }
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

async function ensureDataFiles() {
  const defaultConfig = await loadDefaultConfig();
  const settingsPath = getDataFile("settings");
  const settings = await readJson(settingsPath, null);

  if (!settings) {
    await writeJson(settingsPath, defaultConfig);
  }

  await Promise.all(
    Object.entries(DEFAULT_DATA).map(async ([key, value]) => {
      const filePath = getDataFile(key);
      const existing = await readJson(filePath, null);
      if (!existing) {
        await writeJson(filePath, value);
      }
    })
  );
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

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

app.whenReady().then(async () => {
  await ensureDataFiles();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("storage:getDataDir", () => getDataDir());

ipcMain.handle("storage:read", async (_event, key) => {
  if (key === "settings") {
    const defaults = await loadDefaultConfig();
    const settings = await readJson(getDataFile("settings"), defaults);
    return { ...defaults, ...settings };
  }
  return readJson(getDataFile(key), DEFAULT_DATA[key] || null);
});

ipcMain.handle("storage:write", async (_event, key, value) => {
  return writeJson(getDataFile(key), value);
});

ipcMain.handle("clipboard:writeText", (_event, text) => {
  clipboard.writeText(String(text || ""));
  return true;
});

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
