import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";

test("the separate homepage renders its full content without crashing", async () => {
  await mkdir("tmp", { recursive: true });
  const output = await mkdtemp(resolve("tmp/website-check-"));
  try {
    execFileSync(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "build",
        "--ssr",
        "App.jsx",
        "--outDir",
        output,
      ],
      { stdio: "pipe" },
    );
    const { default: Homepage } = await import(
      pathToFileURL(resolve(output, "App.js")).href
    );
    const html = renderToString(React.createElement(Homepage));
    assert.match(html, /More options/);
    assert.match(html, /Can I actually buy something here/);
    assert.match(html, /Try the shopping demo/);
    assert.doesNotMatch(html, /id="order-size"/);
    assert.doesNotMatch(html, /id="payment"/);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
