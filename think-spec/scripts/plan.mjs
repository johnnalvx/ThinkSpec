#!/usr/bin/env node
// Read-only checks on one feature's plan.md and adr/ files against its spec.md.
// Shared by every think-spec skill: call it as node "${CLAUDE_PLUGIN_ROOT}/scripts/plan.mjs".
// Zero dependencies, Node >= 18. Prints JSON on stdout; errors go to stderr with exit 1 (usage: 2).
//
//   node plan.mjs check <NNN-short-name> [--root DIR]
//
// A missing plan.md is not an error: the result has "exists": false and the next ADR number.
// "errors" and "warnings" are data for the skill (formats in CONVENTIONS.md), so the exit code stays 0.
// Checks are language-neutral: they read IDs, tags and frontmatter, never translated headings.

import fs from 'node:fs';
import path from 'node:path';

const KEYS = ['spec', 'status', 'constitution_version', 'created', 'updated'];
const STATUSES = ['draft', 'approved'];
const ADR_KEYS = ['id', 'status', 'date'];
const ADR_STATUSES = ['accepted', 'superseded'];
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SPEC_DIR = /^(\d{3})-[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const ADR_FILE = /^(ADR-\d{3})-[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*\.md$/u;
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
  if (command !== 'check' || positional.length !== 1) throw new UsageError('usage: plan.mjs check <NNN-short-name> [--root DIR]');
  if (!SPEC_DIR.test(positional[0])) throw new UsageError(`"${positional[0]}" is not NNN-short-name`);
  root = path.resolve(root);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`root is not a directory: ${root}`);
  return { root, id: positional[0] };
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

// FR/NFR IDs defined in spec.md (bullet lines) with their MoSCoW tag, plus every defined ID.
function specIds(lines) {
  const reqs = new Map();
  const all = new Set();
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s+((US|FR|NFR|AC)-\d{3})\b(?: \[[^\]]+\] \[([^\]]+)\])?/);
    if (!m) continue;
    all.add(m[1]);
    if (m[2] === 'FR' || m[2] === 'NFR') reqs.set(m[1], m[3] ?? null);
  }
  return { reqs, all };
}

function checkAdrs(dir, errors, warnings) {
  const adrs = new Map(); // ADR id -> { file, status }
  if (!fs.existsSync(dir)) return adrs;
  for (const name of fs.readdirSync(dir).sort()) {
    const rel = `adr/${name}`;
    const m = name.match(ADR_FILE);
    if (!m) { errors.push(`${rel}: file name must be ADR-NNN-short-title.md`); continue; }
    const lines = readLines(path.join(dir, name));
    const fm = frontmatter(lines);
    if (!fm) { errors.push(`${rel}: no frontmatter (--- block with ${ADR_KEYS.join(', ')})`); continue; }
    for (const key of ADR_KEYS) if (!fm.data[key]) errors.push(`${rel}: frontmatter: missing ${key}`);
    for (const key of Object.keys(fm.data)) if (!ADR_KEYS.includes(key)) errors.push(`${rel}: frontmatter: unknown key ${key}`);
    if (fm.data.id && fm.data.id !== m[1]) errors.push(`${rel}: frontmatter id "${fm.data.id}" does not match the file name`);
    if (fm.data.status && !ADR_STATUSES.includes(fm.data.status)) errors.push(`${rel}: invalid status "${fm.data.status}" (${ADR_STATUSES.join(' | ')})`);
    if (fm.data.date && !DATE.test(fm.data.date)) errors.push(`${rel}: invalid date "${fm.data.date}" (YYYY-MM-DD)`);
    if (lines.slice(fm.end + 1).some((line) => line.includes('{{'))) errors.push(`${rel}: unfilled {{…}} placeholder`);
    if (adrs.has(m[1])) errors.push(`${m[1]} is used by more than one file`);
    adrs.set(m[1], { file: rel, status: fm.data.status ?? null });
  }
  if (adrs.size === 0) warnings.push('adr/ exists but holds no ADR files');
  return adrs;
}

