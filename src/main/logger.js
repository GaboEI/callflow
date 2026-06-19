const path = require("path");
const fs = require("fs/promises");

const MAX_LOG_SIZE = 512 * 1024;
const MAX_LOG_FILES = 5;

function createLogger({ dataDir }) {
  const logDir = path.join(dataDir, "logs");
  const logPath = path.join(logDir, "callflow.log");

  async function rotate() {
    try {
      const stats = await fs.stat(logPath);
      if (stats.size < MAX_LOG_SIZE) return;
      for (let index = MAX_LOG_FILES - 1; index >= 1; index -= 1) {
        const from = index === 1 ? logPath : `${logPath}.${index - 1}`;
        const to = `${logPath}.${index}`;
        await fs.rename(from, to).catch(() => null);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  async function write(level, message, details = {}) {
    const entry = {
      createdAt: new Date().toISOString(),
      level,
      message,
      details
    };
    try {
      await fs.mkdir(logDir, { recursive: true });
      await rotate();
      await fs.appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8");
    } catch (error) {
      console.error("Failed to write CallFlow log", error);
    }
  }

  async function readRecent(limit = 50) {
    try {
      const raw = await fs.readFile(logPath, "utf8");
      return raw
        .trim()
        .split("\n")
        .filter(Boolean)
        .slice(-Math.max(1, Math.min(200, Number(limit) || 50)))
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch (_error) {
            return { createdAt: null, level: "raw", message: line, details: {} };
          }
        });
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }

  return {
    logPath,
    readRecent,
    write,
    info: (message, details) => write("info", message, details),
    warn: (message, details) => write("warn", message, details),
    error: (message, details) => write("error", message, details)
  };
}

module.exports = {
  createLogger
};
