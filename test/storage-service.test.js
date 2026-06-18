const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { createStorageService } = require("../src/main/storage-service");

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
  assert.deepEqual(await service.read("calls"), [{ id: "first" }]);
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
  assert.deepEqual(backupContent, [{ id: "first" }]);
  assert.deepEqual(await service.read("calls"), [{ id: "second" }]);
});

test("rotates calls backups to the configured limit", async () => {
  const { root, service } = await createTestStorage({ backupLimit: 2 });

  await service.write("calls", [{ id: "0" }]);
  await service.write("calls", [{ id: "1" }]);
  await service.write("calls", [{ id: "2" }]);
  await service.write("calls", [{ id: "3" }]);

  assert.equal((await listCallBackups(root)).length, 2);
});
