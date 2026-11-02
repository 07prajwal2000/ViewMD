import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { TabsProvider } from './context/TabsContext';
import { SearchProvider } from './context/SearchContext';
import { EditorSettingsProvider } from './context/EditorSettingsContext';
import { initializePlugins } from './plugins';

// Initialize modular viewer plugins (Markdown, PDF, etc.)
initializePlugins();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <EditorSettingsProvider>
        <WorkspaceProvider>
          <TabsProvider>
            <SearchProvider>
              <App />
            </SearchProvider>
          </TabsProvider>
        </WorkspaceProvider>
      </EditorSettingsProvider>
    </ThemeProvider>
  </StrictMode>
);
