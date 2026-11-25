const { test } = require("node:test");
const assert = require("node:assert/strict");

test("demo session is read-only and disabled demo loses access", async () => {
  process.env.APPWRITE_ENDPOINT = "";
  process.env.APPWRITE_PROJECT_ID = "";
  process.env.APPWRITE_API_KEY = "";
  const store = require("../server/store");
  const auth = require("../server/auth");
  let enabled = true;
  const original = store.getAll;
  store.getAll = async () => ({ settings: { adminDemoEnabled: enabled } });
  try {
    let cookie;
    auth.setDemoSession({ cookie: (name, value) => { cookie = `${name}=${value}`; } });
    const req = { method: "GET", headers: { cookie }, get: () => "1" };
    assert.equal((await auth.authorize(req)).role, "demo");
    let status;
    await new Promise((resolve, reject) => {
      const res = { status: (code) => { status = code; return res; }, json: () => resolve(), clearCookie: () => {} };
      auth.requireAuthApi({ ...req, method: "POST" }, res, () => reject(new Error("demo write passed")));
    });
    assert.equal(status, 403);
    enabled = false;
    assert.equal(await auth.authorize(req), null);
    assert.equal(await auth.authorize({ headers: { cookie: "ferb_demo=demo" } }), null);
  } finally { store.getAll = original; }
});
