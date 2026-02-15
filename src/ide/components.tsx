import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Files, Search, GitBranch, Bug, Puzzle, Play, ChevronRight, ChevronDown,
  X, File, Folder, FolderOpen, Plus, Trash2, Pencil, Terminal as TermIcon,
  FileText, FileCode, FileJson, Settings, SquareTerminal, AlertTriangle,
  Info, CheckCircle2, Circle, StepForward, StepBack, RotateCcw, Square,
  SkipForward, ArrowDown, ChevronUp, PanelBottom, Eye, FolderPlus,
  FilePlus, Minus, GitCommitHorizontal, Clock, FileWarning,
  Download, Upload, Save, FileArchive, Copy,
  RotateCw,
} from 'lucide-react';
import { useIDE } from './IDEContext';
import { PROJECT_TEMPLATES } from './templates';
import { tokenizeLine, tokenColor } from './syntax';
import type { VFSNode, MenuItem } from './types';

// ============= FILE ICONS =============
function getFileIcon(name: string, isOpen?: boolean) {
  if (isOpen !== undefined) {
    return isOpen ? <FolderOpen size={16} className="text-yellow-500" /> : <Folder size={16} className="text-yellow-600" />;
  }
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const iconMap: Record<string, React.ReactNode> = {
    'js': <FileCode size={16} className="text-yellow-400" />,
    'jsx': <FileCode size={16} className="text-cyan-400" />,
    'ts': <FileCode size={16} className="text-blue-400" />,
    'tsx': <FileCode size={16} className="text-blue-400" />,
    'py': <FileCode size={16} className="text-green-400" />,
    'rb': <FileCode size={16} className="text-red-400" />,
    'rs': <FileCode size={16} className="text-orange-400" />,
    'go': <FileCode size={16} className="text-cyan-300" />,
    'cpp': <FileCode size={16} className="text-blue-300" />,
    'c': <FileCode size={16} className="text-blue-200" />,
    'cs': <FileCode size={16} className="text-purple-400" />,
    'kt': <FileCode size={16} className="text-purple-300" />,
    'swift': <FileCode size={16} className="text-orange-500" />,
    'html': <FileCode size={16} className="text-orange-400" />,
    'css': <FileCode size={16} className="text-blue-500" />,
    'json': <FileJson size={16} className="text-yellow-300" />,
    'xml': <FileCode size={16} className="text-orange-300" />,
    'xaml': <FileCode size={16} className="text-blue-400" />,
    'md': <FileText size={16} className="text-white/60" />,
    'toml': <Settings size={16} className="text-gray-400" />,
    'txt': <FileText size={16} className="text-gray-400" />,
    'zip': <FileArchive size={16} className="text-yellow-500" />,
  };
  return iconMap[ext] || <File size={16} className="text-gray-400" />;
}

// ============= DROPDOWN MENU =============
function DropdownMenu({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.1 }}
        className="absolute top-full left-0 mt-0.5 z-50 bg-[#252526] border border-[#454545] rounded shadow-2xl py-1 min-w-[240px]"
      >
        {items.map((item, i) => {
          if (item.divider) {
            return <div key={i} className="border-t border-[#454545] my-1" />;
          }
          return (
            <button
              key={i}
              onClick={() => {
                if (item.action && !item.disabled) {
                  item.action();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`w-full flex items-center justify-between px-4 py-1 text-[12px] transition-colors ${
                item.disabled
                  ? 'text-[#5a5a5a] cursor-default'
                  : 'text-[#cccccc] hover:bg-[#094771] cursor-pointer'
              }`}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span className="text-[11px] text-[#808080] ml-8">{item.shortcut}</span>
              )}
            </button>
          );
        })}
      </motion.div>
    </>
  );
}

