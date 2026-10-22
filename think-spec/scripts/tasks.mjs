#!/usr/bin/env node
// Read-only checks on one feature's tasks.md and traceability.md against its spec.md and plan.md.
// Shared by every think-spec skill: call it as node "${CLAUDE_PLUGIN_ROOT}/scripts/tasks.mjs".
// Zero dependencies, Node >= 18. Prints JSON on stdout; errors go to stderr with exit 1 (usage: 2).
//
//   node tasks.mjs check <NNN-short-name> [--root DIR]
//
// A missing tasks.md is not an error: the result has "exists": false, the plan's status and the next task ID.
// "matrix" is the traceability computed from tasks.md (one row per FR/NFR), so the skill can write traceability.md.
// "tasks" lists every task in file order with its phase (the n-th "## " section holding tasks) and checkbox;
// "nextOpen" is the first unchecked task (null when all are done), where implement resumes.
// "errors" and "warnings" are data for the skill (formats in CONVENTIONS.md), so the exit code stays 0.
// Checks are language-neutral: they read IDs, tags, paths and frontmatter, never translated headings or labels.

import fs from 'node:fs';
import path from 'node:path';

const KEYS = ['spec', 'status', 'created', 'updated'];
const STATUSES = ['draft', 'approved'];
const TRACE_KEYS = ['spec', 'updated'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SPEC_DIR = /^(\d{3})-[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const MAX_CLARIFY = 3;
const MAX_TASKS = 40;
const TASK = /^\s*[-*]\s+\[([ xX])\]\s+(T-\d+)\b(.*)$/;
const TASK_BODY = /^ (\[test\] )?(\[P\] )?\(([^)]*)\) (.+) — (\S.*)$/; // the path follows the last " — "
const DEP = /^\s*[-*]\s+(T-\d{3})\s*(?:←|<-)\s*(T-\d{3}(?:\s*,\s*T-\d{3})*)\s*$/;
const STRUCTURE = /^\s*[-*]\s+`([^`]+)`\s*(?:→|->)/;

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
  if (command !== 'check' || positional.length !== 1) throw new UsageError('usage: tasks.mjs check <NNN-short-name> [--root DIR]');
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

function checkFrontmatter(fm, keys, id, errors, prefix = '') {
  const meta = {};
  if (!fm) { errors.push(`${prefix}no frontmatter (--- block with ${keys.join(', ')})`); return meta; }
  for (const key of keys) {
    meta[key] = fm.data[key] ?? null;
    if (!fm.data[key]) errors.push(`${prefix}frontmatter: missing ${key}`);
  }
  for (const key of Object.keys(fm.data)) if (!keys.includes(key)) errors.push(`${prefix}frontmatter: unknown key ${key}`);
  if (meta.spec && meta.spec !== id) errors.push(`${prefix}frontmatter: spec "${meta.spec}" does not match the folder ${id}`);
  for (const key of ['created', 'updated']) {
    if (meta[key] && !DATE.test(meta[key])) errors.push(`${prefix}frontmatter: invalid ${key}="${meta[key]}" (YYYY-MM-DD)`);
  }
  if (DATE.test(meta.created ?? '') && DATE.test(meta.updated ?? '') && meta.updated < meta.created) {
    errors.push(`${prefix}frontmatter: updated is earlier than created`);
  }
  return meta;
}

// Requirements of spec.md: FR/NFR with their MoSCoW tag, AC with the FRs they test, and every defined ID.
function specModel(lines) {
  const reqs = new Map(); // FR/NFR -> moscow
  const acs = new Map(); // AC -> [FR]
  const all = new Set();
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s+((US|FR|NFR|AC)-\d{3})\b(.*)$/);
    if (!m) continue;
    all.add(m[1]);
    if (m[2] === 'FR' || m[2] === 'NFR') reqs.set(m[1], m[3].match(/^ \[[^\]]+\] \[([^\]]+)\]/)?.[1] ?? null);
    if (m[2] === 'AC') acs.set(m[1], (m[3].match(/^ \(([^)]*)\)/)?.[1] ?? '').split(/\s*,\s*/).filter(Boolean));
  }
  return { reqs, acs, all };
}

// Paths of the plan's structure lines ("- `path` → responsibility (IDs)"). The structure section is the
// "## " section holding the first such line (it precedes data model and contract in the plan's order),
// so contract bullets of the same shape are not read as paths.
function planModel(lines) {
  if (!lines) return { exists: false, status: null, updated: null, structure: [] };
  const fm = frontmatter(lines);
  const first = lines.findIndex((line) => STRUCTURE.test(line));
  const structure = [];
  for (let i = first; first >= 0 && i < lines.length && !(i > first && /^##\s/.test(lines[i])); i++) {
    const m = lines[i].match(STRUCTURE);
    if (m) structure.push(m[1]);
  }
  return { exists: true, status: fm?.data.status ?? null, updated: fm?.data.updated ?? null, structure };
}

const norm = (p) => p.replace(/^`|`$/g, '').replace(/\\/g, '/').replace(/^\.\//, '');
const under = (file, dir) => file === dir || file.startsWith(dir.endsWith('/') ? dir : dir + '/');

function parseTasks(lines, start, spec, errors, warnings) {
  const tasks = [];
  const deps = [];
  const seen = new Set();
  let section = 0;
  let heading = '';
  let clarify = 0;
  let fence = false;
  const body = lines.slice(start);
  body.forEach((line, i) => {
    const n = start + i + 1;
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
    if (fence) return;
    if (line.includes('{{')) errors.push(`line ${n}: unfilled {{…}} placeholder`);
    clarify += (line.match(/\[CLARIFY/g) ?? []).length;
    if (/^##\s/.test(line)) { section++; heading = line.replace(/^##\s+/, '').trim(); }
    for (const [ref] of line.matchAll(/\b(?:US|FR|NFR|AC)-\d{3}\b/g)) {
      if (!spec.all.has(ref)) errors.push(`line ${n}: ${ref} does not exist in spec.md`);
    }

    const dep = line.match(DEP);
    if (dep) { deps.push({ task: dep[1], on: dep[2].split(/\s*,\s*/), line: n }); return; }
    if (/^\s*(?:[-*]\s+)?T-\d+\b/.test(line)) { errors.push(`line ${n}: task line must start with a checkbox ("- [ ] T-###")`); return; }
    const t = line.match(TASK);
    if (!t) return;
    const [, box, ref, rest] = t;
    if (!/^T-\d{3}$/.test(ref)) { errors.push(`line ${n}: ${ref} must be zero-padded to 3 digits`); return; }
    if (seen.has(ref)) errors.push(`line ${n}: ${ref} is defined twice`);
    seen.add(ref);
    const m = rest.match(TASK_BODY);
    if (!m) { errors.push(`line ${n}: ${ref} must read "- [ ] ${ref} [test] [P] (FR-###, AC-###) <description> — <path>" ([test] and [P] optional)`); return; }
    const ids = m[3].split(/\s*,\s*/).filter(Boolean);
    for (const x of ids) if (!/^(?:FR|NFR|AC)-\d{3}$/.test(x)) errors.push(`line ${n}: ${ref} cites "${x}"; a task cites only FR, NFR and AC IDs`);
    if (!ids.some((x) => /^(?:FR|NFR)-/.test(x))) errors.push(`line ${n}: ${ref} cites no FR or NFR`);
    const next = lines[n] ?? '';
    const doneWhen = /^\s{2,}\S/.test(next) && !TASK.test(next);
    if (!doneWhen) errors.push(`line ${n}: ${ref} has no done-when sub-line (indented line right below it)`);
    tasks.push({
      id: ref, line: n, section, heading, done: box !== ' ', test: !!m[1], parallel: !!m[2], ids,
      description: m[4].trim(), path: norm(m[5].trim()),
    });
  });
  if (fence) warnings.push('a code fence is never closed; lines after it were not checked');
  return { tasks, deps, clarify };
}

// IDs a task covers: the FR/NFR it cites plus the FRs of the AC it cites.
function covers(task, spec) {
  const out = new Set();
  for (const x of task.ids) {
    if (x.startsWith('AC-')) for (const fr of spec.acs.get(x) ?? []) out.add(fr);
    else out.add(x);
  }
  return out;
}

function checkTasks(tasks, deps, spec, plan, errors, warnings) {
  const index = new Map(tasks.map((t, i) => [t.id, i]));
  const live = [...spec.reqs].filter(([, moscow]) => moscow !== 'wont').map(([ref]) => ref);

  for (const ref of live) if (!tasks.some((t) => covers(t, spec).has(ref))) errors.push(`${ref} has no task`);
  for (const ac of spec.acs.keys()) if (!tasks.some((t) => t.test && t.ids.includes(ac))) errors.push(`${ac} has no [test] task`);
  for (const ref of live.filter((r) => r.startsWith('NFR-'))) {
    if (!tasks.some((t) => t.test && t.ids.includes(ref))) errors.push(`${ref} has no [test] task`);
  }
  for (const [ref, moscow] of spec.reqs) {
    if (moscow === 'wont' && tasks.some((t) => t.ids.includes(ref))) warnings.push(`${ref} is [wont] but has a task`);
  }

  // Within a phase, the [test] tasks for an ID come before the code tasks that cover it.
  tasks.forEach((t, i) => {
    if (!t.test) return;
    const mine = covers(t, spec);
    const code = tasks.slice(0, i).find((c) => !c.test && c.section === t.section && [...covers(c, spec)].some((r) => mine.has(r)));
    if (code) errors.push(`${t.id} [test] comes after ${code.id}, which covers the same requirement in the same phase; tests go first`);
  });

  // Across phases (setup excepted, it only enables), code ahead of every [test] task for its requirement is suspect.
  const firstSection = tasks[0]?.section;
  for (const ref of live) {
    const code = tasks.find((t) => !t.test && t.section !== firstSection && covers(t, spec).has(ref));
    const test = tasks.find((t) => t.test && covers(t, spec).has(ref));
    if (code && test && index.get(code.id) < index.get(test.id) && code.section !== test.section) {
      warnings.push(`${code.id} covers ${ref} in an earlier phase than its first [test] task ${test.id}; move the test up or the code down`);
    }
  }

  for (let i = 1; i < tasks.length; i++) {
    const [a, b] = [tasks[i - 1], tasks[i]];
    if (a.parallel && b.parallel && a.path === b.path) errors.push(`${a.id} and ${b.id} are [P] next to each other but share ${a.path}`);
  }

  for (const d of deps) {
    if (!index.has(d.task)) { errors.push(`line ${d.line}: ${d.task} does not exist`); continue; }
    for (const on of d.on) {
      if (!index.has(on)) errors.push(`line ${d.line}: ${d.task} depends on ${on}, which does not exist`);
      else if (index.get(on) >= index.get(d.task)) errors.push(`line ${d.line}: ${d.task} depends on ${on}, which comes after it (or is itself); reorder the tasks`);
    }
  }

  if (plan.structure.length) {
    const paths = plan.structure.map(norm);
    for (const t of tasks) if (!paths.some((p) => under(t.path, p))) warnings.push(`${t.id}: ${t.path} is not in the plan's structure`);
    for (const p of paths) if (!tasks.some((t) => under(t.path, p))) warnings.push(`plan structure line ${p} has no task`);
  }
  if (tasks.length > MAX_TASKS) warnings.push(`${tasks.length} tasks; above ${MAX_TASKS}, consider splitting the spec`);
}

