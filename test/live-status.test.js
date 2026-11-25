const { test } = require("node:test");
const assert = require("node:assert/strict");
const defaults = require("../server/defaults.json");
const { renderIndex } = require("../server/render");

test("live status can be hidden without deleting its messages", () => {
  const content = structuredClone(defaults);
  content.profile.liveStatusesEnabled = false;
  assert.match(renderIndex(content, 0), /id="live-status"[^>]* hidden>/);
  assert.ok(content.profile.liveStatuses.length);
  content.profile.liveStatusesEnabled = true;
  assert.doesNotMatch(renderIndex(content, 0), /id="live-status"[^>]* hidden>/);
});
