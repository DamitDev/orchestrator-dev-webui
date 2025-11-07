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
    <div className="card p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-2 border-nord8/30 rounded-lg p-4 dark:border-nord8/20 bg-nord8/5 dark:bg-nord8/5">
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Agent Model <span className="text-xs text-nord8 dark:text-nord8 font-semibold">(CURRENT)</span>
          </div>
          <div className="font-mono text-lg font-bold text-nord8 dark:text-nord8 mb-3">{status?.agent_model || 'None'}</div>
          <div className="flex gap-2">
            <select value={agent} onChange={e => setAgentSel(e.target.value)} className="select flex-1">
              <option value="">Select model…</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={() => agent && setAgent.mutate(agent)} disabled={!agent || setAgent.isPending} className="btn-outline">Set</button>
          </div>
        </div>
        <div className="border-2 border-nord9/30 rounded-lg p-4 dark:border-nord9/20 bg-nord9/5 dark:bg-nord9/5">
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Orchestrator Model <span className="text-xs text-nord9 dark:text-nord9 font-semibold">(CURRENT)</span>
          </div>
          <div className="font-mono text-lg font-bold text-nord9 dark:text-nord9 mb-3">{status?.orchestrator_model || 'None'}</div>
          <div className="flex gap-2">
            <select value={orch} onChange={e => setOrchSel(e.target.value)} className="select flex-1">
              <option value="">Select model…</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={() => orch && setOrch.mutate(orch)} disabled={!orch || setOrch.isPending} className="btn-outline">Set</button>
          </div>
        </div>
      </div>
    </div>
  )
}


