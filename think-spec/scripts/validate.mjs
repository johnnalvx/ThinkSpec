#!/usr/bin/env node
// Lints every think-spec artifact of a project in one run and prints one JSON report.
// Shared by the validate skill and the optional hook: call it as node "${CLAUDE_PLUGIN_ROOT}/scripts/validate.mjs".
// Zero dependencies, Node >= 18. Prints JSON on stdout; errors go to stderr with exit 1 (usage: 2).
//
//   node validate.mjs check [NNN-short-name] [--root DIR]
//
// It runs the other shared scripts as subprocesses (agent-context status, constitution status, spec status, and
// spec / plan / tasks check per spec) and merges their errors and warnings, each tagged with its file, so every rule
// lives in one script. Its own checks: a feature whose tasks are all done has an evidence cell in every
// traceability row, and validation.md follows its contract. With an ID, the per-spec checks run on that spec only.
// "ok" is false when any error remains; errors are data, so the exit code stays 0.
// Checks are language-neutral: they read IDs, dates, counts and frontmatter, never translated words.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SPEC_DIR = /^(\d{3})-[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const VALIDATION_KEYS = ['spec', 'verdict', 'validated'];
const VERDICTS = ['pass', 'fail'];

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
  if (command !== 'check' || positional.length > 1) throw new UsageError('usage: validate.mjs check [NNN-short-name] [--root DIR]');
  if (positional[0] && !SPEC_DIR.test(positional[0])) throw new UsageError(`"${positional[0]}" is not NNN-short-name`);
  root = path.resolve(root);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`root is not a directory: ${root}`);
  return { root, id: positional[0] ?? null };
}

// Runs a sibling script and returns its parsed JSON, or { failed: <stderr line> }.
function run(script, args, root) {
  const res = spawnSync(process.execPath, [path.join(HERE, script), ...args, '--root', root], { encoding: 'utf8' });
  if (res.status !== 0) return { failed: (res.stderr || res.error?.message || `exit ${res.status}`).trim() };
  try { return JSON.parse(res.stdout); } catch { return { failed: `${script} printed no JSON` }; }
}

function readLines(file) {
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/);
}

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

// Evidence is complete when the cell holds a date, and any "(passing/total)" count is all-passing.
function evidenceProblem(cell) {
  if (!/\b\d{4}-\d{2}-\d{2}\b/.test(cell ?? '')) return 'has no evidence (a dated result)';
  const count = cell.match(/\((\d+)\s*\/\s*(\d+)\)/);
  if (count && count[1] !== count[2]) return `records ${count[1]}/${count[2]} passing`;
  return null;
}

function checkTrace(file, rel, err) {
  const lines = readLines(file);
  if (!lines) return;
  for (const line of lines) {
    const m = line.match(/^\s*\|\s*((?:FR|NFR)-\d{3})\s*\|(.*)\|\s*$/);
    if (!m) continue;
    const cells = m[2].split('|').map((c) => c.trim());
    const problem = evidenceProblem(cells[3]);
    if (problem) err(rel, `${m[1]} ${problem}; every task is done`);
  }
}

function checkValidation(file, rel, id, err) {
  const lines = readLines(file);
  if (!lines) return null;
  const fm = frontmatter(lines);
  if (!fm) { err(rel, `no frontmatter (--- block with ${VALIDATION_KEYS.join(', ')})`); return null; }
  const meta = {};
  for (const key of VALIDATION_KEYS) {
    meta[key] = fm.data[key] ?? null;
    if (!fm.data[key]) err(rel, `frontmatter: missing ${key}`);
  }
  for (const key of Object.keys(fm.data)) if (!VALIDATION_KEYS.includes(key)) err(rel, `frontmatter: unknown key ${key}`);
  if (meta.spec && meta.spec !== id) err(rel, `frontmatter: spec "${meta.spec}" does not match the folder ${id}`);
  if (meta.verdict && !VERDICTS.includes(meta.verdict)) err(rel, `frontmatter: invalid verdict "${meta.verdict}" (${VERDICTS.join(' | ')})`);
  if (meta.validated && !DATE.test(meta.validated)) err(rel, `frontmatter: invalid validated="${meta.validated}" (YYYY-MM-DD)`);
  const body = lines.slice(fm.end + 1);
  if (!body.find((line) => line.trim() !== '')?.startsWith('# ')) err(rel, 'no "# " title line after the frontmatter');
  body.forEach((line, i) => { if (line.includes('{{')) err(rel, `line ${fm.end + 2 + i}: unfilled {{…}} placeholder`); });
  return meta;
}

