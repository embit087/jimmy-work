#!/usr/bin/env node
// Dependency-free SHA-256 integrity manifest for office-log-next.
//
//   node scripts/checksum.mjs generate   # write public/checksums.sha256 + public/integrity.json
//   node scripts/checksum.mjs verify     # recompute and fail on any mismatch
//
// The manifest lives under public/ so it is served by the deployment and can be
// fetched to prove the live site was built from a known source tree.

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const MANIFEST_REL = 'public/checksums.sha256';
const INTEGRITY_REL = 'public/integrity.json';

// Never hashed: generated output, dependencies, VCS, and the manifest files themselves.
const EXCLUDE_DIRS = new Set([
  'node_modules', '.next', '.git', '.vercel', '.turbo', 'coverage', '.vscode',
]);
const EXCLUDE_FILES = new Set([MANIFEST_REL, INTEGRITY_REL]);

const toPosix = (p) => p.split(sep).join('/');

async function listFiles(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) await listFiles(join(dir, entry.name), acc);
    } else if (entry.isFile()) {
      const rel = toPosix(relative(ROOT, join(dir, entry.name)));
      if (!EXCLUDE_FILES.has(rel)) acc.push(rel);
    }
  }
  return acc;
}

async function buildLines() {
  const files = (await listFiles(ROOT)).sort();
  const lines = [];
  for (const rel of files) {
    const hash = createHash('sha256').update(await readFile(join(ROOT, rel))).digest('hex');
    lines.push(`${hash}  ${rel}`); // shasum -a 256 -c compatible
  }
  return lines;
}

// A single value that fingerprints the whole tree.
const digestOf = (lines) => createHash('sha256').update(lines.join('\n')).digest('hex');

const commit = () =>
  process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || process.env.COMMIT_SHA || 'unknown';

async function generate() {
  const lines = await buildLines();
  const digest = digestOf(lines);
  await writeFile(join(ROOT, MANIFEST_REL), lines.join('\n') + '\n');
  await writeFile(
    join(ROOT, INTEGRITY_REL),
    JSON.stringify({ algorithm: 'sha256', files: lines.length, manifestDigest: digest, commit: commit() }, null, 2) + '\n',
  );
  console.log(`generate: ${lines.length} files, digest ${digest.slice(0, 16)}…`);
}

async function verify() {
  let recorded;
  try {
    recorded = (await readFile(join(ROOT, MANIFEST_REL), 'utf8')).trim().split('\n');
  } catch {
    console.error(`verify: missing ${MANIFEST_REL} — run "npm run checksum" first`);
    process.exit(1);
  }
  const current = await buildLines();
  const recordedMap = new Map(recorded.map((l) => [l.slice(66), l.slice(0, 64)]));
  const currentMap = new Map(current.map((l) => [l.slice(66), l.slice(0, 64)]));

  const problems = [];
  for (const [file, hash] of currentMap) {
    if (!recordedMap.has(file)) problems.push(`+ untracked: ${file}`);
    else if (recordedMap.get(file) !== hash) problems.push(`~ changed:   ${file}`);
  }
  for (const file of recordedMap.keys()) {
    if (!currentMap.has(file)) problems.push(`- missing:   ${file}`);
  }

  if (problems.length) {
    console.error(`verify: FAILED (${problems.length} issue(s))`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
  }
  console.log(`verify: OK — ${current.length} files, digest ${digestOf(current).slice(0, 16)}…`);
}

const cmd = process.argv[2];
if (cmd === 'generate') await generate();
else if (cmd === 'verify') await verify();
else {
  console.error('usage: node scripts/checksum.mjs <generate|verify>');
  process.exit(1);
}
