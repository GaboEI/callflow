(function () {
  function render(parts) {
    parts.renderHeader();
    parts.renderCapturedCallTime();
    parts.renderCallOptions();
    parts.renderOutcomeControls();
    parts.renderDashboardInlineManagers();
    parts.renderLastCall();
  }

  window.CallFlowDashboardView = { render };
})();
