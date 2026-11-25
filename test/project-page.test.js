const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderProject } = require("../server/project-page");

test("project details escape content and honor the demo switch", () => {
  const project = { title: "<example>", desc: "Project", demoPanel: true, gallery: [{ url: "/assets/example.png", caption: "Image" }] };
  const enabled = renderProject(project, true);
  assert.match(enabled, /&lt;example&gt;/);
  assert.match(enabled, /href="\/admin\/demo"/);
  assert.match(enabled, /alt="Image"/);
  assert.doesNotMatch(renderProject(project, false), /href="\/admin\/demo"/);
});

test("story keeps custom content escaped and displays portfolio screenshots", () => {
  const html = renderProject({ title: "Project", detailIntro: "An idea", detailSections: [{ title: "CV <special>", text: "Secure & open" }] }, false);
  assert.match(html, /class="case-story"/);
  assert.match(html, /CV &lt;special&gt;/);
  assert.match(html, /Secure &amp; open/);
  const portfolio = renderProject(require("../server/portfolio-project"), false);
  assert.match(portfolio, /ferhatb-cv-preview\.png/);
  assert.match(portfolio, /ferhatb-panel-demo\.png/);
  assert.match(portfolio, /class="case-section case-section--visual"/);
});
