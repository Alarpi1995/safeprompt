/**
 * SafePrompt - Language Registry
 * Auto-registers all language pattern files with the detector.
 */

(function () {
  function register(detector) {
    const langs = [
      typeof SafePromptEN !== 'undefined' ? SafePromptEN : null,
      typeof SafePromptAR !== 'undefined' ? SafePromptAR : null,
      typeof SafePromptES !== 'undefined' ? SafePromptES : null,
      typeof SafePromptFR !== 'undefined' ? SafePromptFR : null,
      typeof SafePromptZH !== 'undefined' ? SafePromptZH : null,
      typeof SafePromptDE !== 'undefined' ? SafePromptDE : null,
      typeof SafePromptPT !== 'undefined' ? SafePromptPT : null,
      typeof SafePromptContext !== 'undefined' ? SafePromptContext : null,
    ];

    for (const lang of langs) {
      if (lang) detector.registerLanguage(lang.code, lang);
    }
  }

  // Browser context: create global detector and register
  if (typeof window !== 'undefined') {
    const detector = new (window.SafePromptDetector || SafePromptDetector)();
    register(detector);
    window.safeprompt = detector;
  }

  // Node.js context (for testing)
  if (typeof module !== 'undefined') {
    module.exports = { register };
  }
})();
