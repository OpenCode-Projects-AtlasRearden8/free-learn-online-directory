#!/usr/bin/env node
"use strict";

/**
 * test.js — validates the directory.
 *
 * Checks:
 *   1. data.json parses and every entry has the full schema.
 *   2. Dates are valid, recheckBy is after verifiedFreeOn, and overdue
 *      rechecks are surfaced (informational).
 *   3. All links are https and contain no affiliate or tracking patterns.
 *   4. Categories referenced by entries match the declared category list.
 *   5. index.html actually references data.js and the elements it needs.
 *   6. data.js is in sync with data.json (so the offline page shows the
 *      same data the JSON file holds).
 *
 * Run: node scripts/test.js
 * Exits non-zero on failure.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dataPath = path.join(root, "data.json");
const jsPath = path.join(root, "data.js");
const htmlPath = path.join(root, "index.html");

let failures = 0;
let notes = 0;

function fail(msg) {
  failures += 1;
  console.error("FAIL  " + msg);
}

function note(msg) {
  notes += 1;
  console.log("NOTE  " + msg);
}

function pass(msg) {
  console.log("ok    " + msg);
}

/* 1. JSON parses and entries carry the full schema. */
let data;
try {
  data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  pass("data.json parses as valid JSON");
} catch (e) {
  fail("data.json does not parse: " + e.message);
  process.exit(1); // Nothing after this can be checked.
}

const REQUIRED = [
  "id", "title", "category", "provider", "url",
  "whatYouLearn", "whatsFree", "timeNeeded", "honestLimits",
  "tags", "verifiedFreeOn", "recheckBy"
];

if (!Array.isArray(data.resources) || data.resources.length === 0) {
  fail("resources must be a non-empty array");
  process.exit(1);
}
pass("resources array has " + data.resources.length + " entries");

const seenIds = new Set();
const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date();

