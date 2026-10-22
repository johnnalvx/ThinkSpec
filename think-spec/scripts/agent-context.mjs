#!/usr/bin/env node
// think-spec state keys in AGENTS.md, plus the CLAUDE.md import.
// Shared by every think-spec skill: call it as node "${CLAUDE_PLUGIN_ROOT}/scripts/agent-context.mjs".
// Zero dependencies, Node >= 18. Prints JSON on stdout; errors go to stderr with exit 1 (usage: 2).
// The idea of a tool-managed section in the agent context file comes from GitHub Spec-Kit's
// agent-context extension (MIT, see THIRD_PARTY_NOTICES.md).
//
// A state key is a hidden comment at the end of a line, e.g.
//   - **Spec activa:** ninguna <!-- ts:active-spec none -->
// The comment holds the language-neutral value; the visible text is in the project language.
//
//   node agent-context.mjs status   [--root DIR]
//   node agent-context.mjs scaffold [--root DIR]
//   node agent-context.mjs set      [--root DIR] key=value ... [key.text=<visible text>] ...

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STAGES = ['init', 'constitution', 'specify', 'clarify-spec', 'plan', 'clarify-plan', 'tasks',
  'clarify-tasks', 'implement', 'validate', 'maintain', 'finish'];
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const LANGS = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*(?:,[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*)*$/;
const KEYS = {
  version: { required: true, valid: (v) => SEMVER.test(v), hint: 'semver' },
  'code-language': { required: true, valid: (v) => LANGS.test(v), hint: 'BCP 47 tags, comma-separated (en or es,en)' },
  'docs-language': { required: true, valid: (v) => LANGS.test(v), hint: 'BCP 47 tags, comma-separated (es or es,en)' },
  'ui-language': { required: false, valid: (v) => LANGS.test(v), hint: 'BCP 47 tags, comma-separated' },
  stage: { required: true, valid: (v) => STAGES.includes(v), hint: STAGES.join(' | ') },
  'active-spec': { required: true, valid: (v) => v === 'none' || /^\d{3}-[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(v), hint: 'NNN-short-name or none' },
  constitution: { required: true, valid: (v) => v === 'none' || SEMVER.test(v), hint: 'semver or none' },
};
const KEY_RE = /<!--\s*ts:([a-z-]+)\s+([^\s>]+)\s*-->/g;
// Top-level entries that do not make a project "brownfield" on their own.
const SCAFFOLDING = new Set(['.git', '.claude', '.vscode', '.idea', '.DS_Store', 'Thumbs.db',
  'AGENTS.md', 'CLAUDE.md', 'CLAUDE.local.md', 'specs', '.gitignore', '.gitattributes', '.editorconfig']);
const IS_DOC = /^(readme|license|licence|copying)(\..*)?$|^docs$/i;
const CLAUDE_IMPORT = /^[ \t]*@(?:\.\/)?AGENTS\.md[ \t]*$/m;

class UsageError extends Error {}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  let root = process.cwd();
  const pairs = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--root') {
      if (!rest[i + 1]) throw new UsageError('--root needs a directory');
      root = rest[++i];
    } else pairs.push(rest[i]);
  }
  if (!['status', 'scaffold', 'set'].includes(command)) {
    throw new UsageError('usage: agent-context.mjs <status|scaffold|set> [--root DIR] [key=value ...] [key.text=...]');
  }
  root = path.resolve(root);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`root is not a directory: ${root}`);
  return { command, root, pairs };
}

function pluginVersion() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  try {
    return JSON.parse(fs.readFileSync(path.resolve(here, '../.claude-plugin/plugin.json'), 'utf8')).version ?? null;
  } catch {
    return null;
  }
}

// Text file read that remembers BOM and line endings so writes keep the user's style.
function readText(file) {
  if (!fs.existsSync(file)) return null;
  let text = fs.readFileSync(file, 'utf8');
  const bom = text.startsWith('﻿');
  if (bom) text = text.slice(1);
  return { text, bom, eol: text.includes('\r\n') ? '\r\n' : '\n' };
}

function writeText(file, { text, bom }) {
  fs.writeFileSync(file, (bom ? '﻿' : '') + text, 'utf8');
}

// Every ts: key with the line it sits on.
function scanKeys(lines) {
  const found = {};
  lines.forEach((line, index) => {
    for (const m of line.matchAll(KEY_RE)) (found[m[1]] ??= []).push({ index, value: m[2] });
  });
  return found;
}

function keyReport(text) {
  const found = scanKeys(text.split(/\r?\n/));
  const keys = {};
  for (const [key, hits] of Object.entries(found)) keys[key] = hits.length === 1 ? hits[0].value : hits.map((h) => h.value);
  return {
    keys,
    missing: Object.keys(KEYS).filter((k) => KEYS[k].required && !found[k]),
    duplicates: Object.keys(found).filter((k) => found[k].length > 1),
    unknown: Object.keys(found).filter((k) => !(k in KEYS)),
    invalid: Object.keys(found).filter((k) => k in KEYS && found[k].some((h) => !KEYS[k].valid(h.value))),
  };
}

