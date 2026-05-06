#!/usr/bin/env node
/**
 * One-way copy of Grav markdown into this app's /content folder.
 * Run from repo: `cd solgood-next && npm run migrate`
 *
 * Source: ../user/pages (sibling of solgood-next under the Grav project root)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const GRAV_ROOT = path.resolve(APP_ROOT, "..");
const PAGES = path.join(GRAV_ROOT, "user", "pages");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function stripOrderingPrefix(name) {
  return name.replace(/^\d+\./, "") || name;
}

function copyDirMd(srcDir, destDir, { onlyDefault = true } = {}) {
  ensureDir(destDir);
  if (!fs.existsSync(srcDir)) {
    console.warn("Missing source:", srcDir);
    return 0;
  }
  let n = 0;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const folder = ent.name;
    const slug = stripOrderingPrefix(folder);
    if (slug === "default" || slug.startsWith(".")) continue;
    const mdPath = path.join(srcDir, folder, onlyDefault ? "default.md" : "default.md");
    const altItem = path.join(srcDir, folder, "item.md");
    const from = fs.existsSync(mdPath) ? mdPath : fs.existsSync(altItem) ? altItem : null;
    if (!from) continue;
    const destFile = path.join(destDir, `${slug}.md`);
    if (fs.existsSync(destFile)) {
      // Category duplicates in Grav (e.g. two numbered folders mapping to same slug): keep first.
      continue;
    }
    fs.copyFileSync(from, destFile);
    n++;
  }
  return n;
}

function writeHome() {
  const src = path.join(PAGES, "01.home", "default.md");
  const destDir = path.join(APP_ROOT, "content", "pages");
  ensureDir(destDir);
  const dest = path.join(destDir, "home.md");
  if (!fs.existsSync(src)) return;
  fs.copyFileSync(src, dest);
  console.log("Wrote content/pages/home.md");
}

function main() {
  console.log("Grav root:", GRAV_ROOT);
  ensureDir(path.join(APP_ROOT, "content", "shows"));
  ensureDir(path.join(APP_ROOT, "content", "blog"));
  ensureDir(path.join(APP_ROOT, "content", "categories"));
  const shows = copyDirMd(path.join(PAGES, "01.shows"), path.join(APP_ROOT, "content", "shows"));
  console.log("Shows:", shows);

  const blogRoot = path.join(PAGES, "05.blog");
  if (fs.existsSync(blogRoot)) {
    let blog = 0;
    for (const ent of fs.readdirSync(blogRoot, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      if (ent.name.startsWith(".")) continue;
      const folder = ent.name;
      const from = path.join(blogRoot, folder, "default.md");
      if (!fs.existsSync(from)) continue;
      const dest = path.join(APP_ROOT, "content", "blog", `${folder}.md`);
      fs.copyFileSync(from, dest);
      blog++;
    }
    console.log("Blog posts:", blog);
  }

  const cats = copyDirMd(path.join(PAGES, "02.categories"), path.join(APP_ROOT, "content", "categories"));
  console.log("Categories:", cats);

  writeHome();

  console.log("Done.");
}

main();