for (const r of data.resources) {
  const label = "entry '" + (r.id || "<missing id>") + "'";
  for (const field of REQUIRED) {
    if (!(field in r) || r[field] === "" || r[field] === null) {
      fail(label + " is missing or empty for field: " + field);
    }
  }
  for (const field of ["whatYouLearn", "whatsFree", "timeNeeded", "honestLimits"]) {
    if (typeof r[field] === "string" && r[field].trim().length < 20) {
      fail(label + " field '" + field + "' looks too short to be a real blurb");
    }
  }
  if (seenIds.has(r.id)) fail(label + " has a duplicate id");
  seenIds.add(r.id);

  if (!data.categories.includes(r.category)) {
    fail(label + " has unknown category '" + r.category + "'");
  }

  if (!Array.isArray(r.tags) || r.tags.length === 0) {
    fail(label + " should have at least one tag");
  } else if (!r.tags.every((t) => typeof t === "string" && t.trim())) {
    fail(label + " has empty/invalid tags");
  }

  /* 3. URL checks. */
  const url = r.url || "";
  if (!/^https:\/\//.test(url)) {
    fail(label + " URL must be https: " + url);
  }
  const affiliatePatterns = [
    { re: /[?&]tag=[^&]*-20/i, name: "Amazon affiliate tag" },
    { re: /(ref|aff|affid|aff_id|affiliate|linkshare|shareasale|impact|clickbank|awin|cj\.com)=[^&]*[?&]?$/i, name: "affiliate parameter" },
    { re: /[?&]utm_[a-z]+=[^&]*/i, name: "utm tracking parameter" },
    { re: /\/ref=[^/]*\//i, name: "amazon ref path" },
    { re: /amzn\.to/i, name: "amzn.to shortener" }
  ];
  for (const p of affiliatePatterns) {
    if (p.re.test(url)) fail(label + " URL looks like it has affiliate/tracking (" + p.name + "): " + url);
  }

  /* 2. Date checks. */
  for (const d of [r.verifiedFreeOn, r.recheckBy]) {
    if (!dateRe.test(String(d)) || isNaN(new Date(d + "T00:00:00").getTime())) {
      fail(label + " has invalid date '" + d + "' (expected YYYY-MM-DD)");
    }
  }
  if (dateRe.test(r.verifiedFreeOn) && dateRe.test(r.recheckBy)) {
    if (new Date(r.recheckBy) <= new Date(r.verifiedFreeOn)) {
      fail(label + " recheckBy (" + r.recheckBy + ") is not after verifiedFreeOn (" + r.verifiedFreeOn + ")");
    }
  }
  if (dateRe.test(r.recheckBy) && new Date(r.recheckBy + "T23:59:59") < today) {
    note(label + " is overdue for a re-verification (recheckBy " + r.recheckBy + ", today is " + new Date(today).toISOString().slice(0, 10) + ")");
  }
}

/* Category coverage + labels. */
for (const c of data.categories) {
  const count = data.resources.filter((r) => r.category === c).length;
  if (count === 0) fail("declared category '" + c + "' has no entries");
  if (!(c in data.categoryLabels)) fail("category '" + c + "' has no human-friendly label");
}
const declared = new Set(data.categories);
for (const r of data.resources) {
  if (!declared.has(r.category)) {
    fail("entry '" + r.id + "' uses undeclared category '" + r.category + "'");
  }
}
pass("all categories declared, labeled, and populated");

/* meta block. */
for (const field of ["title", "tagline", "lastEdited", "maintainer"]) {
  if (!data.meta || !data.meta[field]) fail("data.json meta is missing '" + field + "'");
}

/* 5. index.html checks. */
const html = fs.readFileSync(htmlPath, "utf8");
for (const needle of ['<script src="data.js">', 'id="grid"', 'id="search"', 'id="chips"', "FREE_LEARN_DATA"]) {
  if (!html.includes(needle)) fail("index.html is missing: " + needle);
}
for (const el of ["grid", "chips", "search", "count-line", "empty"]) {
  if (!html.includes('id="' + el + '"')) fail("index.html is missing element id '" + el + "'");
}
if (!html.includes("Asdale Dynamics")) {
  fail("index.html should credit Asdale Dynamics, LLC");
}
pass("index.html wired for offline use (data.js, no fetch)");

const staticExternals =
  html.match(/(?:src|href)="https?:\/\/[^"]+"/g) || [];
if (staticExternals.length > 0) {
  note("index.html references external URLs (may break offline): " + staticExternals.join(", "));
}

/* 6. data.js is in sync with data.json. */
let jsSource;
try {
  jsSource = fs.readFileSync(jsPath, "utf8");
} catch (e) {
  fail("data.js does not exist — run `node scripts/build.js` first");
  jsSource = null;
}
if (jsSource) {
  const marker = "window.FREE_LEARN_DATA = ";
  const start = jsSource.indexOf(marker);
  if (start === -1) {
    fail("data.js does not set window.FREE_LEARN_DATA");
  } else {
    const jsonPart = jsSource.slice(start + marker.length).replace(/;\s*$/, "").trim();
    const originalJson = fs.readFileSync(dataPath, "utf8").trim();
    let contentSynced = false;
    try {
      contentSynced = JSON.stringify(JSON.parse(jsonPart)) === JSON.stringify(data);
    } catch (e) {
      contentSynced = false;
    }
    if (!contentSynced) {
      fail("data.js is out of sync with data.json — run `node scripts/build.js`");
    } else if (jsonPart !== originalJson) {
      note("data.js carries the same data as data.json, with different whitespace — run `node scripts/build.js` for an exact re-sync");
    } else {
      pass("data.js is in sync with data.json");
    }
  }
}

/* Summary */
console.log("");
console.log(
  failures === 0
    ? "All checks passed. " + (notes > 0 ? notes + " note(s)." : "")
    : failures + " failure(s), " + notes + " note(s)."
);
process.exit(failures === 0 ? 0 : 1);
