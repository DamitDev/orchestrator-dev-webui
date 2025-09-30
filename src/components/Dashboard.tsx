import React from 'react'
import { useConfig } from '../hooks/useApi'
import Card from './ui/Card'
import LoadingSpinner from './ui/LoadingSpinner'
import { Activity, Brain, Layers, Users } from 'lucide-react'

const Dashboard: React.FC = () => {
  const { data: config, isLoading, error } = useConfig() // Real-time updates via WebSocket

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Failed to load dashboard data</p>
        <p className="text-sm text-gray-500 mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="text-center text-gray-600 p-8">
        <p>No data available</p>
      </div>
    )
  }

  const stats = [
    {
      name: 'Total Tasks',
      value: config.total_tasks,
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Active Tasks',
      value: config.active_tasks,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Queued Tasks',
      value: config.queued_tasks,
      icon: Users,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Pending Approval',
      value: config.pending_approval_tasks,
      icon: Brain,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.name} className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Configuration Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Current Configuration">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Agent Model:</span>
              <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                {config.agent_model}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Orchestrator Model:</span>
              <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                {config.orchestrator_model}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">LLM Backends:</span>
              <span className="text-sm text-gray-900">{config.llm_backends_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">MCP Servers:</span>
              <span className="text-sm text-gray-900">{config.mcp_servers_count}</span>
            </div>
          </div>
        </Card>

        <Card title="System Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">API Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Task Handler:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Running
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Last Updated:</span>
              <span className="text-sm text-gray-900">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
