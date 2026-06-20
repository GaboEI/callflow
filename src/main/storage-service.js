const path = require("path");
const fs = require("fs/promises");
const schema = require("../shared/schema");

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
    dailyWorkDate: null,
    dailyWorkElapsedMs: 0,
    dailyWorkStartedAt: null,
    dailyWorkHistory: {},
    currentBreakStartedAt: null,
    breaks: []
  }
};

const CALL_BACKUP_LIMIT = 20;
const FULL_BACKUP_LIMIT = 20;

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

function createStorageService({ dataDir, defaultConfigPath, backupLimit = CALL_BACKUP_LIMIT, logger = null }) {
  const dataHealthEvents = [];

  function healthEvent(event) {
    dataHealthEvents.push({
      ...event,
      createdAt: new Date().toISOString()
    });
    if (logger) {
      logger.warn(event.type || "storage-health", event).catch(() => null);
    }
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

  async function readRawDataFile(key, fallback) {
    return readJson(getDataFile(key), fallback);
  }

  async function writeRawDataFile(key, value) {
    return writeJson(getDataFile(key), value);
  }

  async function backupDataFile(key, reason = "manual") {
    const filePath = getDataFile(key);
    if (!(await fileExists(filePath))) return null;
    const backupDir = path.join(dataDir, "backups", key);
    try {
      await fs.mkdir(backupDir, { recursive: true });
      const timestamp = backupTimestamp();
      let backupPath = path.join(backupDir, `${DATA_FILES[key]}.bak-${timestamp}.json`);
      for (let index = 1; await fileExists(backupPath); index += 1) {
        backupPath = path.join(backupDir, `${DATA_FILES[key]}.bak-${timestamp}-${index}.json`);
      }
      await fs.copyFile(filePath, backupPath);
      if (logger) await logger.info("data-file-backup-created", { key, reason, backupPath });
      return backupPath;
    } catch (error) {
      healthEvent({
        type: `${key}-backup-failed`,
        file: DATA_FILES[key],
        message: error.message || String(error)
      });
      return null;
    }
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
    const backupPath = await backupDataFile("calls", "calls-overwrite");
    await rotateCallBackups(path.join(dataDir, "backups", "calls"));
    return backupPath;
  }

  async function loadDefaultConfig() {
    return readJson(defaultConfigPath, {});
  }

  async function loadSettings() {
    const defaults = await loadDefaultConfig();
    const rawSettings = await readRawDataFile("settings", defaults);
    const migrated = await migrateAndPersistIfNeeded("settings", rawSettings, { defaults });
    return migrated;
  }

  async function readCurrentSettingsForMigration(defaults) {
    const rawSettings = await readRawDataFile("settings", defaults);
    return schema.migrateData("settings", rawSettings, { defaults }).data;
  }

  async function migrateAndPersistIfNeeded(key, rawValue, context = {}) {
    const migrated = schema.migrateData(key, rawValue, context);
    if (migrated.changed) {
      await backupDataFile(key, "schema-migration");
      await writeRawDataFile(key, schema.wrapPayload(key, migrated.data, migrated.schemaVersion));
      healthEvent({
        type: "schema-migrated",
        file: DATA_FILES[key],
        schemaVersion: migrated.schemaVersion
      });
    }
    return migrated.data;
  }

  async function ensureDataFiles() {
    const defaultConfig = await loadDefaultConfig();
    const settingsPath = getDataFile("settings");
    const settings = await readJson(settingsPath, null);

    if (!settings || !(await fileExists(settingsPath))) {
      await writeRawDataFile("settings", schema.wrapPayload("settings", schema.normalizeData("settings", defaultConfig, { defaults: defaultConfig })));
    }

    await Promise.all(
      Object.entries(DEFAULT_DATA).map(async ([key, value]) => {
        const filePath = getDataFile(key);
        const existing = await readJson(filePath, null);
        if (!existing || !(await fileExists(filePath))) {
          await writeRawDataFile(key, schema.wrapPayload(key, schema.normalizeData(key, value, { settings: defaultConfig })));
        }
      })
    );
  }

  async function read(key) {
    if (key === "settings") {
      return loadSettings();
    }
    const defaults = await loadDefaultConfig();
    const settings = await readCurrentSettingsForMigration(defaults);
    const rawValue = await readRawDataFile(key, DEFAULT_DATA[key] || null);
    return migrateAndPersistIfNeeded(key, rawValue, { settings, defaults });
  }

  async function write(key, value) {
    const validated = validateStorageValue(key, value);
    if (key === "calls") {
      await backupCallsFile();
    }
    const defaults = await loadDefaultConfig();
    const settings = key === "settings" ? value : await readCurrentSettingsForMigration(defaults);
    const normalized = schema.normalizeData(key, validated, { settings, defaults });
    await writeRawDataFile(key, schema.wrapPayload(key, normalized));
    return normalized;
  }

  async function readAllData() {
    const settings = await loadSettings();
    const [calls, reminders, knowledgeBase, workTimer] = await Promise.all([
      read("calls"),
      read("reminders"),
      read("knowledgeBase"),
      read("workTimer")
    ]);
    return { settings, calls, reminders, knowledgeBase, workTimer };
  }

  async function createBackupBundle() {
    return {
      backupVersion: 1,
      appName: "CallFlow",
      createdAt: new Date().toISOString(),
      schemas: schema.schemaVersions(),
      data: await readAllData()
    };
  }

  async function rotateFullBackups(backupDir) {
    const entries = await fs.readdir(backupDir).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const backups = entries
      .filter((name) => /^callflow-full\.bak-\d{8}-\d{6}(?:-\d+)?\.json$/.test(name))
      .sort()
      .reverse();
    await Promise.all(
      backups.slice(FULL_BACKUP_LIMIT).map((name) => fs.unlink(path.join(backupDir, name)).catch(() => null))
    );
  }

  async function writeFullBackup(reason = "manual") {
    const backupDir = path.join(dataDir, "backups", "full");
    await fs.mkdir(backupDir, { recursive: true });
    const timestamp = backupTimestamp();
    let backupPath = path.join(backupDir, `callflow-full.bak-${timestamp}.json`);
    for (let index = 1; await fileExists(backupPath); index += 1) {
      backupPath = path.join(backupDir, `callflow-full.bak-${timestamp}-${index}.json`);
    }
    await writeJson(backupPath, await createBackupBundle());
    await rotateFullBackups(backupDir);
    if (logger) await logger.info("full-backup-created", { reason, backupPath });
    return backupPath;
  }

  async function exportBackup(filePath) {
    await writeJson(filePath, await createBackupBundle());
    if (logger) await logger.info("backup-exported", { filePath });
    return filePath;
  }

  function validateBackupBundle(bundle) {
    if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
      throw new Error("Invalid backup: expected object");
    }
    if (bundle.backupVersion !== 1 || !bundle.data || typeof bundle.data !== "object") {
      throw new Error("Invalid backup: unsupported version or missing data");
    }
    return bundle;
  }

  async function importBackup(filePath) {
    const stats = await fs.stat(filePath);
    if (stats.size > 10 * 1024 * 1024) {
      const error = new Error("Backup file is too large");
      error.code = "BACKUP_TOO_LARGE";
      throw error;
    }
    const bundle = validateBackupBundle(JSON.parse(await fs.readFile(filePath, "utf8")));
    await writeFullBackup("pre-import");
    const defaults = await loadDefaultConfig();
    const settings = schema.normalizeData("settings", bundle.data.settings, { defaults });
    const normalized = {
      settings,
      calls: schema.normalizeData("calls", bundle.data.calls, { settings, defaults }),
      reminders: schema.normalizeData("reminders", bundle.data.reminders, { settings, defaults }),
      knowledgeBase: schema.normalizeData("knowledgeBase", bundle.data.knowledgeBase, { settings, defaults }),
      workTimer: schema.normalizeData("workTimer", bundle.data.workTimer, { settings, defaults })
    };
    await Promise.all(
      Object.entries(normalized).map(([key, value]) => writeRawDataFile(key, schema.wrapPayload(key, value)))
    );
    if (logger) await logger.info("backup-imported", { filePath });
    return normalized;
  }

  async function getDiagnostics(appInfo = {}) {
    return {
      ...appInfo,
      dataDir,
      schemas: schema.schemaVersions(),
      health: dataHealthEvents,
      logPath: logger && logger.logPath ? logger.logPath : null,
      recentLogs: logger && logger.readRecent ? await logger.readRecent(50) : []
    };
  }

  return {
    DATA_FILES,
    DEFAULT_DATA,
    backupCallsFile,
    createBackupBundle,
    ensureDataFiles,
    exportBackup,
    getDataFile,
    getDiagnostics,
    getHealth: () => dataHealthEvents,
    importBackup,
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
  FULL_BACKUP_LIMIT,
  backupTimestamp,
  createStorageService,
  validateStorageValue
};
