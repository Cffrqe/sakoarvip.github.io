import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import type {
  VFSNode, OpenTab, Breakpoint, CommitEntry, TerminalLine,
  BottomPanelTab, ActivityTab, Problem, DebugVariable, CallStackFrame,
} from './types';
import { PROJECT_TEMPLATES } from './templates';

interface IDEState {
  projectName: string;
  projectLanguage: string;
  files: VFSNode[];
  openTabs: OpenTab[];
  activeTabId: string | null;
  activeFileContent: string;
  cursorLine: number;
  cursorCol: number;
  activityTab: ActivityTab;
  sidebarOpen: boolean;
  bottomPanelOpen: boolean;
  bottomPanelTab: BottomPanelTab;
  bottomPanelHeight: number;
  terminalLines: TerminalLine[];
  breakpoints: Breakpoint[];
  isDebugging: boolean;
  debugPaused: boolean;
  debugVariables: DebugVariable[];
  callStack: CallStackFrame[];
  currentDebugLine: number | null;
  commits: CommitEntry[];
  stagedFiles: string[];
  modifiedFiles: string[];
  commitMessage: string;
  gitBranch: string;
  searchQuery: string;
  searchResults: { fileId: string; fileName: string; line: number; text: string }[];
  problems: Problem[];
  showPreview: boolean;
  showProjectModal: boolean;
  wordWrap: boolean;
  zoomLevel: number;
}

interface IDEActions {
  createProject: (templateId: string) => void;
  openFile: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateFileContent: (content: string) => void;
  setCursorPosition: (line: number, col: number) => void;
  createFile: (parentId: string | null, name: string) => void;
  createFolder: (parentId: string | null, name: string) => void;
  renameNode: (nodeId: string, newName: string) => void;
  deleteNode: (nodeId: string) => void;
  setActivityTab: (tab: ActivityTab) => void;
  toggleSidebar: () => void;
  toggleBottomPanel: () => void;
  setBottomPanelTab: (tab: BottomPanelTab) => void;
  setBottomPanelHeight: (h: number) => void;
  toggleBreakpoint: (line: number) => void;
  runCode: () => void;
  startDebug: () => void;
  debugContinue: () => void;
  debugStepOver: () => void;
  debugStepInto: () => void;
  debugStepOut: () => void;
  debugRestart: () => void;
  debugStop: () => void;
  stageFile: (fileId: string) => void;
  unstageFile: (fileId: string) => void;
  commit: () => void;
  setCommitMessage: (msg: string) => void;
  setSearchQuery: (q: string) => void;
  writeTerminal: (line: TerminalLine) => void;
  clearTerminal: () => void;
  togglePreview: () => void;
  setShowProjectModal: (show: boolean) => void;
  saveCurrentFile: () => void;
  saveAllFiles: () => void;
  exportProjectZip: () => void;
  importProjectZip: () => void;
  closeAllTabs: () => void;
  closeOtherTabs: (keepTabId: string) => void;
  newFile: () => void;
  newFolder: () => void;
  toggleWordWrap: () => void;
  wordWrap: boolean;
  zoomLevel: number;
  setZoomLevel: (z: number) => void;
  formatDocument: () => void;
  goToLine: () => void;
  selectAll: () => void;
  duplicateLine: () => void;
  findInFiles: () => void;
  openTerminalTab: () => void;
  toggleFullscreen: () => void;
}

const IDEContext = createContext<(IDEState & IDEActions) | null>(null);

export function useIDE() {
  const ctx = useContext(IDEContext);
  if (!ctx) throw new Error('useIDE must be used within IDEProvider');
  return ctx;
}

