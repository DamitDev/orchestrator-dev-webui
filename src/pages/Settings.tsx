import { useRef, useState, useEffect } from 'react'
import ConfigModels from './config/Models'
import ConfigLLM from './config/LLMBackends'
import ConfigMCP from './config/MCPServers'
import ConfigTaskHandler from './config/TaskHandler'
import ConfigSummaryWorker from './config/SummaryWorker'
import ConfigServiceReload from './config/ServiceReload'
import ConfigTools from './config/ToolsExplorer'
import ConfigSystem from './config/System'
import ConfigAuth from './config/Auth'

const sections = [
  { id: 'models', title: 'Models', component: ConfigModels },
  { id: 'llm-backends', title: 'LLM Backends', component: ConfigLLM },
  { id: 'mcp-servers', title: 'MCP Servers', component: ConfigMCP },
  { id: 'task-handler', title: 'Task Handler', component: ConfigTaskHandler },
  { id: 'summary-worker', title: 'AI Summary Worker', component: ConfigSummaryWorker },
  { id: 'service-reload', title: 'Service Reload', component: ConfigServiceReload },
  { id: 'tools', title: 'Tools Explorer', component: ConfigTools },
  { id: 'system', title: 'System', component: ConfigSystem },
  { id: 'auth', title: 'Auth', component: ConfigAuth },
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState('models')
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id]
    if (element) {
      const offset = 100 // Offset for fixed header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Track active section using IntersectionObserver
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Trigger when section is in the middle-upper part of viewport
      threshold: 0
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id
          setActiveSection(id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    // Observe all sections
    sections.forEach((section) => {
      const element = sectionRefs.current[section.id]
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div className="flex gap-8">
      {/* Table of Contents Sidebar */}
      <aside className="w-64 flex-shrink-0 sticky top-24 h-fit">
        <div className="card p-4">
          <h2 className="text-lg font-bold mb-4 text-nord0 dark:text-nord6">Settings</h2>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  activeSection === section.id
                    ? 'bg-nord8/20 text-nord10 dark:bg-nord8/10 dark:text-nord8 font-medium'
                    : 'text-nord3 dark:text-nord4 hover:bg-nord5/50 dark:hover:bg-nord3/20'
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        {sections.map((section) => {
          const Component = section.component
          return (
            <div
              key={section.id}
              ref={(el) => (sectionRefs.current[section.id] = el)}
              id={section.id}
              className="scroll-mt-24"
            >
              <div className="card p-6">
                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-nord10 to-nord8 bg-clip-text text-transparent">
                  {section.title}
                </h2>
                <Component />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