function check(root, only) {
  const errors = [];
  const warnings = [];
  const err = (file, message) => errors.push({ file, message });
  const warn = (file, message) => warnings.push({ file, message });
  const merge = (file, result) => {
    if (result.failed) { err(file, result.failed); return false; }
    for (const m of result.errors ?? []) err(file, m);
    for (const m of result.warnings ?? []) warn(file, m);
    return true;
  };

  const ctx = run('agent-context.mjs', ['status'], root);
  if (ctx.failed) err('AGENTS.md', ctx.failed);
  else if (!ctx.agentsMd.exists) err('AGENTS.md', 'not found; /think-spec:init writes it');
  else {
    for (const k of ctx.agentsMd.missing) err('AGENTS.md', `state key ${k} is missing`);
    for (const k of ctx.agentsMd.duplicates) err('AGENTS.md', `state key ${k} appears more than once`);
    for (const k of ctx.agentsMd.invalid) err('AGENTS.md', `state key ${k} has an invalid value`);
    for (const k of ctx.agentsMd.unknown) warn('AGENTS.md', `unknown state key ${k}`);
  }

  const con = run('constitution.mjs', ['status'], root);
  if (con.failed) err('docs/constitution.md', con.failed);
  else {
    if (con.constitution.exists) merge('docs/constitution.md', con.constitution);
    for (const s of con.staleSpecs) warn(`specs/${s}/spec.md`, 'written under an older constitution (stale)');
  }

  const status = run('spec.mjs', ['status'], root);
  if (!merge('specs/', status)) return { root, ok: false, scope: only, errors, warnings, specs: [] };

  const activeSpec = ctx.agentsMd?.keys?.['active-spec'];
  if (typeof activeSpec === 'string' && activeSpec !== 'none' && !status.specs.some((s) => s.id === activeSpec)) {
    err('AGENTS.md', `active-spec ${activeSpec} has no folder in specs/`);
  }

  const ids = status.specs.filter((s) => s.spec).map((s) => s.id);
  if (only && !ids.includes(only)) throw new Error(`specs/${only}/spec.md not found`);
  const report = [];
  for (const id of only ? [only] : ids) {
    const dir = path.join(root, 'specs', id);
    const rel = (name) => `specs/${id}/${name}`;
    const spec = run('spec.mjs', ['check', id], root);
    merge(rel('spec.md'), spec);
    const specStatus = spec.frontmatter?.status ?? status.specs.find((s) => s.id === id)?.status ?? null;
    const entry = { id, status: specStatus, plan: null, tasks: null, done: null, total: null, validation: null };

    if (fs.existsSync(path.join(dir, 'plan.md'))) {
      const plan = run('plan.mjs', ['check', id], root);
      merge(rel('plan.md'), plan);
      entry.plan = plan.frontmatter?.status ?? null;
    }
    if (fs.existsSync(path.join(dir, 'tasks.md'))) {
      const tasks = run('tasks.mjs', ['check', id], root);
      if (merge(rel('tasks.md'), tasks)) {
        entry.tasks = tasks.frontmatter?.status ?? null;
        entry.done = tasks.counts.done;
        entry.total = tasks.counts.T;
        if (tasks.counts.T > 0 && tasks.nextOpen === null) checkTrace(path.join(dir, 'traceability.md'), rel('traceability.md'), err);
      }
    }
    const validation = checkValidation(path.join(dir, 'validation.md'), rel('validation.md'), id, err);
    entry.validation = validation?.verdict ?? null;
    if (specStatus === 'closed') {
      if (!validation) err(rel('spec.md'), 'status is closed but validation.md does not exist');
      else if (validation.verdict !== 'pass') err(rel('spec.md'), `status is closed but validation.md says verdict ${validation.verdict}`);
      if (entry.total !== null && entry.done !== entry.total) err(rel('spec.md'), `status is closed but ${entry.total - entry.done} task(s) are open`);
    }
    report.push(entry);
  }
  return { root, ok: errors.length === 0, scope: only, errors, warnings, specs: report };
}

try {
  const { root, id } = parseArgs(process.argv.slice(2));
  process.stdout.write(JSON.stringify(check(root, id), null, 2) + '\n');
} catch (err) {
  process.stderr.write(`validate: ${err.message}\n`);
  process.exit(err instanceof UsageError ? 2 : 1);
}