function findNode(nodes: VFSNode[], id: string): VFSNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findParent(nodes: VFSNode[], targetId: string): VFSNode | null {
  for (const n of nodes) {
    if (n.children) {
      if (n.children.some(c => c.id === targetId)) return n;
      const found = findParent(n.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function getAllFiles(nodes: VFSNode[]): VFSNode[] {
  const result: VFSNode[] = [];
  for (const n of nodes) {
    if (n.type === 'file') result.push(n);
    if (n.children) result.push(...getAllFiles(n.children));
  }
  return result;
}

function getLanguageFromExt(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
    'py': 'python', 'rb': 'ruby', 'rs': 'rust', 'go': 'go',
    'cpp': 'cpp', 'c': 'c', 'h': 'cpp', 'hpp': 'cpp',
    'cs': 'csharp', 'kt': 'kotlin', 'kts': 'kotlin',
    'swift': 'swift', 'html': 'html', 'css': 'css',
    'json': 'json', 'xml': 'xml', 'xaml': 'xml',
    'md': 'markdown', 'txt': 'text', 'toml': 'toml',
    'yaml': 'yaml', 'yml': 'yaml',
  };
  return map[ext] || 'text';
}

let nodeIdCounter = 100;

// =================================================================
// Desktop-only language detection and error analysis
// =================================================================
const DESKTOP_ONLY_LANGUAGES = new Set([
  'kotlin', 'csharp', 'swift', 'cpp', 'c', 'rust', 'go',
]);

function detectErrors(lang: string, code: string, fileName: string): Problem[] {
  const problems: Problem[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Skip empty or comment lines for most checks
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('/*');

    if (lang === 'javascript' || lang === 'typescript') {
      if (!isComment) {
        // var usage
        if (/\bvar\s+\w/.test(line)) {
          problems.push({ file: fileName, line: lineNum, col: line.indexOf('var') + 1, severity: 'warning', message: "Unexpected 'var', use 'let' or 'const' instead" });
        }
        // == instead of ===
        if (/[^=!<>]==[^=]/.test(line)) {
          problems.push({ file: fileName, line: lineNum, col: line.indexOf('==') + 1, severity: 'warning', message: "Expected '===' instead of '=='" });
        }
        // console.log
        if (/console\.(log|warn|error|debug|info)\s*\(/.test(line)) {
          problems.push({ file: fileName, line: lineNum, col: line.indexOf('console') + 1, severity: 'info', message: 'Console statement detected' });
        }
        // alert usage
        if (/\balert\s*\(/.test(line) && !/\/\//.test(line.substring(0, line.indexOf('alert')))) {
          problems.push({ file: fileName, line: lineNum, col: line.indexOf('alert') + 1, severity: 'warning', message: "Unexpected use of 'alert'" });
        }
        // eval usage
        if (/\beval\s*\(/.test(line)) {
          problems.push({ file: fileName, line: lineNum, col: line.indexOf('eval') + 1, severity: 'error', message: "Use of 'eval' is dangerous and not recommended" });
        }
      }
    }

    if (lang === 'python') {
      if (!isComment) {
        // Python 2 print statement
        if (/^\s*print\s+[^(]/.test(line) && !/^\s*print\s*$/.test(line)) {
          problems.push({ file: fileName, line: lineNum, col: line.indexOf('print') + 1, severity: 'error', message: "Missing parentheses in call to 'print'. Did you mean print(...)?" });
        }
        // bare except
        if (/except\s*:\s*$/.test(trimmed)) {
          problems.push({ file: fileName, line: lineNum, col: 1, severity: 'warning', message: 'Bare except clause; consider catching specific exceptions' });
        }
        // mutable default arg
        if (/def\s+\w+\s*\([^)]*=\s*(\[\]|\{\})\)/.test(line)) {
          problems.push({ file: fileName, line: lineNum, col: 1, severity: 'warning', message: 'Mutable default argument; use None instead' });
        }
        // import *
        if (/from\s+\w+\s+import\s+\*/.test(line)) {
          problems.push({ file: fileName, line: lineNum, col: 1, severity: 'warning', message: "Wildcard import 'from x import *' is not recommended" });
        }
      }
    }

    if (lang === 'html' || lang === 'xml') {
      if (/<img\b/.test(line) && !/alt\s*=/.test(line)) {
        problems.push({ file: fileName, line: lineNum, col: line.indexOf('<img') + 1, severity: 'warning', message: "img element missing 'alt' attribute (accessibility)" });
      }
      if (/<a\b/.test(line) && /target\s*=\s*["']_blank["']/.test(line) && !/rel\s*=/.test(line)) {
        problems.push({ file: fileName, line: lineNum, col: 1, severity: 'warning', message: "Links with target='_blank' should include rel='noopener'" });
      }
    }

    if (lang === 'css') {
      if (/!important/.test(line) && !isComment) {
        problems.push({ file: fileName, line: lineNum, col: line.indexOf('!important') + 1, severity: 'warning', message: 'Avoid using !important' });
      }
    }

    if (lang === 'rust') {
      if (/\.unwrap\(\)/.test(line) && !isComment) {
        problems.push({ file: fileName, line: lineNum, col: line.indexOf('.unwrap()') + 1, severity: 'warning', message: "Use of .unwrap() — consider using '?' or 'match' for proper error handling" });
      }
      if (/unsafe\s*\{/.test(line) && !isComment) {
        problems.push({ file: fileName, line: lineNum, col: line.indexOf('unsafe') + 1, severity: 'warning', message: 'Use of unsafe block' });
      }
    }

    if (lang === 'go') {
      if (/\bpanic\s*\(/.test(line) && !isComment) {
        problems.push({ file: fileName, line: lineNum, col: line.indexOf('panic') + 1, severity: 'warning', message: "Use of panic() — consider returning errors instead" });
      }
    }

    if (lang === 'kotlin') {
      if (/!!/.test(line) && !isComment) {
        problems.push({ file: fileName, line: lineNum, col: line.indexOf('!!') + 1, severity: 'warning', message: "Non-null assertion '!!' may cause NullPointerException" });
      }
    }

    if (lang === 'swift') {
      if (/\w+!\s*[^=]/.test(line) && !isComment && !/IBOutlet|IBAction/.test(line) && !/func|var|let/.test(line.substring(0, line.indexOf('!')))) {
        const idx = line.indexOf('!');
        if (idx > 0 && line[idx-1] !== '=' && line[idx-1] !== '<' && line[idx-1] !== '>') {
          problems.push({ file: fileName, line: lineNum, col: idx + 1, severity: 'warning', message: 'Force unwrapping optionals may cause runtime crashes' });
        }
      }
    }

    if (lang === 'csharp') {
      if (/System\.Console\./.test(line) && !isComment) {
        problems.push({ file: fileName, line: lineNum, col: 1, severity: 'info', message: "Consider adding 'using System;' to simplify Console calls" });
      }
    }

    if (lang === 'cpp' || lang === 'c') {
      if (/\bgets\s*\(/.test(line) && !isComment) {
        problems.push({ file: fileName, line: lineNum, col: line.indexOf('gets') + 1, severity: 'error', message: "Use of gets() is unsafe — use fgets() instead" });
      }
      if (/\bsprintf\s*\(/.test(line) && !isComment) {
        problems.push({ file: fileName, line: lineNum, col: line.indexOf('sprintf') + 1, severity: 'warning', message: "Use of sprintf() is unsafe — consider snprintf() instead" });
      }
    }
  }

  // Bracket balance check for C-like languages
  if (['javascript', 'typescript', 'cpp', 'c', 'csharp', 'kotlin', 'swift', 'rust', 'go', 'css', 'json'].includes(lang)) {
    let braces = 0, parens = 0, brackets = 0;
    let inStr = false, strCh = '', inLC = false, inBC = false;
    for (let i = 0; i < code.length; i++) {
      const ch = code[i]; const nx = code[i + 1] || '';
      if (inLC) { if (ch === '\n') inLC = false; continue; }
      if (inBC) { if (ch === '*' && nx === '/') { inBC = false; i++; } continue; }
      if (inStr) { if (ch === '\\') { i++; continue; } if (ch === strCh) inStr = false; continue; }
      if (ch === '/' && nx === '/') { inLC = true; continue; }
      if (ch === '/' && nx === '*') { inBC = true; i++; continue; }
      if (ch === '#' && lang === 'python') { inLC = true; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; continue; }
      if (ch === '{') braces++;
      if (ch === '}') braces--;
      if (ch === '(') parens++;
      if (ch === ')') parens--;
      if (ch === '[') brackets++;
      if (ch === ']') brackets--;
    }
    const lastLine = lines.length;
    if (braces > 0) problems.push({ file: fileName, line: lastLine, col: 1, severity: 'error', message: `${braces} unclosed curly brace(s) '{'` });
    if (braces < 0) problems.push({ file: fileName, line: lastLine, col: 1, severity: 'error', message: `${-braces} extra closing curly brace(s) '}'` });
    if (parens > 0) problems.push({ file: fileName, line: lastLine, col: 1, severity: 'error', message: `${parens} unclosed parenthesis '('` });
    if (parens < 0) problems.push({ file: fileName, line: lastLine, col: 1, severity: 'error', message: `${-parens} extra closing parenthesis ')'` });
    if (brackets > 0) problems.push({ file: fileName, line: lastLine, col: 1, severity: 'error', message: `${brackets} unclosed bracket '['` });
    if (brackets < 0) problems.push({ file: fileName, line: lastLine, col: 1, severity: 'error', message: `${-brackets} extra closing bracket ']'` });
  }

  // Python indentation check
  if (lang === 'python') {
    const indentStack: number[] = [0];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.trim().length === 0 || l.trim().startsWith('#')) continue;
      const indent = (l.match(/^(\s*)/)?.[1] || '').length;
      if (indent > indentStack[indentStack.length - 1]) {
        indentStack.push(indent);
      } else {
        while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
          indentStack.pop();
        }
        if (indent !== indentStack[indentStack.length - 1] && indentStack.length > 1) {
          problems.push({ file: fileName, line: i + 1, col: 1, severity: 'error', message: 'Indentation does not match any outer indentation level' });
        }
      }
    }
  }

  // JSON validation
  if (lang === 'json') {
    try {
      JSON.parse(code);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const posMatch = msg.match(/position (\d+)/);
      let errorLine = 1;
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        errorLine = code.substring(0, pos).split('\n').length;
      }
      problems.push({ file: fileName, line: errorLine, col: 1, severity: 'error', message: `Invalid JSON: ${msg}` });
    }
  }

  return problems;
}

function simulateRun(lang: string, code: string, fileName: string): { output: TerminalLine[]; problems: Problem[] } {
  const out: TerminalLine[] = [];
  const problems = detectErrors(lang, code, fileName);
  const errors = problems.filter(p => p.severity === 'error');

  // Desktop-only language check
  if (DESKTOP_ONLY_LANGUAGES.has(lang)) {
    const langNames: Record<string, string> = {
      kotlin: 'Kotlin', csharp: 'C#', swift: 'Swift', cpp: 'C++', c: 'C', rust: 'Rust', go: 'Go',
    };
    const toolchains: Record<string, string> = {
      kotlin: 'JDK 17+ and Kotlin compiler',
      csharp: '.NET SDK 8.0+',
      swift: 'Xcode and Swift toolchain',
      cpp: 'g++ or clang++ compiler',
      c: 'gcc or clang compiler',
      rust: 'Rust toolchain (rustup)',
      go: 'Go 1.21+',
    };
    const langName = langNames[lang] || lang;
    const toolchain = toolchains[lang] || 'native compiler';

    out.push({ text: `$ cloudflow run ${fileName}`, type: 'command' });
    out.push({ text: '', type: 'stdout' });
    out.push({ text: `╔══════════════════════════════════════════════════════════════════╗`, type: 'stderr' });
    out.push({ text: `║  ⚠  DESKTOP WORKSPACE REQUIRED                                  ║`, type: 'stderr' });
    out.push({ text: `╠══════════════════════════════════════════════════════════════════╣`, type: 'stderr' });
    out.push({ text: `║                                                                  ║`, type: 'stderr' });
    out.push({ text: `║  ${langName} cannot be compiled or executed in the browser.`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║  This language requires a desktop workspace with native`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║  build tools installed on your machine.`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║                                                                  ║`, type: 'stderr' });
    out.push({ text: `║  Required toolchain:`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║    → ${toolchain}`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║                                                                  ║`, type: 'stderr' });
    out.push({ text: `║  How to run ${langName} code:`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║    1. Export this project as a ZIP (Ctrl+Shift+E)`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║    2. Open in a local IDE with ${langName} support`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║    3. Install the required toolchain above`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║    4. Build and run locally`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║                                                                  ║`, type: 'stderr' });
    out.push({ text: `║  💡 CloudFlow Desktop (coming soon) will support native`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║     compilation for all languages.`.padEnd(67) + `║`, type: 'stderr' });
    out.push({ text: `║                                                                  ║`, type: 'stderr' });
    out.push({ text: `╚══════════════════════════════════════════════════════════════════╝`, type: 'stderr' });
    out.push({ text: '', type: 'stdout' });
    out.push({ text: `[CloudFlow] ✖ Error: Cannot execute ${langName} in browser environment`, type: 'stderr' });
    out.push({ text: `[CloudFlow] Process exited with code 1`, type: 'stderr' });

    if (problems.length > 0) {
      out.push({ text: '', type: 'stdout' });
      out.push({ text: `[Linter] Static analysis found ${problems.length} issue(s):`, type: 'info' });
      for (const p of problems.slice(0, 15)) {
        const icon = p.severity === 'error' ? '✖' : p.severity === 'warning' ? '⚠' : 'ℹ';
        out.push({
          text: `  ${icon} ${p.file}:${p.line}:${p.col} — ${p.message}`,
          type: p.severity === 'error' ? 'stderr' : p.severity === 'warning' ? 'command' : 'info',
        });
      }
    }

    return { output: out, problems };
  }

  // Browser-runnable languages
  out.push({ text: `$ cloudflow run ${fileName}`, type: 'command' });

  // Report errors first
  if (errors.length > 0) {
    out.push({ text: `[CloudFlow] Compiling ${lang}...`, type: 'info' });
    out.push({ text: '', type: 'stdout' });
    out.push({ text: `✖ Compilation failed with ${errors.length} error(s):`, type: 'stderr' });
    out.push({ text: '', type: 'stdout' });
    for (const e of errors) {
      out.push({ text: `  ${e.file}:${e.line}:${e.col} — error: ${e.message}`, type: 'stderr' });
    }
    const warns = problems.filter(p => p.severity === 'warning');
    if (warns.length > 0) {
      out.push({ text: '', type: 'stdout' });
      out.push({ text: `  Plus ${warns.length} warning(s)`, type: 'command' });
    }
    out.push({ text: '', type: 'stdout' });
    out.push({ text: `[CloudFlow] Process exited with code 1 — fix errors and retry`, type: 'stderr' });
    return { output: out, problems };
  }

  // Warnings
  const warns = problems.filter(p => p.severity === 'warning');
  if (warns.length > 0) {
    out.push({ text: `[CloudFlow] Compiling ${lang}...`, type: 'info' });
    out.push({ text: `[Linter] ${warns.length} warning(s):`, type: 'command' });
    for (const w of warns.slice(0, 5)) {
      out.push({ text: `  ⚠ ${w.file}:${w.line}:${w.col} — ${w.message}`, type: 'command' });
    }
    if (warns.length > 5) out.push({ text: `  ... and ${warns.length - 5} more`, type: 'command' });
    out.push({ text: '', type: 'stdout' });
  } else {
    out.push({ text: `[CloudFlow] Compiling ${lang}... ✓ No errors`, type: 'info' });
  }

  // Execute and simulate output
  if (lang === 'python') {
    out.push({ text: '[CloudFlow] Running Python 3.12...', type: 'info' });
    out.push({ text: '', type: 'stdout' });
    const prints = code.match(/print\((?:f?["'`](.+?)["'`]|(.+?))\)/g) || [];
    if (prints.length > 0) {
      for (const p of prints) {
        const match = p.match(/print\((?:f?["'`](.+?)["'`]|(.+?))\)/);
        const text = match?.[1] || match?.[2] || p;
        out.push({ text: text.replace(/\\n/g, '\n').replace(/\{.*?\}/g, '<value>'), type: 'stdout' });
      }
    } else {
      out.push({ text: '(no output)', type: 'stdout' });
    }
  } else if (lang === 'javascript' || lang === 'typescript') {
    const rt = lang === 'typescript' ? 'tsc + node' : 'node';
    out.push({ text: `[CloudFlow] Running ${rt} v20.10...`, type: 'info' });
    out.push({ text: '', type: 'stdout' });
    const logs = code.match(/console\.(log|warn|error|info)\((.+?)\);?/g) || [];
    if (logs.length > 0) {
      for (const l of logs) {
        const match = l.match(/console\.(log|warn|error|info)\((.+?)\);?/);
        const method = match?.[1] || 'log';
        const text = match?.[2]?.replace(/['"""`]/g, '') || l;
        const type = method === 'error' ? 'stderr' : method === 'warn' ? 'command' : 'stdout';
        out.push({ text, type: type as TerminalLine['type'] });
      }
    } else {
      out.push({ text: '(no console output)', type: 'stdout' });
    }
  } else if (lang === 'ruby') {
    out.push({ text: '[CloudFlow] ruby main.rb', type: 'info' });
    out.push({ text: '', type: 'stdout' });
    const puts = code.match(/puts\s+(.+)/g) || [];
    for (const p of puts) {
      const text = p.replace(/^puts\s+/, '').replace(/["']/g, '').replace(/#\{.*?\}/g, '<val>');
      out.push({ text, type: 'stdout' });
    }
    if (puts.length === 0) out.push({ text: '(no output)', type: 'stdout' });
  } else {
    out.push({ text: `[CloudFlow] Executing ${lang}...`, type: 'info' });
    out.push({ text: '', type: 'stdout' });
    out.push({ text: 'Program executed successfully.', type: 'stdout' });
  }

  out.push({ text: '', type: 'stdout' });
  out.push({ text: `[CloudFlow] Process exited with code 0 (${(Math.random() * 0.5 + 0.1).toFixed(3)}s)`, type: 'info' });
  return { output: out, problems };
}

export function IDEProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<IDEState>({
    projectName: '',
    projectLanguage: '',
    files: [],
    openTabs: [],
    activeTabId: null,
    activeFileContent: '',
    cursorLine: 1,
    cursorCol: 1,
    activityTab: 'explorer',
    sidebarOpen: true,
    bottomPanelOpen: true,
    bottomPanelTab: 'terminal',
    bottomPanelHeight: 200,
    terminalLines: [
      { text: 'Welcome to CloudFlow Terminal v2.0.0', type: 'info' },
      { text: 'Type commands or use the Run button to execute code.', type: 'info' },
      { text: '', type: 'stdout' },
    ],
    breakpoints: [],
    isDebugging: false,
    debugPaused: false,
    debugVariables: [],
    callStack: [],
    currentDebugLine: null,
    commits: [],
    stagedFiles: [],
    modifiedFiles: [],
    commitMessage: '',
    gitBranch: 'main',
    searchQuery: '',
    searchResults: [],
    problems: [],
    showPreview: false,
    showProjectModal: true,
    wordWrap: false,
    zoomLevel: 100,
  });

  const debugIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createProject = useCallback((templateId: string) => {
    const template = PROJECT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const cloneFiles = (nodes: VFSNode[]): VFSNode[] =>
      nodes.map(n => ({
        ...n, id: `node_${nodeIdCounter++}`,
        children: n.children ? cloneFiles(n.children) : undefined,
      }));
    const files = cloneFiles(template.files);
    const allFiles = getAllFiles(files);
    const firstFile = allFiles[0];
    setState(prev => ({
      ...prev,
      projectName: template.name, projectLanguage: template.language, files,
      openTabs: firstFile ? [{ id: firstFile.id, name: firstFile.name, language: firstFile.language || 'text', modified: false }] : [],
      activeTabId: firstFile?.id || null, activeFileContent: firstFile?.content || '',
      cursorLine: 1, cursorCol: 1, showProjectModal: false,
      commits: [], stagedFiles: [], modifiedFiles: [], breakpoints: [],
      isDebugging: false, problems: [],
      terminalLines: [
        { text: `Project "${template.name}" created successfully.`, type: 'info' },
        { text: `Template: ${template.description}`, type: 'info' },
        { text: `Language: ${template.language}`, type: 'info' },
        { text: '', type: 'stdout' },
        { text: `$ cd ${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`, type: 'command' },
        { text: 'Ready.', type: 'info' },
        { text: '', type: 'stdout' },
      ],
    }));
  }, []);

  const openFile = useCallback((fileId: string) => {
    setState(prev => {
      const node = findNode(prev.files, fileId);
      if (!node || node.type !== 'file') return prev;
      let files = prev.files;
      if (prev.activeTabId) files = updateNodeContent(files, prev.activeTabId, prev.activeFileContent);
      const alreadyOpen = prev.openTabs.find(t => t.id === fileId);
      const openTabs = alreadyOpen ? prev.openTabs
        : [...prev.openTabs, { id: node.id, name: node.name, language: node.language || getLanguageFromExt(node.name), modified: false }];
      const fileNode = findNode(files, fileId);
      return { ...prev, files, openTabs, activeTabId: fileId, activeFileContent: fileNode?.content || '', cursorLine: 1, cursorCol: 1 };
    });
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setState(prev => {
      let files = prev.files;
      if (prev.activeTabId === tabId) files = updateNodeContent(files, tabId, prev.activeFileContent);
      const newTabs = prev.openTabs.filter(t => t.id !== tabId);
      let newActiveId = prev.activeTabId;
      let newContent = prev.activeFileContent;
      if (prev.activeTabId === tabId) {
        const idx = prev.openTabs.findIndex(t => t.id === tabId);
        const nextTab = newTabs[Math.min(idx, newTabs.length - 1)];
        newActiveId = nextTab?.id || null;
        newContent = newActiveId ? (findNode(files, newActiveId)?.content || '') : '';
      }
      return { ...prev, files, openTabs: newTabs, activeTabId: newActiveId, activeFileContent: newContent };
    });
  }, []);

  const setActiveTab = useCallback((tabId: string) => {
    setState(prev => {
      let files = prev.files;
      if (prev.activeTabId && prev.activeTabId !== tabId) files = updateNodeContent(files, prev.activeTabId, prev.activeFileContent);
      const node = findNode(files, tabId);
      return { ...prev, files, activeTabId: tabId, activeFileContent: node?.content || '' };
    });
  }, []);

  const updateFileContent = useCallback((content: string) => {
    setState(prev => {
      const openTabs = prev.openTabs.map(t => t.id === prev.activeTabId ? { ...t, modified: true } : t);
      const modifiedFiles = prev.activeTabId && !prev.modifiedFiles.includes(prev.activeTabId)
        ? [...prev.modifiedFiles, prev.activeTabId] : prev.modifiedFiles;
      return { ...prev, activeFileContent: content, openTabs, modifiedFiles };
    });
  }, []);

  const setCursorPosition = useCallback((line: number, col: number) => {
    setState(prev => ({ ...prev, cursorLine: line, cursorCol: col }));
  }, []);

  const createFile = useCallback((parentId: string | null, name: string) => {
    setState(prev => {
      const newNode: VFSNode = { id: `node_${nodeIdCounter++}`, name, type: 'file', language: getLanguageFromExt(name), content: `// ${name}\n` };
      const files = parentId ? addNodeToParent(prev.files, parentId, newNode) : [...prev.files, newNode];
      return { ...prev, files };
    });
  }, []);

  const createFolder = useCallback((parentId: string | null, name: string) => {
    setState(prev => {
      const newNode: VFSNode = { id: `node_${nodeIdCounter++}`, name, type: 'folder', children: [] };
      const files = parentId ? addNodeToParent(prev.files, parentId, newNode) : [...prev.files, newNode];
      return { ...prev, files };
    });
  }, []);

  const renameNode = useCallback((nodeId: string, newName: string) => {
    setState(prev => ({
      ...prev,
      files: mapNodes(prev.files, n => n.id === nodeId ? { ...n, name: newName } : n),
      openTabs: prev.openTabs.map(t => t.id === nodeId ? { ...t, name: newName } : t),
    }));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      files: removeNode(prev.files, nodeId),
      openTabs: prev.openTabs.filter(t => t.id !== nodeId),
      activeTabId: prev.activeTabId === nodeId ? null : prev.activeTabId,
      activeFileContent: prev.activeTabId === nodeId ? '' : prev.activeFileContent,
    }));
  }, []);

  const setActivityTab = useCallback((tab: ActivityTab) => {
    setState(prev => ({ ...prev, activityTab: tab, sidebarOpen: prev.activityTab === tab ? !prev.sidebarOpen : true }));
  }, []);

  const toggleSidebar = useCallback(() => { setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen })); }, []);
  const toggleBottomPanel = useCallback(() => { setState(prev => ({ ...prev, bottomPanelOpen: !prev.bottomPanelOpen })); }, []);
  const setBottomPanelTab = useCallback((tab: BottomPanelTab) => { setState(prev => ({ ...prev, bottomPanelTab: tab, bottomPanelOpen: true })); }, []);
  const setBottomPanelHeight = useCallback((h: number) => { setState(prev => ({ ...prev, bottomPanelHeight: Math.max(100, Math.min(500, h)) })); }, []);

  const toggleBreakpoint = useCallback((line: number) => {
    setState(prev => {
      if (!prev.activeTabId) return prev;
      const existing = prev.breakpoints.findIndex(b => b.fileId === prev.activeTabId && b.line === line);
      const breakpoints = existing >= 0 ? prev.breakpoints.filter((_, i) => i !== existing)
        : [...prev.breakpoints, { fileId: prev.activeTabId!, line }];
      return { ...prev, breakpoints };
    });
  }, []);

  const runCode = useCallback(() => {
    setState(prev => {
      let files = prev.files;
      if (prev.activeTabId) files = updateNodeContent(files, prev.activeTabId, prev.activeFileContent);
      const activeNode = prev.activeTabId ? findNode(files, prev.activeTabId) : null;
      const lang = activeNode?.language || prev.projectLanguage;
      const code = prev.activeFileContent;
      const fName = activeNode?.name || 'untitled';
      const isWeb = lang === 'html' || (prev.projectLanguage === 'html' && prev.files.some(f => f.name === 'index.html'));
      const { output, problems } = simulateRun(lang, code, fName);
      return {
        ...prev, files,
        terminalLines: [...prev.terminalLines, ...output],
        bottomPanelOpen: true, bottomPanelTab: 'terminal',
        showPreview: isWeb ? true : prev.showPreview,
        problems,
      };
    });
  }, []);

  const startDebug = useCallback(() => {
    setState(prev => {
      if (!prev.activeTabId) return prev;
      // Desktop-only check
      const activeNode = findNode(prev.files, prev.activeTabId!);
      const lang = activeNode?.language || prev.projectLanguage;
      if (DESKTOP_ONLY_LANGUAGES.has(lang)) {
        const langNames: Record<string, string> = { kotlin: 'Kotlin', csharp: 'C#', swift: 'Swift', cpp: 'C++', c: 'C', rust: 'Rust', go: 'Go' };
        const langName = langNames[lang] || lang;
        return {
          ...prev,
          bottomPanelOpen: true, bottomPanelTab: 'terminal',
          terminalLines: [
            ...prev.terminalLines,
            { text: '', type: 'stdout' },
            { text: `[Debug] ✖ Cannot debug ${langName} in the browser.`, type: 'stderr' },
            { text: `[Debug] ${langName} requires a desktop workspace with native debugging tools.`, type: 'stderr' },
            { text: `[Debug] Export this project and debug it in a local IDE.`, type: 'stderr' },
            { text: '', type: 'stdout' },
          ],
        };
      }
      const breakpointLines = prev.breakpoints.filter(b => b.fileId === prev.activeTabId).map(b => b.line);
      const startLine = breakpointLines.length > 0 ? Math.min(...breakpointLines) : 1;
      return {
        ...prev, isDebugging: true, debugPaused: true, currentDebugLine: startLine,
        activityTab: 'debug', sidebarOpen: true, bottomPanelOpen: true, bottomPanelTab: 'debug-console',
        debugVariables: [
          { name: 'count', value: '0', type: 'number' },
          { name: 'message', value: '"Hello"', type: 'string' },
          { name: 'items', value: '[1, 2, 3]', type: 'array' },
          { name: 'isReady', value: 'true', type: 'boolean' },
        ],
        callStack: [
          { name: 'main()', file: activeNode?.name || 'main', line: startLine },
          { name: '<module>', file: activeNode?.name || 'main', line: 1 },
        ],
        terminalLines: [
          ...prev.terminalLines,
          { text: '[Debug] Debugger attached.', type: 'info' },
          { text: `[Debug] Paused at line ${startLine}`, type: 'info' },
        ],
      };
    });
  }, []);

  const debugContinue = useCallback(() => {
    setState(prev => {
      if (!prev.isDebugging) return prev;
      const bpLines = prev.breakpoints.filter(b => b.fileId === prev.activeTabId).map(b => b.line).sort((a, b) => a - b);
      const nextBp = bpLines.find(l => l > (prev.currentDebugLine || 0));
      if (nextBp) return { ...prev, currentDebugLine: nextBp, debugPaused: true, terminalLines: [...prev.terminalLines, { text: `[Debug] Hit breakpoint at line ${nextBp}`, type: 'info' as const }] };
      return { ...prev, isDebugging: false, debugPaused: false, currentDebugLine: null, debugVariables: [], callStack: [], terminalLines: [...prev.terminalLines, { text: '[Debug] Program finished.', type: 'info' as const }] };
    });
  }, []);

  const debugStepOver = useCallback(() => {
    setState(prev => {
      if (!prev.isDebugging || !prev.currentDebugLine) return prev;
      const nextLine = prev.currentDebugLine + 1;
      if (nextLine > prev.activeFileContent.split('\n').length) return { ...prev, isDebugging: false, debugPaused: false, currentDebugLine: null, debugVariables: [], callStack: [] };
      return {
        ...prev, currentDebugLine: nextLine,
        debugVariables: prev.debugVariables.map(v => v.name === 'count' ? { ...v, value: String(parseInt(v.value) + 1) } : v),
        callStack: prev.callStack.map((f, i) => i === 0 ? { ...f, line: nextLine } : f),
      };
    });
  }, []);

  const debugStepInto = useCallback(() => {
    debugStepOver();
    setState(prev => ({
      ...prev,
      callStack: [{ name: 'innerFunction()', file: prev.callStack[0]?.file || 'main', line: (prev.currentDebugLine || 1) }, ...prev.callStack],
    }));
  }, [debugStepOver]);

  const debugStepOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      callStack: prev.callStack.length > 1 ? prev.callStack.slice(1) : prev.callStack,
      currentDebugLine: (prev.currentDebugLine || 1) + 3,
    }));
  }, []);

  const debugRestart = useCallback(() => { debugStop(); setTimeout(() => startDebug(), 100); }, [startDebug]);

  const debugStop = useCallback(() => {
    if (debugIntervalRef.current) { clearInterval(debugIntervalRef.current); debugIntervalRef.current = null; }
    setState(prev => ({ ...prev, isDebugging: false, debugPaused: false, currentDebugLine: null, debugVariables: [], callStack: [], terminalLines: [...prev.terminalLines, { text: '[Debug] Session stopped.', type: 'info' as const }] }));
  }, []);

  const stageFile = useCallback((fileId: string) => { setState(prev => ({ ...prev, stagedFiles: prev.stagedFiles.includes(fileId) ? prev.stagedFiles : [...prev.stagedFiles, fileId] })); }, []);
  const unstageFile = useCallback((fileId: string) => { setState(prev => ({ ...prev, stagedFiles: prev.stagedFiles.filter(f => f !== fileId) })); }, []);

  const commit = useCallback(() => {
    setState(prev => {
      if (!prev.commitMessage.trim() || prev.stagedFiles.length === 0) return prev;
      const newCommit: CommitEntry = { id: `commit_${Date.now()}`, message: prev.commitMessage, timestamp: Date.now(), filesChanged: prev.stagedFiles.map(id => findNode(prev.files, id)?.name || id) };
      return {
        ...prev, commits: [newCommit, ...prev.commits], stagedFiles: [],
        modifiedFiles: prev.modifiedFiles.filter(f => !prev.stagedFiles.includes(f)), commitMessage: '',
        openTabs: prev.openTabs.map(t => ({ ...t, modified: prev.stagedFiles.includes(t.id) ? false : t.modified })),
      };
    });
  }, []);

  const setCommitMessage = useCallback((msg: string) => { setState(prev => ({ ...prev, commitMessage: msg })); }, []);

  const setSearchQuery = useCallback((q: string) => {
    setState(prev => {
      if (!q.trim()) return { ...prev, searchQuery: q, searchResults: [] };
      const allF = getAllFiles(prev.files);
      const results: typeof prev.searchResults = [];
      const ql = q.toLowerCase();
      for (const f of allF) {
        if (!f.content) continue;
        const lines = f.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(ql)) results.push({ fileId: f.id, fileName: f.name, line: i + 1, text: lines[i].trim() });
        }
      }
      return { ...prev, searchQuery: q, searchResults: results };
    });
  }, []);

  const writeTerminal = useCallback((line: TerminalLine) => { setState(prev => ({ ...prev, terminalLines: [...prev.terminalLines, line] })); }, []);
  const clearTerminal = useCallback(() => { setState(prev => ({ ...prev, terminalLines: [] })); }, []);
  const togglePreview = useCallback(() => { setState(prev => ({ ...prev, showPreview: !prev.showPreview })); }, []);
  const setShowProjectModal = useCallback((show: boolean) => { setState(prev => ({ ...prev, showProjectModal: show })); }, []);

  const saveCurrentFile = useCallback(() => {
    setState(prev => {
      if (!prev.activeTabId) return prev;
      const files = updateNodeContent(prev.files, prev.activeTabId, prev.activeFileContent);
      const openTabs = prev.openTabs.map(t => t.id === prev.activeTabId ? { ...t, modified: false } : t);
      // Run linter on save
      const activeNode = findNode(files, prev.activeTabId);
      const lang = activeNode?.language || prev.projectLanguage;
      const problems = detectErrors(lang, prev.activeFileContent, activeNode?.name || 'untitled');
      return {
        ...prev, files, openTabs, problems,
        terminalLines: [...prev.terminalLines, { text: `[CloudFlow] File saved.`, type: 'info' as const }],
      };
    });
  }, []);

  const saveAllFiles = useCallback(() => {
    setState(prev => {
      let files = prev.files;
      if (prev.activeTabId) files = updateNodeContent(files, prev.activeTabId, prev.activeFileContent);
      const openTabs = prev.openTabs.map(t => ({ ...t, modified: false }));
      return { ...prev, files, openTabs, terminalLines: [...prev.terminalLines, { text: `[CloudFlow] All files saved.`, type: 'info' as const }] };
    });
  }, []);

  const exportProjectZip = useCallback(async () => {
    const zip = new JSZip();
    const addNodes = (nodes: VFSNode[], path: string) => {
      for (const node of nodes) {
        const fullPath = path ? `${path}/${node.name}` : node.name;
        if (node.type === 'file') zip.file(fullPath, node.content || '');
        else if (node.children) addNodes(node.children, fullPath);
      }
    };
    let currentFiles = state.files;
    if (state.activeTabId) currentFiles = updateNodeContent(currentFiles, state.activeTabId, state.activeFileContent);
    addNodes(currentFiles, '');
    const blob = await zip.generateAsync({ type: 'blob' });
    const slug = state.projectName ? state.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'project';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${slug}.zip`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setState(prev => ({ ...prev, terminalLines: [...prev.terminalLines, { text: `[CloudFlow] Project exported as ${slug}.zip`, type: 'info' as const }] }));
  }, [state.files, state.activeTabId, state.activeFileContent, state.projectName]);

  const importProjectZip = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.zip';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const zip = await JSZip.loadAsync(file);
        const rootNodes: VFSNode[] = [];
        const folderMap = new Map<string, VFSNode>();
        const entries: [string, JSZip.JSZipObject][] = [];
        zip.forEach((p, z) => { entries.push([p, z]); });
        entries.sort((a, b) => a[0].localeCompare(b[0]));
        for (const [relativePath, zipEntry] of entries) {
          if (relativePath.startsWith('__MACOSX') || relativePath.includes('/.')) continue;
          const parts = relativePath.split('/').filter(p => p.length > 0);
          if (parts.length === 0) continue;
          if (zipEntry.dir) {
            let currentPath = '';
            for (let i = 0; i < parts.length; i++) {
              const prevPath = currentPath;
              currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
              if (!folderMap.has(currentPath)) {
                const folderNode: VFSNode = { id: `node_${nodeIdCounter++}`, name: parts[i], type: 'folder', children: [] };
                folderMap.set(currentPath, folderNode);
                if (prevPath && folderMap.has(prevPath)) folderMap.get(prevPath)!.children!.push(folderNode);
                else if (i === 0) rootNodes.push(folderNode);
              }
            }
          } else {
            const content = await zipEntry.async('string');
            const fileName = parts[parts.length - 1];
            const fileNode: VFSNode = { id: `node_${nodeIdCounter++}`, name: fileName, type: 'file', language: getLanguageFromExt(fileName), content };
            const parentPath = parts.slice(0, -1).join('/');
            if (parentPath && folderMap.has(parentPath)) {
              folderMap.get(parentPath)!.children!.push(fileNode);
            } else {
              let cp = '';
              for (let i = 0; i < parts.length - 1; i++) {
                const pp = cp; cp = cp ? `${cp}/${parts[i]}` : parts[i];
                if (!folderMap.has(cp)) {
                  const fn: VFSNode = { id: `node_${nodeIdCounter++}`, name: parts[i], type: 'folder', children: [] };
                  folderMap.set(cp, fn);
                  if (pp && folderMap.has(pp)) folderMap.get(pp)!.children!.push(fn);
                  else if (i === 0) rootNodes.push(fn);
                }
              }
              if (parentPath && folderMap.has(parentPath)) folderMap.get(parentPath)!.children!.push(fileNode);
              else rootNodes.push(fileNode);
            }
          }
        }
        const findFirst = (nodes: VFSNode[]): VFSNode | null => { for (const n of nodes) { if (n.type === 'file') return n; if (n.children) { const r = findFirst(n.children); if (r) return r; } } return null; };
        const firstFile = findFirst(rootNodes);
        const projectName = file.name.replace(/\.zip$/i, '');
        const detectLang = (nodes: VFSNode[]): string => { for (const n of nodes) { if (n.type === 'file') { if (n.name === 'index.html') return 'html'; const l = getLanguageFromExt(n.name); if (l !== 'text') return l; } if (n.children) { const r = detectLang(n.children); if (r !== 'text') return r; } } return 'text'; };
        setState(prev => ({
          ...prev, projectName, projectLanguage: detectLang(rootNodes), files: rootNodes,
          openTabs: firstFile ? [{ id: firstFile.id, name: firstFile.name, language: firstFile.language || 'text', modified: false }] : [],
          activeTabId: firstFile?.id || null, activeFileContent: firstFile?.content || '',
          showProjectModal: false, cursorLine: 1, cursorCol: 1,
          commits: [], stagedFiles: [], modifiedFiles: [], breakpoints: [], isDebugging: false, problems: [],
          terminalLines: [...prev.terminalLines, { text: `[CloudFlow] Imported project from ${file.name}`, type: 'info' as const }, { text: `[CloudFlow] ${entries.length} files loaded.`, type: 'info' as const }, { text: '', type: 'stdout' as const }],
        }));
      } catch (err) {
        setState(prev => ({ ...prev, terminalLines: [...prev.terminalLines, { text: `[CloudFlow] Error importing ZIP: ${err}`, type: 'stderr' as const }] }));
      }
    };
    input.click();
  }, []);

  const closeAllTabs = useCallback(() => {
    setState(prev => {
      let files = prev.files;
      if (prev.activeTabId) files = updateNodeContent(files, prev.activeTabId, prev.activeFileContent);
      return { ...prev, files, openTabs: [], activeTabId: null, activeFileContent: '' };
    });
  }, []);

  const closeOtherTabs = useCallback((keepTabId: string) => {
    setState(prev => {
      let files = prev.files;
      if (prev.activeTabId) files = updateNodeContent(files, prev.activeTabId, prev.activeFileContent);
      const keepTab = prev.openTabs.find(t => t.id === keepTabId);
      if (!keepTab) return prev;
      const node = findNode(files, keepTabId);
      return { ...prev, files, openTabs: [keepTab], activeTabId: keepTabId, activeFileContent: node?.content || '' };
    });
  }, []);

  const newFile = useCallback(() => { const name = prompt('Enter file name:'); if (name?.trim()) createFile(null, name.trim()); }, [createFile]);
  const newFolder = useCallback(() => { const name = prompt('Enter folder name:'); if (name?.trim()) createFolder(null, name.trim()); }, [createFolder]);
  const toggleWordWrap = useCallback(() => { setState(prev => ({ ...prev, wordWrap: !prev.wordWrap })); }, []);
  const setZoomLevel = useCallback((z: number) => { setState(prev => ({ ...prev, zoomLevel: Math.max(50, Math.min(200, z)) })); }, []);

  const formatDocument = useCallback(() => {
    setState(prev => {
      if (!prev.activeTabId) return prev;
      const lines = prev.activeFileContent.split('\n');
      let indent = 0;
      const formatted = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) indent = Math.max(0, indent - 1);
        const result = '  '.repeat(indent) + trimmed;
        if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) indent++;
        return result;
      });
      return {
        ...prev, activeFileContent: formatted.join('\n'),
        openTabs: prev.openTabs.map(t => t.id === prev.activeTabId ? { ...t, modified: true } : t),
        terminalLines: [...prev.terminalLines, { text: '[CloudFlow] Document formatted.', type: 'info' as const }],
      };
    });
  }, []);

  const goToLine = useCallback(() => { const line = prompt('Go to line:'); if (line) { const num = parseInt(line); if (!isNaN(num)) setState(prev => ({ ...prev, cursorLine: num, cursorCol: 1 })); } }, []);
  const selectAll = useCallback(() => { const ta = document.querySelector('textarea'); if (ta) { ta.focus(); ta.select(); } }, []);

  const duplicateLine = useCallback(() => {
    setState(prev => {
      if (!prev.activeTabId) return prev;
      const lines = prev.activeFileContent.split('\n');
      const lineIdx = prev.cursorLine - 1;
      if (lineIdx >= 0 && lineIdx < lines.length) {
        lines.splice(lineIdx + 1, 0, lines[lineIdx]);
        return { ...prev, activeFileContent: lines.join('\n'), openTabs: prev.openTabs.map(t => t.id === prev.activeTabId ? { ...t, modified: true } : t) };
      }
      return prev;
    });
  }, []);

  const findInFiles = useCallback(() => { setState(prev => ({ ...prev, activityTab: 'search' as const, sidebarOpen: true })); }, []);
  const openTerminalTab = useCallback(() => { setState(prev => ({ ...prev, bottomPanelOpen: true, bottomPanelTab: 'terminal' as const })); }, []);
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  const value: IDEState & IDEActions = {
    ...state,
    createProject, openFile, closeTab, setActiveTab, updateFileContent,
    setCursorPosition, createFile, createFolder, renameNode, deleteNode,
    setActivityTab, toggleSidebar, toggleBottomPanel, setBottomPanelTab,
    setBottomPanelHeight, toggleBreakpoint, runCode, startDebug,
    debugContinue, debugStepOver, debugStepInto, debugStepOut,
    debugRestart, debugStop, stageFile, unstageFile, commit,
    setCommitMessage, setSearchQuery, writeTerminal, clearTerminal,
    togglePreview, setShowProjectModal,
    saveCurrentFile, saveAllFiles, exportProjectZip, importProjectZip,
    closeAllTabs, closeOtherTabs, newFile, newFolder, toggleWordWrap,
    setZoomLevel, formatDocument, goToLine, selectAll, duplicateLine,
    findInFiles, openTerminalTab, toggleFullscreen,
  };

  return <IDEContext.Provider value={value}>{children}</IDEContext.Provider>;
}

function updateNodeContent(nodes: VFSNode[], nodeId: string, content: string): VFSNode[] {
  return nodes.map(n => {
    if (n.id === nodeId) return { ...n, content };
    if (n.children) return { ...n, children: updateNodeContent(n.children, nodeId, content) };
    return n;
  });
}

function addNodeToParent(nodes: VFSNode[], parentId: string, newNode: VFSNode): VFSNode[] {
  return nodes.map(n => {
    if (n.id === parentId && n.type === 'folder') return { ...n, children: [...(n.children || []), newNode] };
    if (n.children) return { ...n, children: addNodeToParent(n.children, parentId, newNode) };
    return n;
  });
}

function removeNode(nodes: VFSNode[], nodeId: string): VFSNode[] {
  return nodes.filter(n => n.id !== nodeId).map(n => n.children ? { ...n, children: removeNode(n.children, nodeId) } : n);
}

function mapNodes(nodes: VFSNode[], fn: (n: VFSNode) => VFSNode): VFSNode[] {
  return nodes.map(n => { const m = fn(n); if (m.children) return { ...m, children: mapNodes(m.children, fn) }; return m; });
}

export { findParent, findNode, getAllFiles, getLanguageFromExt };
