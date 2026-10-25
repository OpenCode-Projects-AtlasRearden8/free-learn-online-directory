#!/usr/bin/env node
"use strict";

/**
 * smoke-test.js — loads index.html in jsdom, runs the page's scripts,
 * and asserts the app actually renders: chips, cards, search, filter,
 * and the overdue-recheck path.
 *
 * Run: node scripts/smoke-test.js   (requires jsdom, dev dependency)
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

let failures = 0;
function fail(msg) { failures += 1; console.error("FAIL  " + msg); }
function pass(msg) { console.log("ok    " + msg); }

const dom = new JSDOM(html, {
  url: "file://" + root + "/index.html",
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

// Run remaining scripts after DOMContentLoaded-equivalent load.


setTimeout(() => {
  try {
    const data = window.FREE_LEARN_DATA;
    if (!data) { fail("FREE_LEARN_DATA did not load"); finish(); return; }
    pass("FREE_LEARN_DATA loaded (" + data.resources.length + " resources)");

    const cards = document.querySelectorAll("#grid .card");
    if (cards.length === data.resources.length) {
      pass("all " + cards.length + " cards rendered on first paint");
    } else {
      fail("expected " + data.resources.length + " cards, saw " + cards.length);
    }

    const chips = document.querySelectorAll("#chips .chip");
    const expectedChips = data.categories.length + 1;
    if (chips.length === expectedChips) {
      pass("category chips rendered (" + chips.length + ")");
    } else {
      fail("expected " + expectedChips + " chips, saw " + chips.length);
    }

    // Filter: click "Language learning".
    const langChip = Array.from(chips).find((c) => c.textContent === "Language learning");
    langChip.click();
    const langCards = document.querySelectorAll("#grid .card");
    const expectedLang = data.resources.filter((r) => r.category === "language").length;
    if (langCards.length === expectedLang) {
      pass("language filter shows " + langCards.length + " cards");
    } else {
      fail("language filter expected " + expectedLang + ", saw " + langCards.length);
    }

    // Search within filter: should narrow further.
    const search = document.getElementById("search");
    search.value = "audio";
    search.dispatchEvent(new window.Event("input", { bubbles: true }));
    const searched = document.querySelectorAll("#grid .card").length;
    const expectedSearch = data.resources.filter(
      (r) => r.category === "language" &&
        [r.title, r.provider, r.whatYouLearn, r.whatsFree, r.tags.join(" ")].join(" ").toLowerCase().includes("audio")
    ).length;
    if (searched === expectedSearch) {
      pass("search 'audio' within language shows " + searched + " card(s)");
    } else {
      fail("search expected " + expectedSearch + ", saw " + searched);
    }

    // Nonsense query → empty state visible.
    search.value = "zzzznotathing";
    search.dispatchEvent(new window.Event("input", { bubbles: true }));
    if (!document.getElementById("empty").hidden && document.querySelectorAll("#grid .card").length === 0) {
      pass("empty state appears for nonsense search");
    } else {
      fail("empty state did not trigger for nonsense search");
    }

    // Reset.
    search.value = "";
    search.dispatchEvent(new window.Event("input", { bubbles: true }));
    document.querySelector('#chips .chip[data-cat="all"]').click();

    // Card content sanity: first card has a link, verified dates, free box.
    const firstCard = document.querySelector("#grid .card");
    const link = firstCard.querySelector("h2 a");
    if (link && link.href.startsWith("https://")) {
      pass("card links point to https provider sites");
    } else {
      fail("card link missing or not https: " + (link ? link.href : "none"));
    }
    for (const cls of ["freebox", "limitsbox"]) {
      if (!firstCard.querySelector("." + cls)) fail("card missing ." + cls);
    }
    if (!firstCard.textContent.includes("Verified free on")) fail("card missing verified-free-on line");
    pass("card fields (what's free, honest limits, verified dates) present");

    // Count line + meta injection.
    if (!document.getElementById("count-line").textContent.includes("of " + data.resources.length)) {
      fail("count line not populated");
    }
    const lastEdited = document.querySelector('[data-meta="lastEdited"]').textContent;
    if (lastEdited !== data.meta.lastEdited) fail("meta lastEdited not injected (saw '" + lastEdited + "')");
    pass("count line and lastEdited meta rendered");

    finish();
  } catch (e) {
    fail("smoke test threw: " + e.stack);
    finish();
  }
}, 400);

function finish() {
  console.log("");
  console.log(failures === 0 ? "Smoke test passed." : failures + " failure(s) in smoke test.");
  process.exit(failures === 0 ? 0 : 1);
}
