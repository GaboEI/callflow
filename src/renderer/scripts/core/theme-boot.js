(function () {
  // Runs before first paint (first element inside <body>) so the window never
  // flashes the wrong theme family/mode while app.js boots.
  const HINT_KEY = "callflow.themeHint";

  function readHint() {
    try {
      const raw = window.localStorage.getItem(HINT_KEY);
      if (!raw || raw.length > 200) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      if (parsed.family !== "default" && parsed.family !== "gruvbox") return null;
      if (parsed.resolved !== "light" && parsed.resolved !== "dark") return null;
      return { family: parsed.family, resolved: parsed.resolved };
    } catch {
      return null;
    }
  }

  const hint = readHint();
  const body = document.body;
  if (!hint || !body) return;
  body.dataset.themeFamily = hint.family;
  body.dataset.theme = hint.resolved;
  body.style.colorScheme = hint.resolved;
})();