function matrixOf(tasks, spec) {
  return [...spec.reqs].filter(([, moscow]) => moscow !== 'wont').map(([ref]) => {
    const mine = tasks.filter((t) => covers(t, spec).has(ref)).sort((a, b) => a.id.localeCompare(b.id));
    return {
      id: ref,
      ac: [...spec.acs].filter(([, frs]) => frs.includes(ref)).map(([ac]) => ac),
      tasks: mine.map((t) => t.id),
      tests: [...new Set(mine.filter((t) => t.test).map((t) => t.path))],
    };
  });
}

function checkTrace(lines, id, matrix, errors, warnings) {
  if (!lines) { errors.push(`specs/${id}/traceability.md not found; tasks writes it with tasks.md`); return null; }
  const prefix = 'traceability.md: ';
  const meta = checkFrontmatter(frontmatter(lines), TRACE_KEYS, id, errors, prefix);
  const rows = new Map();
  for (const [i, line] of lines.entries()) {
    const m = line.match(/^\s*\|\s*((?:FR|NFR)-\d{3})\s*\|(.*)\|\s*$/);
    if (!m) continue;
    if (rows.has(m[1])) errors.push(`${prefix}line ${i + 1}: ${m[1]} has two rows`);
    rows.set(m[1], { cells: m[2].split('|').map((c) => c.trim()), line: i + 1 });
  }
  const ids = (cell, re) => (cell ?? '').match(re) ?? [];
  const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  for (const want of matrix) {
    const row = rows.get(want.id);
    if (!row) { errors.push(`${prefix}${want.id} has no row`); continue; }
    if (row.cells.length < 4) { errors.push(`${prefix}line ${row.line}: ${want.id} needs the columns ID | AC | Tasks | Test | Evidence`); continue; }
    const [ac, tk, test] = row.cells;
    if (!same(ids(ac, /\bAC-\d{3}\b/g), want.ac)) errors.push(`${prefix}${want.id} lists AC ${ids(ac, /\bAC-\d{3}\b/g).join(', ') || 'none'}; spec.md links ${want.ac.join(', ') || 'none'}`);
    if (!same(ids(tk, /\bT-\d{3}\b/g), want.tasks)) errors.push(`${prefix}${want.id} lists tasks ${ids(tk, /\bT-\d{3}\b/g).join(', ') || 'none'}; tasks.md has ${want.tasks.join(', ') || 'none'}`);
    for (const p of want.tests) if (!norm(test).includes(p)) warnings.push(`${prefix}${want.id}: test column lacks ${p}`);
  }
  for (const ref of rows.keys()) if (!matrix.some((r) => r.id === ref)) errors.push(`${prefix}${ref} has a row but is not a live FR/NFR of the spec`);
  return meta;
}

