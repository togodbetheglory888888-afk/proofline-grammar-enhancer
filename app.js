```javascript
(function () {
  "use strict";

  /* =========================================================
     PROOFLINE GRAMMAR ENHANCER
     Complete Application Controller
     ========================================================= */

  const $ = (id) => document.getElementById(id);

  const el = {
    licenseView: $("licenseView"),
    homeView: $("homeView"),
    workspaceView: $("workspaceView"),
    licenseCode: $("licenseCode"),
    activateBtn: $("activateBtn"),
    licenseMessage: $("licenseMessage")
  };

  const state = {
    licensed: false,
    deviceId: "",
    text: "",
    fileName: "Untitled Document",
    analysis: null,
    selectedSuggestion: null,
    analysisTimer: null,
    isAnalyzing: false
  };

  /* =========================================================
     CONFIGURATION
     ========================================================= */

  function getConfig() {
    return window.PROOFLINE_LICENSE_CONFIG || {
      apiUrl: "",
      requireOnlineActivation: true,
      product: "PROOFLINE-GRAMMAR-49"
    };
  }

function isTestingMode() {
  const cfg = getConfig();

  /*
    TESTING MODE

    If online activation is disabled OR no license
    server URL has been configured, allow the app
    to run locally for testing.
  */

  if (cfg.requireOnlineActivation === false) {
    return true;
  }

  return false;
}

  /* =========================================================
     DEVICE IDENTIFICATION
     ========================================================= */

  function getDeviceId() {
    let id = localStorage.getItem("proofline_device_id");

    if (!id) {
      if (window.crypto && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id =
          "PF-" +
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).substring(2, 12);
      }

      localStorage.setItem("proofline_device_id", id);
    }

    return id;
  }

  function getDeviceType() {
    const ua = navigator.userAgent || "";

    const mobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
        ua
      );

    if (
      /iPad/i.test(ua) ||
      (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
    ) {
      return "TABLET";
    }

    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) {
      return "TABLET";
    }

    if (mobile) {
      return "CELLPHONE";
    }

    return "COMPUTER";
  }

  function getDeviceLabel() {
    const type = getDeviceType();
    const platform = navigator.platform || "Unknown platform";

    return type + " / " + platform;
  }

  /* =========================================================
     LOCAL LICENSE STATE
     ========================================================= */

  function isLicensed() {
    if (isTestingMode()) {
      return true;
    }

    const status = localStorage.getItem("proofline_license_status");
    const savedDevice = localStorage.getItem("proofline_license_device");

    return (
      status === "activated" &&
      savedDevice &&
      savedDevice === getDeviceId()
    );
  }

  /* =========================================================
     LICENSE MESSAGE
     ========================================================= */

  function setLicenseMessage(message, type) {
    if (!el.licenseMessage) return;

    el.licenseMessage.textContent = message || "";

    el.licenseMessage.className = "";

    if (type) {
      el.licenseMessage.classList.add(type);
    }
  }

  /* =========================================================
     LICENSE ACTIVATION
     ========================================================= */

  async function activateLicense() {
    /*
      TESTING MODE

      If config.js contains:

      requireOnlineActivation: false

      the application opens without contacting
      the license server.
    */

    if (isTestingMode()) {
      state.licensed = true;

      if (el.licenseView) {
        el.licenseView.classList.add("hidden");
      }

      setLicenseMessage("");

      showHome();

      return;
    }

    const input = el.licenseCode;

    if (!input) return;

    const code = (input.value || "").replace(/\D/g, "");

    input.value = code;

    if (!/^\d{7}$/.test(code)) {
      setLicenseMessage("Enter exactly 7 digits.", "error");
      return;
    }

    const cfg = getConfig();

    if (!cfg.apiUrl) {
      setLicenseMessage(
        "License service is not configured yet. Set apiUrl in config.js before selling.",
        "error"
      );

      return;
    }

    const btn = el.activateBtn;

    if (btn) {
      btn.disabled = true;
    }

    setLicenseMessage(
      "Checking your license online…",
      "busy"
    );

    try {
      const response = await fetch(
        cfg.apiUrl.replace(/\/$/, "") + "/activate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code: code,
            deviceId: getDeviceId(),
            deviceType: getDeviceType(),
            deviceLabel: getDeviceLabel(),
            product:
              cfg.product || "PROOFLINE-GRAMMAR-49"
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message || "Activation was not accepted."
        );
      }

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

      state.licensed = true;

      if (el.licenseView) {
        el.licenseView.classList.add("hidden");
      }

      setLicenseMessage("");

      showHome();

    } catch (error) {
      setLicenseMessage(
        error.message ||
          "Could not contact the license service. Make sure you are online.",
        "error"
      );
    } finally {
      if (btn) {
        btn.disabled = false;
      }
    }
  }

  /* =========================================================
     LICENSE GATE
     ========================================================= */

  function initLicenseGate() {
    state.deviceId = getDeviceId();

    /*
      IMPORTANT FIX:

      Testing mode completely bypasses the license gate.
    */

    if (isTestingMode()) {
      state.licensed = true;

      if (el.licenseView) {
        el.licenseView.classList.add("hidden");
      }

      if (el.homeView) {
        el.homeView.classList.remove("hidden");
      }

      if (el.workspaceView) {
        el.workspaceView.classList.add("hidden");
      }

      showHome();

      return;
    }

    state.licensed = isLicensed();

    if (state.licensed) {
      if (el.licenseView) {
        el.licenseView.classList.add("hidden");
      }

      showHome();

      return;
    }

    if (el.licenseView) {
      el.licenseView.classList.remove("hidden");
    }

    if (el.homeView) {
      el.homeView.classList.add("hidden");
    }

    if (el.workspaceView) {
      el.workspaceView.classList.add("hidden");
    }

    if (el.activateBtn) {
      el.activateBtn.onclick = activateLicense;
    }

    if (el.licenseCode) {
      el.licenseCode.addEventListener("input", function (event) {
        event.target.value = event.target.value
          .replace(/\D/g, "")
          .slice(0, 7);
      });

      el.licenseCode.addEventListener(
        "keydown",
        function (event) {
          if (event.key === "Enter") {
            activateLicense();
          }
        }
      );
    }
  }

  /* =========================================================
     VIEW MANAGEMENT
     ========================================================= */

  function showHome() {
    if (!state.licensed) return;

    if (el.licenseView) {
      el.licenseView.classList.add("hidden");
    }

    if (el.workspaceView) {
      el.workspaceView.classList.add("hidden");
    }

    if (el.homeView) {
      el.homeView.classList.remove("hidden");
    }
  }

  function showWorkspace() {
    if (!state.licensed) return;

    if (el.licenseView) {
      el.licenseView.classList.add("hidden");
    }

    if (el.homeView) {
      el.homeView.classList.add("hidden");
    }

    if (el.workspaceView) {
      el.workspaceView.classList.remove("hidden");
    }
  }

  /* =========================================================
     ELEMENT HELPERS
     ========================================================= */

  function getEditor() {
    return (
      $("editor") ||
      $("textEditor") ||
      $("documentEditor") ||
      $("inputText") ||
      $("textInput")
    );
  }

  function getEditorValue() {
    const editor = getEditor();

    if (!editor) return "";

    return editor.value !== undefined
      ? editor.value
      : editor.textContent || "";
  }

  function setEditorValue(value) {
    const editor = getEditor();

    if (!editor) return;

    if (editor.value !== undefined) {
      editor.value = value;
    } else {
      editor.textContent = value;
    }
  }

  /* =========================================================
     DOCUMENT MANAGEMENT
     ========================================================= */

  function updateDocumentTitle() {
    const title =
      $("documentTitle") ||
      $("fileName") ||
      $("docTitle");

    if (title) {
      title.textContent =
        state.fileName || "Untitled Document";
    }
  }

  function createDocument() {
    state.text = "";
    state.analysis = null;
    state.fileName = "Untitled Document";

    setEditorValue("");

    updateDocumentTitle();

    render();

    showWorkspace();

    const editor = getEditor();

    if (editor) {
      setTimeout(function () {
        editor.focus();
      }, 100);
    }
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

  function runAnalysis() {
    if (!state.licensed) return;

    const text = getEditorValue();

    state.text = text;

    if (!text.trim()) {
      state.analysis = null;
      render();
      return;
    }

    state.isAnalyzing = true;

    render();

    try {
      if (
        window.GrammarEngine &&
        typeof window.GrammarEngine.analyze ===
          "function"
      ) {
        state.analysis =
          window.GrammarEngine.analyze(text);
      } else if (
        window.GrammarChecker &&
        typeof window.GrammarChecker.analyze ===
          "function"
      ) {
        state.analysis =
          window.GrammarChecker.analyze(text);
      } else if (
        typeof window.analyze === "function"
      ) {
        state.analysis = window.analyze(text);
      } else {
        state.analysis = {
          suggestions: [],
          score: 100,
          errors: 0,
          warnings: 0
        };
      }
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
    }

    state.isAnalyzing = false;

    render();
  }

  /* =========================================================
     ANALYSIS NORMALIZATION
     ========================================================= */

  function getSuggestions() {
    if (!state.analysis) return [];

    if (Array.isArray(state.analysis)) {
      return state.analysis;
    }

    if (
      Array.isArray(state.analysis.suggestions)
    ) {
      return state.analysis.suggestions;
    }

    if (
      Array.isArray(state.analysis.issues)
    ) {
      return state.analysis.issues;
    }

    if (
      Array.isArray(state.analysis.results)
    ) {
      return state.analysis.results;
    }

    return [];
  }

  function getSuggestionText(item) {
    return (
      item.suggestion ||
      item.replacement ||
      item.correct ||
      item.corrected ||
      item.message ||
      ""
    );
  }

  function getSuggestionMessage(item) {
    return (
      item.message ||
      item.explanation ||
      item.reason ||
      item.description ||
      "Possible improvement"
    );
  }

  function getSuggestionType(item) {
    return (
      item.type ||
      item.category ||
      item.rule ||
      "Suggestion"
    );
  }

  function getSuggestionStart(item) {
    return Number.isFinite(item.start)
      ? item.start
      : Number.isFinite(item.index)
      ? item.index
      : -1;
  }

  function getSuggestionEnd(item) {
    if (Number.isFinite(item.end)) {
      return item.end;
    }

    const start = getSuggestionStart(item);

    if (start >= 0) {
      const original =
        item.original ||
        item.text ||
        item.word ||
        "";

      return start + original.length;
    }

    return -1;
  }

  /* =========================================================
     ALTERNATIVES
     ========================================================= */

  function getAlternatives(item) {
    if (!item) return [];

    if (Array.isArray(item.alternatives)) {
      return item.alternatives
        .filter(Boolean)
        .slice(0, 5);
    }

    if (
      window.EnhancerEngine &&
      typeof window.EnhancerEngine
        .alternativesFor === "function"
    ) {
      const original =
        item.original ||
        item.text ||
        item.word ||
        "";

      if (original) {
        try {
          return window.EnhancerEngine
            .alternativesFor(original)
            .slice(0, 5);
        } catch (e) {}
      }
    }

    return [];
  }

  /* =========================================================
     RENDERING
     ========================================================= */

  function render() {
    renderScore();
    renderSuggestions();
    renderStats();
    renderBackdrop();
  }

  function renderScore() {
    const scoreElement =
      $("score") ||
      $("grammarScore") ||
      $("scoreValue");

    if (!scoreElement) return;

    let score = 100;

    if (
      state.analysis &&
      Number.isFinite(state.analysis.score)
    ) {
      score = state.analysis.score;
    }

    score = Math.max(
      0,
      Math.min(100, Math.round(score))
    );

    scoreElement.textContent = score;
  }

  function renderStats() {
    if (!state.analysis) return;

    const suggestions = getSuggestions();

    const errorCount =
      state.analysis.errors ??
      state.analysis.errorCount ??
      suggestions.filter(function (s) {
        return (
          getSuggestionType(s)
            .toLowerCase()
            .includes("error")
        );
      }).length;

    const warningCount =
      state.analysis.warnings ??
      state.analysis.warningCount ??
      suggestions.filter(function (s) {
        return (
          getSuggestionType(s)
            .toLowerCase()
            .includes("warning")
        );
      }).length;

    const errorsEl =
      $("errorCount") ||
      $("errors");

    const warningsEl =
      $("warningCount") ||
      $("warnings");

    const suggestionEl =
      $("suggestionCount") ||
      $("suggestionsCount");

    if (errorsEl) {
      errorsEl.textContent = errorCount;
    }

    if (warningsEl) {
      warningsEl.textContent = warningCount;
    }

    if (suggestionEl) {
      suggestionEl.textContent =
        suggestions.length;
    }
  }

  function renderSuggestions() {
    const container =
      $("suggestionsList") ||
      $("suggestions") ||
      $("resultsList") ||
      $("issuesList");

    if (!container) return;

    container.innerHTML = "";

    if (state.isAnalyzing) {
      const loading = document.createElement(
        "div"
      );

      loading.className = "suggestion-card";

      loading.textContent =
        "Analyzing your writing…";

      container.appendChild(loading);

      return;
    }

    const suggestions = getSuggestions();

    if (!suggestions.length) {
      const empty = document.createElement(
        "div"
      );

      empty.className = "suggestion-card";

      empty.textContent = state.text.trim()
        ? "No suggestions found."
        : "Start typing to check your writing.";

      container.appendChild(empty);

      return;
    }

    suggestions.forEach(function (
      suggestion,
      index
    ) {
      const card = document.createElement(
        "div"
      );

      card.className =
        "suggestion-card";

      card.dataset.index = index;

      const type = document.createElement(
        "div"
      );

      type.className =
        "suggestion-type";

      type.textContent =
        getSuggestionType(suggestion);

      const message = document.createElement(
        "div"
      );

      message.className =
        "suggestion-message";

      message.textContent =
        getSuggestionMessage(suggestion);

      card.appendChild(type);
      card.appendChild(message);

      const replacement =
        getSuggestionText(suggestion);

      if (replacement) {
        const applyButton =
          document.createElement("button");

        applyButton.className =
          "suggestion-apply";

        applyButton.type = "button";

        applyButton.textContent =
          "Apply: " + replacement;

        applyButton.addEventListener(
          "click",
          function (event) {
            event.stopPropagation();

            applySuggestion(
              suggestion,
              replacement
            );
          }
        );

        card.appendChild(
          applyButton
        );
      }

      const alternatives =
        getAlternatives(suggestion);

      if (alternatives.length) {
        const altTitle =
          document.createElement("div");

        altTitle.className =
          "alternatives-title";

        altTitle.textContent =
          "Word alternatives";

        card.appendChild(altTitle);

        const altWrap =
          document.createElement("div");

        altWrap.className =
          "alternatives";

        alternatives.forEach(
          function (alternative) {
            const button =
              document.createElement(
                "button"
              );

            button.type = "button";

            button.className =
              "alternative-btn";

            button.textContent =
              alternative;

            button.addEventListener(
              "click",
              function (event) {
                event.stopPropagation();

                applySuggestion(
                  suggestion,
                  alternative
                );
              }
            );

            altWrap.appendChild(button);
          }
        );

        card.appendChild(altWrap);
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
    const editor = getEditor();

    if (!editor) return;

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

      setEditorValue(text);

      state.text = text;

      scheduleAnalysis();

      showToast("Suggestion applied.");

      return;
    }

    /*
      Fallback for engines that provide
      original text but no position.
    */

    const original =
      suggestion.original ||
      suggestion.text ||
      suggestion.word ||
      "";

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

        setEditorValue(text);

        state.text = text;

        scheduleAnalysis();

        showToast("Suggestion applied.");

        return;
      }
    }

    showToast(
      "Unable to locate the original text."
    );
  }

  /* =========================================================
     BACKDROP / HIGHLIGHTING
     ========================================================= */

  function renderBackdrop() {
    const backdrop =
      $("backdrop") ||
      $("highlightLayer");

    const editor = getEditor();

    if (!backdrop || !editor) {
      return;
    }

    const text = getEditorValue();

    if (!text) {
      backdrop.innerHTML = "";
      return;
    }

    const suggestions =
      getSuggestions();

    if (!suggestions.length) {
      backdrop.textContent = escapeHTML(text);
      return;
    }

    let output = "";
    let position = 0;

    suggestions
      .slice()
      .sort(function (a, b) {
        return (
          getSuggestionStart(a) -
          getSuggestionStart(b)
        );
      })
      .forEach(function (item) {
        const start =
          getSuggestionStart(item);

        const end =
          getSuggestionEnd(item);

        if (
          start < 0 ||
          end <= start ||
          start < position ||
          end > text.length
        ) {
          return;
        }

        output += escapeHTML(
          text.slice(position, start)
        );

        const flagged =
          text.slice(start, end);

        output +=
          '<mark class="grammar-highlight">' +
          escapeHTML(flagged) +
          "</mark>";

        position = end;
      });

    output += escapeHTML(
      text.slice(position)
    );

    backdrop.innerHTML = output;
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =========================================================
     FOCUS / CURSOR
     ========================================================= */

  function focusEditor() {
    const editor = getEditor();

    if (!editor) return;

    editor.focus();

    try {
      const length =
        editor.value.length;

      editor.setSelectionRange(
        length,
        length
      );
    } catch (e) {}
  }

  /* =========================================================
     COPY
     ========================================================= */

  async function copyText() {
    const text = getEditorValue();

    if (!text) {
      showToast("There is no text to copy.");

      return;
    }

    try {
      await navigator.clipboard.writeText(
        text
      );

      showToast("Text copied.");
    } catch (error) {
      const editor = getEditor();

      if (editor) {
        editor.select();

        try {
          document.execCommand("copy");
        } catch (e) {}

        editor.setSelectionRange(
          editor.value.length,
          editor.value.length
        );
      }

      showToast("Text copied.");
    }
  }

  /* =========================================================
     TOAST
     ========================================================= */

  function showToast(message) {
    let toast = $("toast");

    if (!toast) {
      toast = document.createElement(
        "div"
      );

      toast.id = "toast";

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
      showToast.timer
    );

    showToast.timer =
      setTimeout(function () {
        toast.classList.remove("show");
      }, 2200);
  }

  /* =========================================================
     FILE READING
     ========================================================= */

  function readFile(file) {
    return new Promise(function (
      resolve,
      reject
    ) {
      const reader =
        new FileReader();

      reader.onload = function () {
        resolve(
          reader.result || ""
        );
      };

      reader.onerror = function () {
        reject(
          new Error(
            "Unable to read file."
          )
        );
      };

      reader.readAsText(file);
    });
  }

  /* =========================================================
     IMPORT FILES
     ========================================================= */

  async function importFiles(files) {
    if (!files || !files.length) {
      return;
    }

    const file = files[0];

    try {
      const text =
        await readFile(file);

      state.fileName =
        file.name ||
        "Imported Document";

      setEditorValue(text);

      state.text = text;

      showWorkspace();

      updateDocumentTitle();

      scheduleAnalysis();

      showToast(
        "Document imported successfully."
      );
    } catch (error) {
      console.error(error);

      showToast(
        "Unable to import the document."
      );
    }
  }

  /* =========================================================
     SAVE AS
     ========================================================= */

  function saveAs() {
    const text = getEditorValue();

    if (!text.trim()) {
      showToast(
        "There is no text to save."
      );

      return;
    }

    const blob =
      new Blob([text], {
        type: "text/plain;charset=utf-8"
      });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    const baseName =
      (state.fileName ||
        "Proofline Document")
        .replace(
          /\.[^/.]+$/,
          ""
        );

    link.download =
      baseName +
      "_Proofline.txt";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast("Document saved.");
  }

  /* =========================================================
     ENHANCE
     ========================================================= */

  function enhance() {
    const text = getEditorValue();

    if (!text.trim()) {
      showToast(
        "Enter some text first."
      );

      return;
    }

    try {
      if (
        window.EnhancerEngine &&
        typeof window.EnhancerEngine
          .enhance === "function"
      ) {
        const result =
          window.EnhancerEngine.enhance(
            text
          );

        if (
          typeof result === "string" &&
          result.trim()
        ) {
          setEditorValue(result);

          state.text = result;

          scheduleAnalysis();

          showToast(
            "Writing enhanced."
          );

          return;
        }
      }

      showToast(
        "Enhancer is not available."
      );
    } catch (error) {
      console.error(
        "Enhancer error:",
        error
      );

      showToast(
        "Unable to enhance the text."
      );
    }
  }

  /* =========================================================
     EVENT BINDING
     ========================================================= */

  function bindButton(
    ids,
    handler
  ) {
    ids.forEach(function (id) {
      const button = $(id);

      if (button) {
        button.addEventListener(
          "click",
          handler
        );
      }
    });
  }

  function initEvents() {
    const editor = getEditor();

    if (editor) {
      editor.addEventListener(
        "input",
        function () {
          state.text =
            getEditorValue();

          scheduleAnalysis();
        }
      );

      editor.addEventListener(
        "scroll",
        function () {
          const backdrop =
            $("backdrop") ||
            $("highlightLayer");

          if (backdrop) {
            backdrop.scrollTop =
              editor.scrollTop;

            backdrop.scrollLeft =
              editor.scrollLeft;
          }
        }
      );
    }

    /* New document */

    bindButton(
      [
        "newDocument",
        "newBtn",
        "createDocument",
        "startWriting"
      ],
      createDocument
    );

    /* Home */

    bindButton(
      [
        "homeBtn",
        "backHome"
      ],
      showHome
    );

    /* Workspace */

    bindButton(
      [
        "writeBtn",
        "openEditor",
        "startWritingBtn"
      ],
      function () {
        showWorkspace();
        focusEditor();
      }
    );

    /* Copy */

    bindButton(
      [
        "copyBtn",
        "copyText"
      ],
      copyText
    );

    /* Save */

    bindButton(
      [
        "saveBtn",
        "saveAsBtn"
      ],
      saveAs
    );

    /* Enhance */

    bindButton(
      [
        "enhanceBtn",
        "enhanceText"
      ],
      enhance
    );

    /* Upload */

    const fileInput =
      $("fileInput") ||
      $("uploadInput") ||
      $("fileUpload");

    if (fileInput) {
      fileInput.addEventListener(
        "change",
        function (event) {
          importFiles(
            event.target.files
          );

          event.target.value = "";
        }
      );
    }

    /* Drag and drop */

    const dropZone =
      $("dropZone") ||
      $("uploadArea");

    if (dropZone) {
      [
        "dragenter",
        "dragover"
      ].forEach(function (eventName) {
        dropZone.addEventListener(
          eventName,
          function (event) {
            event.preventDefault();

            dropZone.classList.add(
              "dragging"
            );
          }
        );
      });

      [
        "dragleave",
        "drop"
      ].forEach(function (eventName) {
        dropZone.addEventListener(
          eventName,
          function (event) {
            event.preventDefault();

            dropZone.classList.remove(
              "dragging"
            );
          }
        );
      });

      dropZone.addEventListener(
        "drop",
        function (event) {
          const files =
            event.dataTransfer.files;

          importFiles(files);
        }
      );
    }

    /* Escape key */

    document.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key === "Escape" &&
          el.workspaceView &&
          !el.workspaceView.classList.contains(
            "hidden"
          )
        ) {
          showHome();
        }
      }
    );
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  function init() {
    initLicenseGate();
    initEvents();

    /*
      In testing mode, go directly
      to the home page.
    */

    if (isTestingMode()) {
      state.licensed = true;
      showHome();
    }
  }

  /* =========================================================
     START APPLICATION
     ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
```
