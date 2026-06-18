(function () {
  async function readAll() {
    const [settings, calls, templates, reminders, knowledgeBase, workTimer, health] = await Promise.all([
      window.callflow.read("settings"),
      window.callflow.read("calls"),
      window.callflow.read("templates"),
      window.callflow.read("reminders"),
      window.callflow.read("knowledgeBase"),
      window.callflow.read("workTimer"),
      window.callflow.getHealth()
    ]);

    return { settings, calls, templates, reminders, knowledgeBase, workTimer, health };
  }

  async function write(key, value) {
    return window.callflow.write(key, value);
  }

  window.CallFlowStorage = { readAll, write };
})();
