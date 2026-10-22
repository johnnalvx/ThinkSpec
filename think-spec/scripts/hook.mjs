#!/usr/bin/env node
// PostToolUse hook (hooks/hooks.json, Write|Edit): after Claude writes a think-spec artifact, lint it with
// validate.mjs and warn Claude about the errors in that file. Opt-in: it acts only when the plugin option
// validate_on_edit is true (exported to hooks as CLAUDE_PLUGIN_OPTION_VALIDATE_ON_EDIT).
// Zero dependencies, Node >= 18. Reads the hook input JSON on stdin.
// Exit 2 with the errors on stderr shows them to Claude (the edit already happened); exit 0 otherwise,
// including on any failure of its own, so the hook never gets in the way of a session.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MAX_LINES = 10;
const SPEC_FILE = /^specs\/(\d{3}-[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*)\//u;

function main() {
  if (!/^(true|1)$/i.test(process.env.CLAUDE_PLUGIN_OPTION_VALIDATE_ON_EDIT ?? '')) return 0;
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const file = input.tool_input?.file_path;
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd;
  if (!file || !root || !fs.existsSync(path.join(root, 'AGENTS.md'))) return 0;

  const rel = path.relative(root, path.resolve(root, file)).replace(/\\/g, '/');
  const spec = rel.match(SPEC_FILE)?.[1];
  if (!(rel === 'AGENTS.md' || rel === 'docs/constitution.md' || rel.startsWith('specs/'))) return 0;

  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'validate.mjs');
  const args = [script, 'check', ...(spec ? [spec] : []), '--root', root];
  const res = spawnSync(process.execPath, args, { encoding: 'utf8' });
  if (res.status !== 0) return 0;
  const errors = JSON.parse(res.stdout).errors.filter((e) => e.file === rel);
  if (errors.length === 0) return 0;

  const lines = errors.slice(0, MAX_LINES).map((e) => `- ${e.message}`);
  if (errors.length > MAX_LINES) lines.push(`- +${errors.length - MAX_LINES} more`);
  process.stderr.write(`think-spec: ${rel} has ${errors.length} error(s) (validate.mjs):\n${lines.join('\n')}\n`);
  return 2;
}

let code = 0;
try { code = main(); } catch { code = 0; }
process.exit(code);
