(function () {
  function render(parts) {
    parts.renderReminders();
    parts.renderReminderFormVisibility();
  }

  window.CallFlowRemindersView = { render };
})();
