#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const UI_DIR = path.join(ROOT, "src/components/ui");
const SRC_DIR = path.join(ROOT, "src");

const exts = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir) {
  const result = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") {
      continue;
    }

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...walk(full));
    } else if (exts.has(path.extname(entry.name))) {
      result.push(full);
    }
  }

  return result;
}

const componentFiles = fs
  .readdirSync(UI_DIR)
  .filter((file) => exts.has(path.extname(file)))
  .map((file) => ({
    file,
    name: path.basename(file, path.extname(file)),
  }));

const sourceFiles = walk(SRC_DIR);

const imports = sourceFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");

const used = [];
const unused = [];

for (const component of componentFiles) {
  const patterns = [
    `@/components/ui/${component.name}`,
    `components/ui/${component.name}`,
    `./${component.name}`,
    `../${component.name}`,
  ];

  if (patterns.some((p) => imports.includes(p))) {
    used.push(component.name);
  } else {
    unused.push(component.name);
  }
}

used.sort();
unused.sort();

console.log("\nUsed UI components");
console.log("------------------");
used.forEach((c) => console.log(`✓ ${c}`));

console.log("\nUnused UI components");
console.log("--------------------");
unused.forEach((c) => console.log(`✗ ${c}`));

console.log(`\nSummary: ${used.length} used, ${unused.length} unused`);
