#!/usr/bin/env node
// Read-only checks on specs/: the next spec number, each spec's status, and the line formats of one spec.md.
// Shared by every think-spec skill: call it as node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.mjs".
// Zero dependencies, Node >= 18. Prints JSON on stdout; errors go to stderr with exit 1 (usage: 2).
//
//   node spec.mjs status [--root DIR]
//   node spec.mjs check  <NNN-short-name> [--root DIR]
//
// "errors" and "warnings" are data for the skill (formats in CONVENTIONS.md), so the exit code stays 0.
// Checks are language-neutral: they read IDs, tags and frontmatter, never translated headings.

import fs from 'node:fs';
import path from 'node:path';

const KEYS = ['id', 'title', 'status', 'constitution_version', 'created', 'updated'];
const OPTIONAL_KEYS = ['supersedes']; // the spec this one replaces whole (written by specify on a maintain rewrite)
const STATUSES = ['draft', 'approved', 'active', 'closed', 'superseded'];
const IN_PROGRESS = new Set(['draft', 'approved', 'active']);
const EARS = ['ubiquitous', 'event', 'state', 'unwanted', 'optional', 'complex'];
const MOSCOW = ['must', 'should', 'could', 'wont'];
const ISO25010 = ['functional-suitability', 'performance-efficiency', 'compatibility', 'interaction-capability',
  'reliability', 'security', 'maintainability', 'flexibility', 'safety'];
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SPEC_DIR = /^(\d{3})-[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const MAX_CLARIFY = 3;

class UsageError extends Error {}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  let root = process.cwd();
  const positional = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--root') {
      if (!rest[i + 1]) throw new UsageError('--root needs a directory');
      root = rest[++i];
    } else positional.push(rest[i]);
  }
  if (command === 'status' && positional.length === 0) { /* ok */ }
  else if (command === 'check' && positional.length === 1) { /* ok */ }
  else throw new UsageError('usage: spec.mjs status [--root DIR] | spec.mjs check <NNN-short-name> [--root DIR]');
  root = path.resolve(root);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`root is not a directory: ${root}`);
  return { command, root, id: positional[0] };
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

function specDirs(root) {
  const dir = path.join(root, 'specs');
  if (!fs.existsSync(dir)) return null;
  return fs.readdirSync(dir)
    .filter((name) => /^\d{3}-/.test(name) && fs.statSync(path.join(dir, name)).isDirectory())
    .sort();
}

function status(root) {
  const dirs = specDirs(root);
  const errors = [];
  if (!dirs) return { root, specsDir: false, next: '001', specs: [], active: [], inProgress: [], errors };
  const specs = dirs.map((id) => {
    const lines = readLines(path.join(root, 'specs', id, 'spec.md'));
    const fm = lines && frontmatter(lines);
    return { id, spec: !!lines, status: fm?.data.status ?? null, title: fm?.data.title ?? null, supersedes: fm?.data.supersedes ?? null };
  });
  const numbers = dirs.map((id) => Number(id.slice(0, 3)));
  const seen = new Set();
  for (const [i, n] of numbers.entries()) {
    if (seen.has(n)) errors.push(`number ${dirs[i].slice(0, 3)} is used by more than one folder`);
    seen.add(n);
  }
  const active = specs.filter((s) => s.status === 'active').map((s) => s.id);
  if (active.length > 1) errors.push(`${active.length} specs have status: active; at most one may`);
  for (const s of specs) {
    if (!s.spec) errors.push(`${s.id}: folder without spec.md`);
    else if (!STATUSES.includes(s.status)) errors.push(`${s.id}: invalid or missing status "${s.status ?? ''}"`);
  }
  return {
    root,
    specsDir: true,
    next: String((numbers.length ? Math.max(...numbers) : 0) + 1).padStart(3, '0'),
    specs,
    active,
    inProgress: specs.filter((s) => IN_PROGRESS.has(s.status)).map((s) => s.id),
    errors,
  };
}

