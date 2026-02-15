export interface VFSNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: VFSNode[];
  content?: string;
  language?: string;
  icon?: string;
}

export interface OpenTab {
  id: string;
  name: string;
  language: string;
  modified: boolean;
}

export interface Breakpoint {
  fileId: string;
  line: number;
}

export interface CommitEntry {
  id: string;
  message: string;
  timestamp: number;
  filesChanged: string[];
}

export interface TerminalLine {
  text: string;
  type: 'stdout' | 'stderr' | 'info' | 'command';
}

export interface DebugVariable {
  name: string;
  value: string;
  type: string;
}

export interface CallStackFrame {
  name: string;
  file: string;
  line: number;
}

export type BottomPanelTab = 'terminal' | 'output' | 'debug-console' | 'problems';
export type ActivityTab = 'explorer' | 'search' | 'source-control' | 'debug' | 'extensions';

export interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
  disabled?: boolean;
  submenu?: MenuItem[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  language: string;
  files: VFSNode[];
}

export interface Problem {
  file: string;
  line: number;
  col: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
}
