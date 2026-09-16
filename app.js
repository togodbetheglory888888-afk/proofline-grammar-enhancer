(function () {
  "use strict";

  /* =========================================================
     PROOFLINE GRAMMAR ENHANCER
     Application Controller
     ========================================================= */

  const $ = (id) => document.getElementById(id);

  const elements = {
    licenseView: $("licenseView"),
    homeView: $("homeView"),
    workspaceView: $("workspaceView"),

    licenseCode: $("licenseCode"),
    activateBtn: $("activateBtn"),
    licenseMessage: $("licenseMessage"),

    editor: $("editor"),
    backdrop: $("backdrop"),
    editorScroll: $("editorScroll"),

    fileInput: $("fileInput"),
    dropZone: $("dropZone"),
    fileStatus: $("fileStatus"),

    documentsModal: $("documentsModal"),
    enhancerModal: $("enhancerModal"),

    suggestionsList: $("suggestionsList"),
    suggestionsCount: $("suggestionsCount"),

    scoreValue: $("scoreValue"),
    metrics: $("metrics"),
    analyzingBadge: $("analyzingBadge"),

    wordCount: $("wordCount"),
    charCount: $("charCount"),
    readingTime: $("readingTime"),
    readingLevel: $("readingLevel"),
    cursorPos: $("cursorPos"),

    docTitleBtn: $("docTitleBtn")
  };

  const state = {
    licensed: false,
    deviceId: "",
    text: "",
    fileName: "Untitled document",
    analysis: null,
    analysisTimer: null,
    isAnalyzing: false,
    activeFilter: "All",
    enhancedText: "",
    documents: []
  };

  /* =========================================================
     CONFIGURATION
     ========================================================= */

  function getConfig() {
    return window.PROOFLINE_LICENSE_CONFIG || {
      apiUrl: "",
      requireOnlineActivation: false,
      product: "PROOFLINE-GRAMMAR-49"
    };
  }

  function isTestingMode() {
    return getConfig().requireOnlineActivation === false;
  }

  /* =========================================================
     DEVICE IDENTIFICATION
     ========================================================= */

  function getDeviceId() {
    let deviceId = localStorage.getItem("proofline_device_id");

    if (!deviceId) {
      if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
      ) {
        deviceId = window.crypto.randomUUID();
      } else {
        deviceId =
          "PF-" +
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).slice(2, 14);
      }

      localStorage.setItem("proofline_device_id", deviceId);
    }

    return deviceId;
  }

  function getDeviceType() {
    const userAgent = navigator.userAgent || "";

    if (
      /iPad/i.test(userAgent) ||
      (
        /Macintosh/i.test(userAgent) &&
        navigator.maxTouchPoints > 1
      ) ||
      (
        /Android/i.test(userAgent) &&
        !/Mobile/i.test(userAgent)
      )
    ) {
      return "TABLET";
    }

    if (
      /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
        userAgent
      )
    ) {
      return "CELLPHONE";
    }

    return "COMPUTER";
  }

  function getDeviceLabel() {
    const platform =
      navigator.userAgentData?.platform ||
      navigator.platform ||
      "Unknown platform";

    return `${getDeviceType()} / ${platform}`;
  }

  /* =========================================================
     LICENSE MANAGEMENT
     ========================================================= */

  function isLocallyLicensed() {
    if (isTestingMode()) {
      return true;
    }

    const status =
      localStorage.getItem("proofline_license_status");

    const savedDevice =
      localStorage.getItem("proofline_license_device");

    return (
      status === "activated" &&
      Boolean(savedDevice) &&
      savedDevice === getDeviceId()
    );
  }

  function saveLicenseLocally(code) {
    localStorage.setItem(
      "proofline_license_status",
      "activated"
    );

    localStorage.setItem(
      "proofline_license_code",
      code
    );

    localStorage.setItem(
      "proofline_license_device",
      getDeviceId()
    );
  }

  function setLicenseMessage(message = "", type = "") {
    if (!elements.licenseMessage) {
      return;
    }

    elements.licenseMessage.textContent = message;
    elements.licenseMessage.className = "license-message";

    if (type) {
      elements.licenseMessage.classList.add(type);
    }
  }

  function cleanLicenseCode(value) {
    return String(value || "")
      .replace(/\D/g, "")
      .slice(0, 7);
  }

  async function activateLicense() {
    if (!elements.licenseCode) {
      console.error(
        "Proofline: #licenseCode was not found."
      );
      return;
    }

    const code = cleanLicenseCode(
      elements.licenseCode.value
    );

    elements.licenseCode.value = code;

    if (!/^\d{7}$/.test(code)) {
      setLicenseMessage(
        "Enter exactly 7 digits.",
        "error"
      );

      elements.licenseCode.focus();
      return;
    }

    /*
      Local testing mode.

      This accepts any seven-digit code and does not provide
      secure one-code-per-device enforcement.
    */
    if (isTestingMode()) {
      saveLicenseLocally(code);
      state.licensed = true;

      setLicenseMessage("");
      showHome();

      showToast(
        "Proofline activated in testing mode."
      );

      return;
    }

    const config = getConfig();

    if (!config.apiUrl) {
      setLicenseMessage(
        "The online license service is not configured.",
        "error"
      );
      return;
    }

    if (elements.activateBtn) {
      elements.activateBtn.disabled = true;
    }

    setLicenseMessage(
      "Checking your license online...",
      "busy"
    );

    try {
      const apiUrl =
        config.apiUrl.replace(/\/+$/, "") +
        "/activate";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          deviceId: getDeviceId(),
          deviceType: getDeviceType(),
          deviceLabel: getDeviceLabel(),
          product:
            config.product ||
            "PROOFLINE-GRAMMAR-49"
        })
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error(
          data.message ||
          `Activation failed with status ${response.status}.`
        );
      }

      saveLicenseLocally(code);
      state.licensed = true;

      setLicenseMessage("");
      showHome();

      showToast(
        "Proofline activated successfully."
      );
    } catch (error) {
      console.error(
        "Proofline activation error:",
        error
      );

      const offline =
        !navigator.onLine
          ? " Your device appears to be offline."
          : "";

      setLicenseMessage(
        (error.message ||
          "Could not contact the license service.") +
          offline,
        "error"
      );
    } finally {
      if (elements.activateBtn) {
        elements.activateBtn.disabled = false;
      }
    }
  }

  function initLicenseGate() {
    state.deviceId = getDeviceId();
    state.licensed = isLocallyLicensed();

    if (state.licensed) {
      showHome();
      return;
    }

    showLicense();

    if (elements.licenseCode) {
      elements.licenseCode.focus();
    }
  }

  /* =========================================================
     VIEW MANAGEMENT
     ========================================================= */

  function hideAllMainViews() {
    elements.licenseView?.classList.add("hidden");
    elements.homeView?.classList.add("hidden");
    elements.workspaceView?.classList.add("hidden");
  }

  function showLicense() {
    hideAllMainViews();
    elements.licenseView?.classList.remove("hidden");
  }

  function showHome() {
    if (!state.licensed) {
      showLicense();
      return;
    }

    hideAllMainViews();
    elements.homeView?.classList.remove("hidden");
  }

  function showWorkspace() {
    if (!state.licensed) {
      showLicense();
      return;
    }

    hideAllMainViews();
    elements.workspaceView?.classList.remove("hidden");

    requestAnimationFrame(() => {
      synchronizeEditorScroll();
      render();
    });
  }

  /* =========================================================
     EDITOR HELPERS
     ========================================================= */

  function getEditor() {
    return (
      elements.editor ||
      $("textEditor") ||
      $("documentEditor") ||
      $("inputText") ||
      $("textInput")
    );
  }

  function getEditorValue() {
    const editor = getEditor();

    if (!editor) {
      return "";
    }

    return typeof editor.value === "string"
      ? editor.value
      : editor.textContent || "";
  }

  function setEditorValue(value) {
    const editor = getEditor();

    if (!editor) {
      return;
    }

    if (typeof editor.value === "string") {
      editor.value = value;
    } else {
      editor.textContent = value;
    }
  }

  function focusEditor() {
    const editor = getEditor();

    if (!editor) {
      return;
    }

    editor.focus();

    if (
      typeof editor.setSelectionRange === "function"
    ) {
      const length = getEditorValue().length;
      editor.setSelectionRange(length, length);
    }

    updateCursorPosition();
  }

  function updateDocumentTitle() {
    if (elements.docTitleBtn) {
      elements.docTitleBtn.textContent =
        state.fileName || "Untitled document";
    }

    document.title =
      `${state.fileName || "Untitled document"} - Proofline`;
  }

  function createDocument() {
    clearTimeout(state.analysisTimer);

    state.text = "";
    state.analysis = null;
    state.fileName = "Untitled document";
    state.enhancedText = "";

    setEditorValue("");
    updateDocumentTitle();
    showWorkspace();
    render();

    setTimeout(focusEditor, 100);
  }

  /* =========================================================
     ANALYSIS
     ========================================================= */

  function scheduleAnalysis() {
    clearTimeout(state.analysisTimer);

    state.analysisTimer = setTimeout(
      runAnalysis,
      350
    );
  }

  async function runAnalysis() {
    if (!state.licensed) {
      return;
    }

    const text = getEditorValue();
    state.text = text;

    if (!text.trim()) {
      state.analysis = null;
      state.isAnalyzing = false;
      render();
      return;
    }

    state.isAnalyzing = true;
    renderAnalyzingState();

    try {
      let result;

      if (
        window.GrammarEngine &&
        typeof window.GrammarEngine.analyze ===
          "function"
      ) {
        result = window.GrammarEngine.analyze(text);
      } else if (
        window.GrammarChecker &&
        typeof window.GrammarChecker.analyze ===
          "function"
      ) {
        result = window.GrammarChecker.analyze(text);
      } else if (
        typeof window.analyze === "function"
      ) {
        result = window.analyze(text);
      } else {
        console.warn(
          "Proofline: No grammar engine was found."
        );

        result = {
          suggestions: [],
          score: 100,
          errors: 0,
          warnings: 0
        };
      }

      state.analysis =
        result instanceof Promise
          ? await result
          : result;
    } catch (error) {
      console.error(
        "Proofline analysis error:",
        error
      );

      state.analysis = {
        suggestions: [],
        score: 100,
        errors: 0,
        warnings: 0
      };

      showToast(
        "The grammar engine could not analyze the text."
      );
    } finally {
      state.isAnalyzing = false;
      render();
    }
  }

  /* =========================================================
     ANALYSIS NORMALIZATION
     ========================================================= */

  function getSuggestions() {
    if (!state.analysis) {
      return [];
    }

    if (Array.isArray(state.analysis)) {
      return state.analysis;
    }

    const possibleLists = [
      state.analysis.suggestions,
      state.analysis.issues,
      state.analysis.results,
      state.analysis.matches
    ];

    return (
      possibleLists.find(Array.isArray) || []
    );
  }

  function getSuggestionText(item = {}) {
    const value =
      item.suggestion ??
      item.replacement ??
      item.correct ??
      item.corrected ??
      item.replacements?.[0]?.value ??
      "";

    return String(value);
  }

  function getSuggestionMessage(item = {}) {
    return String(
      item.message ??
      item.explanation ??
      item.reason ??
      item.description ??
      "Possible writing improvement"
    );
  }

  function getSuggestionType(item = {}) {
    return String(
      item.type ??
      item.category ??
      item.rule ??
      item.kind ??
      "Suggestion"
    );
  }

  function getSuggestionStart(item = {}) {
    const possibleStart =
      item.start ??
      item.index ??
      item.offset;

    const start = Number(possibleStart);

    return Number.isFinite(start)
      ? start
      : -1;
  }

  function getSuggestionEnd(item = {}) {
    const explicitEnd = Number(item.end);

    if (Number.isFinite(explicitEnd)) {
      return explicitEnd;
    }

    const start = getSuggestionStart(item);
    const explicitLength = Number(item.length);

    if (
      start >= 0 &&
      Number.isFinite(explicitLength)
    ) {
      return start + explicitLength;
    }

    const original = String(
      item.original ??
      item.text ??
      item.word ??
      item.context?.text ??
      ""
    );

    return start >= 0
      ? start + original.length
      : -1;
  }

  function getAlternatives(item = {}) {
    if (Array.isArray(item.alternatives)) {
      return [
        ...new Set(
          item.alternatives
            .map(String)
            .filter(Boolean)
        )
      ].slice(0, 5);
    }

    if (Array.isArray(item.replacements)) {
      return [
        ...new Set(
          item.replacements
            .map((replacement) =>
              typeof replacement === "string"
                ? replacement
                : replacement?.value
            )
            .filter(Boolean)
        )
      ].slice(0, 5);
    }

    if (
      window.EnhancerEngine &&
      typeof window.EnhancerEngine
        .alternativesFor === "function"
    ) {
      const original = String(
        item.original ??
        item.text ??
        item.word ??
        ""
      );

      if (original) {
        try {
          const alternatives =
            window.EnhancerEngine
              .alternativesFor(original);

          return Array.isArray(alternatives)
            ? alternatives.slice(0, 5)
            : [];
        } catch (error) {
          console.warn(
            "Unable to obtain alternatives:",
            error
          );
        }
      }
    }

    return [];
  }

  function normalizeCategory(item) {
    const type = getSuggestionType(item)
      .toLowerCase();

    if (type.includes("spell")) {
      return "Spelling";
    }

    if (
      type.includes("punct") ||
      type.includes("comma")
    ) {
      return "Punctuation";
    }

    if (
      type.includes("vocab") ||
      type.includes("word")
    ) {
      return "Vocabulary";
    }

    if (
      type.includes("style") ||
      type.includes("clarity") ||
      type.includes("sentence") ||
      type.includes("paragraph")
    ) {
      return "Style";
    }

    return "Grammar";
  }

  function getFilteredSuggestions() {
    const suggestions = getSuggestions();

    if (state.activeFilter === "All") {
      return suggestions;
    }

    return suggestions.filter(
      (suggestion) =>
        normalizeCategory(suggestion) ===
        state.activeFilter
    );
  }

  /* =========================================================
     RENDERING
     ========================================================= */

  function render() {
    renderScore();
    renderMetrics();
    renderCounts();
    renderSuggestions();
    renderBackdrop();
    renderStatusBar();
    renderAnalyzingState();
  }

  function renderAnalyzingState() {
    if (!elements.analyzingBadge) {
      return;
    }

    elements.analyzingBadge.classList.toggle(
      "hidden",
      !state.isAnalyzing
    );
  }

  function renderScore() {
    if (!elements.scoreValue) {
      return;
    }

    let score = Number(
      state.analysis?.score ?? 100
    );

    if (!Number.isFinite(score)) {
      score = 100;
    }

    score = Math.max(
      0,
      Math.min(100, Math.round(score))
    );

    elements.scoreValue.textContent =
      String(score);
  }

  function renderMetrics() {
    if (!elements.metrics) {
      return;
    }

    const suggestions = getSuggestions();

    const errors = Number(
      state.analysis?.errors ??
      state.analysis?.errorCount ??
      suggestions.filter((item) =>
        getSuggestionType(item)
          .toLowerCase()
          .includes("error")
      ).length
    );

    const warnings = Number(
      state.analysis?.warnings ??
      state.analysis?.warningCount ??
      suggestions.filter((item) =>
        getSuggestionType(item)
          .toLowerCase()
          .includes("warning")
      ).length
    );

    elements.metrics.innerHTML = "";

    const metricData = [
      {
        value: Number.isFinite(errors)
          ? errors
          : 0,
        label: "Errors"
      },
      {
        value: Number.isFinite(warnings)
          ? warnings
          : 0,
        label: "Warnings"
      },
      {
        value: suggestions.length,
        label: "Suggestions"
      }
    ];

    metricData.forEach((metric) => {
      const wrapper =
        document.createElement("div");

      wrapper.className = "metric";

      const value =
        document.createElement("b");

      value.textContent =
        String(metric.value);

      const label =
        document.createElement("span");

      label.textContent = metric.label;

      wrapper.append(value, label);
      elements.metrics.appendChild(wrapper);
    });
  }

  function renderCounts() {
    const suggestions = getSuggestions();

    const counts = {
      All: suggestions.length,
      Grammar: 0,
      Spelling: 0,
      Punctuation: 0,
      Style: 0,
      Vocabulary: 0
    };

    suggestions.forEach((suggestion) => {
      const category =
        normalizeCategory(suggestion);

      counts[category] =
        (counts[category] || 0) + 1;
    });

    const countElements = {
      All: $("allCount"),
      Grammar: $("grammarCount"),
      Spelling: $("spellingCount"),
      Punctuation: $("punctuationCount"),
      Style: $("styleCount"),
      Vocabulary: $("vocabularyCount")
    };

    Object.entries(countElements).forEach(
      ([category, element]) => {
        if (element) {
          element.textContent =
            String(counts[category] || 0);
        }
      }
    );

    if (elements.suggestionsCount) {
      elements.suggestionsCount.textContent =
        String(getFilteredSuggestions().length);
    }
  }

  function renderSuggestions() {
    const container =
      elements.suggestionsList;

    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (state.isAnalyzing) {
      const loading =
        document.createElement("div");

      loading.className =
        "suggestion-card empty";

      loading.textContent =
        "Analyzing your writing...";

      container.appendChild(loading);
      return;
    }

    const suggestions =
      getFilteredSuggestions();

    if (!suggestions.length) {
      const empty =
        document.createElement("div");

      empty.className =
        "suggestion-card empty";

      if (!state.text.trim()) {
        empty.textContent =
          "Start typing to check your writing.";
      } else if (state.activeFilter !== "All") {
        empty.textContent =
          `No ${state.activeFilter.toLowerCase()} suggestions found.`;
      } else {
        empty.textContent =
          "No suggestions found.";
      }

      container.appendChild(empty);
      return;
    }

    suggestions.forEach((suggestion) => {
      const card =
        document.createElement("article");

      card.className = "suggestion-card";

      const type =
        document.createElement("div");

      type.className = "suggestion-type";
      type.textContent =
        normalizeCategory(suggestion);

      const message =
        document.createElement("div");

      message.className =
        "suggestion-message";

      message.textContent =
        getSuggestionMessage(suggestion);

      card.append(type, message);

      const replacement =
        getSuggestionText(suggestion);

      if (replacement) {
        const applyButton =
          document.createElement("button");

        applyButton.type = "button";
        applyButton.className =
          "suggestion-apply";

        applyButton.textContent =
          `Apply: ${replacement}`;

        applyButton.addEventListener(
          "click",
          () => {
            applySuggestion(
              suggestion,
              replacement
            );
          }
        );

        card.appendChild(applyButton);
      }

      const alternatives =
        getAlternatives(suggestion).filter(
          (alternative) =>
            alternative !== replacement
        );

      if (alternatives.length) {
        const title =
          document.createElement("div");

        title.className =
          "alternatives-title";

        title.textContent =
          "Alternatives";

        const wrapper =
          document.createElement("div");

        wrapper.className = "alternatives";

        alternatives.forEach(
          (alternative) => {
            const button =
              document.createElement("button");

            button.type = "button";
            button.className =
              "alternative-btn";

            button.textContent =
              alternative;

            button.addEventListener(
              "click",
              () => {
                applySuggestion(
                  suggestion,
                  alternative
                );
              }
            );

            wrapper.appendChild(button);
          }
        );

        card.append(title, wrapper);
      }

      container.appendChild(card);
    });
  }

  /* =========================================================
     APPLY SUGGESTION
     ========================================================= */

  function applySuggestion(
    suggestion,
    replacement
  ) {
    let text = getEditorValue();

    const start =
      getSuggestionStart(suggestion);

    const end =
      getSuggestionEnd(suggestion);

    if (
      start >= 0 &&
      end >= start &&
      end <= text.length
    ) {
      text =
        text.slice(0, start) +
        replacement +
        text.slice(end);

      finishSuggestionApplication(text);
      return;
    }

    const original = String(
      suggestion.original ??
      suggestion.text ??
      suggestion.word ??
      ""
    );

    if (original) {
      const position =
        text.indexOf(original);

      if (position >= 0) {
        text =
          text.slice(0, position) +
          replacement +
          text.slice(
            position + original.length
          );

        finishSuggestionApplication(text);
        return;
      }
    }

    showToast(
      "Unable to locate the original text."
    );
  }

  function finishSuggestionApplication(text) {
    setEditorValue(text);
    state.text = text;

    renderStatusBar();
    scheduleAnalysis();
    focusEditor();

    showToast("Suggestion applied.");
  }

  /* =========================================================
     BACKDROP AND HIGHLIGHTING
     ========================================================= */

  function renderBackdrop() {
    const backdrop = elements.backdrop;
    const editor = getEditor();

    if (!backdrop || !editor) {
      return;
    }

    const text = getEditorValue();

    if (!text) {
      backdrop.innerHTML = "";
      return;
    }

    const validSuggestions =
      getSuggestions()
        .map((item) => ({
          item,
          start: getSuggestionStart(item),
          end: getSuggestionEnd(item)
        }))
        .filter(
          ({ start, end }) =>
            start >= 0 &&
            end > start &&
            end <= text.length
        )
        .sort(
          (first, second) =>
            first.start - second.start
        );

    if (!validSuggestions.length) {
      backdrop.textContent = text;
      synchronizeEditorScroll();
      return;
    }

    let output = "";
    let position = 0;

    validSuggestions.forEach(
      ({ item, start, end }) => {
        if (start < position) {
          return;
        }

        output += escapeHTML(
          text.slice(position, start)
        );

        const category =
          normalizeCategory(item)
            .toLowerCase();

        output +=
          `<mark class="grammar-highlight ${category}">` +
          escapeHTML(text.slice(start, end)) +
          "</mark>";

        position = end;
      }
    );

    output += escapeHTML(
      text.slice(position)
    );

    backdrop.innerHTML = output;
    synchronizeEditorScroll();
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function synchronizeEditorScroll() {
    const editor = getEditor();
    const backdrop = elements.backdrop;

    if (!editor || !backdrop) {
      return;
    }

    backdrop.scrollTop = editor.scrollTop;
    backdrop.scrollLeft = editor.scrollLeft;
  }

  /* =========================================================
     STATUS BAR
     ========================================================= */

  function renderStatusBar() {
    const text = getEditorValue();

    const words = text.trim()
      ? text.trim().split(/\s+/).length
      : 0;

    const characters = text.length;

    const readingSeconds =
      words === 0
        ? 0
        : Math.max(
            1,
            Math.ceil((words / 200) * 60)
          );

    if (elements.wordCount) {
      elements.wordCount.textContent =
        `${words} ${words === 1 ? "word" : "words"}`;
    }

    if (elements.charCount) {
      elements.charCount.textContent =
        `${characters} ${
          characters === 1
            ? "character"
            : "characters"
        }`;
    }

    if (elements.readingTime) {
      if (readingSeconds < 60) {
        elements.readingTime.textContent =
          `${readingSeconds} sec read`;
      } else {
        const minutes =
          Math.ceil(readingSeconds / 60);

        elements.readingTime.textContent =
          `${minutes} min read`;
      }
    }

    if (elements.readingLevel) {
      elements.readingLevel.textContent =
        getReadingLevel(words, text);
    }

    updateCursorPosition();
  }

  function getReadingLevel(wordCount, text) {
    if (!wordCount) {
      return "—";
    }

    const sentenceCount = Math.max(
      1,
      (text.match(/[.!?]+/g) || []).length
    );

    const averageSentenceLength =
      wordCount / sentenceCount;

    if (averageSentenceLength <= 12) {
      return "Easy";
    }

    if (averageSentenceLength <= 20) {
      return "Standard";
    }

    return "Advanced";
  }

  function updateCursorPosition() {
    const editor = getEditor();

    if (
      !editor ||
      !elements.cursorPos ||
      typeof editor.selectionStart !== "number"
    ) {
      return;
    }

    const beforeCursor =
      editor.value.slice(
        0,
        editor.selectionStart
      );

    const lines =
      beforeCursor.split("\n");

    const line = lines.length;
    const column =
      lines[lines.length - 1].length + 1;

    elements.cursorPos.textContent =
      `Ln ${line}, Col ${column}`;
  }

  /* =========================================================
     COPY AND SAVE
     ========================================================= */

  async function copyText() {
    const text = getEditorValue();

    if (!text) {
      showToast(
        "There is no text to copy."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast("Text copied.");
    } catch (error) {
      const editor = getEditor();

      if (!editor) {
        showToast("Unable to copy the text.");
        return;
      }

      editor.focus();
      editor.select();

      const copied =
        document.execCommand("copy");

      focusEditor();

      showToast(
        copied
          ? "Text copied."
          : "Unable to copy the text."
      );
    }
  }

  function saveAs() {
    const text = getEditorValue();

    if (!text.trim()) {
      showToast(
        "There is no text to save."
      );
      return;
    }

    const baseName =
      (state.fileName ||
        "Proofline document")
        .replace(/\.[^/.]+$/, "")
        .replace(/[<>:"/\\|?*]/g, "_");

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8"
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `${baseName}_Proofline.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    showToast("Document saved.");
  }

  /* =========================================================
     FILE IMPORT
     ========================================================= */

  function setFileStatus(message) {
    if (elements.fileStatus) {
      elements.fileStatus.textContent =
        message || "";
    }
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(String(reader.result || ""));
      };

      reader.onerror = () => {
        reject(
          new Error("Unable to read the file.")
        );
      };

      reader.readAsText(file);
    });
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(
          new Error("Unable to read the file.")
        );
      };

      reader.readAsArrayBuffer(file);
    });
  }

  async function readDocx(file) {
    if (
      !window.mammoth ||
      typeof window.mammoth.extractRawText !==
        "function"
    ) {
      throw new Error(
        "The DOCX reader library is unavailable."
      );
    }

    const arrayBuffer =
      await readFileAsArrayBuffer(file);

    const result =
      await window.mammoth.extractRawText({
        arrayBuffer
      });

    return result.value || "";
  }

  async function readPdf(file) {
    const pdfLibrary =
      window.pdfjsLib ||
      window["pdfjs-dist/build/pdf"];

    if (!pdfLibrary) {
      throw new Error(
        "The PDF reader library is unavailable."
      );
    }

    const arrayBuffer =
      await readFileAsArrayBuffer(file);

    const loadingTask =
      pdfLibrary.getDocument({
        data: new Uint8Array(arrayBuffer)
      });

    const pdf = await loadingTask.promise;
    const pages = [];

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber += 1
    ) {
      const page =
        await pdf.getPage(pageNumber);

      const content =
        await page.getTextContent();

      const pageText = content.items
        .map((item) => item.str || "")
        .join(" ");

      pages.push(pageText);
    }

    return pages.join("\n\n");
  }

  async function extractFileText(file) {
    const fileName =
      file.name.toLowerCase();

    if (fileName.endsWith(".docx")) {
      return readDocx(file);
    }

    if (fileName.endsWith(".pdf")) {
      return readPdf(file);
    }

    return readFileAsText(file);
  }

  async function importFiles(files) {
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    setFileStatus(
      `Opening ${file.name}...`
    );

    try {
      const text =
        await extractFileText(file);

      if (!text.trim()) {
        throw new Error(
          "No readable text was found in the file."
        );
      }

      state.fileName =
        file.name || "Imported document";

      state.text = text;
      state.analysis = null;

      setEditorValue(text);
      updateDocumentTitle();
      showWorkspace();
      closeModal("documentsModal");

      renderStatusBar();
      scheduleAnalysis();

      setFileStatus(
        `${file.name} opened successfully.`
      );

      showToast(
        "Document imported successfully."
      );
    } catch (error) {
      console.error(
        "Proofline file import error:",
        error
      );

      setFileStatus(
        error.message ||
        "Unable to import the document."
      );

      showToast(
        "Unable to import the document."
      );
    }
  }

  /* =========================================================
     ENHANCER
     ========================================================= */

  async function openEnhancer() {
    const text = getEditorValue();

    if (!text.trim()) {
      showToast("Enter some text first.");
      return;
    }

    const originalElement =
      $("enhanceOriginal");

    const resultElement =
      $("enhanceResult");

    const changesElement =
      $("enhanceChanges");

    if (originalElement) {
      originalElement.textContent = text;
    }

    if (resultElement) {
      resultElement.textContent =
        "Preparing enhancement...";
    }

    if (changesElement) {
      changesElement.innerHTML = "";
    }

    openModal("enhancerModal");

    const mode =
      $("enhancerMode")?.value ||
      "standard";

    try {
      if (
        !window.EnhancerEngine ||
        typeof window.EnhancerEngine.enhance !==
          "function"
      ) {
        throw new Error(
          "The enhancer engine is unavailable."
        );
      }

      let result =
        window.EnhancerEngine.enhance(
          text,
          mode
        );

      if (result instanceof Promise) {
        result = await result;
      }

      const enhancedText =
        typeof result === "string"
          ? result
          : result?.text ??
            result?.enhanced ??
            result?.result ??
            "";

      if (!enhancedText.trim()) {
        throw new Error(
          "No enhanced text was produced."
        );
      }

      state.enhancedText = enhancedText;

      if (resultElement) {
        resultElement.textContent =
          enhancedText;
      }

      renderEnhancementChanges(
        text,
        enhancedText
      );
    } catch (error) {
      console.error(
        "Proofline enhancer error:",
        error
      );

      state.enhancedText = "";

      if (resultElement) {
        resultElement.textContent =
          error.message ||
          "Unable to enhance the text.";
      }
    }
  }

  function renderEnhancementChanges(
    original,
    enhanced
  ) {
    const container =
      $("enhanceChanges");

    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (original === enhanced) {
      const noChanges =
        document.createElement("div");

      noChanges.className = "change";
      noChanges.textContent =
        "No changes were suggested.";

      container.appendChild(noChanges);
      return;
    }

    const change =
      document.createElement("div");

    change.className = "change";

    const removed =
      document.createElement("del");

    removed.textContent = original;

    const separator =
      document.createTextNode(" → ");

    const inserted =
      document.createElement("ins");

    inserted.textContent = enhanced;

    change.append(
      removed,
      separator,
      inserted
    );

    container.appendChild(change);
  }

  function applyEnhancement() {
    if (!state.enhancedText.trim()) {
      showToast(
        "There is no enhancement to apply."
      );
      return;
    }

    setEditorValue(state.enhancedText);
    state.text = state.enhancedText;

    closeModal("enhancerModal");
    renderStatusBar();
    scheduleAnalysis();
    focusEditor();

    showToast("Enhancement applied.");
  }

  /* =========================================================
     MODALS
     ========================================================= */

  function openModal(id) {
    $(id)?.classList.remove("hidden");
  }

  function closeModal(id) {
    $(id)?.classList.add("hidden");
  }

  /* =========================================================
     TOAST
     ========================================================= */

  function showToast(message) {
    let toast = $("toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.setAttribute(
        "role",
        "status"
      );

      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  /* =========================================================
     EVENT HELPERS
     ========================================================= */

  function bindButton(ids, handler) {
    ids.forEach((id) => {
      const button = $(id);

      if (button) {
        button.addEventListener(
          "click",
          handler
        );
      }
    });
  }

  /* =========================================================
     EVENT BINDING
     ========================================================= */

  function initEvents() {
    const editor = getEditor();

    if (elements.activateBtn) {
      elements.activateBtn.addEventListener(
        "click",
        activateLicense
      );
    }

    if (elements.licenseCode) {
      elements.licenseCode.addEventListener(
        "input",
        (event) => {
          event.target.value =
            cleanLicenseCode(
              event.target.value
            );

          setLicenseMessage("");
        }
      );

      elements.licenseCode.addEventListener(
        "keydown",
        (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            activateLicense();
          }
        }
      );
    }

    if (editor) {
      editor.addEventListener(
        "input",
        () => {
          state.text = getEditorValue();

          renderStatusBar();
          renderBackdrop();
          scheduleAnalysis();
        }
      );

      editor.addEventListener(
        "scroll",
        synchronizeEditorScroll
      );

      editor.addEventListener(
        "click",
        updateCursorPosition
      );

      editor.addEventListener(
        "keyup",
        updateCursorPosition
      );

      editor.addEventListener(
        "select",
        updateCursorPosition
      );
    }

    bindButton(
      [
        "getStartedBtn",
        "blankDocBtn",
        "newDocBtn",
        "newDocument",
        "newBtn",
        "createDocument",
        "startWriting"
      ],
      createDocument
    );

    bindButton(
      [
        "brandHomeBtn",
        "homeBtn",
        "backHome"
      ],
      showHome
    );

    bindButton(
      [
        "homeUploadBtn",
        "uploadBtn"
      ],
      () => {
        elements.fileInput?.click();
      }
    );

    bindButton(
      ["documentsBtn"],
      () => {
        openModal("documentsModal");
      }
    );

    bindButton(
      ["copyBtn", "copyText"],
      copyText
    );

    bindButton(
      ["saveAsBtn", "saveBtn"],
      saveAs
    );

    bindButton(
      ["enhanceBtn", "enhanceText"],
      openEnhancer
    );

    bindButton(
      ["applyEnhanceBtn"],
      applyEnhancement
    );

    if (elements.fileInput) {
      elements.fileInput.addEventListener(
        "change",
        (event) => {
          importFiles(
            event.target.files
          );

          event.target.value = "";
        }
      );
    }

    if (elements.dropZone) {
      ["dragenter", "dragover"].forEach(
        (eventName) => {
          elements.dropZone.addEventListener(
            eventName,
            (event) => {
              event.preventDefault();

              elements.dropZone.classList.add(
                "dragging"
              );
            }
          );
        }
      );

      ["dragleave", "drop"].forEach(
        (eventName) => {
          elements.dropZone.addEventListener(
            eventName,
            (event) => {
              event.preventDefault();

              elements.dropZone.classList.remove(
                "dragging"
              );
            }
          );
        }
      );

      elements.dropZone.addEventListener(
        "drop",
        (event) => {
          importFiles(
            event.dataTransfer.files
          );
        }
      );
    }

    document
      .querySelectorAll("[data-close]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            closeModal(
              button.dataset.close
            );
          }
        );
      });

    document
      .querySelectorAll(".modal")
      .forEach((modal) => {
        modal.addEventListener(
          "click",
          (event) => {
            if (event.target === modal) {
              closeModal(modal.id);
            }
          }
        );
      });

    document
      .querySelectorAll(
        ".nav-item[data-filter]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            state.activeFilter =
              button.dataset.filter || "All";

            document
              .querySelectorAll(
                ".nav-item[data-filter]"
              )
              .forEach((item) => {
                item.classList.toggle(
                  "active",
                  item === button
                );
              });

            renderSuggestions();
            renderCounts();
          }
        );
      });

    $("enhancerMode")?.addEventListener(
      "change",
      () => {
        if (
          elements.enhancerModal &&
          !elements.enhancerModal.classList.contains(
            "hidden"
          )
        ) {
          openEnhancer();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== "Escape") {
          return;
        }

        const visibleModal =
          document.querySelector(
            ".modal:not(.hidden)"
          );

        if (visibleModal) {
          closeModal(visibleModal.id);
          return;
        }

        if (
          elements.workspaceView &&
          !elements.workspaceView.classList.contains(
            "hidden"
          )
        ) {
          showHome();
        }
      }
    );

    window.addEventListener(
      "resize",
      synchronizeEditorScroll
    );
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {
    initEvents();
    initLicenseGate();

    updateDocumentTitle();
    render();

    console.info(
      "Proofline initialized.",
      {
        testingMode: isTestingMode(),
        licensed: state.licensed,
        deviceType: getDeviceType()
      }
    );
  }

  /* =========================================================
     START APPLICATION
     ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();
