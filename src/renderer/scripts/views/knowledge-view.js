(function () {
  function createKnowledgeView(context) {
    const { $, state, validators: V, escapeHtml, runAction, renderApp } = context;
    let markdownRenderer = null;

    function language() {
      return state.settings?.language || "es";
    }

    function t(key) {
      return window.CallFlowI18n.t(key, language());
    }

    function selectedScript() {
      return state.knowledgeBase.find((note) => note.id === state.selectedNoteId) || null;
    }

    function formatDate(value) {
      if (!value) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const locale = language() === "en" ? "en-US" : language() === "ru" ? "ru-RU" : "es-ES";
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
    }

    function summarize(content, maxLength = 180) {
      const plain = String(content || "")
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/^[#>*+\-\d.\s]+/gm, "")
        .replace(/[*_~`|]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}…` : plain;
    }

    function sanitizeHtml(html) {
      return window.DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        FORBID_TAGS: ["style"],
        FORBID_ATTR: ["style"]
      });
    }

    function renderMarkdown(content) {
      if (!markdownRenderer) return `<p>${escapeHtml(content)}</p>`;
      return markdownRenderer.markdown(String(content || ""));
    }

    function markdownToPlainText(content) {
      const container = document.createElement("div");
      container.innerHTML = renderMarkdown(content);
      container.querySelectorAll("br, p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre, tr").forEach((element) => {
        element.append(document.createTextNode("\n"));
      });
      return (container.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
    }

    function initializeMarkdownRenderer() {
      if (markdownRenderer) return;
      markdownRenderer = Object.create(window.EasyMDE.prototype);
      markdownRenderer.options = {
        renderingConfig: {
          singleLineBreaks: false,
          sanitizerFunction: sanitizeHtml
        }
      };
    }

    function replaceSelection(before, after = "", placeholder = "") {
      const input = $("#scriptContent");
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const selected = input.value.slice(start, end) || placeholder;
      input.setRangeText(`${before}${selected}${after}`, start, end, "end");
      input.focus();
      input.setSelectionRange(start + before.length, start + before.length + selected.length);
    }

    function prefixSelection(prefix) {
      const input = $("#scriptContent");
      const start = input.selectionStart;
      const end = input.selectionEnd;
      if (start === end) {
        input.setRangeText(prefix, start, end, "end");
        input.focus();
        return;
      }
      const selected = input.value.slice(start, end);
      const prefixed = selected.split("\n").map((line) => `${prefix}${line}`).join("\n");
      input.setRangeText(prefixed, start, end, "select");
      input.focus();
    }

    function applyFormat(format) {
      const input = $("#scriptContent");
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const selected = input.value.slice(start, end);
      if (format === "heading2") prefixSelection("## ");
      if (format === "heading3") prefixSelection("### ");
      if (format === "bold") replaceSelection("**", "**", "texto");
      if (format === "italic") replaceSelection("*", "*", "texto");
      if (format === "link") replaceSelection("[", "](https://)", "texto");
      if (format === "list") prefixSelection("- ");
      if (format === "quote") prefixSelection("> ");
      if (format === "table") {
        input.setRangeText("| Columna 1 | Columna 2 |\n| --- | --- |\n| Valor | Valor |", start, end, "end");
        input.focus();
      }
      if (format === "rule") {
        input.setRangeText("\n\n---\n\n", start, end, "end");
        input.focus();
      }
      if (format === "code") {
        input.setRangeText(`\`\`\`\n${selected || "código"}\n\`\`\``, start, end, "end");
        input.focus();
      }
    }

    function showSourceEditor() {
      $("#scriptContent").classList.remove("hidden");
      $("#scriptEditorPreview").classList.add("hidden");
      $("#toggleScriptPreview").classList.remove("active");
      document.querySelectorAll("[data-script-format]").forEach((button) => {
        button.disabled = false;
      });
    }

    function toggleEditorPreview() {
      const input = $("#scriptContent");
      const preview = $("#scriptEditorPreview");
      const showPreview = preview.classList.contains("hidden");
      preview.classList.toggle("hidden", !showPreview);
      input.classList.toggle("hidden", showPreview);
      $("#toggleScriptPreview").classList.toggle("active", showPreview);
      document.querySelectorAll("[data-script-format]").forEach((button) => {
        button.disabled = showPreview;
      });
      if (showPreview) preview.innerHTML = renderMarkdown(input.value);
      else input.focus();
    }

    function renderLibrary() {
      const query = $("#noteSearch").value.trim().toLowerCase();
      const scripts = [...state.knowledgeBase]
        .filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query))
        .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));

      if (!scripts.length) {
        const hasScripts = state.knowledgeBase.length > 0;
        $("#notesList").innerHTML = `
          <div class="script-empty-state">
            <span aria-hidden="true">${hasScripts ? "⌕" : "◇"}</span>
            <strong>${escapeHtml(t(hasScripts ? "scriptNoResults" : "scriptEmptyTitle"))}</strong>
            ${hasScripts ? "" : `<p>${escapeHtml(t("scriptEmptyText"))}</p>`}
          </div>
        `;
        return;
      }

      $("#notesList").innerHTML = scripts
        .map((note) => {
          const dateType = note.updatedAt ? "scriptModified" : "scriptCreated";
          const summary = summarize(note.content) || t("scriptDocument");
          return `
            <article class="script-card">
              <div class="script-card-main">
                <span class="script-card-icon" aria-hidden="true">#</span>
                <div>
                  <h3>${escapeHtml(note.title)}</h3>
                  <p>${escapeHtml(summary)}</p>
                </div>
              </div>
              <footer>
                <span>${escapeHtml(t(dateType))}: ${escapeHtml(formatDate(note.updatedAt || note.createdAt))}</span>
                <button type="button" data-select-note="${escapeHtml(note.id)}">${escapeHtml(t("scriptOpen"))} →</button>
              </footer>
            </article>
          `;
        })
        .join("");
    }

    function renderReader(note) {
      $("#scriptReaderTitle").textContent = note.title;
      const dateType = note.updatedAt ? "scriptModified" : "scriptCreated";
      $("#scriptReaderMeta").textContent = `${t(dateType)}: ${formatDate(note.updatedAt || note.createdAt)}`;
      $("#notePreview").innerHTML = renderMarkdown(note.content);
    }

    function render() {
      const note = selectedScript();
      if (state.knowledgeMode !== "library" && state.knowledgeMode !== "editor" && !note) {
        state.knowledgeMode = "library";
      }

      const mode = state.knowledgeMode || "library";
      $("#scriptLibrary").classList.toggle("hidden", mode !== "library");
      $("#scriptReader").classList.toggle("hidden", mode !== "reader");
      $("#scriptEditorPanel").classList.toggle("hidden", mode !== "editor");

      if (mode === "library") renderLibrary();
      if (mode === "reader" && note) renderReader(note);
    }

    function openEditor(note = null) {
      state.selectedNoteId = note?.id || null;
      state.knowledgeMode = "editor";
      render();
      $("#noteForm").title.value = note?.title || "";
      $("#scriptContent").value = note?.content || "";
      showSourceEditor();
      setTimeout(() => {
        $("#noteForm").title.focus();
      }, 0);
    }

    function closeEditor() {
      state.knowledgeMode = selectedScript() ? "reader" : "library";
      render();
    }

    async function save(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const validation = V.validateNotePayload({ title: form.title.value, content: form.content.value });
      if (!validation.ok) {
        context.setStatusMessage(t(validation.messageKey), "error");
        return;
      }

      const existing = selectedScript();
      const now = new Date().toISOString();
      const note = existing
        ? { ...existing, title: validation.value.title, content: validation.value.content, updatedAt: now }
        : {
            id: crypto.randomUUID(),
            title: validation.value.title,
            content: validation.value.content,
            createdAt: now
          };
      const nextKnowledgeBase = existing
        ? state.knowledgeBase.map((item) => (item.id === existing.id ? note : item))
        : [...state.knowledgeBase, note];

      await runAction(async () => {
        await window.CallFlowStorage.write("knowledgeBase", nextKnowledgeBase);
        state.knowledgeBase = nextKnowledgeBase;
        state.selectedNoteId = note.id;
        state.knowledgeMode = "reader";
        renderApp();
        context.setStatusMessage(t("noteSaved"), "success");
      });
    }

    async function deleteSelected() {
      const note = selectedScript();
      if (!note || !window.confirm(t("confirmDeleteScript"))) return;
      const nextKnowledgeBase = state.knowledgeBase.filter((item) => item.id !== note.id);
      await runAction(async () => {
        await window.CallFlowStorage.write("knowledgeBase", nextKnowledgeBase);
        state.knowledgeBase = nextKnowledgeBase;
        state.selectedNoteId = null;
        state.knowledgeMode = "library";
        renderApp();
      });
    }

    async function exportSelected(extension) {
      const note = selectedScript();
      if (!note) return;
      await runAction(() =>
        window.callflow.exportNote({
          fileName: note.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase() || "callflow-script",
          content: extension === "txt" ? markdownToPlainText(note.content) : note.content,
          extension
        })
      );
    }

    function selectNote(id) {
      const note = state.knowledgeBase.find((item) => item.id === id);
      if (!note) return;
      state.selectedNoteId = id;
      state.knowledgeMode = "reader";
      render();
    }

    function showLibrary() {
      state.knowledgeMode = "library";
      state.selectedNoteId = null;
      render();
    }

    function bindEvents() {
      initializeMarkdownRenderer();
      $("#noteForm").addEventListener("submit", save);
      $("#deleteNote").addEventListener("click", deleteSelected);
      $("#newNote").addEventListener("click", () => openEditor());
      $("#editNote").addEventListener("click", () => openEditor(selectedScript()));
      $("#backToScripts").addEventListener("click", showLibrary);
      $("#cancelNoteEdit").addEventListener("click", closeEditor);
      $("#cancelNoteEditBottom").addEventListener("click", closeEditor);
      $("#noteSearch").addEventListener("input", renderLibrary);
      document.querySelectorAll("[data-script-format]").forEach((button) => {
        button.addEventListener("click", () => applyFormat(button.dataset.scriptFormat));
      });
      $("#toggleScriptPreview").addEventListener("click", toggleEditorPreview);
      $("#exportMd").addEventListener("click", () => exportSelected("md"));
      $("#exportTxt").addEventListener("click", () => exportSelected("txt"));
    }

    return { bindEvents, render, selectNote };
  }

  window.CallFlowKnowledgeView = { createKnowledgeView };
})();
