(function () {
  function createInitialState() {
    return {
      settings: null,
      calls: [],
      reminders: [],
      reminderFormCollapsed: true,
      activeAlarmReminderId: null,
      activeAlarmPhase: null,
      activeAlarmSoundKey: null,
      alarmSoundTimer: null,
      knowledgeBase: [],
      health: [],
      callsNeedPersist: false,
      workTimer: null,
      clockTimer: null,
      timerPersistTimer: null,
      reminderTimer: null,
      selectedNoteId: null,
      editingReminderId: null,
      lastCall: null,
      pendingCallCapturedAt: null,
      selectedPrimaryOutcome: null,
      openOutcomeMenu: null,
      selectedBlocks: new Set(),
      editingReportBlockKey: null,
      reportRange: {
        preset: "today",
        from: "",
        to: ""
      },
      reportSearch: {
        query: "",
        matches: 0,
        activeIndex: 0
      },
      formLists: {
        onboardingCallTypes: [],
        onboardingFrequentStatuses: [],
        onboardingSuccessOutcomes: [],
        onboardingRejectionOutcomes: [],
        onboardingCallbackOutcomes: [],
        settingsCallTypes: [],
        settingsFrequentStatuses: [],
        settingsSuccessOutcomes: [],
        settingsRejectionOutcomes: [],
        settingsCallbackOutcomes: []
      },
      presetMeta: {
        onboardingFrequentStatuses: { custom: [] },
        settingsFrequentStatuses: { custom: [] }
      },
      onboardingStep: 0,
      onboardingMode: "initial",
      onboardingActiveTimezones: [],
      timezonePickers: {
        onboarding: {
          searchQuery: "",
          selectedTimezoneValue: "local",
          isTimezoneDropdownOpen: false,
          filteredTimezoneOptions: [],
          highlightedTimezoneIndex: -1
        },
        settings: {
          searchQuery: "",
          selectedTimezoneValue: "local",
          isTimezoneDropdownOpen: false,
          filteredTimezoneOptions: [],
          highlightedTimezoneIndex: -1
        }
      },
      dateTimePicker: {
        input: null,
        mode: null,
        step: "date",
        year: null,
        month: null,
        hour: 0,
        minute: 0
      }
    };
  }

  window.CallFlowUiState = { createInitialState };

  if (typeof module !== "undefined") {
    module.exports = window.CallFlowUiState;
  }
})();