function check(root, id) {
  if (!SPEC_DIR.test(id)) throw new UsageError(`"${id}" is not NNN-short-name`);
  const rel = `specs/${id}/spec.md`;
  const lines = readLines(path.join(root, 'specs', id, 'spec.md'));
  if (!lines) throw new Error(`${rel} not found`);
  const errors = [];
  const warnings = [];

  const fm = frontmatter(lines);
  const meta = {};
  if (!fm) errors.push(`no frontmatter (--- block with ${KEYS.join(', ')})`);
  else {
    for (const key of KEYS) {
      const value = fm.data[key];
      meta[key] = value ?? null;
      if (value === undefined || value === '') errors.push(`frontmatter: missing ${key}`);
    }
    for (const key of Object.keys(fm.data)) if (!KEYS.includes(key) && !OPTIONAL_KEYS.includes(key)) errors.push(`frontmatter: unknown key ${key}`);
    const sup = fm.data.supersedes;
    if (sup !== undefined) {
      meta.supersedes = sup;
      if (!SPEC_DIR.test(sup)) errors.push(`frontmatter: invalid supersedes "${sup}" (NNN-short-name)`);
      else if (sup === id) errors.push('frontmatter: a spec cannot supersede itself');
      else {
        const target = readLines(path.join(root, 'specs', sup, 'spec.md'));
        if (!target) errors.push(`frontmatter: supersedes ${sup}, which has no specs/${sup}/spec.md`);
        else if (frontmatter(target)?.data.status !== 'superseded') warnings.push(`supersedes ${sup}, whose status is not superseded`);
      }
    }
    if (meta.id && meta.id !== id) errors.push(`frontmatter: id "${meta.id}" does not match the folder ${id}`);
    if (meta.status && !STATUSES.includes(meta.status)) errors.push(`frontmatter: invalid status "${meta.status}" (${STATUSES.join(' | ')})`);
    if (meta.constitution_version && meta.constitution_version !== 'none' && !SEMVER.test(meta.constitution_version)) {
      errors.push(`frontmatter: invalid constitution_version "${meta.constitution_version}" (semver or none)`);
    }
    for (const key of ['created', 'updated']) {
      if (meta[key] && !DATE.test(meta[key])) errors.push(`frontmatter: invalid ${key}="${meta[key]}" (YYYY-MM-DD)`);
    }
    if (DATE.test(meta.created ?? '') && DATE.test(meta.updated ?? '') && meta.updated < meta.created) {
      errors.push('frontmatter: updated is earlier than created');
    }
  }

  const start = fm ? fm.end + 1 : 0;
  const body = lines.slice(start);
  if (!body.find((line) => line.trim() !== '')?.startsWith('# ')) errors.push('no "# " title line after the frontmatter');

  const ids = { US: [], FR: [], NFR: [], AC: [] };
  const frs = new Map(); // FR id -> moscow
  const acLinks = []; // [ac id, [fr ids], line number]
  let clarify = 0;
  let fence = false;
  body.forEach((line, i) => {
    const n = start + i + 1;
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) return;
    if (line.includes('{{')) errors.push(`line ${n}: unfilled {{…}} placeholder`);
    clarify += (line.match(/\[CLARIFY/g) ?? []).length;

    const bare = line.match(/^\s*(US|FR|NFR|AC)-\d+\b/);
    if (bare) { errors.push(`line ${n}: ${bare[1]} line must be a bullet ("- ${line.trim()}")`); return; }
    const item = line.match(/^\s*[-*]\s+(US|FR|NFR|AC)-(\d+)\b(.*)$/);
    if (!item) return;
    const [, type, num, rest] = item;
    const ref = `${type}-${num}`;
    if (num.length !== 3) { errors.push(`line ${n}: ${ref} must be zero-padded to 3 digits`); return; }
    if (ids[type].includes(ref)) errors.push(`line ${n}: ${ref} is defined twice`);
    ids[type].push(ref);

    if (type === 'FR' || type === 'NFR') {
      const m = rest.match(/^ \[([^\]]+)\] \[([^\]]+)\] (\S.*)$/);
      if (!m) { errors.push(`line ${n}: ${ref} must read "${ref} [${type === 'FR' ? 'ears-type' : 'iso-25010-category'}] [moscow] <sentence>"`); return; }
      const allowed = type === 'FR' ? EARS : ISO25010;
      if (!allowed.includes(m[1])) errors.push(`line ${n}: ${ref} has unknown ${type === 'FR' ? 'EARS type' : 'ISO 25010 category'} [${m[1]}] (${allowed.join(' | ')})`);
      if (!MOSCOW.includes(m[2])) errors.push(`line ${n}: ${ref} has unknown MoSCoW tag [${m[2]}] (${MOSCOW.join(' | ')})`);
      else if (m[2] === 'wont') warnings.push(`line ${n}: ${ref} is [wont]; exclusions belong in the out-of-scope section`);
      if (type === 'FR') frs.set(ref, m[2]);
    } else if (type === 'AC') {
      const m = rest.match(/^ \((FR-\d{3}(?:, ?FR-\d{3})*)\) (\S.*)$/);
      if (!m) { errors.push(`line ${n}: ${ref} must read "${ref} (FR-###) <Given> … <When> … <Then> …"`); return; }
      acLinks.push([ref, m[1].split(/, ?/), n]);
    } else if (!/^ \S/.test(rest)) {
      errors.push(`line ${n}: ${ref} has no text`);
    }
  });

  if (fence) warnings.push('a code fence is never closed; lines after it were not checked');
  if (ids.FR.length === 0) errors.push('no FR-### lines');
  for (const [ac, targets, n] of acLinks) {
    for (const fr of targets) if (!frs.has(fr)) errors.push(`line ${n}: ${ac} points to ${fr}, which does not exist`);
  }
  const covered = new Set(acLinks.flatMap(([, targets]) => targets));
  for (const [fr, moscow] of frs) if (moscow !== 'wont' && !covered.has(fr)) errors.push(`${fr} has no AC`);
  if (clarify > MAX_CLARIFY) errors.push(`${clarify} [CLARIFY] markers; a spec holds at most ${MAX_CLARIFY}`);
  if (clarify > 0 && meta.status && meta.status !== 'draft') errors.push(`status is ${meta.status} but ${clarify} [CLARIFY] marker(s) remain`);

  // Next free number per ID type, counting every mention (clarifications cite removed IDs), so a deleted ID is never reused.
  const next = {};
  for (const type of ['US', 'FR', 'NFR', 'AC']) {
    const nums = body.flatMap((line) => [...line.matchAll(new RegExp(`\\b${type}-(\\d{3})\\b`, 'g'))].map((m) => Number(m[1])));
    next[type] = `${type}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
  }

  return {
    root,
    file: rel,
    frontmatter: meta,
    counts: { US: ids.US.length, FR: ids.FR.length, NFR: ids.NFR.length, AC: ids.AC.length, CLARIFY: clarify },
    next,
    errors,
    warnings,
  };
}

try {
  const { command, root, id } = parseArgs(process.argv.slice(2));
  const out = command === 'status' ? status(root) : check(root, id);
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
} catch (err) {
  process.stderr.write(`spec: ${err.message}\n`);
  process.exit(err instanceof UsageError ? 2 : 1);
}
