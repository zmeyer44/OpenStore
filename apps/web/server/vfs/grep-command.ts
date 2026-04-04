import path from "node:path";
import RE2 from "re2";
import { defineCommand } from "just-bash";
import type { CommandContext, ExecResult } from "just-bash";

/**
 * Optimized grep command for the Locker VFS.
 *
 * The built-in just-bash grep calls readFile serially for each file during
 * recursive searches. This custom command resolves the full file list up front
 * and prefetches all content in parallel, then performs regex matching in
 * memory. For a workspace with hundreds of files, this turns O(n) sequential
 * storage downloads into a single parallel batch.
 */

const MAX_PREFETCH_CONCURRENCY = 20;

interface GrepFlags {
  recursive: boolean;
  ignoreCase: boolean;
  lineNumber: boolean;
  filesWithMatches: boolean;
  filesWithoutMatch: boolean;
  count: boolean;
  invertMatch: boolean;
  wordRegexp: boolean;
  fixedStrings: boolean;
  maxCount: number | null;
  includeGlob: string | null;
  excludeGlob: string | null;
  suppressFilename: boolean;
  forceFilename: boolean;
  onlyMatching: boolean;
  quiet: boolean;
  afterContext: number;
  beforeContext: number;
}

interface ParsedArgs {
  flags: GrepFlags;
  patterns: string[];
  targets: string[];
}

function defaultFlags(): GrepFlags {
  return {
    recursive: false,
    ignoreCase: false,
    lineNumber: false,
    filesWithMatches: false,
    filesWithoutMatch: false,
    count: false,
    invertMatch: false,
    wordRegexp: false,
    fixedStrings: false,
    maxCount: null,
    includeGlob: null,
    excludeGlob: null,
    suppressFilename: false,
    forceFilename: false,
    onlyMatching: false,
    quiet: false,
    afterContext: 0,
    beforeContext: 0,
  };
}

