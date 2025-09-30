import React, { useState } from 'react'
import { useLLMBackends, useSetAgent, useSetOrchestrator } from '../hooks/useApi'
import Card from './ui/Card'
import Button from './ui/Button'
import LoadingSpinner from './ui/LoadingSpinner'
import LLMBackendManager from './LLMBackendManager'
import MCPServerManager from './MCPServerManager'

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const [selectedAgent, setSelectedAgent] = useState('')
  const [selectedOrchestrator, setSelectedOrchestrator] = useState('')
  
  const { data: llmBackends, isLoading: llmLoading } = useLLMBackends()
  const setAgentMutation = useSetAgent()
  const setOrchestratorMutation = useSetOrchestrator()

  const handleSetAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedAgent) {
      await setAgentMutation.mutateAsync(selectedAgent)
      setSelectedAgent('')
    }
  }

  const handleSetOrchestrator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedOrchestrator) {
      await setOrchestratorMutation.mutateAsync(selectedOrchestrator)
      setSelectedOrchestrator('')
    }
  }



  return (
    <div className="space-y-6">


      {/* Model Configuration */}
      <Card title="Model Configuration">
        {llmLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Agent Model */}
            <form onSubmit={handleSetAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Model
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a model...</option>
                    {llmBackends?.all_available_models?.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    disabled={!selectedAgent || setAgentMutation.isPending}
                    size="sm"
                  >
                    {setAgentMutation.isPending ? <LoadingSpinner size="sm" /> : 'Set'}
                  </Button>
                </div>
              </div>
            </form>

            {/* Orchestrator Model */}
            <form onSubmit={handleSetOrchestrator} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orchestrator Model
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedOrchestrator}
                    onChange={(e) => setSelectedOrchestrator(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a model...</option>
                    {llmBackends?.all_available_models?.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    disabled={!selectedOrchestrator || setOrchestratorMutation.isPending}
                    size="sm"
                  >
                    {setOrchestratorMutation.isPending ? <LoadingSpinner size="sm" /> : 'Set'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* LLM Backend Management */}
      <LLMBackendManager />

      {/* MCP Server Management */}
      <MCPServerManager />
    </div>
  )
}

export default Settings
