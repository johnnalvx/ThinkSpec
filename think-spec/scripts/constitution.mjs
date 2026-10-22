#!/usr/bin/env node
// Read-only checks on docs/constitution.md and on the constitution version each spec records.
// Shared by every think-spec skill: call it as node "${CLAUDE_PLUGIN_ROOT}/scripts/constitution.mjs".
// Zero dependencies, Node >= 18. Prints JSON on stdout; errors go to stderr with exit 1 (usage: 2).
//
//   node constitution.mjs status [--root DIR]
//
// "errors" lists every way the constitution breaks the contract in CONVENTIONS.md (frontmatter,
// 15-line cap, leftover markers); it is data for the skill, so the exit code stays 0.

import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join('docs', 'constitution.md');
const MAX_CONTENT_LINES = 15;
const KEYS = ['version', 'ratified', 'amended'];
const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PRINCIPLE = /^\d+\.\s+\*\*/;
const MARKERS = [['[CLARIFY', 'an open [CLARIFY] marker'], ['{{', 'an unfilled {{…}} placeholder'], ['TODO(', 'a TODO( marker']];
const CLOSED = new Set(['closed', 'superseded']);

class UsageError extends Error {}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  let root = process.cwd();
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--root' && rest[i + 1]) root = rest[++i];
    else throw new UsageError(`unexpected argument "${rest[i]}"`);
  }
  if (command !== 'status') throw new UsageError('usage: constitution.mjs status [--root DIR]');
  root = path.resolve(root);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`root is not a directory: ${root}`);
  return { root };
}

function readLines(file) {
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
}

// Flat "key: value" frontmatter between the first two --- lines; null when there is none.
function frontmatter(lines) {
  if (lines[0]?.trim() !== '---') return null;
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
  if (end < 0) return null;
  const data = {};
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*?)\s*$/);
    if (m) data[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return { data, end };
}

function semver(v) {
  const m = SEMVER.exec(v ?? '');
  return m ? m.slice(1, 4).map(Number) : null;
}

function constitution(root) {
  const lines = readLines(path.join(root, FILE));
  if (!lines) return { exists: false };
  const errors = [];
  const fm = frontmatter(lines);
  const meta = {};
  if (!fm) errors.push('no frontmatter (--- block with version, ratified, amended)');
  else {
    for (const key of KEYS) {
      const value = fm.data[key];
      meta[key] = value ?? null;
      if (value === undefined) errors.push(`frontmatter: missing ${key}`);
      else if (key === 'version' ? !semver(value) : !DATE.test(value)) {
        errors.push(`frontmatter: invalid ${key}="${value}" (expected ${key === 'version' ? 'semver' : 'YYYY-MM-DD'})`);
      }
    }
    for (const key of Object.keys(fm.data)) if (!KEYS.includes(key)) errors.push(`frontmatter: unknown key ${key}`);
    if (DATE.test(meta.ratified ?? '') && DATE.test(meta.amended ?? '') && meta.amended < meta.ratified) {
      errors.push('frontmatter: amended is earlier than ratified');
    }
  }

  const body = lines.slice(fm ? fm.end + 1 : 0);
  const content = body.filter((line) => line.trim() !== '');
  if (content[0]?.startsWith('# ')) content.shift(); // the title does not count
  else errors.push('no "# " title line after the frontmatter');
  if (content.length > MAX_CONTENT_LINES) errors.push(`${content.length} content lines; the cap is ${MAX_CONTENT_LINES}`);
  const principles = content.filter((line) => PRINCIPLE.test(line)).length;
  if (principles === 0) errors.push('no numbered principle lines ("1. **Name:** rule")');
  for (const [marker, label] of MARKERS) {
    const count = body.filter((line) => line.includes(marker)).length;
    if (count) errors.push(`${count} line(s) with ${label}`);
  }
  return { exists: true, ...meta, contentLines: content.length, maxContentLines: MAX_CONTENT_LINES, principles, errors };
}

// stale: the spec is still open and was written under an older MAJOR.MINOR; null when it records no version.
function specs(root, current) {
  const dir = path.join(root, 'specs');
  if (!fs.existsSync(dir)) return [];
  const cur = semver(current);
  return fs.readdirSync(dir)
    .filter((name) => /^\d{3}-/.test(name) && fs.existsSync(path.join(dir, name, 'spec.md')))
    .sort()
    .map((id) => {
      const fm = frontmatter(readLines(path.join(dir, id, 'spec.md')));
      const status = fm?.data.status ?? null;
      const recorded = fm?.data.constitution_version ?? null;
      const rec = semver(recorded);
      let stale = null;
      if (CLOSED.has(status)) stale = false;
      else if (rec && cur) stale = rec[0] < cur[0] || (rec[0] === cur[0] && rec[1] < cur[1]);
      return { id, status, constitution_version: recorded, stale };
    });
}

try {
  const { root } = parseArgs(process.argv.slice(2));
  const c = constitution(root);
  const list = specs(root, c.version);
  const out = {
    root,
    file: FILE.replace(/\\/g, '/'),
    constitution: c,
    specs: list,
    staleSpecs: list.filter((s) => s.stale).map((s) => s.id),
    unversionedSpecs: list.filter((s) => !CLOSED.has(s.status) && !semver(s.constitution_version)).map((s) => s.id),
  };
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
} catch (err) {
  process.stderr.write(`constitution: ${err.message}\n`);
  process.exit(err instanceof UsageError ? 2 : 1);
}
