(function () {
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

  function hasMarkdownSyntax(content) {
    return /(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|\|.+\|)|\*\*[^*]+\*\*|(^|[^*])\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|\[[^\]]+\]\([^)]+\)|~~[^~]+~~/m.test(String(content || ""));
  }

  function documentType(note) {
    if (note?.documentType === "pdf") return "pdf";
    if (note?.documentType === "txt") return "txt";
    if (note?.documentType === "markdown") return "markdown";
    return hasMarkdownSyntax(note?.content) ? "markdown" : "txt";
  }

  function typeMeta(note, t) {
    const type = documentType(note);
    return {
      type,
      label: t(type === "pdf" ? "scriptTypePdf" : type === "markdown" ? "scriptTypeMarkdown" : "scriptTypeText"),
      extension: type === "pdf" ? "PDF" : type === "markdown" ? ".md" : "TXT",
      glyph: type === "pdf" ? "▰" : type === "markdown" ? "▤" : "▥"
    };
  }

  function formatDate(value, locale = "es-ES") {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function updateTaskMarker(content, taskIndex, checked) {
    let currentIndex = 0;
    return String(content || "").replace(/^(\s*[-*+]\s+)\[([ xX])\]/gm, (match, prefix) => {
      const replacement = currentIndex === taskIndex ? `${prefix}[${checked ? "x" : " "}]` : match;
      currentIndex += 1;
      return replacement;
    });
  }

  function markdownToPlainText(content) {
    const text = String(content || "")
      .replace(/```[^\n]*\n([\s\S]*?)```/g, (_match, code) => `\n${code.trimEnd()}\n`)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_~`|]/g, "");
    return text
      .split(/\r?\n/)
      .map((line) =>
        line
          .replace(/^\s*-\s+\[[ xX]\]\s*/g, "- ")
          .replace(/^\s*\d+\.\s+/g, "")
          .replace(/^[#>*+\-]+\s*/g, "")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean)
      .join("\n");
  }

  function importErrorMessage(error, t) {
    const messages = {
      UNSUPPORTED_DOCUMENT_TYPE: "unsupportedDocumentType",
      IMPORTED_DOCUMENT_TOO_LARGE: "importedDocumentTooLarge",
      INVALID_TEXT_DOCUMENT: "invalidTextDocument",
      INVALID_PDF_DOCUMENT: "invalidPdfDocument"
    };
    return t(messages[error?.code] || "actionFailed");
  }

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

    function typeMetaView(note) {
      return typeMeta(note, t);
    }

    function formatDateView(value) {
      const locale = language() === "en" ? "en-US" : language() === "ru" ? "ru-RU" : "es-ES";
      return formatDate(value, locale);
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
      const template = document.createElement("template");
      template.innerHTML = markdownRenderer.markdown(String(content || ""));
      template.content.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
        checkbox.disabled = false;
        checkbox.className = "script-task-checkbox";
        checkbox.dataset.scriptTaskIndex = String(index);
        const listItem = checkbox.closest("li");
        if (!listItem) return;
        listItem.classList.add("script-task-item");
        const list = listItem.parentElement;
        const nextElement = list?.nextElementSibling;
        const isOrphanTask = !listItem.textContent.trim() && list?.children.length === 1;
        const isHeadingNext = nextElement && /^H[1-6]$/.test(nextElement.tagName);
        if (isOrphanTask && isHeadingNext) {
          nextElement.classList.add("script-task-heading");
          nextElement.prepend(checkbox);
          list.remove();
        }
      });
      template.content.querySelectorAll("pre").forEach((pre) => {
        const wrapper = document.createElement("div");
        wrapper.className = "script-code-block";
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "script-copy-code";
        copyButton.dataset.copyCode = "";
        copyButton.title = t("copyCode");
        copyButton.setAttribute("aria-label", t("copyCode"));
        copyButton.textContent = "⧉";
        pre.replaceWith(wrapper);
        wrapper.append(copyButton, pre);
      });
      template.content.querySelectorAll("blockquote").forEach((quote) => {
        const first = quote.firstElementChild;
        if (!first || !/^\[!NOTE\]/i.test(first.textContent || "")) return;
        quote.classList.add("script-callout");
        first.textContent = first.textContent.replace(/^\[!NOTE\]\s*/i, "");
      });
      return template.innerHTML;
    }

    function markdownToPlainTextView(content) {
      return markdownToPlainText(content);
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
      if (format === "task") prefixSelection("- [ ] ");
      if (format === "quote") prefixSelection("> ");
      if (format === "strikethrough") replaceSelection("~~", "~~", "texto");
      if (format === "callout") prefixSelection("> [!NOTE] ");
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

    async function copyCodeBlock(button) {
      const code = button.closest(".script-code-block")?.querySelector("code");
      if (!code) return;
      await runAction(async () => {
        await window.callflow.copyText(code.textContent || "");
        button.textContent = "✓";
        button.classList.add("copied");
        context.setStatusMessage(t("copied"), "success");
        setTimeout(() => {
          button.textContent = "⧉";
          button.classList.remove("copied");
        }, 1200);
      });
    }

    function updateTaskMarkerView(content, taskIndex, checked) {
      return updateTaskMarker(content, taskIndex, checked);
    }

    async function toggleTask(checkbox) {
      const taskIndex = Number(checkbox.dataset.scriptTaskIndex);
      if (!Number.isInteger(taskIndex)) return;

      if (state.knowledgeMode === "editor") {
        const input = $("#scriptContent");
        input.value = updateTaskMarkerView(input.value, taskIndex, checkbox.checked);
        $("#scriptEditorPreview").innerHTML = renderMarkdown(input.value);
        return;
      }

      const note = selectedScript();
      if (!note) return;
      const updatedNote = {
        ...note,
        content: updateTaskMarkerView(note.content, taskIndex, checkbox.checked),
        updatedAt: new Date().toISOString()
      };
      const nextKnowledgeBase = state.knowledgeBase.map((item) => (item.id === note.id ? updatedNote : item));
      await runAction(async () => {
        await window.CallFlowStorage.write("knowledgeBase", nextKnowledgeBase);
        state.knowledgeBase = nextKnowledgeBase;
        $("#scriptReaderMeta").textContent = `${t("scriptModified")}: ${formatDateView(updatedNote.updatedAt)}`;
      });
    }

    function renderLibrary() {
      const query = $("#noteSearch").value.trim().toLowerCase();
      const scripts = [...state.knowledgeBase]
        .filter((note) => `${note.title} ${note.content} ${note.originalName || ""}`.toLowerCase().includes(query))
        .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));

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
          const meta = typeMetaView(note);
          const summary = meta.type === "pdf" ? note.originalName || t("scriptPdfDocument") : summarize(note.content) || t("scriptDocument");
          const title = note.title || note.originalName || t("scriptDocument");
          return `
            <article class="script-card${note.pinned ? " pinned" : ""}">
              <div class="script-card-actions">
                <button type="button" class="script-card-action script-pin-button${note.pinned ? " active" : ""}" data-pin-note="${escapeHtml(note.id)}" title="${escapeHtml(t(note.pinned ? "scriptUnpin" : "scriptPin"))}" aria-label="${escapeHtml(t(note.pinned ? "scriptUnpin" : "scriptPin"))}">${note.pinned ? "★" : "☆"}</button>
                <button type="button" class="script-card-action script-delete-card-button" data-delete-note="${escapeHtml(note.id)}" title="${escapeHtml(t("delete"))}" aria-label="${escapeHtml(t("delete"))}">×</button>
              </div>
              <div class="script-card-main">
                <span class="script-card-icon type-${meta.type}" aria-hidden="true"><b>${meta.glyph}</b><small>${meta.extension}</small></span>
                <div>
                  <h3 title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
                  <p title="${escapeHtml(summary)}">${escapeHtml(summary)}</p>
                </div>
              </div>
              <footer>
                <span><b class="script-type-label">${escapeHtml(meta.label)}</b> · ${escapeHtml(t(dateType))}: ${escapeHtml(formatDateView(note.updatedAt || note.createdAt))}</span>
                <button type="button" data-select-note="${escapeHtml(note.id)}">${escapeHtml(t("scriptOpen"))} →</button>
              </footer>
            </article>
          `;
        })
        .join("");
    }

    function renderReader(note) {
      const meta = typeMetaView(note);
      $("#scriptReaderTitle").textContent = note.title;
      $("#scriptReaderType").textContent = meta.label;
      const dateType = note.updatedAt ? "scriptModified" : "scriptCreated";
      $("#scriptReaderMeta").textContent = `${t(dateType)}: ${formatDateView(note.updatedAt || note.createdAt)}`;
      $("#editNote").classList.toggle("hidden", meta.type === "pdf");
      $("#exportMd").classList.toggle("hidden", meta.type === "pdf");
      $("#exportTxt").classList.toggle("hidden", meta.type === "pdf");
      $("#notePreview").classList.toggle("hidden", meta.type === "pdf");
      $("#scriptPdfReader").classList.toggle("hidden", meta.type !== "pdf");
      if (meta.type === "pdf") {
        $("#scriptPdfReader").innerHTML = note.pdfData
          ? `<embed src="data:application/pdf;base64,${note.pdfData}" type="application/pdf" title="${escapeHtml(note.title)}" />`
          : `<p class="script-pdf-error">${escapeHtml(t("scriptPdfUnavailable"))}</p>`;
      } else {
        $("#scriptPdfReader").innerHTML = "";
        $("#notePreview").innerHTML = meta.type === "txt"
          ? `<pre class="script-plain-text">${escapeHtml(note.content)}</pre>`
          : renderMarkdown(note.content);
      }
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
      const nextDocumentType = existing?.originalName?.toLowerCase().endsWith(".md")
        ? "markdown"
        : hasMarkdownSyntax(validation.value.content) ? "markdown" : "txt";
      const note = existing
        ? { ...existing, title: validation.value.title, content: validation.value.content, documentType: nextDocumentType, updatedAt: now }
        : {
            id: crypto.randomUUID(),
            title: validation.value.title,
            content: validation.value.content,
            documentType: nextDocumentType,
            pinned: false,
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
      return deleteNote(note);
    }

    async function deleteNote(note) {
      if (!note || !window.confirm(t("confirmDeleteScript"))) return;
      const nextKnowledgeBase = state.knowledgeBase.filter((item) => item.id !== note.id);
      await runAction(async () => {
        await window.CallFlowStorage.write("knowledgeBase", nextKnowledgeBase);
        state.knowledgeBase = nextKnowledgeBase;
        if (state.selectedNoteId === note.id) {
          state.selectedNoteId = null;
          state.knowledgeMode = "library";
        }
        renderApp();
        context.setStatusMessage(t("scriptDeleted"), "success");
      });
    }

    async function exportSelected(extension) {
      const note = selectedScript();
      if (!note) return;
      await runAction(() =>
        window.callflow.exportNote({
          fileName: note.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase() || "callflow-script",
          content: extension === "txt" ? markdownToPlainTextView(note.content) : note.content,
          extension
        })
      );
    }

    async function importDocument() {
      await runAction(async () => {
        const imported = await window.callflow.importKnowledgeDocument();
        if (!imported || imported.canceled) return;
        const now = new Date().toISOString();
        const note = V.normalizeNote({
          id: crypto.randomUUID(),
          title: imported.title,
          content: imported.content,
          documentType: imported.type,
          originalName: imported.fileName,
          mimeType: imported.mimeType,
          pdfData: imported.pdfData,
          pinned: false,
          createdAt: now
        });
        const nextKnowledgeBase = [...state.knowledgeBase, note];
        await window.CallFlowStorage.write("knowledgeBase", nextKnowledgeBase);
        state.knowledgeBase = nextKnowledgeBase;
        renderApp();
        context.setStatusMessage(t("scriptImported"), "success");
      }, { userMessage: (error) => importErrorMessage(error, t), logMessage: "Failed to import script document" });
    }

    async function togglePinned(id) {
      const nextKnowledgeBase = state.knowledgeBase.map((note) => note.id === id ? { ...note, pinned: !note.pinned } : note);
      await runAction(async () => {
        await window.CallFlowStorage.write("knowledgeBase", nextKnowledgeBase);
        state.knowledgeBase = nextKnowledgeBase;
        renderLibrary();
      });
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
      $("#importScript").addEventListener("click", importDocument);
      $("#editNote").addEventListener("click", () => openEditor(selectedScript()));
      $("#backToScripts").addEventListener("click", showLibrary);
      $("#cancelNoteEdit").addEventListener("click", closeEditor);
      $("#cancelNoteEditBottom").addEventListener("click", closeEditor);
      $("#noteSearch").addEventListener("input", renderLibrary);
      document.querySelectorAll("[data-script-format]").forEach((button) => {
        button.addEventListener("click", () => applyFormat(button.dataset.scriptFormat));
      });
      $("#toggleScriptPreview").addEventListener("click", toggleEditorPreview);
      $("#knowledgeView").addEventListener("click", (event) => {
        const copyButton = event.target.closest("[data-copy-code]");
        const pinButton = event.target.closest("[data-pin-note]");
        const deleteButton = event.target.closest("[data-delete-note]");
        if (copyButton) copyCodeBlock(copyButton);
        if (pinButton) {
          event.stopPropagation();
          togglePinned(pinButton.dataset.pinNote);
        }
        if (deleteButton) {
          event.stopPropagation();
          const note = state.knowledgeBase.find((item) => item.id === deleteButton.dataset.deleteNote);
          deleteNote(note);
        }
      });
      $("#knowledgeView").addEventListener("change", (event) => {
        const taskCheckbox = event.target.closest("[data-script-task-index]");
        if (taskCheckbox) toggleTask(taskCheckbox);
      });
      $("#exportMd").addEventListener("click", () => exportSelected("md"));
      $("#exportTxt").addEventListener("click", () => exportSelected("txt"));
    }

    return { bindEvents, render, selectNote };
  }

  const api = {
    createKnowledgeView,
    documentType,
    formatDate,
    hasMarkdownSyntax,
    importErrorMessage,
    markdownToPlainText,
    summarize,
    typeMeta,
    updateTaskMarker
  };

  if (typeof window !== "undefined") {
    window.CallFlowKnowledgeView = api;
  }

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})();
