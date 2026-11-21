const STORAGE_KEY = "memfiddle:apps";

const app = document.getElementById("app");

let currentAppId = null;

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

function migrateAppsIfNeeded(apps) {
  // Migrate old name-keyed format (no `id` field) to ID-keyed format.
  // Returns a new object if migration was needed, or the same object otherwise.
  let needsMigration = false;
  for (const key of Object.keys(apps)) {
    if (!apps[key].id) {
      needsMigration = true;
      break;
    }
  }

  if (!needsMigration) return apps;

  const migrated = {};
  for (const key of Object.keys(apps)) {
    const entry = apps[key];
    const id = generateId();
    migrated[id] = {
      id,
      name: entry.name || key,
      html: entry.html || "",
      css: entry.css || "",
      js: entry.js || "",
      updatedAt: entry.updatedAt || Date.now()
    };
  }
  return migrated;
}

function loadApps() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const migrated = migrateAppsIfNeeded(raw);
    if (migrated !== raw) {
      // Save the migrated data back so we only migrate once.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch (error) {
    console.error("Could not load apps:", error);
    return {};
  }
}

function saveApps(apps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

// ── Custom confirm dialog ──────────────────────────────────────────────────

/**
 * Show a custom confirmation dialog (never uses the browser's confirm()).
 *
 * @param {object} opts
 * @param {string}   opts.title          - Dialog heading
 * @param {string}   opts.message        - Body text (optional)
 * @param {string}   opts.confirmLabel   - Label for the confirm button (action verb)
 * @param {string}   [opts.cancelLabel]  - Label for cancel button (default "Cancel")
 * @param {boolean}  [opts.confirmIsPrimary] - If true, confirm button uses primary style (dark); otherwise danger style
 * @param {Function} opts.onConfirm      - Called when user confirms
 * @param {Function} [opts.onCancel]     - Called when user cancels (optional)
 */
function showConfirmDialog({ title, message, confirmLabel, cancelLabel = "Cancel", confirmIsPrimary = false, onConfirm, onCancel }) {
  const existing = document.getElementById("confirmDialog");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "confirmDialog";
  overlay.className = "modal-overlay confirm-dialog-overlay";
  overlay.innerHTML = `
    <div class="confirm-dialog-card" role="dialog" aria-modal="true" aria-labelledby="confirmDialogTitle">
      <h2 id="confirmDialogTitle" class="confirm-dialog-title">${escapeHtml(title)}</h2>
      ${message ? `<p class="confirm-dialog-message">${escapeHtml(message)}</p>` : ""}
      <div class="confirm-dialog-actions">
        <button type="button" class="secondary-button" id="confirmDialogCancel">${escapeHtml(cancelLabel)}</button>
        <button type="button" class="${confirmIsPrimary ? "primary-button" : "danger-button"}" id="confirmDialogConfirm">${escapeHtml(confirmLabel)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKeyDown);
  };

  const onKeyDown = event => {
    if (event.key === "Escape") {
      close();
      if (onCancel) onCancel();
    }
  };

  document.addEventListener("keydown", onKeyDown);

  document.getElementById("confirmDialogCancel").addEventListener("click", () => {
    close();
    if (onCancel) onCancel();
  });

  document.getElementById("confirmDialogConfirm").addEventListener("click", () => {
    close();
    onConfirm();
  });
}

// ── App list ───────────────────────────────────────────────────────────────

function showList() {
  currentAppId = null;

  const apps = loadApps();

  const ids = Object.keys(apps).sort(
    (a, b) => apps[b].updatedAt - apps[a].updatedAt
  );

  app.innerHTML = `
    <main class="page">
      <header class="header">
        <h1 class="logo">Mem<span>Fiddle</span></h1>
        <button class="primary-button" id="createButton">Create</button>
      </header>

      <section>
        ${
          ids.length === 0
            ? `
              <div class="empty-state">
                <p>No apps yet.</p>
                <p>Create your first prototype to get started.</p>
              </div>
            `
            : `
              <div class="app-list">
                ${ids.map(id => `
                  <article class="app-card">
                    <h3 class="app-card-name">${escapeHtml(apps[id].name)}</h3>

                    <p class="app-card-date">
                      Updated ${formatDate(apps[id].updatedAt)}
                    </p>

                    <div class="card-actions">
                      <button
                        class="primary-button run-button"
                        data-id="${escapeHtml(id)}"
                      >
                        Run
                      </button>

                      <button
                        class="secondary-button edit-button"
                        data-id="${escapeHtml(id)}"
                      >
                        Edit
                      </button>

                      <button
                        class="secondary-button duplicate-button"
                        data-id="${escapeHtml(id)}"
                      >
                        Duplicate
                      </button>
                    </div>
                  </article>
                `).join("")}
              </div>
            `
        }

        <div class="landing-links">
          <a href="#" class="landing-link" id="helpLink">How do I use MemFiddle?</a>
          <a href="https://memalign.github.io/p/memfiddle.html" target="_blank" rel="noopener noreferrer" class="landing-link">About</a>
        </div>
      </section>
    </main>
  `;

  document.getElementById("createButton").addEventListener("click", () => {
    showEditor(null);
  });

  document.querySelectorAll(".run-button").forEach(button => {
    button.addEventListener("click", () => {
      runApp(button.dataset.id);
    });
  });

  document.querySelectorAll(".edit-button").forEach(button => {
    button.addEventListener("click", () => {
      showEditor(button.dataset.id);
    });
  });

  document.querySelectorAll(".duplicate-button").forEach(button => {
    button.addEventListener("click", () => {
      duplicateApp(button.dataset.id);
    });
  });

  document.getElementById("helpLink").addEventListener("click", event => {
    event.preventDefault();
    showHelpModal();
  });
}

// ── First launch / example apps ────────────────────────────────────────────

const FIRST_LAUNCH_KEY = "memfiddle:initialized";

function isExamplePresentInApps(example, apps) {
  for (const app of Object.values(apps)) {
    if (
      app.html === example.html &&
      app.css === example.css &&
      app.js === example.js
    ) {
      return true;
    }
  }
  return false;
}

function getMissingExamples(apps) {
  if (typeof EXAMPLE_APPS === "undefined" || !Array.isArray(EXAMPLE_APPS)) {
    return [];
  }
  return EXAMPLE_APPS.filter(example => !isExamplePresentInApps(example, apps));
}

function restoreExampleApps() {
  const apps = loadApps();
  const missing = getMissingExamples(apps);
  if (missing.length === 0) return;

  missing.forEach(example => {
    // Check if any existing app has the same name; if so, suffix it.
    const existingNames = new Set(Object.values(apps).map(a => a.name));
    let targetName = example.name;
    if (existingNames.has(targetName)) {
      let counter = 2;
      targetName = `${example.name} (Example)`;
      while (existingNames.has(targetName)) {
        targetName = `${example.name} (Example ${counter})`;
        counter++;
      }
    }

    const id = generateId();
    apps[id] = {
      id,
      name: targetName,
      html: example.html,
      css: example.css,
      js: example.js,
      updatedAt: Date.now()
    };
  });

  saveApps(apps);
  showList();
}

function initFirstLaunch() {
  if (localStorage.getItem(FIRST_LAUNCH_KEY)) {
    return;
  }

  const apps = loadApps();
  if (typeof EXAMPLE_APPS !== "undefined" && Array.isArray(EXAMPLE_APPS)) {
    let modified = false;
    const existingNames = new Set(Object.values(apps).map(a => a.name));
    EXAMPLE_APPS.forEach(example => {
      if (!existingNames.has(example.name)) {
        const id = generateId();
        apps[id] = {
          id,
          name: example.name,
          html: example.html,
          css: example.css,
          js: example.js,
          updatedAt: Date.now()
        };
        modified = true;
      }
    });
    if (modified) {
      saveApps(apps);
    }
  }
  localStorage.setItem(FIRST_LAUNCH_KEY, "true");
}

// ── Duplicate ──────────────────────────────────────────────────────────────

function duplicateApp(sourceId) {
  const apps = loadApps();
  const source = apps[sourceId];
  if (!source) return;

  const existingNames = new Set(Object.values(apps).map(a => a.name));
  let newName = `${source.name} (Copy)`;
  let counter = 2;
  while (existingNames.has(newName)) {
    newName = `${source.name} (Copy ${counter})`;
    counter++;
  }

  const newId = generateId();
  apps[newId] = {
    id: newId,
    name: newName,
    html: source.html,
    css: source.css,
    js: source.js,
    updatedAt: Date.now()
  };

  saveApps(apps);
  showList();
}

// ── Help modal ─────────────────────────────────────────────────────────────

function showHelpModal() {
  const existingModal = document.getElementById("helpModal");
  if (existingModal) existingModal.remove();

  const examplePrompt = "I want you to create a simple web app where the user can tap the screen and a poop emoji will fly up from the bottom of the screen, with some random spin and velocity, then fall down with gravity. Make the background of the page black. Support multi-touch. Give me HTML, CSS, and vanilla JavaScript with no dependencies.";

  const apps = loadApps();
  const missingExamples = getMissingExamples(apps);

  const modalOverlay = document.createElement("div");
  modalOverlay.id = "helpModal";
  modalOverlay.className = "modal-overlay";
  modalOverlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="helpModalTitle">
      <header class="modal-header">
        <h2 id="helpModalTitle" class="modal-title">How do I use MemFiddle?</h2>
        <button type="button" class="modal-close-button" id="closeHelpModal" aria-label="Close dialog">&times;</button>
      </header>
      <div class="modal-body">
        <p class="modal-text">
          MemFiddle is a way to preview and test simple web apps. Prompt your favorite LLM to create your web app and give you 'HTML, CSS, and vanilla JavaScript with no dependencies' and then paste the resulting file content into MemFiddle.
        </p>
        <div class="prompt-section">
          <div class="prompt-header">
            <span class="prompt-title">Example prompt:</span>
            <button type="button" class="copy-button" id="copyPromptButton">Copy</button>
          </div>
          <pre class="prompt-code"><code>${escapeHtml(examplePrompt)}</code></pre>
        </div>
        ${
          missingExamples.length > 0
            ? `
              <div class="modal-footer-actions">
                <button type="button" class="secondary-button" id="restoreExamplesButton">Restore Example Apps</button>
              </div>
            `
            : ""
        }
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const closeModal = () => {
    modalOverlay.remove();
    document.removeEventListener("keydown", onKeyDown);
  };

  const onKeyDown = event => {
    if (event.key === "Escape") closeModal();
  };

  document.addEventListener("keydown", onKeyDown);

  document.getElementById("closeHelpModal").addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", event => {
    if (event.target === modalOverlay) closeModal();
  });

  const copyButton = document.getElementById("copyPromptButton");
  copyButton.addEventListener("click", () => {
    copyToClipboard(examplePrompt, copyButton);
  });

  const restoreButton = document.getElementById("restoreExamplesButton");
  if (restoreButton) {
    restoreButton.addEventListener("click", () => {
      restoreExampleApps();
      restoreButton.textContent = "Restored!";
      restoreButton.disabled = true;
      setTimeout(() => {
        closeModal();
      }, 700);
    });
  }
}

// ── Clipboard ──────────────────────────────────────────────────────────────

function copyToClipboard(text, buttonElement) {
  const onSuccess = () => {
    if (!buttonElement) return;
    const originalText = buttonElement.textContent;
    buttonElement.textContent = "Copied!";
    buttonElement.classList.add("copied");
    setTimeout(() => {
      buttonElement.textContent = originalText;
      buttonElement.classList.remove("copied");
    }, 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
      fallbackCopyToClipboard(text, onSuccess);
    });
  } else {
    fallbackCopyToClipboard(text, onSuccess);
  }
}

function fallbackCopyToClipboard(text, onSuccess) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    onSuccess();
  } catch (err) {
    console.error("Copy failed:", err);
  }
  document.body.removeChild(textarea);
}

// ── Editor ─────────────────────────────────────────────────────────────────

function showEditor(id) {
  currentAppId = id;

  const apps = loadApps();
  const existing = id ? apps[id] : null;

  // Snapshot of original values for change detection.
  const originalValues = {
    name: existing?.name || "",
    html: existing?.html || "",
    css: existing?.css || "",
    js: existing?.js || ""
  };

  app.innerHTML = `
    <main class="editor-page">
      <header class="editor-header">
        <div class="editor-header-left">
          <button class="back-button" id="backButton" aria-label="Back">&lt; Apps</button>
        </div>

        <h1 class="editor-title">
          ${id ? "Edit" : "New App"}
        </h1>

        <div class="editor-header-right"></div>
      </header>

      ${
        !id
          ? `
            <div class="editor-help-link-container">
              <a href="#" class="landing-link" id="editorHelpLink">How do I use MemFiddle?</a>
            </div>
          `
          : ""
      }

      <div class="name-field">
        <label for="nameInput">App Name</label>

        <input
          id="nameInput"
          class="name-input"
          type="text"
          autocomplete="off"
          placeholder="My App"
          value="${escapeHtml(existing?.name || "")}"
        >
      </div>

      <div class="editors">
        <section class="editor-panel">
          <div class="editor-label">
            <span>HTML</span>
            <div class="editor-label-actions">
              <button type="button" class="label-button copy-field-button" data-target="htmlEditor">Copy</button>
              <button type="button" class="label-button clear-field-button" data-target="htmlEditor">Clear</button>
            </div>
          </div>

          <textarea
            id="htmlEditor"
            class="code-editor"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            autocorrect="off"
            placeholder="<h1>Hello world</h1>"
          >${escapeHtml(existing?.html || "")}</textarea>
        </section>

        <section class="editor-panel">
          <div class="editor-label">
            <span>CSS</span>
            <div class="editor-label-actions">
              <button type="button" class="label-button copy-field-button" data-target="cssEditor">Copy</button>
              <button type="button" class="label-button clear-field-button" data-target="cssEditor">Clear</button>
            </div>
          </div>

          <textarea
            id="cssEditor"
            class="code-editor"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            autocorrect="off"
            placeholder="body { font-family: sans-serif; }"
          >${escapeHtml(existing?.css || "")}</textarea>
        </section>

        <section class="editor-panel">
          <div class="editor-label">
            <span>JavaScript</span>
            <div class="editor-label-actions">
              <button type="button" class="label-button copy-field-button" data-target="jsEditor">Copy</button>
              <button type="button" class="label-button clear-field-button" data-target="jsEditor">Clear</button>
            </div>
          </div>

          <textarea
            id="jsEditor"
            class="code-editor"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            autocorrect="off"
            placeholder="console.log('Hello!');"
          >${escapeHtml(existing?.js || "")}</textarea>
        </section>
      </div>

      <footer class="editor-footer">
        ${
          id
            ? `<button class="danger-button" id="deleteButton">Delete</button>`
            : ""
        }

        <button class="primary-button" id="saveButton">
          Save &amp; Run
        </button>
      </footer>
    </main>
  `;

  function hasUnsavedChanges() {
    const current = getEditorValues();
    return (
      current.name !== originalValues.name ||
      current.html !== originalValues.html ||
      current.css !== originalValues.css ||
      current.js !== originalValues.js
    );
  }

  document.getElementById("backButton").addEventListener("click", () => {
    if (!hasUnsavedChanges()) {
      showList();
      return;
    }

    showConfirmDialog({
      title: "Unsaved Changes",
      message: "Do you want to save your changes before leaving?",
      confirmLabel: "Save",
      cancelLabel: "Discard",
      confirmIsPrimary: true,
      onConfirm: () => {
        // Save then go back; saveAndRun navigates to runner, so just save to storage and go to list.
        saveToStorage();
        showList();
      },
      onCancel: () => {
        // "Discard" — go back without saving.
        showList();
      }
    });
  });

  const editorHelpLink = document.getElementById("editorHelpLink");
  if (editorHelpLink) {
    editorHelpLink.addEventListener("click", event => {
      event.preventDefault();
      showHelpModal();
    });
  }

  document.querySelectorAll(".copy-field-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const editor = document.getElementById(targetId);
      if (editor) {
        copyToClipboard(editor.value, btn);
      }
    });
  });

  document.querySelectorAll(".clear-field-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const editor = document.getElementById(targetId);
      if (editor) {
        editor.value = "";
        editor.focus();
      }
    });
  });

  document.getElementById("saveButton").addEventListener("click", saveAndRun);

  if (id) {
    document.getElementById("deleteButton").addEventListener("click", () => {
      deleteApp(id);
    });
  }

  setupEditorTabBehavior();
}

// ── Editor helpers ─────────────────────────────────────────────────────────

function getEditorValues() {
  return {
    name: document.getElementById("nameInput").value.trim(),
    html: document.getElementById("htmlEditor").value,
    css: document.getElementById("cssEditor").value,
    js: document.getElementById("jsEditor").value
  };
}

function stripMarkdownFences(text) {
  if (!text) return "";
  let result = text.trim();
  result = result.replace(/^```[a-zA-Z0-9_-]*\r?\n/, "");
  result = result.replace(/\r?\n```\s*$/, "");
  return result;
}

function cleanCss(css) {
  let cleaned = stripMarkdownFences(css).trim();
  cleaned = cleaned.replace(/^<style[^>]*>/i, "").replace(/<\/style>\s*$/i, "");
  return cleaned.trim();
}

function cleanJs(js) {
  let cleaned = stripMarkdownFences(js).trim();
  cleaned = cleaned.replace(/^<script[^>]*>/i, "").replace(/<\/script>\s*$/i, "");
  return cleaned.trim();
}

/**
 * Save current editor values to storage without running.
 * Returns true on success, false on failure.
 */
function saveToStorage() {
  const values = getEditorValues();

  if (!values.name) {
    values.name = "Untitled";
    const nameInput = document.getElementById("nameInput");
    if (nameInput) nameInput.value = "Untitled";
  }

  const cleanedHtml = stripMarkdownFences(values.html);
  const cleanedCss = cleanCss(values.css);
  const cleanedJs = cleanJs(values.js);

  const apps = loadApps();
  const id = currentAppId || generateId();

  apps[id] = {
    id,
    name: values.name,
    html: cleanedHtml,
    css: cleanedCss,
    js: cleanedJs,
    updatedAt: Date.now()
  };

  try {
    saveApps(apps);
    const savedApps = loadApps();
    if (!savedApps[id]) {
      throw new Error("App was not found after saving.");
    }
  } catch (error) {
    console.error(error);
    alert("Could not save the app. Local storage may be unavailable or full.");
    return false;
  }

  currentAppId = id;

  // Update editor fields with cleaned values.
  const htmlEditor = document.getElementById("htmlEditor");
  const cssEditor = document.getElementById("cssEditor");
  const jsEditor = document.getElementById("jsEditor");
  if (htmlEditor) htmlEditor.value = cleanedHtml;
  if (cssEditor) cssEditor.value = cleanedCss;
  if (jsEditor) jsEditor.value = cleanedJs;

  return true;
}

function saveAndRun() {
  const values = getEditorValues();

  // Default to "Untitled" when name is empty instead of alerting.
  if (!values.name) {
    values.name = "Untitled";
    const nameInput = document.getElementById("nameInput");
    if (nameInput) nameInput.value = "Untitled";
  }

  const cleanedHtml = stripMarkdownFences(values.html);
  const cleanedCss = cleanCss(values.css);
  const cleanedJs = cleanJs(values.js);

  document.getElementById("htmlEditor").value = cleanedHtml;
  document.getElementById("cssEditor").value = cleanedCss;
  document.getElementById("jsEditor").value = cleanedJs;

  const apps = loadApps();
  const id = currentAppId || generateId();

  apps[id] = {
    id,
    name: values.name,
    html: cleanedHtml,
    css: cleanedCss,
    js: cleanedJs,
    updatedAt: Date.now()
  };

  try {
    saveApps(apps);

    // Verify that it actually made it into storage.
    const savedApps = loadApps();

    if (!savedApps[id]) {
      throw new Error("App was not found after saving.");
    }
  } catch (error) {
    console.error(error);
    alert("Could not save the app. Local storage may be unavailable or full.");
    return;
  }

  currentAppId = id;

  runApp(id);
}

// ── Runner ─────────────────────────────────────────────────────────────────

function resetViewportZoom() {
  const meta = document.querySelector('meta[name="viewport"]');
  if (meta) {
    meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover");
  }
  window.scrollTo(0, 0);
}

function runApp(id) {
  resetViewportZoom();

  const apps = loadApps();
  const data = apps[id];

  if (!data) {
    alert("App not found.");
    showList();
    return;
  }

  const runner = document.createElement("div");
  runner.className = "runner";

  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "sandbox",
    "allow-scripts allow-modals allow-popups allow-top-navigation allow-forms allow-pointer-lock"
  );
  iframe.setAttribute(
    "allow",
    "camera; microphone; geolocation; accelerometer; gyroscope; bluetooth; midi; web-share; clipboard-read; clipboard-write; fullscreen"
  );
  iframe.setAttribute("allowfullscreen", "");

  const exitButton = document.createElement("button");
  exitButton.className = "exit-floating-button";
  exitButton.textContent = "Exit";
  exitButton.title = "Exit to app list";

  exitButton.addEventListener("click", () => {
    resetViewportZoom();
    showList();
  });

  runner.appendChild(iframe);
  runner.appendChild(exitButton);

  app.innerHTML = "";
  app.appendChild(runner);

  // Set srcdoc AFTER the iframe is connected to the DOM.
  // In Safari/WebKit, setting srcdoc on a detached iframe prevents it from loading.
  try {
    const documentContent = buildAppDocument(data);
    console.log(`[MemFiddle] Running app "${data.name}", document length: ${documentContent.length}`);
    iframe.srcdoc = documentContent;
  } catch (err) {
    console.error("[MemFiddle] Failed to build app document:", err);
    alert(`Could not run app: ${err.message}`);
  }
}

function buildAppDocument(data) {
  const rawHtml = stripMarkdownFences(data.html || "");
  const rawCss = cleanCss(data.css || "");
  const rawJs = cleanJs(data.js || "");

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  // Remove relative/local script imports (e.g. script.js, ./script.js, app.js)
  // because in an opaque sandbox srcdoc, relative paths fail to load.
  // External scripts (https://, http://, //) are preserved.
  doc.querySelectorAll("script").forEach(script => {
    const src = script.getAttribute("src");
    if (src && !/^https?:\/\/|^\/\//i.test(src.trim())) {
      script.remove();
    }
  });

  // Remove relative/local stylesheet links (e.g. style.css, ./style.css)
  // External stylesheets (https://, http://, //) are preserved.
  doc.querySelectorAll("link").forEach(link => {
    const rel = (link.getAttribute("rel") || "").toLowerCase();
    const href = link.getAttribute("href");
    if (rel.includes("stylesheet") && href && !/^https?:\/\/|^\/\//i.test(href.trim())) {
      link.remove();
    }
  });

  const customTitle = doc.querySelector("title")?.textContent || data.name || "App";

  // Collect head elements (meta tags, external links/scripts, inline styles)
  const headElements = [];
  Array.from(doc.head.children).forEach(el => {
    const tag = el.tagName.toLowerCase();
    if (tag === "title") return;
    if (tag === "meta" && el.getAttribute("charset")) return;
    if (tag === "meta" && el.getAttribute("name")?.toLowerCase() === "viewport") return;
    headElements.push(el.outerHTML);
  });

  const bodyAttrs = Array.from(doc.body.attributes)
    .map(attr => `${attr.name}="${escapeHtml(attr.value)}"`)
    .join(" ");

  const bodyContent = doc.body.innerHTML;

  const safeCss = rawCss.replaceAll("</style", "<\\/style");
  const safeJs = rawJs.replaceAll("</script", "<\\/script");

  // Polyfill in-memory localStorage / sessionStorage if sandbox blocks access, and show temporary storage banner
  const storagePolyfillScript = `
    <script>
      (function() {
        function createMemoryStorage() {
          var store = {};
          var bannerShown = false;

          function showBanner() {
            if (bannerShown) return;
            bannerShown = true;
            function insertBanner() {
              if (document.getElementById('memfiddle-storage-banner')) return;
              var banner = document.createElement('div');
              banner.id = 'memfiddle-storage-banner';
              banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#d97706;color:white;padding:10px 16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;font-weight:500;z-index:999998;box-shadow:0 -2px 10px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:space-between;word-break:break-word;';
              var text = document.createElement('span');
              text.textContent = 'localStorage APIs are limited to temporary storage';
              var closeBtn = document.createElement('button');
              closeBtn.textContent = '✕';
              closeBtn.setAttribute('aria-label', 'Dismiss banner');
              closeBtn.style.cssText = 'background:transparent;border:0;color:white;font-size:16px;cursor:pointer;padding:0 0 0 12px;line-height:1;font-weight:700;';
              closeBtn.onclick = function() { banner.remove(); };
              banner.appendChild(text);
              banner.appendChild(closeBtn);
              (document.body || document.documentElement).appendChild(banner);
            }
            if (document.body) {
              insertBanner();
            } else {
              window.addEventListener('DOMContentLoaded', insertBanner);
            }
          }

          var storage = {
            getItem: function(key) {
              showBanner();
              var k = String(key);
              return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
            },
            setItem: function(key, value) {
              showBanner();
              store[String(key)] = String(value);
            },
            removeItem: function(key) {
              showBanner();
              delete store[String(key)];
            },
            clear: function() {
              showBanner();
              store = {};
            },
            key: function(index) {
              showBanner();
              var keys = Object.keys(store);
              return index >= 0 && index < keys.length ? keys[index] : null;
            }
          };

          Object.defineProperty(storage, 'length', {
            get: function() {
              showBanner();
              return Object.keys(store).length;
            }
          });

          return new Proxy(storage, {
            get: function(target, prop) {
              if (prop in target || typeof prop === 'symbol') {
                return target[prop];
              }
              showBanner();
              return Object.prototype.hasOwnProperty.call(store, prop) ? store[prop] : undefined;
            },
            set: function(target, prop, value) {
              if (prop in target) {
                target[prop] = value;
                return true;
              }
              showBanner();
              store[String(prop)] = String(value);
              return true;
            },
            deleteProperty: function(target, prop) {
              if (prop in target) {
                delete target[prop];
                return true;
              }
              showBanner();
              delete store[String(prop)];
              return true;
            }
          });
        }

        try {
          var testKey = '__mf_test__';
          window.localStorage.setItem(testKey, testKey);
          window.localStorage.removeItem(testKey);
        } catch (e) {
          var memLocalStorage = createMemoryStorage();
          var memSessionStorage = createMemoryStorage();
          try {
            Object.defineProperty(window, 'localStorage', {
              value: memLocalStorage,
              configurable: true,
              enumerable: true,
              writable: true
            });
          } catch (err) {
            try { window.localStorage = memLocalStorage; } catch (e2) {}
          }
          try {
            Object.defineProperty(window, 'sessionStorage', {
              value: memSessionStorage,
              configurable: true,
              enumerable: true,
              writable: true
            });
          } catch (err) {
            try { window.sessionStorage = memSessionStorage; } catch (e2) {}
          }
        }
      })();
    <\/script>
  `;

  // Lightweight in-iframe error reporting so errors are visible on mobile without DevTools
  const errorTrapScript = `
    <script>
      window.addEventListener('error', function(event) {
        var storageBanner = document.getElementById('memfiddle-storage-banner');
        var bottomOffset = storageBanner ? (storageBanner.offsetHeight || 42) + 'px' : '0';
        var banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;bottom:' + bottomOffset + ';left:0;right:0;background:#dc2626;color:white;padding:12px 16px;font-family:sans-serif;font-size:13px;z-index:999999;box-shadow:0 -2px 10px rgba(0,0,0,0.3);word-break:break-word;';
        banner.textContent = 'App Error: ' + (event.message || event.error || 'Unknown script error') + (event.lineno ? ' (line ' + event.lineno + ')' : '');
        document.body ? document.body.appendChild(banner) : document.documentElement.appendChild(banner);
      });
    <\/script>
  `;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(customTitle)}</title>
${storagePolyfillScript}
${errorTrapScript}
${headElements.join("\n")}
${safeCss ? `<style>\n${safeCss}\n</style>` : ""}
</head>
<body${bodyAttrs ? ` ${bodyAttrs}` : ""}>
${bodyContent}
${safeJs ? `<script>\n${safeJs}\n<\/script>` : ""}
</body>
</html>`;
}

// ── Delete ─────────────────────────────────────────────────────────────────

function deleteApp(id) {
  const apps = loadApps();
  const appData = apps[id];
  if (!appData) return;

  showConfirmDialog({
    title: `Delete "${appData.name}"?`,
    message: "This cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    confirmIsPrimary: false,
    onConfirm: () => {
      const latestApps = loadApps();
      delete latestApps[id];
      saveApps(latestApps);
      showList();
    }
  });
}

// ── Tab behavior in editors ────────────────────────────────────────────────

function setupEditorTabBehavior() {
  document.querySelectorAll(".code-editor").forEach(editor => {
    editor.addEventListener("keydown", event => {
      if (event.key !== "Tab") {
        return;
      }

      event.preventDefault();

      const start = editor.selectionStart;
      const end = editor.selectionEnd;

      editor.value =
        editor.value.substring(0, start) +
        "  " +
        editor.value.substring(end);

      editor.selectionStart = editor.selectionEnd = start + 2;
    });
  });
}

// ── Bootstrap ──────────────────────────────────────────────────────────────

// Initialize example apps on first launch.
initFirstLaunch();

// Initial page.
showList();
