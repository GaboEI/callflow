(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function setText(selector, value) {
    const element = $(selector);
    if (element) element.textContent = value || "";
  }

  window.CallFlowDom = { $, $$, setText };

  if (typeof module !== "undefined") {
    module.exports = window.CallFlowDom;
  }
})();
