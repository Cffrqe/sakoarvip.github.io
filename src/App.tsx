import { IDEProvider } from './ide/IDEContext';
import {
  ProjectModal, ActivityBar, Sidebar, TopBar, EditorTabs,
  CodeEditor, Minimap, BottomPanel, StatusBar, DebugToolbar,
} from './ide/components';

export function App() {
  return (
    <IDEProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#1e1e1e] font-['Segoe_UI',system-ui,sans-serif]">
        {/* Top Menu Bar */}
        <TopBar />

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Debug floating toolbar */}
          <DebugToolbar />

          {/* Activity Bar (far left) */}
          <ActivityBar />

          {/* Sidebar */}
          <Sidebar />

          {/* Editor + Bottom Panel area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Editor Tabs */}
            <EditorTabs />

            {/* Editor area */}
            <div className="flex-1 flex overflow-hidden">
              <CodeEditor />
              <Minimap />
            </div>

            {/* Bottom Panel */}
            <BottomPanel />
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar />

        {/* Project Modal Overlay */}
        <ProjectModal />
      </div>
    </IDEProvider>
  );
}
