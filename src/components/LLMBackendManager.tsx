import React, { useState } from 'react'
import { useLLMBackends, useAddLLMBackend, useRemoveLLMBackend } from '../hooks/useApi'
import Card from './ui/Card'
import Button from './ui/Button'
import LoadingSpinner from './ui/LoadingSpinner'
import { Server, Plus, Trash2, Globe, Key } from 'lucide-react'

const LLMBackendManager: React.FC = () => {
  const { data: backendsData, isLoading, error } = useLLMBackends()
  const addBackendMutation = useAddLLMBackend()
  const removeBackendMutation = useRemoveLLMBackend()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newHost, setNewHost] = useState('')
  const [newApiKey, setNewApiKey] = useState('')

  const handleAddBackend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHost.trim() || !newApiKey.trim()) return

    try {
      await addBackendMutation.mutateAsync({ host: newHost.trim(), apiKey: newApiKey.trim() })
      setNewHost('')
      setNewApiKey('')
      setShowAddForm(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleRemoveBackend = async (host: string) => {
    if (window.confirm(`Are you sure you want to remove the LLM backend at ${host}?`)) {
      try {
        await removeBackendMutation.mutateAsync(host)
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
        <p>Failed to load LLM backends</p>
        <p className="text-sm text-gray-500 mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  return (
    <Card title="LLM Backend Management" className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Server className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">
            {backendsData?.total_backends || 0} backend(s) configured
          </span>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Backend</span>
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="bg-gray-50 border-dashed">
          <form onSubmit={handleAddBackend} className="space-y-4">
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
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="submit"
                disabled={addBackendMutation.isPending}
                className="flex items-center space-x-2"
                size="sm"
              >
                {addBackendMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Add Backend</span>
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

      {/* Backends List */}
      <div className="space-y-3">
        {backendsData?.backends?.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No LLM backends configured</p>
            <p className="text-sm">Add a backend to get started</p>
          </div>
        ) : (
          backendsData?.backends?.map((backend, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">{backend.base_url}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">{backend.models.length}</span> model(s): {' '}
                    {backend.models.slice(0, 3).join(', ')}
                    {backend.models.length > 3 && ` and ${backend.models.length - 3} more...`}
                  </div>
                </div>
                <Button
                  onClick={() => handleRemoveBackend(backend.base_url)}
                  variant="danger"
                  size="sm"
                  disabled={removeBackendMutation.isPending}
                  className="flex items-center space-x-1"
                >
                  {removeBackendMutation.isPending ? (
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

      {/* Available Models Summary */}
      {backendsData?.all_available_models && backendsData.all_available_models.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">All Available Models</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {backendsData.all_available_models.map((model) => (
              <span
                key={model}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {model}
              </span>
            ))}
          </div>
        </Card>
      )}
    </Card>
  )
}

export default LLMBackendManager
