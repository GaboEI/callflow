(function () {
  async function readAll() {
    const [settings, calls, templates, reminders, knowledgeBase, workTimer] = await Promise.all([
      window.callflow.read("settings"),
      window.callflow.read("calls"),
      window.callflow.read("templates"),
      window.callflow.read("reminders"),
      window.callflow.read("knowledgeBase"),
      window.callflow.read("workTimer")
    ]);

    return { settings, calls, templates, reminders, knowledgeBase, workTimer };
  }

  async function write(key, value) {
    return window.callflow.write(key, value);
  }

  window.CallFlowStorage = { readAll, write };
})();
