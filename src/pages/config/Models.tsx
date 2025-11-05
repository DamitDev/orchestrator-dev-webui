import { useState } from 'react'
import { useConfigStatus } from '../../hooks/useConfig'
import { useLLMBackends, useSetAgent, useSetOrchestrator } from '../../hooks/useConfig'

export default function ConfigModels() {
  const { data: status } = useConfigStatus()
  const { data: llm } = useLLMBackends()
  const setAgent = useSetAgent()
  const setOrch = useSetOrchestrator()
  const [agent, setAgentSel] = useState('')
  const [orch, setOrchSel] = useState('')
  const models: string[] = llm?.all_available_models || []
  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <h1 className="text-lg font-semibold">Models</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <div className="text-sm text-gray-700 mb-2">Agent Model (current: <span className="font-mono">{status?.agent_model}</span>)</div>
          <div className="flex gap-2">
            <select value={agent} onChange={e => setAgentSel(e.target.value)} className="flex-1 px-2 py-1 border rounded text-sm">
              <option value="">Select model…</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={() => agent && setAgent.mutate(agent)} disabled={!agent || setAgent.isPending} className="px-3 py-1.5 border rounded text-sm">Set</button>
          </div>
        </div>
        <div className="border rounded p-3">
          <div className="text-sm text-gray-700 mb-2">Orchestrator Model (current: <span className="font-mono">{status?.orchestrator_model}</span>)</div>
          <div className="flex gap-2">
            <select value={orch} onChange={e => setOrchSel(e.target.value)} className="flex-1 px-2 py-1 border rounded text-sm">
              <option value="">Select model…</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={() => orch && setOrch.mutate(orch)} disabled={!orch || setOrch.isPending} className="px-3 py-1.5 border rounded text-sm">Set</button>
          </div>
        </div>
      </div>
    </div>
  )
}


