import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Dashboard from './components/Dashboard'
import TaskList from './components/TaskList'
import TaskDetail from './components/TaskDetail'
import Settings from './components/Settings'
import { WebSocketProvider } from './components/WebSocketProvider'
import { ConnectionStatus } from './components/ConnectionStatus'
import { LayoutDashboard, ListTodo, Settings as SettingsIcon, Cpu } from 'lucide-react'
import type { Task } from './types/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
})

type Tab = 'dashboard' | 'tasks' | 'settings'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
    { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
  ]

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task)
    if (activeTab !== 'tasks') {
      setActiveTab('tasks')
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'tasks':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="flex flex-col min-h-0">
              <TaskList
                onTaskSelect={handleTaskSelect}
                selectedTaskId={selectedTask?.id}
              />
            </div>
            <div className="lg:col-span-2 flex flex-col min-h-0">
              {selectedTask ? (
                <TaskDetail
                  taskId={selectedTask.id}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <ListTodo className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Select a task</p>
                    <p className="text-sm">Choose a task from the list to view its details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      case 'settings':
        return (
          <Settings />
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <div className="h-screen bg-gray-50 flex flex-col">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <Cpu className="h-8 w-8 text-primary-600" />
                  <h1 className="text-xl font-bold text-gray-900">
                    Orchestrator
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <ConnectionStatus />
                <div className="flex items-center space-x-1">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-0">
          <div className="h-full">
            {renderContent()}
          </div>
        </main>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
        </div>
      </WebSocketProvider>
    </QueryClientProvider>
  )
}

export default App
