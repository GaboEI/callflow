const test = require("node:test");
const assert = require("node:assert/strict");

const knowledgeView = require("../src/renderer/scripts/views/knowledge-view");

test("knowledge-view exports helpers via module.exports", () => {
  assert.equal(typeof knowledgeView.createKnowledgeView, "function");
  assert.equal(typeof knowledgeView.summarize, "function");
  assert.equal(typeof knowledgeView.updateTaskMarker, "function");
});

test("knowledge-view summarizes text and collapses markdown noise", () => {
  assert.equal(knowledgeView.summarize("Hola   mundo"), "Hola mundo");
  assert.equal(knowledgeView.summarize("# Titulo\n- uno\n- dos"), "Titulo uno dos");
  assert.equal(knowledgeView.summarize("A".repeat(200), 20), `${"A".repeat(20)}…`);
});

test("knowledge-view detects markdown syntax", () => {
  assert.equal(knowledgeView.hasMarkdownSyntax("texto normal"), false);
  assert.equal(knowledgeView.hasMarkdownSyntax("**bold**"), true);
  assert.equal(knowledgeView.hasMarkdownSyntax("- item"), true);
});

test("knowledge-view classifies document types and metadata", () => {
  const t = (key) => `tr:${key}`;
  assert.equal(knowledgeView.documentType({ documentType: "pdf" }), "pdf");
  assert.equal(knowledgeView.documentType({ documentType: "txt" }), "txt");
  assert.equal(knowledgeView.documentType({ content: "# hola" }), "markdown");
  assert.deepEqual(knowledgeView.typeMeta({ documentType: "pdf" }, t), {
    type: "pdf",
    label: "tr:scriptTypePdf",
    extension: "PDF",
    glyph: "▰"
  });
});

test("knowledge-view formats dates and handles invalid values", () => {
  assert.match(knowledgeView.formatDate("2026-06-27T10:00:00Z", "es-ES"), /2026/);
  assert.equal(knowledgeView.formatDate("", "es-ES"), "");
  assert.equal(knowledgeView.formatDate("not-a-date", "es-ES"), "");
});

test("knowledge-view updates only the targeted task marker", () => {
  const content = "- [ ] first\n- [x] second\n- [ ] third";
  assert.equal(knowledgeView.updateTaskMarker(content, 1, false), "- [ ] first\n- [ ] second\n- [ ] third");
  assert.equal(knowledgeView.updateTaskMarker(content, 0, true), "- [x] first\n- [x] second\n- [ ] third");
});

test("knowledge-view maps import errors to translated messages", () => {
  const t = (key) => `tr:${key}`;
  assert.equal(knowledgeView.importErrorMessage({ code: "INVALID_TEXT_DOCUMENT" }, t), "tr:invalidTextDocument");
  assert.equal(knowledgeView.importErrorMessage({ code: "IMPORTED_DOCUMENT_TOO_LARGE" }, t), "tr:importedDocumentTooLarge");
  assert.equal(knowledgeView.importErrorMessage({ code: "UNKNOWN" }, t), "tr:actionFailed");
});

test("knowledge-view plain text export strips task syntax", () => {
  assert.equal(knowledgeView.markdownToPlainText("- [ ] tarea\n\n**bold** texto"), "tarea\nbold texto");
});
