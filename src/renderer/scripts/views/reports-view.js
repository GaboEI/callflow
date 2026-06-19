(function () {
  function render(parts) {
    parts.renderBlocks();
    parts.renderStats();
  }

  window.CallFlowReportsView = { render };
})();
