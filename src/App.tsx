import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
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
import Settings from './pages/Settings'
import GlobalShortcuts from './components/GlobalShortcuts'

function Header() {
  const { mode, toggle } = useMode()
  const location = useLocation()
  const [wfOpen, setWfOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const wfCloseTimeout = useRef<number | null>(null)
  const scheduleClose = () => {
    if (wfCloseTimeout.current) clearTimeout(wfCloseTimeout.current)
    wfCloseTimeout.current = window.setTimeout(() => {
      setWfOpen(false)
      wfCloseTimeout.current = null
    }, 200)
  }
  const cancelClose = () => {
    if (wfCloseTimeout.current) { 
      clearTimeout(wfCloseTimeout.current)
      wfCloseTimeout.current = null 
    }
  }
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
    <NavLink to={to} className={({ isActive }) => `${'nav-link'} ${isActive ? 'nav-link-active' : ''}`}>
      {label}
    </NavLink>
  )
  return (
    <header className="bg-nord6/80 backdrop-blur-md border-b border-nord4 shadow-nord dark:bg-nord0/80 dark:border-nord2 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nord8 to-nord10 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                <svg className="w-5 h-5 text-nord0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-nord10 to-nord8 bg-clip-text text-transparent">
                Orchestrator
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItem('/', 'Inbox')}
              <div className="relative" onMouseEnter={() => { cancelClose(); setWfOpen(true); }} onMouseLeave={() => scheduleClose()}>
                <button className={`nav-link ${wfOpen ? 'nav-link-active' : ''}`}>
                  Workflows
                  <svg className={`w-4 h-4 ml-1 inline transition-transform ${wfOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {wfOpen && (
                  <div className={`dropdown-menu w-44`} onMouseEnter={() => cancelClose()} onMouseLeave={() => scheduleClose()}>
                    <div className="py-1">
                      <NavLink to="/workflows/tickets" className={({isActive}) => `${'dropdown-item'} ${isActive ? 'dropdown-item-active' : ''}`} onClick={() => setWfOpen(false)}>Tickets</NavLink>
                      <NavLink to="/workflows/matrix" className={({isActive}) => `${'dropdown-item'} ${isActive ? 'dropdown-item-active' : ''}`} onClick={() => setWfOpen(false)}>Matrix</NavLink>
                      <NavLink to="/workflows/proactive" className={({isActive}) => `${'dropdown-item'} ${isActive ? 'dropdown-item-active' : ''}`} onClick={() => setWfOpen(false)}>Proactive</NavLink>
                      <NavLink to="/workflows/interactive" className={({isActive}) => `${'dropdown-item'} ${isActive ? 'dropdown-item-active' : ''}`} onClick={() => setWfOpen(false)}>Interactive</NavLink>
                    </div>
                  </div>
                )}
              </div>
              {navItem('/tasks', 'Tasks')}
              {navItem('/create', 'Create')}
              {navItem('/settings', 'Settings')}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-md bg-nord5/50 text-nord3 font-mono hidden sm:inline dark:bg-nord2 dark:text-nord4">
              {location.pathname}
            </span>
            <button onClick={toggleTheme} className="btn-outline" title="Toggle theme">
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button onClick={toggle} className="btn-outline hidden sm:inline-flex">
              {mode === 'simple' ? 'Simple' : 'Expert'}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <GlobalShortcuts />
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Inbox />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/create" element={<CreateTask />} />

            <Route path="/workflows/tickets" element={<WorkflowTickets />} />
            <Route path="/workflows/matrix" element={<WorkflowMatrix />} />
            <Route path="/workflows/proactive" element={<WorkflowProactive />} />
            <Route path="/workflows/interactive" element={<WorkflowInteractive />} />

            <Route path="/task/:id" element={<TaskDetail />} />

            <Route path="/settings" element={<Settings />} />

            <Route path="/events" element={<Events />} />
            <Route path="/preferences" element={<Preferences />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}