function status(root) {
  const agents = readText(path.join(root, 'AGENTS.md'));
  const claude = readText(path.join(root, 'CLAUDE.md'));
  const entries = fs.readdirSync(root).filter((name) => !SCAFFOLDING.has(name));
  const specsDir = path.join(root, 'specs');
  const specs = fs.existsSync(specsDir)
    ? fs.readdirSync(specsDir).filter((n) => /^\d{3}-/.test(n) && fs.statSync(path.join(specsDir, n)).isDirectory())
    : null;
  return {
    root,
    mode: entries.some((name) => !IS_DOC.test(name)) ? 'brownfield' : 'greenfield',
    entries,
    docs: entries.filter((name) => IS_DOC.test(name)),
    git: fs.existsSync(path.join(root, '.git')),
    agentsMd: agents ? { exists: true, lines: agents.text.split(/\r?\n/).length, ...keyReport(agents.text) } : { exists: false },
    claudeMd: claude
      ? { exists: true, lines: claude.text.split(/\r?\n/).length, importsAgents: CLAUDE_IMPORT.test(claude.text), onlyImport: claude.text.trim().replace(/^@\.\//, '@') === '@AGENTS.md' }
      : { exists: false },
    constitution: fs.existsSync(path.join(root, 'docs', 'constitution.md')),
    specs,
    pluginVersion: pluginVersion(),
  };
}

function scaffold(root) {
  const actions = [];
  const claudePath = path.join(root, 'CLAUDE.md');
  const claude = readText(claudePath);
  if (!claude) {
    fs.writeFileSync(claudePath, '@AGENTS.md\n', 'utf8');
    actions.push('created CLAUDE.md');
  } else if (!CLAUDE_IMPORT.test(claude.text)) {
    claude.text = `@AGENTS.md${claude.eol}${claude.eol}${claude.text}`;
    writeText(claudePath, claude);
    actions.push('added @AGENTS.md import to CLAUDE.md');
  }
  return { root, actions };
}

// Validates every pair first, then rewrites; nothing is written when any pair is wrong.
function set(root, pairs) {
  const file = path.join(root, 'AGENTS.md');
  const doc = readText(file);
  if (!doc) throw new Error('AGENTS.md not found; write it from the template first');
  const lines = doc.text.split(/\r?\n/);
  const found = scanKeys(lines);

  const values = {};
  const texts = {};
  for (const pair of pairs) {
    const eq = pair.indexOf('=');
    const name = eq > 0 ? pair.slice(0, eq).trim() : '';
    const value = pair.slice(eq + 1).trim();
    if (name.endsWith('.text') && name.slice(0, -5) in KEYS) texts[name.slice(0, -5)] = value;
    else if (name in KEYS) values[name] = value;
    else throw new UsageError(`unknown field "${pair}"; keys: ${Object.keys(KEYS).join(', ')} (append .text for visible text)`);
  }
  const version = pluginVersion();
  if (version && found.version && !('version' in values)) values.version = version;

  for (const key of new Set([...Object.keys(values), ...Object.keys(texts)])) {
    if (!found[key]) throw new Error(`AGENTS.md has no line with <!-- ts:${key} … -->; add it from the template first`);
    if (found[key].length > 1) throw new Error(`AGENTS.md has ${found[key].length} lines with ts:${key}; keep exactly one`);
    if (key in values && !KEYS[key].valid(values[key])) throw new UsageError(`invalid ${key}="${values[key]}"; expected ${KEYS[key].hint}`);
  }

  for (const [key, value] of Object.entries(values)) {
    const i = found[key][0].index;
    lines[i] = lines[i].replace(new RegExp(`(<!--\\s*ts:${key}\\s+)[^\\s>]+`), `$1${value}`);
  }
  for (const [key, text] of Object.entries(texts)) {
    const i = found[key][0].index;
    // Visible value = text between the bold label and the first ts: comment.
    const m = lines[i].match(/^(\s*[-*]\s+\*\*[^*]+\*\*\s*)(.*?)(\s*<!--\s*ts:)/);
    if (!m) throw new Error(`line with ts:${key} has no "- **Label:** value" shape; edit its text by hand`);
    lines[i] = m[1] + text + lines[i].slice(m[1].length + m[2].length);
  }

  const text = lines.join(doc.eol);
  const result = text === doc.text ? 'unchanged' : 'updated';
  if (result === 'updated') writeText(file, { text, bom: doc.bom });
  return { file: 'AGENTS.md', result, ...keyReport(text) };
}

try {
  const { command, root, pairs } = parseArgs(process.argv.slice(2));
  const out = command === 'status' ? status(root) : command === 'scaffold' ? scaffold(root) : set(root, pairs);
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
} catch (err) {
  process.stderr.write(`agent-context: ${err.message}\n`);
  process.exit(err instanceof UsageError ? 2 : 1);
}