function parseArgs(args: string[]): ParsedArgs {
  const flags = defaultFlags();
  const patterns: string[] = [];
  const targets: string[] = [];
  let patternConsumed = false;
  let i = 0;

  while (i < args.length) {
    const arg = args[i]!;

    if (arg === "--") {
      i++;
      break;
    }

    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      const key = eqIdx >= 0 ? arg.slice(0, eqIdx) : arg;
      const val = eqIdx >= 0 ? arg.slice(eqIdx + 1) : null;

      switch (key) {
        case "--recursive":
          flags.recursive = true;
          break;
        case "--ignore-case":
          flags.ignoreCase = true;
          break;
        case "--line-number":
          flags.lineNumber = true;
          break;
        case "--files-with-matches":
          flags.filesWithMatches = true;
          break;
        case "--files-without-match":
          flags.filesWithoutMatch = true;
          break;
        case "--count":
          flags.count = true;
          break;
        case "--invert-match":
          flags.invertMatch = true;
          break;
        case "--word-regexp":
          flags.wordRegexp = true;
          break;
        case "--fixed-strings":
          flags.fixedStrings = true;
          break;
        case "--extended-regexp":
          break;
        case "--max-count":
          flags.maxCount = Number.parseInt(val ?? args[++i] ?? "", 10) || null;
          break;
        case "--include":
          flags.includeGlob = val ?? args[++i] ?? null;
          break;
        case "--exclude":
          flags.excludeGlob = val ?? args[++i] ?? null;
          break;
        case "--no-filename":
          flags.suppressFilename = true;
          break;
        case "--with-filename":
          flags.forceFilename = true;
          break;
        case "--only-matching":
          flags.onlyMatching = true;
          break;
        case "--quiet":
        case "--silent":
          flags.quiet = true;
          break;
        case "--after-context":
          flags.afterContext = Number.parseInt(val ?? args[++i] ?? "", 10) || 0;
          break;
        case "--before-context":
          flags.beforeContext =
            Number.parseInt(val ?? args[++i] ?? "", 10) || 0;
          break;
        case "--context":
          {
            const n = Number.parseInt(val ?? args[++i] ?? "", 10) || 0;
            flags.afterContext = n;
            flags.beforeContext = n;
          }
          break;
        case "--regexp":
          patterns.push(val ?? args[++i] ?? "");
          patternConsumed = true;
          break;
      }
      i++;
      continue;
    }

    if (arg.startsWith("-") && arg.length > 1) {
      const chars = arg.slice(1);
      let j = 0;
      while (j < chars.length) {
        const ch = chars[j]!;
        switch (ch) {
          case "r":
          case "R":
            flags.recursive = true;
            break;
          case "i":
            flags.ignoreCase = true;
            break;
          case "n":
            flags.lineNumber = true;
            break;
          case "l":
            flags.filesWithMatches = true;
            break;
          case "L":
            flags.filesWithoutMatch = true;
            break;
          case "c":
            flags.count = true;
            break;
          case "v":
            flags.invertMatch = true;
            break;
          case "w":
            flags.wordRegexp = true;
            break;
          case "F":
            flags.fixedStrings = true;
            break;
          case "E":
            break;
          case "o":
            flags.onlyMatching = true;
            break;
          case "h":
            flags.suppressFilename = true;
            break;
          case "H":
            flags.forceFilename = true;
            break;
          case "q":
            flags.quiet = true;
            break;
          case "e": {
            const rest = chars.slice(j + 1);
            const pat = rest.length > 0 ? rest : (args[++i] ?? "");
            patterns.push(pat);
            patternConsumed = true;
            j = chars.length;
            continue;
          }
          case "m": {
            const rest = chars.slice(j + 1);
            flags.maxCount =
              Number.parseInt(rest.length > 0 ? rest : (args[++i] ?? ""), 10) ||
              null;
            j = chars.length;
            continue;
          }
          case "A": {
            const rest = chars.slice(j + 1);
            flags.afterContext =
              Number.parseInt(rest.length > 0 ? rest : (args[++i] ?? ""), 10) ||
              0;
            j = chars.length;
            continue;
          }
          case "B": {
            const rest = chars.slice(j + 1);
            flags.beforeContext =
              Number.parseInt(rest.length > 0 ? rest : (args[++i] ?? ""), 10) ||
              0;
            j = chars.length;
            continue;
          }
          case "C": {
            const rest = chars.slice(j + 1);
            const n =
              Number.parseInt(rest.length > 0 ? rest : (args[++i] ?? ""), 10) ||
              0;
            flags.afterContext = n;
            flags.beforeContext = n;
            j = chars.length;
            continue;
          }
        }
        j++;
      }
      i++;
      continue;
    }

    // Positional argument: first non-flag is the pattern (unless -e was used)
    if (!patternConsumed && patterns.length === 0) {
      patterns.push(arg);
      patternConsumed = true;
    } else {
      targets.push(arg);
    }
    i++;
  }

  // Remaining args after "--" are targets
  while (i < args.length) {
    targets.push(args[i]!);
    i++;
  }

  return { flags, patterns, targets };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MAX_PATTERN_LENGTH = 1000;

function buildMatcher(
  patterns: string[],
  flags: GrepFlags,
): { matcher: (line: string) => RegExpMatchArray | null; error?: string } {
  if (patterns.length === 0) {
    return { matcher: () => null };
  }

  const regexSources = patterns.map((p) => {
    let src = flags.fixedStrings ? escapeRegex(p) : p;
    if (flags.wordRegexp) {
      src = `\\b${src}\\b`;
    }
    return src;
  });

  const combined =
    regexSources.length === 1 ? regexSources[0]! : regexSources.join("|");

  if (combined.length > MAX_PATTERN_LENGTH) {
    return {
      matcher: () => null,
      error: `grep: pattern too long (max ${MAX_PATTERN_LENGTH} characters)\n`,
    };
  }

  const regexFlags = flags.ignoreCase ? "i" : "";

  try {
    // Use RE2 for linear-time matching to prevent ReDoS attacks
    const regex = new RE2(combined, regexFlags);
    return {
      matcher: (line: string) => regex.exec(line) as RegExpMatchArray | null,
    };
  } catch {
    return {
      matcher: () => null,
      error: `grep: invalid regex pattern: ${combined}\n`,
    };
  }
}

