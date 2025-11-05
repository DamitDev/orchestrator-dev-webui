import { Link, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useMode } from './state/ModeContext'
import Inbox from './pages/Inbox'
import Tasks from './pages/Tasks'
import CreateTask from './pages/CreateTask'
import WorkflowTickets from './pages/workflows/Tickets'
import WorkflowMatrix from './pages/workflows/Matrix'
import WorkflowProactive from './pages/workflows/Proactive'
import WorkflowInteractive from './pages/workflows/Interactive'
import TaskDetail from './pages/task/TaskDetail'
import ConfigModels from './pages/config/Models'
import ConfigLLM from './pages/config/LLMBackends'
import ConfigMCP from './pages/config/MCPServers'
import ConfigTaskHandler from './pages/config/TaskHandler'
import ConfigTools from './pages/config/ToolsExplorer'
import ConfigSystem from './pages/config/System'
import ConfigAuth from './pages/config/Auth'
import Events from './pages/Events'
import Preferences from './pages/Preferences'
import GlobalShortcuts from './components/GlobalShortcuts'

function Header() {
  const { mode, toggle } = useMode()
  const location = useLocation()
  const [wfOpen, setWfOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const initialDark = stored ? stored === 'dark' : document.documentElement.classList.contains('dark')
    setIsDark(initialDark)
    document.documentElement.classList.toggle('dark', initialDark)
  }, [])
  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }
  const navItem = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      {label}
    </NavLink>
  )
  return (
    <header className="bg-white border-b dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-primary-700">Orchestrator</Link>
            <nav className="hidden md:flex items-center gap-2">
              {navItem('/', 'Inbox')}
              <div className="relative">
                <button onClick={() => setWfOpen(o => !o)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Workflows</button>
                {wfOpen && (
                  <div className="absolute z-10 mt-1 w-44 bg-white border rounded shadow">
                    <div className="py-1 text-sm">
                      <NavLink to="/workflows/tickets" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setWfOpen(false)}>Tickets</NavLink>
                      <NavLink to="/workflows/matrix" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setWfOpen(false)}>Matrix</NavLink>
                      <NavLink to="/workflows/proactive" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setWfOpen(false)}>Proactive</NavLink>
                      <NavLink to="/workflows/interactive" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setWfOpen(false)}>Interactive</NavLink>
                    </div>
                  </div>
                )}
              </div>
              {navItem('/tasks', 'Tasks')}
              {navItem('/create', 'Create')}
              <div className="relative">
                <button onClick={() => setSettingsOpen(o => !o)} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Settings</button>
                {settingsOpen && (
                  <div className="absolute z-10 mt-1 w-52 bg-white border rounded shadow">
                    <div className="py-1 text-sm">
                      <NavLink to="/config/models" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setSettingsOpen(false)}>Models</NavLink>
                      <NavLink to="/config/llm-backends" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setSettingsOpen(false)}>LLM Backends</NavLink>
                      <NavLink to="/config/mcp-servers" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setSettingsOpen(false)}>MCP Servers</NavLink>
                      <NavLink to="/config/task-handler" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setSettingsOpen(false)}>Task Handler</NavLink>
                      <NavLink to="/config/tools" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setSettingsOpen(false)}>Tools Explorer</NavLink>
                      <NavLink to="/config/system" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setSettingsOpen(false)}>System</NavLink>
                      <NavLink to="/config/auth" className={({isActive}) => `block px-3 py-1.5 ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}`} onClick={() => setSettingsOpen(false)}>Auth</NavLink>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline">{location.pathname}</span>
            <button onClick={toggleTheme} className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50">
              {isDark ? 'Light' : 'Dark'} Theme
            </button>
            <button onClick={toggle} className="px-3 py-2 text-sm rounded-md border hover:bg-gray-50">
              {mode === 'simple' ? 'Simple' : 'Expert'} Mode
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

function ConfigLayout() {
  const tab = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      {label}
    </NavLink>
  )
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tab('/config/models', 'Models')}
        {tab('/config/llm-backends', 'LLM Backends')}
        {tab('/config/mcp-servers', 'MCP Servers')}
        {tab('/config/task-handler', 'Task Handler')}
        {tab('/config/tools', 'Tools Explorer')}
        {tab('/config/system', 'System')}
        {tab('/config/auth', 'Auth')}
      </div>
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <GlobalShortcuts />
      <Header />
      <main className="flex-1 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Inbox />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/create" element={<CreateTask />} />

            <Route path="/workflows/tickets" element={<WorkflowTickets />} />
            <Route path="/workflows/matrix" element={<WorkflowMatrix />} />
            <Route path="/workflows/proactive" element={<WorkflowProactive />} />
            <Route path="/workflows/interactive" element={<WorkflowInteractive />} />

            <Route path="/task/:id" element={<TaskDetail />} />

            <Route path="/config" element={<ConfigLayout />}>
              <Route path="models" element={<ConfigModels />} />
              <Route path="llm-backends" element={<ConfigLLM />} />
              <Route path="mcp-servers" element={<ConfigMCP />} />
              <Route path="task-handler" element={<ConfigTaskHandler />} />
              <Route path="tools" element={<ConfigTools />} />
              <Route path="system" element={<ConfigSystem />} />
              <Route path="auth" element={<ConfigAuth />} />
            </Route>

            <Route path="/events" element={<Events />} />
            <Route path="/preferences" element={<Preferences />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}


