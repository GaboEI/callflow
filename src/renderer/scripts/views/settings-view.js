(function () {
  function render(parts) {
    parts.renderActiveTimezoneEditors();
    parts.renderListEditors();
  }

  window.CallFlowSettingsView = { render };
})();
