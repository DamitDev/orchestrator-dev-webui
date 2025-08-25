import React, { useState } from 'react'
import { useMCPServers, useAddMCPServer, useRemoveMCPServer } from '../hooks/useApi'
import Card from './ui/Card'
import Button from './ui/Button'
import LoadingSpinner from './ui/LoadingSpinner'
import { Wrench, Plus, Trash2, Globe, Key } from 'lucide-react'

const MCPServerManager: React.FC = () => {
  const { data: serversData, isLoading, error } = useMCPServers()
  const addServerMutation = useAddMCPServer()
  const removeServerMutation = useRemoveMCPServer()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newHost, setNewHost] = useState('')
  const [newApiKey, setNewApiKey] = useState('')

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHost.trim() || !newApiKey.trim()) return

    try {
      await addServerMutation.mutateAsync({ host: newHost.trim(), apiKey: newApiKey.trim() })
      setNewHost('')
      setNewApiKey('')
      setShowAddForm(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleRemoveServer = async (host: string) => {
    if (window.confirm(`Are you sure you want to remove the MCP server at ${host}?`)) {
      try {
        await removeServerMutation.mutateAsync(host)
      } catch (error) {
        // Error handled by mutation
      }
    }
  }

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
        <p>Failed to load MCP servers</p>
        <p className="text-sm text-gray-500 mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  return (
    <Card title="MCP Server Management" className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Wrench className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-600">
            {serversData?.total_servers || 0} server(s) configured
          </span>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Server</span>
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="bg-gray-50 border-dashed">
          <form onSubmit={handleAddServer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Host URL
                </label>
                <input
                  type="url"
                  value={newHost}
                  onChange={(e) => setNewHost(e.target.value)}
                  placeholder="http://localhost:3001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Key className="h-4 w-4 inline mr-1" />
                  API Key
                </label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="API key (if required)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="submit"
                disabled={addServerMutation.isPending}
                className="flex items-center space-x-2"
                size="sm"
              >
                {addServerMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Add Server</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowAddForm(false)
                  setNewHost('')
                  setNewApiKey('')
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Servers List */}
      <div className="space-y-3">
        {serversData?.servers?.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No MCP servers configured</p>
            <p className="text-sm">Add a server to enable tools</p>
          </div>
        ) : (
          serversData?.servers?.map((server, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-900">{server.base_url}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">{server.tools.length}</span> tool(s): {' '}
                    {server.tools.slice(0, 3).join(', ')}
                    {server.tools.length > 3 && ` and ${server.tools.length - 3} more...`}
                  </div>
                </div>
                <Button
                  onClick={() => handleRemoveServer(server.base_url)}
                  variant="danger"
                  size="sm"
                  disabled={removeServerMutation.isPending}
                  className="flex items-center space-x-1"
                >
                  {removeServerMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Remove</span>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Available Tools Summary */}
      {serversData?.all_available_tools && serversData.all_available_tools.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <Wrench className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-900">All Available Tools</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {serversData.all_available_tools.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {tool}
              </span>
            ))}
          </div>
        </Card>
      )}
    </Card>
  )
}

export default MCPServerManager
