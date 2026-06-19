(function () {
  function createKnowledgeView(context) {
    const { $, state, validators: V, markdownPreview, escapeHtml, runAction, renderApp } = context;

    function render() {
      const query = $("#noteSearch").value.toLowerCase();
      const notes = state.knowledgeBase.filter((note) =>
        `${note.title} ${note.content}`.toLowerCase().includes(query)
      );

      $("#notesList").innerHTML = notes.length
        ? notes
            .map((note) => `
              <article class="list-item">
                <header>
                  <strong>${escapeHtml(note.title)}</strong>
                  <button data-select-note="${note.id}">Abrir</button>
                </header>
                <p class="muted">${escapeHtml(note.content.slice(0, 120))}</p>
              </article>
            `)
            .join("")
        : '<p class="muted">No hay notas.</p>';

      const selected = state.knowledgeBase.find((note) => note.id === state.selectedNoteId);
      const form = $("#noteForm");
      if (selected) {
        form.title.value = selected.title;
        form.content.value = selected.content;
        $("#notePreview").innerHTML = markdownPreview(selected.content);
      } else {
        form.title.value = "";
        form.content.value = "";
        $("#notePreview").innerHTML = '<span class="muted">Vista previa</span>';
      }
    }

    async function save(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const validation = V.validateNotePayload({ title: form.title.value, content: form.content.value });
      if (!validation.ok) {
        context.setStatusMessage(CallFlowI18n.t(validation.messageKey, state.settings.language || "es"), "error");
        return;
      }
      const existing = state.knowledgeBase.find((note) => note.id === state.selectedNoteId);
      let nextKnowledgeBase;
      let nextSelectedNoteId = state.selectedNoteId;
      if (existing) {
        nextKnowledgeBase = state.knowledgeBase.map((note) =>
          note.id === state.selectedNoteId
            ? { ...note, title: validation.value.title, content: validation.value.content, updatedAt: new Date().toISOString() }
            : note
        );
      } else {
        const note = {
          id: crypto.randomUUID(),
          title: validation.value.title,
          content: validation.value.content,
          createdAt: new Date().toISOString()
        };
        nextKnowledgeBase = [...state.knowledgeBase, note];
        nextSelectedNoteId = note.id;
      }
      await runAction(async () => {
        await CallFlowStorage.write("knowledgeBase", nextKnowledgeBase);
        state.knowledgeBase = nextKnowledgeBase;
        state.selectedNoteId = nextSelectedNoteId;
        renderApp();
        context.setStatusMessage(CallFlowI18n.t("noteSaved", state.settings.language || "es"), "success");
      });
    }

    async function deleteSelected() {
      if (!state.selectedNoteId) return;
      const nextKnowledgeBase = state.knowledgeBase.filter((note) => note.id !== state.selectedNoteId);
      await runAction(async () => {
        await CallFlowStorage.write("knowledgeBase", nextKnowledgeBase);
        state.knowledgeBase = nextKnowledgeBase;
        state.selectedNoteId = null;
        renderApp();
      });
    }

    async function exportSelected(extension) {
      const note = state.knowledgeBase.find((item) => item.id === state.selectedNoteId);
      if (!note) return;
      await runAction(() =>
        window.callflow.exportNote({
          fileName: note.title.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase() || "callflow-note",
          content: note.content,
          extension
        })
      );
    }

    function selectNote(id) {
      state.selectedNoteId = id;
      render();
    }

    function bindEvents() {
      $("#noteForm").addEventListener("submit", save);
      $("#deleteNote").addEventListener("click", deleteSelected);
      $("#newNote").addEventListener("click", () => {
        state.selectedNoteId = null;
        render();
        $("#noteForm input[name='title']").focus();
      });
      $("#noteSearch").addEventListener("input", render);
      $("#noteForm textarea[name='content']").addEventListener("input", (event) => {
        $("#notePreview").innerHTML = markdownPreview(event.target.value);
      });
      $("#exportMd").addEventListener("click", () => exportSelected("md"));
      $("#exportTxt").addEventListener("click", () => exportSelected("txt"));
    }

    return { bindEvents, render, selectNote };
  }

  window.CallFlowKnowledgeView = { createKnowledgeView };
})();