// ============= TOP BAR =============
export function TopBar() {
  const ide = useIDE();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const menuItems: Record<string, MenuItem[]> = {
    File: [
      { label: 'New File', shortcut: 'Ctrl+N', action: ide.newFile },
      { label: 'New Folder', action: ide.newFolder },
      { label: '', divider: true },
      { label: 'Open Project from ZIP...', shortcut: 'Ctrl+O', action: ide.importProjectZip },
      { label: '', divider: true },
      { label: 'Save', shortcut: 'Ctrl+S', action: ide.saveCurrentFile },
      { label: 'Save All', shortcut: 'Ctrl+Shift+S', action: ide.saveAllFiles },
      { label: '', divider: true },
      { label: 'Export Project as ZIP...', shortcut: 'Ctrl+Shift+E', action: ide.exportProjectZip },
      { label: '', divider: true },
      { label: 'New Project...', action: () => ide.setShowProjectModal(true) },
      { label: 'Close Tab', shortcut: 'Ctrl+W', action: () => { if (ide.activeTabId) ide.closeTab(ide.activeTabId); } },
      { label: 'Close All Tabs', action: ide.closeAllTabs },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: () => document.execCommand('undo') },
      { label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: () => document.execCommand('redo') },
      { label: '', divider: true },
      { label: 'Cut', shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
      { label: 'Copy', shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
      { label: 'Paste', shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
      { label: '', divider: true },
      { label: 'Select All', shortcut: 'Ctrl+A', action: ide.selectAll },
      { label: 'Duplicate Line', shortcut: 'Ctrl+Shift+D', action: ide.duplicateLine },
      { label: '', divider: true },
      { label: 'Find in Files', shortcut: 'Ctrl+Shift+F', action: ide.findInFiles },
      { label: 'Format Document', shortcut: 'Shift+Alt+F', action: ide.formatDocument },
    ],
    View: [
      { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => ide.setActivityTab('explorer') },
      { label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => ide.setActivityTab('search') },
      { label: 'Source Control', shortcut: 'Ctrl+Shift+G', action: () => ide.setActivityTab('source-control') },
      { label: 'Debug', shortcut: 'Ctrl+Shift+D', action: () => ide.setActivityTab('debug') },
      { label: 'Extensions', shortcut: 'Ctrl+Shift+X', action: () => ide.setActivityTab('extensions') },
      { label: '', divider: true },
      { label: ide.sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar', shortcut: 'Ctrl+B', action: ide.toggleSidebar },
      { label: ide.bottomPanelOpen ? 'Hide Panel' : 'Show Panel', shortcut: 'Ctrl+`', action: ide.toggleBottomPanel },
      { label: '', divider: true },
      { label: `Word Wrap: ${ide.wordWrap ? 'ON' : 'OFF'}`, shortcut: 'Alt+Z', action: ide.toggleWordWrap },
      { label: '', divider: true },
      { label: 'Zoom In', shortcut: 'Ctrl+=', action: () => ide.setZoomLevel(ide.zoomLevel + 10) },
      { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => ide.setZoomLevel(ide.zoomLevel - 10) },
      { label: 'Reset Zoom', action: () => ide.setZoomLevel(100) },
      { label: '', divider: true },
      { label: 'Fullscreen', shortcut: 'F11', action: ide.toggleFullscreen },
    ],
    Terminal: [
      { label: 'New Terminal', shortcut: 'Ctrl+`', action: ide.openTerminalTab },
      { label: 'Clear Terminal', action: ide.clearTerminal },
      { label: '', divider: true },
      { label: 'Run Code', shortcut: 'F5', action: ide.runCode },
      { label: 'Start Debugging', shortcut: 'Ctrl+F5', action: ide.startDebug },
      { label: '', divider: true },
      { label: 'Show Terminal', action: () => ide.setBottomPanelTab('terminal') },
      { label: 'Show Output', action: () => ide.setBottomPanelTab('output') },
      { label: 'Show Problems', action: () => ide.setBottomPanelTab('problems') },
    ],
    Help: [
      { label: 'Keyboard Shortcuts', action: () => {
        ide.writeTerminal({ text: '', type: 'stdout' });
        ide.writeTerminal({ text: '=== Keyboard Shortcuts ===', type: 'info' });
        ide.writeTerminal({ text: 'Ctrl+S     Save File', type: 'stdout' });
        ide.writeTerminal({ text: 'Ctrl+N     New File', type: 'stdout' });
        ide.writeTerminal({ text: 'Ctrl+O     Import ZIP Project', type: 'stdout' });
        ide.writeTerminal({ text: 'Ctrl+Shift+E  Export ZIP', type: 'stdout' });
        ide.writeTerminal({ text: 'Ctrl+B     Toggle Sidebar', type: 'stdout' });
        ide.writeTerminal({ text: 'Ctrl+`     Toggle Terminal', type: 'stdout' });
        ide.writeTerminal({ text: 'F5         Run Code', type: 'stdout' });
        ide.writeTerminal({ text: 'Ctrl+F5    Start Debug', type: 'stdout' });
        ide.writeTerminal({ text: 'Alt+Z      Toggle Word Wrap', type: 'stdout' });
        ide.writeTerminal({ text: 'Ctrl+W     Close Tab', type: 'stdout' });
        ide.writeTerminal({ text: '', type: 'stdout' });
        ide.setBottomPanelTab('terminal');
      }},
      { label: 'About CloudFlow', action: () => {
        ide.writeTerminal({ text: '', type: 'stdout' });
        ide.writeTerminal({ text: '╔══════════════════════════════════════╗', type: 'info' });
        ide.writeTerminal({ text: '║       CloudFlow IDE v2.0.0          ║', type: 'info' });
        ide.writeTerminal({ text: '║  Cloud-based Development Platform   ║', type: 'info' });
        ide.writeTerminal({ text: '║  Built with React + Tailwind CSS    ║', type: 'info' });
        ide.writeTerminal({ text: '╚══════════════════════════════════════╝', type: 'info' });
        ide.writeTerminal({ text: '', type: 'stdout' });
        ide.setBottomPanelTab('terminal');
      }},
      { label: '', divider: true },
      { label: 'Go to Line...', shortcut: 'Ctrl+G', action: ide.goToLine },
    ],
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (ctrl && !shift && e.key === 's') {
        e.preventDefault();
        ide.saveCurrentFile();
      } else if (ctrl && shift && e.key === 'S') {
        e.preventDefault();
        ide.saveAllFiles();
      } else if (ctrl && !shift && e.key === 'n') {
        e.preventDefault();
        ide.newFile();
      } else if (ctrl && !shift && e.key === 'o') {
        e.preventDefault();
        ide.importProjectZip();
      } else if (ctrl && shift && e.key === 'E') {
        e.preventDefault();
        ide.exportProjectZip();
      } else if (ctrl && e.key === 'b') {
        e.preventDefault();
        ide.toggleSidebar();
      } else if (ctrl && e.key === '`') {
        e.preventDefault();
        ide.toggleBottomPanel();
      } else if (e.key === 'F5' && !ctrl) {
        e.preventDefault();
        ide.runCode();
      } else if (ctrl && e.key === 'F5') {
        e.preventDefault();
        ide.startDebug();
      } else if (e.altKey && e.key === 'z') {
        e.preventDefault();
        ide.toggleWordWrap();
      } else if (ctrl && e.key === 'w') {
        e.preventDefault();
        if (ide.activeTabId) ide.closeTab(ide.activeTabId);
      } else if (ctrl && e.key === 'g') {
        e.preventDefault();
        ide.goToLine();
      } else if (ctrl && shift && e.key === 'D') {
        e.preventDefault();
        ide.duplicateLine();
      } else if (ctrl && shift && e.key === 'F') {
        e.preventDefault();
        ide.findInFiles();
      } else if (e.key === 'F11') {
        e.preventDefault();
        ide.toggleFullscreen();
      } else if (ctrl && e.key === '=') {
        e.preventDefault();
        ide.setZoomLevel(ide.zoomLevel + 10);
      } else if (ctrl && e.key === '-') {
        e.preventDefault();
        ide.setZoomLevel(ide.zoomLevel - 10);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ide]);

  return (
    <div className="h-9 bg-[#3c3c3c] flex items-center justify-between px-2 border-b border-[#252526] flex-shrink-0 select-none">
      {/* Left: Menu buttons */}
      <div className="flex items-center gap-0 text-[12px] text-[#cccccc]">
        {Object.keys(menuItems).map(menu => (
          <div key={menu} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menu ? null : menu)}
              onMouseEnter={() => openMenu && setOpenMenu(menu)}
              className={`px-2.5 py-1 rounded text-[12px] transition-colors ${
                openMenu === menu ? 'bg-[#505050] text-white' : 'hover:bg-[#505050]'
              }`}
            >
              {menu}
            </button>
            <AnimatePresence>
              {openMenu === menu && (
                <DropdownMenu items={menuItems[menu]} onClose={() => setOpenMenu(null)} />
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Center: project name */}
      <div className="absolute left-1/2 -translate-x-1/2 text-[12px] text-[#999] flex items-center gap-1 pointer-events-none">
        {ide.projectName && (
          <>
            <span className="text-[#808080]">{ide.projectName}</span>
            <span className="text-[#555]">—</span>
          </>
        )}
        <span className="font-semibold text-[#ccc]">CloudFlow</span>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1">
        {/* Import/Export */}
        <button
          onClick={ide.importProjectZip}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-[#505050] text-[#ccc] hover:bg-[#606060] transition-colors"
          title="Import ZIP Project (Ctrl+O)"
        >
          <Upload size={13} />
        </button>
        <button
          onClick={ide.exportProjectZip}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-[#505050] text-[#ccc] hover:bg-[#606060] transition-colors"
          title="Export as ZIP (Ctrl+Shift+E)"
        >
          <Download size={13} />
        </button>

        <div className="w-px h-5 bg-[#555] mx-1" />

        {/* Preview */}
        {ide.projectLanguage === 'html' && (
          <button
            onClick={ide.togglePreview}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${
              ide.showPreview ? 'bg-[#007acc] text-white' : 'bg-[#505050] text-[#ccc] hover:bg-[#606060]'
            }`}
            title="Toggle Preview"
          >
            <Eye size={13} />
            Preview
          </button>
        )}

        {/* Save */}
        <button
          onClick={ide.saveCurrentFile}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-[#505050] text-[#ccc] hover:bg-[#606060] transition-colors"
          title="Save (Ctrl+S)"
        >
          <Save size={13} />
        </button>

        {/* Debug */}
        <button
          onClick={ide.startDebug}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-[#505050] text-[#ccc] hover:bg-[#606060] transition-colors"
          title="Debug (Ctrl+F5)"
        >
          <Bug size={13} />
        </button>

        {/* Run */}
        <button
          onClick={ide.runCode}
          className="flex items-center gap-1 px-3 py-1 rounded text-[11px] bg-[#2ea043] text-white hover:bg-[#3fb950] transition-colors"
          title="Run Code (F5)"
        >
          <Play size={13} />
          Run
        </button>

        {/* New Project */}
        <button
          onClick={() => ide.setShowProjectModal(true)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-[#505050] text-[#ccc] hover:bg-[#606060] transition-colors ml-1"
          title="New Project"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ============= PROJECT MODAL =============
export function ProjectModal() {
  const { showProjectModal, createProject, setShowProjectModal, projectName, importProjectZip } = useIDE();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!showProjectModal) return null;

  const categories = [...new Set(PROJECT_TEMPLATES.map(t => t.category))];
  const filtered = selectedCategory
    ? PROJECT_TEMPLATES.filter(t => t.category === selectedCategory)
    : PROJECT_TEMPLATES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl w-[780px] max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3c3c]">
          <div>
            <h2 className="text-xl font-semibold text-[#d4d4d4]">
              {projectName ? 'New Project' : 'Welcome to CloudFlow'}
            </h2>
            <p className="text-sm text-[#808080] mt-1">Choose a template or import a project</p>
          </div>
          <div className="flex items-center gap-2">
            {projectName && (
              <button
                onClick={() => setShowProjectModal(false)}
                className="p-1 rounded hover:bg-[#3c3c3c] text-[#808080] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Import from ZIP bar */}
        <div className="flex items-center gap-3 px-6 py-3 bg-[#1e1e1e] border-b border-[#3c3c3c]">
          <button
            onClick={() => {
              importProjectZip();
              setShowProjectModal(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#007acc] hover:bg-[#006bb3] text-white rounded text-sm transition-colors"
          >
            <Upload size={16} />
            Import from ZIP
          </button>
          <span className="text-[#808080] text-xs">or choose a template below</span>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 px-6 py-3 border-b border-[#3c3c3c] overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
              !selectedCategory ? 'bg-[#007acc] text-white' : 'bg-[#3c3c3c] text-[#808080] hover:text-[#d4d4d4]'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat ? 'bg-[#007acc] text-white' : 'bg-[#3c3c3c] text-[#808080] hover:text-[#d4d4d4]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-3">
            {filtered.map(template => (
              <button
                key={template.id}
                onClick={() => createProject(template.id)}
                className="group flex flex-col items-start p-4 bg-[#1e1e1e] hover:bg-[#2a2d2e] border border-[#3c3c3c] hover:border-[#007acc] rounded-lg transition-all text-left cursor-pointer"
              >
                <span className="text-2xl mb-2">{template.icon}</span>
                <span className="text-sm font-medium text-[#d4d4d4] group-hover:text-white">
                  {template.name}
                </span>
                <span className="text-xs text-[#808080] mt-1">{template.description}</span>
                <span className="text-[10px] text-[#555] mt-2 px-1.5 py-0.5 bg-[#252526] rounded">
                  {template.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============= ACTIVITY BAR =============
export function ActivityBar() {
  const { activityTab, setActivityTab } = useIDE();
  const tabs: { id: typeof activityTab; icon: React.ReactNode; label: string }[] = [
    { id: 'explorer', icon: <Files size={24} />, label: 'Explorer (Ctrl+Shift+E)' },
    { id: 'search', icon: <Search size={24} />, label: 'Search (Ctrl+Shift+F)' },
    { id: 'source-control', icon: <GitBranch size={24} />, label: 'Source Control (Ctrl+Shift+G)' },
    { id: 'debug', icon: <Bug size={24} />, label: 'Debug (Ctrl+Shift+D)' },
    { id: 'extensions', icon: <Puzzle size={24} />, label: 'Extensions (Ctrl+Shift+X)' },
  ];

  return (
    <div className="w-12 bg-[#333333] flex flex-col items-center pt-1 flex-shrink-0">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActivityTab(tab.id)}
          title={tab.label}
          className={`w-12 h-12 flex items-center justify-center transition-colors relative ${
            activityTab === tab.id
              ? 'text-white'
              : 'text-[#808080] hover:text-white'
          }`}
        >
          {activityTab === tab.id && (
            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-white rounded-r" />
          )}
          {tab.icon}
        </button>
      ))}
      <div className="flex-1" />
      <button
        title="Settings"
        className="w-12 h-12 flex items-center justify-center text-[#808080] hover:text-white transition-colors"
      >
        <Settings size={22} />
      </button>
    </div>
  );
}

// ============= SIDEBAR =============
export function Sidebar() {
  const { activityTab, sidebarOpen } = useIDE();

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-[#252526] border-r border-[#3c3c3c] flex flex-col overflow-hidden flex-shrink-0"
        >
          {activityTab === 'explorer' && <ExplorerPanel />}
          {activityTab === 'search' && <SearchPanel />}
          {activityTab === 'source-control' && <SourceControlPanel />}
          {activityTab === 'debug' && <DebugPanel />}
          {activityTab === 'extensions' && <ExtensionsPanel />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============= EXPLORER =============
function ExplorerPanel() {
  const { files, projectName, createFile, createFolder, setShowProjectModal, importProjectZip, exportProjectZip } = useIDE();
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [creatingName, setCreatingName] = useState('');

  const handleCreate = () => {
    if (!creatingName.trim()) { setCreatingType(null); return; }
    if (creatingType === 'file') createFile(null, creatingName);
    else createFolder(null, creatingName);
    setCreatingName('');
    setCreatingType(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
        <span>{projectName || 'Explorer'}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setCreatingType('file')}
            className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#808080] hover:text-white"
            title="New File (Ctrl+N)"
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={() => setCreatingType('folder')}
            className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#808080] hover:text-white"
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            onClick={importProjectZip}
            className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#808080] hover:text-white"
            title="Import ZIP"
          >
            <Upload size={14} />
          </button>
          <button
            onClick={exportProjectZip}
            className="p-0.5 rounded hover:bg-[#3c3c3c] text-[#808080] hover:text-white"
            title="Export ZIP"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto text-[13px]">
        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-[#808080] text-xs">
            <p className="mb-3">No project open</p>
            <button
              onClick={() => setShowProjectModal(true)}
              className="text-[#007acc] hover:underline text-xs block mx-auto mb-2"
            >
              Create New Project
            </button>
            <button
              onClick={importProjectZip}
              className="text-[#007acc] hover:underline text-xs block mx-auto"
            >
              Import from ZIP
            </button>
          </div>
        ) : (
          <>
            {creatingType && (
              <div className="flex items-center gap-1 px-4 py-1">
                {creatingType === 'folder' ? <Folder size={14} className="text-yellow-600" /> : <File size={14} className="text-gray-400" />}
                <input
                  autoFocus
                  value={creatingName}
                  onChange={e => setCreatingName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreatingType(null); }}
                  onBlur={handleCreate}
                  className="flex-1 bg-[#3c3c3c] text-[#d4d4d4] text-xs px-1.5 py-0.5 border border-[#007acc] rounded outline-none"
                  placeholder={`New ${creatingType}...`}
                />
              </div>
            )}
            {files.map(node => (
              <FileTreeNode key={node.id} node={node} depth={0} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function FileTreeNode({ node, depth }: { node: VFSNode; depth: number }) {
  const { openFile, activeTabId, deleteNode, renameNode, createFile, createFolder } = useIDE();
  const [expanded, setExpanded] = useState(depth < 2);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState(node.name);
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [creatingName, setCreatingName] = useState('');

  const handleClick = () => {
    if (node.type === 'folder') setExpanded(!expanded);
    else openFile(node.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRename = () => {
    if (renameName.trim() && renameName !== node.name) renameNode(node.id, renameName);
    setRenaming(false);
  };

  const handleCreate = () => {
    if (!creatingName.trim()) { setCreatingType(null); return; }
    if (creatingType === 'file') createFile(node.id, creatingName);
    else createFolder(node.id, creatingName);
    setCreatingName('');
    setCreatingType(null);
    setExpanded(true);
  };

  const isActive = node.id === activeTabId;

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`flex items-center gap-1 py-0.5 pr-2 cursor-pointer transition-colors ${
          isActive ? 'bg-[#37373d] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'
        }`}
        style={{ paddingLeft: depth * 16 + 8 }}
      >
        {node.type === 'folder' ? (
          <>
            {expanded ? <ChevronDown size={14} className="text-[#808080] flex-shrink-0" /> : <ChevronRight size={14} className="text-[#808080] flex-shrink-0" />}
            {getFileIcon(node.name, expanded)}
          </>
        ) : (
          <>
            <span className="w-3.5 flex-shrink-0" />
            {getFileIcon(node.name)}
          </>
        )}
        {renaming ? (
          <input
            autoFocus
            value={renameName}
            onChange={e => setRenameName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false); }}
            onBlur={handleRename}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-[#3c3c3c] text-[#d4d4d4] text-xs px-1 py-0 border border-[#007acc] rounded outline-none min-w-0"
          />
        ) : (
          <span className="truncate text-[13px] ml-1">{node.name}</span>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-[#252526] border border-[#454545] rounded shadow-xl py-1 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {node.type === 'folder' && (
              <>
                <ContextMenuItem
                  icon={<FilePlus size={14} />}
                  label="New File"
                  onClick={() => { setCreatingType('file'); setContextMenu(null); setExpanded(true); }}
                />
                <ContextMenuItem
                  icon={<FolderPlus size={14} />}
                  label="New Folder"
                  onClick={() => { setCreatingType('folder'); setContextMenu(null); setExpanded(true); }}
                />
                <div className="border-t border-[#454545] my-1" />
              </>
            )}
            {node.type === 'file' && (
              <>
                <ContextMenuItem
                  icon={<Copy size={14} />}
                  label="Copy Path"
                  onClick={() => { navigator.clipboard.writeText(node.name); setContextMenu(null); }}
                />
                <div className="border-t border-[#454545] my-1" />
              </>
            )}
            <ContextMenuItem
              icon={<Pencil size={14} />}
              label="Rename"
              shortcut="F2"
              onClick={() => { setRenaming(true); setRenameName(node.name); setContextMenu(null); }}
            />
            <ContextMenuItem
              icon={<Trash2 size={14} />}
              label="Delete"
              shortcut="Del"
              className="text-red-400 hover:text-red-300"
              onClick={() => { deleteNode(node.id); setContextMenu(null); }}
            />
          </div>
        </>
      )}

      {/* Children */}
      {node.type === 'folder' && expanded && (
        <>
          {creatingType && (
            <div className="flex items-center gap-1 py-0.5" style={{ paddingLeft: (depth + 1) * 16 + 8 }}>
              {creatingType === 'folder' ? <Folder size={14} className="text-yellow-600" /> : <File size={14} className="text-gray-400" />}
              <input
                autoFocus
                value={creatingName}
                onChange={e => setCreatingName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreatingType(null); }}
                onBlur={handleCreate}
                className="flex-1 bg-[#3c3c3c] text-[#d4d4d4] text-xs px-1.5 py-0.5 border border-[#007acc] rounded outline-none mr-2"
                placeholder={`New ${creatingType}...`}
              />
            </div>
          )}
          {node.children?.map(child => (
            <FileTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </>
      )}
    </div>
  );
}

function ContextMenuItem({ icon, label, onClick, className, shortcut }: {
  icon: React.ReactNode; label: string; onClick: () => void; className?: string; shortcut?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#cccccc] hover:bg-[#094771] transition-colors ${className || ''}`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {shortcut && <span className="text-[10px] text-[#808080]">{shortcut}</span>}
    </button>
  );
}

// ============= SEARCH PANEL =============
function SearchPanel() {
  const { searchQuery, setSearchQuery, searchResults, openFile } = useIDE();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
        Search
      </div>
      <div className="px-3 mb-2">
        <input
          autoFocus
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search in files..."
          className="w-full bg-[#3c3c3c] text-[#d4d4d4] text-xs px-2 py-1.5 rounded border border-[#3c3c3c] focus:border-[#007acc] outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto text-[12px]">
        {searchResults.length === 0 && searchQuery && (
          <div className="px-4 py-4 text-[#808080] text-xs">No results found</div>
        )}
        {searchResults.length > 0 && (
          <div className="px-4 py-1 text-[10px] text-[#808080]">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </div>
        )}
        {searchResults.map((r, i) => (
          <button
            key={i}
            onClick={() => openFile(r.fileId)}
            className="w-full text-left px-4 py-1.5 hover:bg-[#2a2d2e] transition-colors flex flex-col"
          >
            <div className="flex items-center gap-1">
              {getFileIcon(r.fileName)}
              <span className="text-[#d4d4d4] text-xs">{r.fileName}</span>
              <span className="text-[#808080] text-[10px] ml-auto">Ln {r.line}</span>
            </div>
            <div className="text-[#808080] text-[11px] truncate mt-0.5 ml-5">
              {r.text}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============= SOURCE CONTROL =============
function SourceControlPanel() {
  const { modifiedFiles, stagedFiles, stageFile, unstageFile, commit, commitMessage, setCommitMessage, commits, files } = useIDE();

  const getFileName = (id: string): string => {
    const find = (nodes: VFSNode[]): string | null => {
      for (const n of nodes) {
        if (n.id === id) return n.name;
        if (n.children) { const r = find(n.children); if (r) return r; }
      }
      return null;
    };
    return find(files) || id;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
        Source Control
      </div>

      {/* Commit input */}
      <div className="px-3 mb-2">
        <input
          type="text"
          value={commitMessage}
          onChange={e => setCommitMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); }}
          placeholder="Commit message..."
          className="w-full bg-[#3c3c3c] text-[#d4d4d4] text-xs px-2 py-1.5 rounded border border-[#3c3c3c] focus:border-[#007acc] outline-none"
        />
        <button
          onClick={commit}
          disabled={!commitMessage.trim() || stagedFiles.length === 0}
          className="w-full mt-1.5 px-3 py-1.5 bg-[#007acc] text-white text-xs rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#006bb3] transition-colors flex items-center justify-center gap-1"
        >
          <CheckCircle2 size={12} />
          Commit ({stagedFiles.length})
        </button>
      </div>

      {/* Staged */}
      {stagedFiles.length > 0 && (
        <div className="px-3 mb-2">
          <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-1">
            Staged Changes ({stagedFiles.length})
          </div>
          {stagedFiles.map(f => (
            <div key={f} className="flex items-center gap-1.5 py-0.5 text-xs text-[#73c991]">
              {getFileIcon(getFileName(f))}
              <span className="flex-1 truncate">{getFileName(f)}</span>
              <button onClick={() => unstageFile(f)} title="Unstage" className="p-0.5 hover:bg-[#3c3c3c] rounded">
                <Minus size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modified */}
      {modifiedFiles.length > 0 && (
        <div className="px-3 mb-2">
          <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-1">
            Changes ({modifiedFiles.filter(f => !stagedFiles.includes(f)).length})
          </div>
          {modifiedFiles.filter(f => !stagedFiles.includes(f)).map(f => (
            <div key={f} className="flex items-center gap-1.5 py-0.5 text-xs text-[#e2c08d]">
              {getFileIcon(getFileName(f))}
              <span className="flex-1 truncate">{getFileName(f)}</span>
              <button onClick={() => stageFile(f)} title="Stage" className="p-0.5 hover:bg-[#3c3c3c] rounded">
                <Plus size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {modifiedFiles.length === 0 && stagedFiles.length === 0 && (
        <div className="px-4 py-4 text-[#808080] text-xs">No changes detected</div>
      )}

      {/* Commit History */}
      {commits.length > 0 && (
        <div className="border-t border-[#3c3c3c] mt-2 pt-2 px-3 flex-1 overflow-y-auto">
          <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-1">
            <Clock size={10} className="inline mr-1" />
            History
          </div>
          {commits.map(c => (
            <div key={c.id} className="py-1.5 border-b border-[#3c3c3c] last:border-0">
              <div className="flex items-start gap-1.5">
                <GitCommitHorizontal size={12} className="text-[#007acc] mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-[#d4d4d4] truncate">{c.message}</div>
                  <div className="text-[10px] text-[#808080]">
                    {new Date(c.timestamp).toLocaleTimeString()} · {c.filesChanged.length} file(s)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============= DEBUG PANEL =============
function DebugPanel() {
  const { isDebugging, debugVariables, callStack, breakpoints, startDebug, debugStop } = useIDE();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase flex items-center justify-between">
        <span>Debug</span>
        {!isDebugging ? (
          <button onClick={startDebug} className="p-1 rounded hover:bg-[#3c3c3c] text-green-500" title="Start Debugging">
            <Play size={14} />
          </button>
        ) : (
          <button onClick={debugStop} className="p-1 rounded hover:bg-[#3c3c3c] text-red-500" title="Stop">
            <Square size={14} />
          </button>
        )}
      </div>

      {!isDebugging ? (
        <div className="px-4 py-6 text-center">
          <Bug size={32} className="text-[#808080] mx-auto mb-3 opacity-40" />
          <p className="text-xs text-[#808080] mb-2">No active debug session</p>
          <button
            onClick={startDebug}
            className="text-xs text-[#007acc] hover:underline"
          >
            Start Debugging (F5)
          </button>
          {breakpoints.length > 0 && (
            <p className="text-[10px] text-[#808080] mt-2">
              {breakpoints.length} breakpoint(s) set
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Variables */}
          <div className="px-3 mb-2">
            <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-1">Variables</div>
            {debugVariables.map((v, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5 text-xs">
                <span className="text-[#9cdcfe]">{v.name}</span>
                <span className="text-[#808080]">=</span>
                <span className={
                  v.type === 'string' ? 'text-[#ce9178]' :
                  v.type === 'number' ? 'text-[#b5cea8]' :
                  v.type === 'boolean' ? 'text-[#569cd6]' :
                  'text-[#d4d4d4]'
                }>{v.value}</span>
                <span className="text-[#555] text-[10px] ml-auto">{v.type}</span>
              </div>
            ))}
          </div>

          {/* Call Stack */}
          <div className="px-3 border-t border-[#3c3c3c] pt-2">
            <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-1">Call Stack</div>
            {callStack.map((frame, i) => (
              <div key={i} className={`flex items-center gap-1.5 py-0.5 text-xs ${i === 0 ? 'text-[#d4d4d4]' : 'text-[#808080]'}`}>
                <ArrowDown size={10} className={i === 0 ? 'text-yellow-500' : 'text-[#555]'} />
                <span className="text-[#dcdcaa]">{frame.name}</span>
                <span className="text-[#808080] text-[10px] ml-auto">{frame.file}:{frame.line}</span>
              </div>
            ))}
          </div>

          {/* Breakpoints list */}
          <div className="px-3 border-t border-[#3c3c3c] pt-2 mt-2">
            <div className="text-[10px] text-[#808080] uppercase tracking-wider mb-1">Breakpoints</div>
            {breakpoints.map((bp, i) => (
              <div key={i} className="flex items-center gap-1.5 py-0.5 text-xs text-[#d4d4d4]">
                <Circle size={8} className="text-red-500 fill-red-500" />
                <span>Line {bp.line}</span>
              </div>
            ))}
            {breakpoints.length === 0 && (
              <div className="text-[10px] text-[#808080]">No breakpoints</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============= EXTENSIONS PANEL =============
function ExtensionsPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [installed, setInstalled] = useState<Set<string>>(new Set(['Python', 'ESLint', 'Prettier', 'GitLens', 'Live Server']));

  const extensions = [
    { name: 'Python', author: 'Microsoft', desc: 'IntelliSense, linting, debugging' },
    { name: 'ESLint', author: 'Microsoft', desc: 'JavaScript linter integration' },
    { name: 'Prettier', author: 'Prettier', desc: 'Code formatter' },
    { name: 'Rust Analyzer', author: 'rust-lang', desc: 'Rust language support' },
    { name: 'C/C++', author: 'Microsoft', desc: 'C/C++ IntelliSense, debugging' },
    { name: 'Go', author: 'Go Team', desc: 'Go language support' },
    { name: 'GitLens', author: 'GitKraken', desc: 'Git supercharged' },
    { name: 'Docker', author: 'Microsoft', desc: 'Docker support' },
    { name: 'Thunder Client', author: 'Ranga V', desc: 'REST API client' },
    { name: 'Live Server', author: 'Ritwick Dey', desc: 'Launch dev local server' },
    { name: 'Tailwind CSS', author: 'Tailwind Labs', desc: 'Tailwind IntelliSense' },
    { name: 'Path Intellisense', author: 'Christian Kohler', desc: 'Autocomplete filenames' },
  ];

  const filtered = searchTerm
    ? extensions.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.desc.toLowerCase().includes(searchTerm.toLowerCase()))
    : extensions;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
        Extensions
      </div>
      <div className="px-3 mb-2">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search extensions..."
          className="w-full bg-[#3c3c3c] text-[#d4d4d4] text-xs px-2 py-1.5 rounded border border-[#3c3c3c] focus:border-[#007acc] outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((ext, i) => (
          <div key={i} className="flex items-start gap-2 px-3 py-2 hover:bg-[#2a2d2e] transition-colors">
            <Puzzle size={28} className="text-[#007acc] flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-[#d4d4d4] font-medium">{ext.name}</div>
              <div className="text-[10px] text-[#808080]">{ext.author}</div>
              <div className="text-[10px] text-[#666] mt-0.5">{ext.desc}</div>
            </div>
            <button
              onClick={() => {
                setInstalled(prev => {
                  const next = new Set(prev);
                  if (next.has(ext.name)) next.delete(ext.name);
                  else next.add(ext.name);
                  return next;
                });
              }}
              className={`text-[10px] px-2 py-0.5 rounded flex-shrink-0 transition-colors ${
                installed.has(ext.name)
                  ? 'bg-[#3c3c3c] text-[#808080] hover:bg-[#555] hover:text-white'
                  : 'bg-[#007acc] text-white hover:bg-[#006bb3]'
              }`}
            >
              {installed.has(ext.name) ? 'Installed' : 'Install'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= DEBUG TOOLBAR =============
export function DebugToolbar() {
  const { isDebugging, debugPaused, debugContinue, debugStepOver, debugStepInto, debugStepOut, debugRestart, debugStop } = useIDE();

  if (!isDebugging) return null;

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      className="absolute top-0 left-1/2 -translate-x-1/2 z-30 bg-[#3c3c3c] border border-[#555] rounded-b-lg px-2 py-1 flex items-center gap-0.5 shadow-lg"
    >
      <DebugBtn onClick={debugContinue} title={debugPaused ? "Continue (F5)" : "Pause"} color="text-green-400">
        {debugPaused ? <Play size={16} /> : <Square size={16} />}
      </DebugBtn>
      <DebugBtn onClick={debugStepOver} title="Step Over (F10)" color="text-blue-400">
        <SkipForward size={16} />
      </DebugBtn>
      <DebugBtn onClick={debugStepInto} title="Step Into (F11)" color="text-blue-400">
        <StepForward size={16} />
      </DebugBtn>
      <DebugBtn onClick={debugStepOut} title="Step Out (Shift+F11)" color="text-blue-400">
        <StepBack size={16} />
      </DebugBtn>
      <DebugBtn onClick={debugRestart} title="Restart (Ctrl+Shift+F5)" color="text-green-400">
        <RotateCcw size={16} />
      </DebugBtn>
      <DebugBtn onClick={debugStop} title="Stop (Shift+F5)" color="text-red-400">
        <Square size={16} />
      </DebugBtn>
    </motion.div>
  );
}

function DebugBtn({ children, onClick, title, color }: { children: React.ReactNode; onClick: () => void; title: string; color: string }) {
  return (
    <button onClick={onClick} title={title} className={`p-1.5 rounded hover:bg-[#555] transition-colors ${color}`}>
      {children}
    </button>
  );
}

// ============= EDITOR TABS =============
export function EditorTabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab, closeOtherTabs, closeAllTabs } = useIDE();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);

  if (openTabs.length === 0) return null;

  return (
    <>
      <div className="flex bg-[#252526] border-b border-[#3c3c3c] overflow-x-auto flex-shrink-0">
        {openTabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] cursor-pointer border-r border-[#3c3c3c] select-none min-w-0 flex-shrink-0 group ${
              tab.id === activeTabId
                ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]'
                : 'bg-[#2d2d2d] text-[#808080] hover:bg-[#2a2d2e] border-t-2 border-t-transparent'
            }`}
          >
            {getFileIcon(tab.name)}
            <span className="truncate max-w-[120px]">{tab.name}</span>
            {tab.modified && <span className="text-[#e2c08d] text-lg leading-none ml-0.5">●</span>}
            <button
              onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
              className="ml-1 p-0.5 rounded hover:bg-[#555] text-[#808080] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Tab context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-[#252526] border border-[#454545] rounded shadow-xl py-1 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <ContextMenuItem
              icon={<X size={14} />}
              label="Close"
              shortcut="Ctrl+W"
              onClick={() => { closeTab(contextMenu.tabId); setContextMenu(null); }}
            />
            <ContextMenuItem
              icon={<X size={14} />}
              label="Close Others"
              onClick={() => { closeOtherTabs(contextMenu.tabId); setContextMenu(null); }}
            />
            <ContextMenuItem
              icon={<X size={14} />}
              label="Close All"
              onClick={() => { closeAllTabs(); setContextMenu(null); }}
            />
          </div>
        </>
      )}
    </>
  );
}

// ============= SYNTAX HIGHLIGHTED CODE EDITOR =============
export function CodeEditor() {
  const {
    activeTabId, activeFileContent, updateFileContent, setCursorPosition,
    breakpoints, toggleBreakpoint, currentDebugLine, isDebugging,
    openTabs, showPreview, projectLanguage, files, wordWrap, zoomLevel,
    problems,
  } = useIDE();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const lines = activeFileContent.split('\n');
  const activeTab = openTabs.find(t => t.id === activeTabId);
  const lang = activeTab?.language || 'text';
  const fileBreakpoints = breakpoints.filter(b => b.fileId === activeTabId).map(b => b.line);

  // Error lines for gutter markers
  const errorLines = useMemo(() => {
    const map = new Map<number, 'error' | 'warning' | 'info'>();
    for (const p of problems) {
      const existing = map.get(p.line);
      if (!existing || (p.severity === 'error') || (p.severity === 'warning' && existing !== 'error')) {
        map.set(p.line, p.severity);
      }
    }
    return map;
  }, [problems]);

  // Tokenized lines for syntax highlighting
  const highlightedLines = useMemo(() => {
    return lines.map(line => tokenizeLine(line, lang));
  }, [lines, lang]);

  const handleScroll = () => {
    if (textareaRef.current) {
      if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      if (highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  };

  const handleCursorChange = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = activeFileContent.substring(0, pos);
    const line = textBefore.split('\n').length;
    const lastNewline = textBefore.lastIndexOf('\n');
    const col = pos - lastNewline;
    setCursorPosition(line, col);
  };

  const getPreviewHtml = useCallback(() => {
    if (projectLanguage !== 'html') return '';
    const findFile = (nodes: VFSNode[], name: string): string => {
      for (const n of nodes) {
        if (n.name === name && n.type === 'file') return n.content || '';
        if (n.children) { const r = findFile(n.children, name); if (r) return r; }
      }
      return '';
    };
    let html = findFile(files, 'index.html') || activeFileContent;
    const css = findFile(files, 'style.css');
    const js = findFile(files, 'app.js');
    if (css && !html.includes('<style>')) html = html.replace('</head>', `<style>${css}</style></head>`);
    if (js) html = html.replace(/<script\s+src=["']app\.js["']><\/script>/g, `<script>${js}<\/script>`);
    return html;
  }, [projectLanguage, files, activeFileContent]);

  if (!activeTabId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center text-[#808080]">
          <FileCode size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-1">CloudFlow IDE</p>
          <p className="text-xs mb-4">Open a file from the Explorer to start editing</p>
          <div className="text-[11px] text-[#555] space-y-1">
            <p><kbd className="px-1.5 py-0.5 bg-[#333] rounded text-[#999]">Ctrl+N</kbd> New File</p>
            <p><kbd className="px-1.5 py-0.5 bg-[#333] rounded text-[#999]">Ctrl+O</kbd> Import ZIP Project</p>
            <p><kbd className="px-1.5 py-0.5 bg-[#333] rounded text-[#999]">Ctrl+S</kbd> Save File</p>
            <p><kbd className="px-1.5 py-0.5 bg-[#333] rounded text-[#999]">F5</kbd> Run Code</p>
          </div>
        </div>
      </div>
    );
  }

  const editorFontSize = Math.round(13 * (zoomLevel / 100));
  const lineHeight = Math.round(21 * (zoomLevel / 100));

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className={`flex flex-1 min-w-0 ${showPreview && projectLanguage === 'html' ? 'w-1/2' : ''}`}>
        {/* Line numbers + breakpoint/error gutter */}
        <div
          ref={lineNumbersRef}
          className="bg-[#1e1e1e] text-right pr-2 pl-1 select-none overflow-hidden flex-shrink-0 pt-0 border-r border-[#3c3c3c]"
          style={{ width: '64px' }}
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const hasBp = fileBreakpoints.includes(lineNum);
            const isDebugLine = isDebugging && currentDebugLine === lineNum;
            const errorSev = errorLines.get(lineNum);
            return (
              <div
                key={i}
                className={`cursor-pointer flex items-center justify-end gap-0.5 group relative ${
                  isDebugLine ? 'bg-[#ffcc0020]' : ''
                }`}
                style={{ lineHeight: `${lineHeight}px`, fontSize: `${editorFontSize}px` }}
                onClick={() => toggleBreakpoint(lineNum)}
              >
                {/* Error/warning indicator */}
                {errorSev && !hasBp && !isDebugLine && (
                  <div className={`w-1 h-3 rounded-sm mr-0.5 flex-shrink-0 ${
                    errorSev === 'error' ? 'bg-red-500' : errorSev === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                )}
                {hasBp && (
                  <Circle size={8} className="text-red-500 fill-red-500 flex-shrink-0" />
                )}
                {isDebugLine && !hasBp && (
                  <ArrowDown size={10} className="text-yellow-500 flex-shrink-0" />
                )}
                {/* Hover breakpoint indicator */}
                {!hasBp && !isDebugLine && !errorSev && (
                  <Circle size={8} className="text-red-500/0 group-hover:text-red-500/40 flex-shrink-0 transition-colors" />
                )}
                <span className={`font-mono ${
                  isDebugLine ? 'text-yellow-300' : hasBp ? 'text-red-300' : 'text-[#858585]'
                }`}>
                  {lineNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Editor container with highlight overlay + textarea */}
        <div className="flex-1 relative overflow-hidden">
          {/* Debug line highlight */}
          {isDebugging && currentDebugLine && (
            <div
              className="absolute left-0 right-0 bg-[#ffcc0015] border-l-2 border-yellow-500 pointer-events-none z-20"
              style={{ top: (currentDebugLine - 1) * lineHeight, height: lineHeight }}
            />
          )}

          {/* Syntax highlight overlay (rendered HTML, not editable) */}
          <div
            ref={highlightRef}
            className="absolute inset-0 overflow-hidden pointer-events-none font-mono pl-4 pt-0"
            style={{ fontSize: `${editorFontSize}px`, lineHeight: `${lineHeight}px`, whiteSpace: wordWrap ? 'pre-wrap' : 'pre', wordBreak: wordWrap ? 'break-all' : 'normal' }}
            aria-hidden="true"
          >
            {highlightedLines.map((tokens, i) => (
              <div key={i} style={{ height: `${lineHeight}px` }}>
                {tokens.map((token, j) => (
                  <span key={j} style={{ color: tokenColor(token.type) }}>
                    {token.text}
                  </span>
                ))}
                {tokens.length === 0 && <span>&nbsp;</span>}
              </div>
            ))}
          </div>

          {/* Actual textarea (invisible text, visible caret) */}
          <textarea
            ref={textareaRef}
            value={activeFileContent}
            onChange={e => updateFileContent(e.target.value)}
            onScroll={handleScroll}
            onClick={handleCursorChange}
            onKeyUp={handleCursorChange}
            spellCheck={false}
            className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none p-0 pl-4 pt-0 font-mono overflow-auto z-10"
            style={{
              tabSize: 2,
              caretColor: '#d4d4d4',
              color: 'transparent',
              fontSize: `${editorFontSize}px`,
              lineHeight: `${lineHeight}px`,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              wordBreak: wordWrap ? 'break-all' : 'normal',
            }}
          />

          {/* Error squiggles (rendered as colored underlines under problem lines) */}
          {problems.length > 0 && (
            <div className="absolute inset-0 pointer-events-none z-15 pl-4" style={{ fontSize: `${editorFontSize}px`, lineHeight: `${lineHeight}px` }}>
              {problems.slice(0, 50).map((p, idx) => {
                if (p.line > lines.length) return null;
                const lineText = lines[p.line - 1] || '';
                const col = Math.max(0, p.col - 1);
                // Determine squiggle width
                const wordMatch = lineText.substring(col).match(/^[\w.!]+/);
                const squiggleLen = wordMatch ? wordMatch[0].length : Math.max(1, Math.min(lineText.length - col, 8));
                const charWidth = editorFontSize * 0.6;
                return (
                  <div
                    key={idx}
                    className="absolute"
                    style={{
                      top: (p.line - 1) * lineHeight + lineHeight - 3,
                      left: col * charWidth,
                      width: squiggleLen * charWidth,
                      height: 2,
                      backgroundImage: p.severity === 'error'
                        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='2'%3E%3Cpath d='M0 1 Q1 0 2 1 Q3 2 4 1' stroke='%23f44' fill='none' stroke-width='0.7'/%3E%3C/svg%3E")`
                        : p.severity === 'warning'
                        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='2'%3E%3Cpath d='M0 1 Q1 0 2 1 Q3 2 4 1' stroke='%23fa0' fill='none' stroke-width='0.7'/%3E%3C/svg%3E")`
                        : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='2'%3E%3Cpath d='M0 1 Q1 0 2 1 Q3 2 4 1' stroke='%2348f' fill='none' stroke-width='0.7'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat-x',
                    }}
                    title={`${p.severity}: ${p.message}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && projectLanguage === 'html' && (
        <div className="w-1/2 border-l border-[#3c3c3c] flex flex-col bg-white">
          <div className="bg-[#252526] text-[11px] text-[#808080] px-3 py-1 border-b border-[#3c3c3c] flex items-center gap-1.5">
            <Eye size={12} />
            App Preview
            <button
              onClick={() => {
                const iframe = document.querySelector('iframe[title="preview"]') as HTMLIFrameElement;
                if (iframe) iframe.srcdoc = getPreviewHtml();
              }}
              className="ml-auto p-0.5 rounded hover:bg-[#3c3c3c] text-[#808080] hover:text-white"
              title="Refresh"
            >
              <RotateCw size={12} />
            </button>
          </div>
          <iframe
            srcDoc={getPreviewHtml()}
            className="flex-1 w-full border-none"
            sandbox="allow-scripts"
            title="preview"
          />
        </div>
      )}
    </div>
  );
}

// ============= BOTTOM PANEL =============
export function BottomPanel() {
  const {
    bottomPanelOpen, bottomPanelTab, setBottomPanelTab, toggleBottomPanel,
    bottomPanelHeight, setBottomPanelHeight,
    terminalLines, clearTerminal, problems,
  } = useIDE();
  const resizeRef = useRef<{ startY: number; startH: number } | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines.length]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { startY: e.clientY, startH: bottomPanelHeight };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const diff = resizeRef.current.startY - ev.clientY;
      setBottomPanelHeight(resizeRef.current.startH + diff);
    };
    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const tabs: { id: typeof bottomPanelTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'terminal', label: 'Terminal', icon: <TermIcon size={14} /> },
    { id: 'output', label: 'Output', icon: <SquareTerminal size={14} /> },
    { id: 'debug-console', label: 'Debug Console', icon: <Bug size={14} /> },
    { id: 'problems', label: 'Problems', icon: <AlertTriangle size={14} />, badge: problems.length || undefined },
  ];

  return (
    <AnimatePresence>
      {bottomPanelOpen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: bottomPanelHeight }}
          exit={{ height: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-[#1e1e1e] border-t border-[#3c3c3c] flex flex-col overflow-hidden flex-shrink-0"
        >
          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className="h-1 cursor-ns-resize bg-transparent hover:bg-[#007acc] transition-colors flex-shrink-0"
          />

          {/* Tabs */}
          <div className="flex items-center bg-[#252526] border-b border-[#3c3c3c] px-2 flex-shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setBottomPanelTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] transition-colors uppercase tracking-wider ${
                  bottomPanelTab === tab.id
                    ? 'text-white border-b border-white'
                    : 'text-[#808080] hover:text-[#cccccc]'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-[#007acc] text-white text-[9px] px-1.5 py-0 rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
            <div className="flex-1" />
            {bottomPanelTab === 'terminal' && (
              <button
                onClick={clearTerminal}
                className="p-1 rounded hover:bg-[#3c3c3c] text-[#808080] hover:text-white mr-1"
                title="Clear Terminal"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={toggleBottomPanel}
              className="p-1 rounded hover:bg-[#3c3c3c] text-[#808080] hover:text-white"
              title="Close Panel"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto font-mono text-[12px] p-2">
            {bottomPanelTab === 'terminal' && (
              <div>
                {terminalLines.map((line, i) => (
                  <div key={i} className={`leading-[18px] whitespace-pre-wrap ${
                    line.type === 'stderr' ? 'text-red-400' :
                    line.type === 'command' ? 'text-[#dcdcaa]' :
                    line.type === 'info' ? 'text-[#569cd6]' :
                    'text-[#d4d4d4]'
                  }`}>
                    {line.text}
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            )}
            {bottomPanelTab === 'output' && (
              <div className="text-[#808080]">
                <div className="leading-[18px]">[CloudFlow Output Channel]</div>
                <div className="leading-[18px]">Build output will appear here when you run your project.</div>
              </div>
            )}
            {bottomPanelTab === 'debug-console' && (
              <div className="text-[#808080]">
                <div className="leading-[18px]">[Debug Console]</div>
                <div className="leading-[18px]">Start a debug session to use the console.</div>
              </div>
            )}
            {bottomPanelTab === 'problems' && (
              <div>
                {problems.length === 0 ? (
                  <div className="text-[#808080] leading-[18px]">No problems detected.</div>
                ) : (
                  problems.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 leading-[22px]">
                      {p.severity === 'error' ? (
                        <FileWarning size={14} className="text-red-500 flex-shrink-0" />
                      ) : p.severity === 'warning' ? (
                        <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
                      ) : (
                        <Info size={14} className="text-blue-500 flex-shrink-0" />
                      )}
                      <span className={
                        p.severity === 'error' ? 'text-red-400' :
                        p.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                      }>{p.message}</span>
                      <span className="text-[#808080] text-[10px] ml-auto">{p.file}:{p.line}:{p.col}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============= STATUS BAR =============
export function StatusBar() {
  const {
    cursorLine, cursorCol, openTabs, activeTabId, gitBranch,
    isDebugging, bottomPanelOpen, toggleBottomPanel, problems,
    projectLanguage, wordWrap, zoomLevel, setBottomPanelTab,
  } = useIDE();
  const activeTab = openTabs.find(t => t.id === activeTabId);
  const lang = activeTab?.language || projectLanguage || 'plaintext';
  const desktopOnly = new Set(['kotlin', 'csharp', 'swift', 'cpp', 'c', 'rust', 'go']);
  const isDesktopLang = desktopOnly.has(lang);
  const errorCount = problems.filter(p => p.severity === 'error').length;
  const warnCount = problems.filter(p => p.severity === 'warning').length;

  return (
    <div className={`h-6 flex items-center justify-between px-3 text-[11px] flex-shrink-0 ${
      isDebugging ? 'bg-[#cc6633]' : errorCount > 0 ? 'bg-[#c23b22]' : 'bg-[#007acc]'
    } text-white`}>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 cursor-pointer hover:bg-white/10 px-1 rounded">
          <GitBranch size={12} />
          {gitBranch}
        </span>
        {(errorCount > 0 || warnCount > 0) && (
          <button
            onClick={() => { setBottomPanelTab('problems'); }}
            className="flex items-center gap-1 hover:bg-white/10 px-1 rounded"
          >
            {errorCount > 0 && (
              <span className="flex items-center gap-0.5">
                <AlertTriangle size={11} />
                {errorCount}
              </span>
            )}
            {warnCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Info size={11} />
                {warnCount}
              </span>
            )}
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span>Ln {cursorLine}, Col {cursorCol}</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        <span className="capitalize flex items-center gap-1">
          {lang}
          {isDesktopLang && (
            <span className="text-[9px] bg-white/20 px-1 rounded" title="Requires desktop workspace to run">Desktop Only</span>
          )}
        </span>
        {wordWrap && <span className="opacity-70">Wrap</span>}
        {zoomLevel !== 100 && <span className="opacity-70">{zoomLevel}%</span>}
        <button
          onClick={toggleBottomPanel}
          className="flex items-center gap-0.5 hover:bg-white/10 px-1 rounded"
        >
          {bottomPanelOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          <PanelBottom size={12} />
        </button>
      </div>
    </div>
  );
}

// ============= MINIMAP (visual only) =============
export function Minimap() {
  const { activeFileContent, activeTabId } = useIDE();
  if (!activeTabId) return null;

  const lines = activeFileContent.split('\n');
  const maxVisibleLines = 100;
  const displayLines = lines.slice(0, maxVisibleLines);

  return (
    <div className="w-[60px] bg-[#1e1e1e] border-l border-[#3c3c3c] overflow-hidden flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
      <div className="p-1">
        {displayLines.map((line, i) => (
          <div
            key={i}
            className="h-[2px] mb-[1px] rounded-sm"
            style={{
              width: `${Math.min(line.length * 0.8, 50)}px`,
              backgroundColor: line.trim() ? 'rgba(212,212,212,0.15)' : 'transparent',
            }}
          />
        ))}
      </div>
    </div>
  );
}