function check(root, id) {
  const featureDir = path.join(root, 'specs', id);
  const specLines = readLines(path.join(featureDir, 'spec.md'));
  if (!specLines) throw new Error(`specs/${id}/spec.md not found`);
  const spec = specModel(specLines);
  const specUpdated = frontmatter(specLines)?.data.updated ?? null;
  const plan = planModel(readLines(path.join(featureDir, 'plan.md')));

  const errors = [];
  const warnings = [];
  const rel = `specs/${id}/tasks.md`;
  const lines = readLines(path.join(featureDir, 'tasks.md'));
  if (!plan.exists) warnings.push('plan.md not found; tasks are written only from an approved plan');
  else if (plan.status !== 'approved') warnings.push(`plan status is ${plan.status}; tasks are written only from an approved plan`);
  if (!lines) return { root, file: rel, exists: false, planStatus: plan.status, nextTask: 'T-001', errors, warnings };

  const fm = frontmatter(lines);
  const meta = checkFrontmatter(fm, KEYS, id, errors);
  if (meta.status && !STATUSES.includes(meta.status)) errors.push(`frontmatter: invalid status "${meta.status}" (${STATUSES.join(' | ')})`);
  const start = fm ? fm.end + 1 : 0;
  if (!lines.slice(start).find((line) => line.trim() !== '')?.startsWith('# ')) errors.push('no "# " title line after the frontmatter');

  const { tasks, deps, clarify } = parseTasks(lines, start, spec, errors, warnings);
  if (tasks.length === 0) errors.push('no task lines');
  checkTasks(tasks, deps, spec, plan, errors, warnings);
  if (clarify > MAX_CLARIFY) errors.push(`${clarify} [CLARIFY] markers; a task list holds at most ${MAX_CLARIFY}`);
  if (clarify > 0 && meta.status === 'approved') errors.push(`status is approved but ${clarify} [CLARIFY] marker(s) remain`);
  for (const [name, date] of [['plan.md', plan.updated], ['spec.md', specUpdated]]) {
    if (DATE.test(date ?? '') && DATE.test(meta.updated ?? '') && date > meta.updated) {
      warnings.push(`${name} was updated (${date}) after the tasks (${meta.updated}); review the tasks against it`);
    }
  }

  const matrix = matrixOf(tasks, spec);
  const traceLines = readLines(path.join(featureDir, 'traceability.md'));
  checkTrace(traceLines, id, matrix, errors, warnings);

  // Every T-### mentioned anywhere (clarifications cite removed tasks), so a deleted ID is never reused.
  const nums = [...lines, ...(traceLines ?? [])].flatMap((line) => [...line.matchAll(/\bT-(\d{3})\b/g)].map((m) => Number(m[1])));
  const live = matrix.map((r) => r.id);
  const count = (type) => live.filter((r) => r.startsWith(type + '-'));
  const covered = new Set(matrix.filter((r) => r.tasks.length).map((r) => r.id));
  const phases = [...new Set(tasks.map((t) => t.section))]; // "## " sections holding tasks, numbered from 1
  return {
    root,
    file: rel,
    exists: true,
    frontmatter: meta,
    planStatus: plan.status,
    counts: {
      T: tasks.length, test: tasks.filter((t) => t.test).length, done: tasks.filter((t) => t.done).length,
      FR: count('FR').length, FRcovered: count('FR').filter((r) => covered.has(r)).length,
      NFR: count('NFR').length, NFRcovered: count('NFR').filter((r) => covered.has(r)).length,
      AC: spec.acs.size, ACtested: [...spec.acs.keys()].filter((ac) => tasks.some((t) => t.test && t.ids.includes(ac))).length,
      CLARIFY: clarify,
    },
    nextTask: 'T-' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0'),
    nextOpen: tasks.find((t) => !t.done)?.id ?? null,
    tasks: tasks.map((t) => ({
      id: t.id, phase: phases.indexOf(t.section) + 1, heading: t.heading, done: t.done, test: t.test,
      parallel: t.parallel, ids: t.ids, path: t.path,
    })),
    matrix,
    errors,
    warnings,
  };
}

try {
  const { root, id } = parseArgs(process.argv.slice(2));
  process.stdout.write(JSON.stringify(check(root, id), null, 2) + '\n');
} catch (err) {
  process.stderr.write(`tasks: ${err.message}\n`);
  process.exit(err instanceof UsageError ? 2 : 1);
}
