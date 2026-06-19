const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { createStorageService } = require("../src/main/storage-service");
const schema = require("../src/shared/schema");

async function createTestStorage(options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "callflow-storage-"));
  const defaultConfigPath = path.join(root, "default_config.json");
  await fs.writeFile(defaultConfigPath, JSON.stringify({ language: "es", operatorName: "" }), "utf8");
  return {
    root,
    service: createStorageService({
      dataDir: path.join(root, "userData"),
      defaultConfigPath,
      ...options
    })
  };
}

async function listCallBackups(root) {
  const backupDir = path.join(root, "userData", "backups", "calls");
  return fs.readdir(backupDir).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
}

test("does not create a calls backup for the first write", async () => {
  const { root, service } = await createTestStorage();

  await service.write("calls", [{ id: "first" }]);

  assert.deepEqual(await listCallBackups(root), []);
  assert.deepEqual((await service.read("calls")).map((call) => call.id), ["first"]);
});

test("creates a calls backup before overwriting existing calls", async () => {
  const { root, service } = await createTestStorage();

  await service.write("calls", [{ id: "first" }]);
  await service.write("calls", [{ id: "second" }]);

  const backups = await listCallBackups(root);
  assert.equal(backups.length, 1);

  const backupContent = JSON.parse(
    await fs.readFile(path.join(root, "userData", "backups", "calls", backups[0]), "utf8")
  );
  assert.equal(backupContent.schemaVersion, schema.CURRENT_SCHEMA_VERSION);
  assert.deepEqual(backupContent.data.map((call) => call.id), ["first"]);
  assert.deepEqual((await service.read("calls")).map((call) => call.id), ["second"]);
});

test("rotates calls backups to the configured limit", async () => {
  const { root, service } = await createTestStorage({ backupLimit: 2 });

  await service.write("calls", [{ id: "0" }]);
  await service.write("calls", [{ id: "1" }]);
  await service.write("calls", [{ id: "2" }]);
  await service.write("calls", [{ id: "3" }]);

  assert.equal((await listCallBackups(root)).length, 2);
});

test("migrates legacy calls into versioned storage while preserving read shape", async () => {
  const { root, service } = await createTestStorage();
  const callsPath = path.join(root, "userData", "calls.json");
  await fs.mkdir(path.dirname(callsPath), { recursive: true });
  await fs.writeFile(callsPath, JSON.stringify([{ id: "legacy", callId: "ABC", date: "06.18", time: "10:00" }]), "utf8");

  const calls = await service.read("calls");
  const stored = JSON.parse(await fs.readFile(callsPath, "utf8"));

  assert.equal(calls[0].id, "legacy");
  assert.equal(stored.schemaVersion, schema.CURRENT_SCHEMA_VERSION);
  assert.equal(stored.data[0].callId, "ABC");
});

test("exports and imports a full backup bundle", async () => {
  const { root, service } = await createTestStorage();
  const backupPath = path.join(root, "backup.callflow-backup.json");

  await service.write("settings", { language: "en", operatorName: "Agent" });
  await service.write("calls", [{ id: "call-1", callId: "A1", date: "06.18", time: "09:00" }]);
  await service.exportBackup(backupPath);
  await service.write("calls", []);

  const imported = await service.importBackup(backupPath);

  assert.equal(imported.settings.language, "en");
  assert.equal(imported.calls[0].callId, "A1");
  assert.equal((await service.read("calls"))[0].callId, "A1");
});