function globToRegex(glob: string): RegExp {
  const src = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${src}$`);
}

async function collectFilesRecursive(
  dirPath: string,
  ctx: CommandContext,
  flags: GrepFlags,
): Promise<string[]> {
  const allPaths = ctx.fs.getAllPaths();
  const prefix = dirPath === "/" ? "/" : `${dirPath}/`;
  const includeRe = flags.includeGlob ? globToRegex(flags.includeGlob) : null;
  const excludeRe = flags.excludeGlob ? globToRegex(flags.excludeGlob) : null;

  const result: string[] = [];
  for (const p of allPaths) {
    if (dirPath !== "/" && !p.startsWith(prefix) && p !== dirPath) continue;
    if (dirPath === "/" || p.startsWith(prefix)) {
      try {
        const stat = await ctx.fs.stat(p);
        if (!stat.isFile) continue;
      } catch {
        continue;
      }

      const basename = path.posix.basename(p);
      if (includeRe && !includeRe.test(basename)) continue;
      if (excludeRe && excludeRe.test(basename)) continue;
      result.push(p);
    }
  }

  return result;
}

async function resolveTargetFiles(
  targets: string[],
  flags: GrepFlags,
  ctx: CommandContext,
): Promise<string[]> {
  if (targets.length === 0) {
    // No targets: read from stdin (handled separately)
    return [];
  }

  const filePaths: string[] = [];

  for (const target of targets) {
    const resolved = ctx.fs.resolvePath(ctx.cwd, target);
    try {
      const stat = await ctx.fs.stat(resolved);
      if (stat.isDirectory) {
        if (flags.recursive) {
          const children = await collectFilesRecursive(resolved, ctx, flags);
          filePaths.push(...children);
        } else {
          // grep: <dir>: Is a directory (skip with warning)
        }
      } else if (stat.isFile) {
        filePaths.push(resolved);
      }
    } catch {
      // Target doesn't exist — we'll report no matches
    }
  }

  return filePaths;
}

async function prefetchFiles(
  filePaths: string[],
  ctx: CommandContext,
): Promise<Map<string, string>> {
  const contents = new Map<string, string>();
  const batches: string[][] = [];

  for (let i = 0; i < filePaths.length; i += MAX_PREFETCH_CONCURRENCY) {
    batches.push(filePaths.slice(i, i + MAX_PREFETCH_CONCURRENCY));
  }

  for (const batch of batches) {
    const results = await Promise.allSettled(
      batch.map(async (fp) => {
        const content = await ctx.fs.readFile(fp);
        return { path: fp, content };
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        contents.set(result.value.path, result.value.content);
      }
    }
  }

  return contents;
}

interface MatchLine {
  filePath: string;
  lineNumber: number;
  line: string;
  matchText: string | null;
}

function grepContent(
  filePath: string,
  content: string,
  matcher: (line: string) => RegExpMatchArray | null,
  flags: GrepFlags,
): MatchLine[] {
  const lines = content.split("\n");
  // Remove trailing empty line from split
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  const matches: MatchLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const m = matcher(line);
    const isMatch = flags.invertMatch ? m === null : m !== null;

    if (isMatch) {
      matches.push({
        filePath,
        lineNumber: i + 1,
        line,
        matchText: !flags.invertMatch && m ? (m[0] ?? null) : null,
      });

      if (flags.maxCount !== null && matches.length >= flags.maxCount) {
        break;
      }
    }
  }

  return matches;
}

function formatResults(
  allMatches: Map<string, MatchLine[]>,
  flags: GrepFlags,
  multipleFiles: boolean,
): string {
  const showFilename =
    flags.forceFilename || (!flags.suppressFilename && multipleFiles);
  const outputLines: string[] = [];

  const sortedFiles = [...allMatches.keys()].sort();

  for (const filePath of sortedFiles) {
    const matches = allMatches.get(filePath)!;

    if (flags.quiet) continue;

    if (flags.filesWithMatches) {
      if (matches.length > 0) {
        outputLines.push(filePath);
      }
      continue;
    }

    if (flags.filesWithoutMatch) {
      if (matches.length === 0) {
        outputLines.push(filePath);
      }
      continue;
    }

    if (flags.count) {
      if (showFilename) {
        outputLines.push(`${filePath}:${matches.length}`);
      } else {
        outputLines.push(`${matches.length}`);
      }
      continue;
    }

    for (const match of matches) {
      const parts: string[] = [];
      if (showFilename) parts.push(filePath);
      if (flags.lineNumber) parts.push(String(match.lineNumber));

      const text = flags.onlyMatching ? (match.matchText ?? "") : match.line;

      if (parts.length > 0) {
        outputLines.push(`${parts.join(":")}:${text}`);
      } else {
        outputLines.push(text);
      }
    }
  }

  if (outputLines.length === 0) return "";
  return outputLines.join("\n") + "\n";
}

export const optimizedGrepCommand = defineCommand(
  "grep",
  async (args: string[], ctx: CommandContext): Promise<ExecResult> => {
    const { flags, patterns, targets } = parseArgs(args);

    if (patterns.length === 0 && targets.length === 0 && !ctx.stdin) {
      return {
        stdout: "",
        stderr: "grep: no pattern specified\n",
        exitCode: 2,
      };
    }

    if (patterns.length === 0) {
      return {
        stdout: "",
        stderr: "grep: no pattern specified\n",
        exitCode: 2,
      };
    }

    const { matcher, error: matcherError } = buildMatcher(patterns, flags);

    if (matcherError) {
      return { stdout: "", stderr: matcherError, exitCode: 2 };
    }

    // If no targets, read from stdin
    if (targets.length === 0) {
      if (!ctx.stdin) {
        return { stdout: "", stderr: "", exitCode: 1 };
      }
      const matches = grepContent(
        "(standard input)",
        ctx.stdin,
        matcher,
        flags,
      );
      const allMatches = new Map([["(standard input)", matches]]);
      const stdout = formatResults(allMatches, flags, false);
      const hasMatch = matches.length > 0;
      return { stdout, stderr: "", exitCode: hasMatch ? 0 : 1 };
    }

    // Resolve all target files (recursive walk if needed)
    const filePaths = await resolveTargetFiles(targets, flags, ctx);

    if (filePaths.length === 0) {
      return { stdout: "", stderr: "", exitCode: 1 };
    }

    // Parallel prefetch — the key optimization over built-in grep
    const contents = await prefetchFiles(filePaths, ctx);

    // Match all files
    const allMatches = new Map<string, MatchLine[]>();
    let anyMatch = false;

    for (const filePath of filePaths) {
      const content = contents.get(filePath);
      if (content === undefined) continue;

      const matches = grepContent(filePath, content, matcher, flags);
      allMatches.set(filePath, matches);
      if (matches.length > 0) anyMatch = true;

      // Early exit for -q (quiet) mode
      if (flags.quiet && anyMatch) {
        return { stdout: "", stderr: "", exitCode: 0 };
      }
    }

    // Handle -L (files without match) — need entries for all files
    if (flags.filesWithoutMatch) {
      for (const filePath of filePaths) {
        if (!allMatches.has(filePath)) {
          allMatches.set(filePath, []);
        }
      }
    }

    const multipleFiles = filePaths.length > 1;
    const stdout = formatResults(allMatches, flags, multipleFiles);
    return { stdout, stderr: "", exitCode: anyMatch ? 0 : 1 };
  },
);
