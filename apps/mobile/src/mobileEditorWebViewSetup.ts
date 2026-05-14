export const mobileEditorSetupScript = `
  document.documentElement.lang = navigator.language || "en";
  document.addEventListener("keydown", function(event) {
    if (isFileNewShortcut(event)) {
      event.preventDefault();
      postEditorMessage({ type: "shortcut", command: "fileNewNote" });
      return;
    }
    if (!isTabInsideEditor(event)) return;
    event.preventDefault();
    postEditorMessage({
      type: "listIndent",
      direction: event.shiftKey ? "out" : "in"
    });
  }, true);
  document.addEventListener("click", function(event) {
    var link = event.target && event.target.closest && event.target.closest("a[href^='tolaria-note:']");
    if (!link) return;
    event.preventDefault();
    postEditorMessage({
      type: "openWikilink",
      target: decodeURIComponent(String(link.getAttribute("href") || "").replace(/^tolaria-note:/, ""))
    });
  }, true);
  function isFileNewShortcut(event) {
    return (event.metaKey || event.ctrlKey)
      && !event.altKey
      && String(event.key).toLowerCase() === "n";
  }
  function isTabInsideEditor(event) {
    if (event.key !== "Tab") return false;
    var selection = window.getSelection();
    var node = selection && selection.anchorNode;
    return Boolean(node && containingEditor(node));
  }
  function containingEditor(node) {
    var editor = document.querySelector(".ProseMirror");
    var container = node.nodeType === 1 ? node : node.parentNode;
    return editor && container && editor.contains(container);
  }
  function activeWikilinkQuery() {
    var selection = window.getSelection();
    if (!isCollapsedTextSelection(selection)) return null;
    if (!containingEditor(selection.anchorNode)) return null;
    return wikilinkQueryBeforeCursor(selection);
  }
  function isCollapsedTextSelection(selection) {
    return Boolean(selection
      && selection.anchorNode
      && selection.anchorNode.nodeType === 3
      && selection.rangeCount > 0
      && selection.isCollapsed);
  }
  function wikilinkQueryBeforeCursor(selection) {
    var prefix = String(selection.anchorNode.textContent || "").slice(0, selection.anchorOffset);
    var start = prefix.lastIndexOf("[[");
    if (start < 0) return null;
    var query = cleanWikilinkQuery(prefix.slice(start + 2));
    if (query === null) return null;
    return {
      frame: wikilinkQueryFrame(selection),
      query: query
    };
  }
  function cleanWikilinkQuery(query) {
    return query.indexOf("]]") >= 0 || query.indexOf("\\n") >= 0 ? null : query;
  }
  function emitWikilinkQuery() {
    var activeQuery = activeWikilinkQuery();
    postEditorMessage({
      type: "wikilinkQuery",
      frame: activeQuery ? activeQuery.frame : null,
      query: activeQuery ? activeQuery.query : null
    });
  }
  function wikilinkQueryFrame(selection) {
    var range = selection.getRangeAt(0).cloneRange();
    var rect = range.getBoundingClientRect();
    if (hasVisibleFrame(rect)) {
      return {
        bottom: rect.bottom,
        left: rect.left
      };
    }
    return fallbackWikilinkQueryFrame(selection);
  }
  function fallbackWikilinkQueryFrame(selection) {
    var container = selection.anchorNode && selection.anchorNode.parentElement;
    var rect = container && container.getBoundingClientRect && container.getBoundingClientRect();
    return {
      bottom: rect ? rect.bottom : 0,
      left: rect ? rect.left : 0
    };
  }
  function hasVisibleFrame(rect) {
    if (!rect) return false;
    return Boolean(rect.bottom || rect.left);
  }
  function postEditorMessage(message) {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  document.addEventListener("keyup", emitWikilinkQuery, true);
  document.addEventListener("mouseup", emitWikilinkQuery, true);
  document.addEventListener("selectionchange", emitWikilinkQuery, true);
  true;
`

export const mobileEditorCss = `
  * {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif !important;
  }

  html,
  body,
  #root,
  .ProseMirror {
    color: #292825;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    font-size: 18px;
    line-height: 1.55;
  }

  .ProseMirror {
    padding: 0;
  }

  .ProseMirror h1 {
    font-family: inherit;
    font-size: 42px;
    font-weight: 760;
    letter-spacing: 0;
    line-height: 1.08;
    margin: 18px 0 28px;
  }

  .ProseMirror p,
  .ProseMirror li,
  .ProseMirror blockquote {
    font-family: inherit;
  }

  .ProseMirror a[href^="tolaria-note:"] {
    color: #3367f6;
    font-weight: 650;
    text-decoration: none;
    border-radius: 5px;
    background: #e8eeff;
    padding: 1px 4px;
  }
`
