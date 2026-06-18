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
    previousStatus: null,
    workElapsedMs: 0,
    workStartedAt: null,
    currentBreakStartedAt: null,
    breaks: []
  }
};

const CALL_BACKUP_LIMIT = 20;

function backupTimestamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
}

function cloneFallback(fallback) {
  if (fallback === null || fallback === undefined) return fallback;
  return JSON.parse(JSON.stringify(fallback));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (_error) {
    return false;
  }
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

function createStorageService({ dataDir, defaultConfigPath, backupLimit = CALL_BACKUP_LIMIT }) {
  const dataHealthEvents = [];

  function healthEvent(event) {
    dataHealthEvents.push({
      ...event,
      createdAt: new Date().toISOString()
    });
  }

  function getDataFile(key) {
    if (!DATA_FILES[key]) {
      throw new Error(`Unknown data key: ${key}`);
    }
    return path.join(dataDir, DATA_FILES[key]);
  }

  async function backupCorruptFile(filePath, reason) {
    const backupPath = `${filePath}.corrupt-${backupTimestamp()}.json`;
    try {
      await fs.rename(filePath, backupPath);
      healthEvent({
        type: "corrupt-json-recovered",
        file: path.basename(filePath),
        backupFile: path.basename(backupPath),
        message: reason.message || String(reason)
      });
      return backupPath;
    } catch (error) {
      healthEvent({
        type: "corrupt-json-backup-failed",
        file: path.basename(filePath),
        message: error.message || String(error)
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

  async function rotateCallBackups(backupDir) {
    const entries = await fs.readdir(backupDir).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const backups = entries
      .filter((name) => /^calls\.json\.bak-\d{8}-\d{6}(?:-\d+)?\.json$/.test(name))
      .sort()
      .reverse();
    await Promise.all(
      backups.slice(backupLimit).map((name) => fs.unlink(path.join(backupDir, name)).catch(() => null))
    );
  }

  async function backupCallsFile() {
    const filePath = getDataFile("calls");
    if (!(await fileExists(filePath))) return null;
    const backupDir = path.join(dataDir, "backups", "calls");
    try {
      await fs.mkdir(backupDir, { recursive: true });
      const timestamp = backupTimestamp();
      let backupPath = path.join(backupDir, `calls.json.bak-${timestamp}.json`);
      for (let index = 1; await fileExists(backupPath); index += 1) {
        backupPath = path.join(backupDir, `calls.json.bak-${timestamp}-${index}.json`);
      }
      await fs.copyFile(filePath, backupPath);
      await rotateCallBackups(backupDir);
      return backupPath;
    } catch (error) {
      healthEvent({
        type: "calls-backup-failed",
        file: DATA_FILES.calls,
        message: error.message || String(error)
      });
      return null;
    }
  }

  async function loadDefaultConfig() {
    return readJson(defaultConfigPath, {});
  }

  async function loadSettings() {
    const defaults = await loadDefaultConfig();
    const settings = await readJson(getDataFile("settings"), defaults);
    return { ...defaults, ...settings };
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

  async function read(key) {
    if (key === "settings") {
      return loadSettings();
    }
    return readJson(getDataFile(key), DEFAULT_DATA[key] || null);
  }

  async function write(key, value) {
    const validated = validateStorageValue(key, value);
    if (key === "calls") {
      await backupCallsFile();
    }
    return writeJson(getDataFile(key), validated);
  }

  return {
    DATA_FILES,
    DEFAULT_DATA,
    backupCallsFile,
    ensureDataFiles,
    getDataFile,
    getHealth: () => dataHealthEvents,
    loadSettings,
    read,
    readJson,
    validateStorageValue,
    write,
    writeJson
  };
}

module.exports = {
  CALL_BACKUP_LIMIT,
  DATA_FILES,
  DEFAULT_DATA,
  backupTimestamp,
  createStorageService,
  validateStorageValue
};
