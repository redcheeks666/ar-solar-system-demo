#!/usr/bin/env node
import { appendFile, copyFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = new Set(process.argv.slice(2));
const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const agentRoot = resolve(
  process.env.AGENT_REPO_DIR ?? join(projectRoot, "..", "agent-companion-repo"),
);

const docsToSnapshot = [
  "AGENTS.md",
  "TODO.md",
  "TODO.zh-CN.md",
  "ar_solar_system_prd.md",
  "README.md",
  "package.json",
];

function run(command, commandArgs, cwd, options = {}) {
  try {
    const output = execFileSync(command, commandArgs, {
      cwd,
      encoding: "utf8",
      stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
    });

    return typeof output === "string" ? output.trim() : "";
  } catch (error) {
    if (options.allowFail) {
      return "";
    }

    throw error;
  }
}

function git(commandArgs, cwd, options = {}) {
  return run("git", commandArgs, cwd, options);
}

function timestampForFilename(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

async function main() {
  if (!existsSync(agentRoot)) {
    console.warn(
      `[sync-agent] Agent repo not found at ${agentRoot}. Create it or set AGENT_REPO_DIR.`,
    );
    process.exit(args.has("--strict") ? 1 : 0);
  }

  const now = new Date();
  const sourceCommit = git(["rev-parse", "HEAD"], projectRoot, { allowFail: true });
  const shortCommit = sourceCommit.slice(0, 7) || "uncommitted";
  const sourceBranch = git(["branch", "--show-current"], projectRoot, { allowFail: true });
  const sourceRemote = git(["config", "--get", "remote.origin.url"], projectRoot, {
    allowFail: true,
  });
  const sourceSubject = git(["log", "-1", "--pretty=%s"], projectRoot, { allowFail: true });
  const sourceStatus = git(["status", "--short"], projectRoot, { allowFail: true });

  const latestSnapshotDir = join(agentRoot, "snapshots", "latest");
  const pointSnapshotDir = join(
    agentRoot,
    "snapshots",
    `${now.toISOString().slice(0, 10)}-${shortCommit}`,
  );
  await mkdir(latestSnapshotDir, { recursive: true });
  await mkdir(pointSnapshotDir, { recursive: true });

  const copiedDocs = [];
  for (const doc of docsToSnapshot) {
    const sourcePath = join(projectRoot, doc);
    if (!existsSync(sourcePath)) {
      continue;
    }

    await copyFile(sourcePath, join(latestSnapshotDir, doc));
    await copyFile(sourcePath, join(pointSnapshotDir, doc));
    copiedDocs.push(doc);
  }

  const metadata = {
    syncedAt: now.toISOString(),
    sourceRepository: "ar-solar-system-demo",
    sourcePath: projectRoot,
    sourceBranch,
    sourceCommit,
    sourceCommitShort: shortCommit,
    sourceCommitSubject: sourceSubject,
    sourceRemote,
    sourceStatusShort: sourceStatus,
    copiedDocs,
  };

  await writeFile(
    join(agentRoot, "main-project-sync.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    join(latestSnapshotDir, "source-metadata.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    join(pointSnapshotDir, "source-metadata.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );

  const syncLogDir = join(agentRoot, "sync-log");
  await mkdir(syncLogDir, { recursive: true });
  const dateKey = now.toISOString().slice(0, 10);
  const syncLogPath = join(syncLogDir, `${dateKey}.md`);
  if (!existsSync(syncLogPath)) {
    await writeFile(syncLogPath, `# Sync Log - ${dateKey}\n\n`, "utf8");
  }

  await appendFile(
    syncLogPath,
    `- ${now.toISOString()} | ${shortCommit} | ${sourceBranch || "unknown-branch"} | ${
      sourceSubject || "No commit subject"
    } | copied ${copiedDocs.join(", ")}\n`,
    "utf8",
  );

  console.log(`[sync-agent] Synced ${copiedDocs.length} docs to ${agentRoot}`);

  if (args.has("--commit-agent")) {
    const agentStatus = git(["status", "--short"], agentRoot, { allowFail: true });
    if (!agentStatus) {
      console.log("[sync-agent] Agent repo has no changes to commit");
    } else {
      git(["add", "."], agentRoot, { stdio: "inherit" });
      git(["commit", "-m", `docs: sync agent context for ${shortCommit}`], agentRoot, {
        stdio: "inherit",
      });
      if (args.has("--push")) {
        git(["push"], agentRoot, { stdio: "inherit" });
      }
    }
  }
}

main().catch((error) => {
  console.error("[sync-agent] Failed to sync agent repo:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
