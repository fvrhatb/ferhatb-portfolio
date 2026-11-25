const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderProject } = require("../server/project-page");

test("project details escape content and honor the demo switch", () => {
  const project = { title: "<örnek>", desc: "Bir proje", demoPanel: true, gallery: [{ url: "/assets/example.png", caption: "Görsel" }] };
  const enabled = renderProject(project, true);
  assert.match(enabled, /&lt;örnek&gt;/);
  assert.match(enabled, /href="\/admin\/demo"/);
  assert.match(enabled, /alt="Görsel"/);
  const disabled = renderProject(project, false);
  assert.doesNotMatch(disabled, /href="\/admin\/demo"/);
  assert.match(disabled, /demosu şu anda kapalı/);
});