function check(root, id) {
  const featureDir = path.join(root, 'specs', id);
  const specLines = readLines(path.join(featureDir, 'spec.md'));
  if (!specLines) throw new Error(`specs/${id}/spec.md not found`);
  const specStatus = frontmatter(specLines)?.data.status ?? null;
  const { reqs, all } = specIds(specLines);

  const errors = [];
  const warnings = [];
  const adrs = checkAdrs(path.join(featureDir, 'adr'), errors, warnings);
  const nextAdr = 'ADR-' + String((adrs.size ? Math.max(...[...adrs.keys()].map((a) => Number(a.slice(4)))) : 0) + 1).padStart(3, '0');

  const rel = `specs/${id}/plan.md`;
  const lines = readLines(path.join(featureDir, 'plan.md'));
  if (!lines) return { root, file: rel, exists: false, specStatus, nextAdr, adrs: Object.fromEntries(adrs), errors, warnings };

  const fm = frontmatter(lines);
  const meta = {};
  if (!fm) errors.push(`no frontmatter (--- block with ${KEYS.join(', ')})`);
  else {
    for (const key of KEYS) {
      meta[key] = fm.data[key] ?? null;
      if (!fm.data[key]) errors.push(`frontmatter: missing ${key}`);
    }
    for (const key of Object.keys(fm.data)) if (!KEYS.includes(key)) errors.push(`frontmatter: unknown key ${key}`);
    if (meta.spec && meta.spec !== id) errors.push(`frontmatter: spec "${meta.spec}" does not match the folder ${id}`);
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

  const cited = new Set();
  const citedAdrs = new Set();
  let clarify = 0;
  let fence = false;
  body.forEach((line, i) => {
    const n = start + i + 1;
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
    for (const [ref] of line.matchAll(/\b(?:US|FR|NFR|AC)-\d{3}\b/g)) {
      cited.add(ref);
      if (!all.has(ref)) errors.push(`line ${n}: ${ref} does not exist in spec.md`);
    }
    for (const [ref] of line.matchAll(/\bADR-\d{3}\b/g)) {
      citedAdrs.add(ref);
      if (!adrs.has(ref)) errors.push(`line ${n}: ${ref} has no file in adr/`);
    }
    if (/\b(?:FR|NFR|AC)-\d{3}\s*(?:…|\.\.\.?|–|—|-)\s*(?:(?:FR|NFR|AC)-)?\d{3}\b/.test(line)) {
      warnings.push(`line ${n}: ID range; cite each ID, the IDs inside a range count as uncited`);
    }
    if (fence) return;
    if (line.includes('{{')) errors.push(`line ${n}: unfilled {{…}} placeholder`);
    clarify += (line.match(/\[CLARIFY/g) ?? []).length;
  });
  if (fence) warnings.push('a code fence is never closed');

  const uncovered = [...reqs].filter(([ref, moscow]) => moscow !== 'wont' && !cited.has(ref)).map(([ref]) => ref);
  for (const ref of uncovered) errors.push(`${ref} has no home in the plan (cited nowhere)`);
  for (const [ref, adr] of adrs) if (!citedAdrs.has(ref)) warnings.push(`${adr.file} is not cited in plan.md`);
  if (clarify > MAX_CLARIFY) errors.push(`${clarify} [CLARIFY] markers; a plan holds at most ${MAX_CLARIFY}`);
  if (clarify > 0 && meta.status === 'approved') errors.push(`status is approved but ${clarify} [CLARIFY] marker(s) remain`);
  if (!['approved', 'active', 'closed', 'superseded'].includes(specStatus)) warnings.push(`spec status is ${specStatus}; a plan is written only on an approved spec`);
  const specUpdated = frontmatter(specLines)?.data.updated;
  if (DATE.test(specUpdated ?? '') && DATE.test(meta.updated ?? '') && specUpdated > meta.updated) {
    warnings.push(`spec.md was updated (${specUpdated}) after the plan (${meta.updated}); review the plan against it`);
  }

  const count = (type) => [...reqs.keys()].filter((r) => r.startsWith(type + '-'));
  return {
    root,
    file: rel,
    exists: true,
    frontmatter: meta,
    specStatus,
    counts: {
      FR: count('FR').length, FRcited: count('FR').filter((r) => cited.has(r)).length,
      NFR: count('NFR').length, NFRcited: count('NFR').filter((r) => cited.has(r)).length,
      ADR: adrs.size, CLARIFY: clarify,
    },
    uncovered,
    nextAdr,
    adrs: Object.fromEntries(adrs),
    errors,
    warnings,
  };
}

try {
  const { root, id } = parseArgs(process.argv.slice(2));
  process.stdout.write(JSON.stringify(check(root, id), null, 2) + '\n');
} catch (err) {
  process.stderr.write(`plan: ${err.message}\n`);
  process.exit(err instanceof UsageError ? 2 : 1);
}
