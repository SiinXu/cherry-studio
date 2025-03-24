import '@renderer/databases'

import store, { persistor } from '@renderer/store'
import { Provider } from 'react-redux'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { Layout } from '../../../src/components'

import Sidebar from './components/app/Sidebar'
import AntdProvider from './context/AntdProvider'
import StyleSheetManager from './context/StyleSheetManager'
import { SyntaxHighlighterProvider } from './context/SyntaxHighlighterProvider'
import { ThemeProvider } from './context/ThemeProvider'
import NavigationHandler from './handler/NavigationHandler'
import AgentsPage from './pages/agents/AgentsPage'
import AppsPage from './pages/apps/AppsPage'
import DemoPage from './pages/demo/DemoPage'
import FilesPage from './pages/files/FilesPage'
import HomePage from './pages/home/HomePage'
import KnowledgePage from './pages/knowledge/KnowledgePage'
import PaintingsPage from './pages/paintings/PaintingsPage'
import SettingsPage from './pages/settings/SettingsPage'
import TranslatePage from './pages/translate/TranslatePage'
import './App.css'

function App(): JSX.Element {
  return (
    <Provider store={store}>
      <StyleSheetManager>
        <ThemeProvider>
          <AntdProvider>
            <SyntaxHighlighterProvider>
              <PersistGate loading={null} persistor={persistor}>
                <Layout className="rb-app">
                  <HashRouter>
                    <NavigationHandler />
                    <Sidebar />
                    <Layout.Main className="rb-app-content">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/agents" element={<AgentsPage />} />
                        <Route path="/paintings" element={<PaintingsPage />} />
                        <Route path="/translate" element={<TranslatePage />} />
                        <Route path="/files" element={<FilesPage />} />
                        <Route path="/knowledge" element={<KnowledgePage />} />
                        <Route path="/apps" element={<AppsPage />} />
                        <Route path="/settings/*" element={<SettingsPage />} />
                        <Route path="/demo" element={<DemoPage />} />
                      </Routes>
                    </Layout.Main>
                  </HashRouter>
                </Layout>
              </PersistGate>
            </SyntaxHighlighterProvider>
          </AntdProvider>
        </ThemeProvider>
      </StyleSheetManager>
    </Provider>
  )
}

export default App
