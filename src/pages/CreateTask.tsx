import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../lib/api'
import type { TaskCreateRequest, ReasoningEffort } from '../types/api'
import { tasksKeys } from '../hooks/useTasks'
import toast from 'react-hot-toast'

type Workflow = TaskCreateRequest['workflow_id']
type ToolPreset = 'all' | 'none' | 'custom'

function WorkflowCard({ id, title, desc, active, onClick }: { id: Workflow; title: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      type="button" 
      onClick={onClick} 
      className={`p-4 border-2 rounded-lg text-left transition-all ${
        active 
          ? 'border-nord8 bg-nord8/10 shadow-md dark:border-nord8 dark:bg-nord8/20' 
          : 'border-nord4 hover:border-nord8/50 bg-nord6 dark:border-nord3 dark:bg-nord2 dark:hover:border-nord8/50'
      }`}
    >
      <div className={`font-medium ${active ? 'text-nord10 dark:text-nord8' : 'text-nord0 dark:text-nord6'}`}>{title}</div>
      <div className={`text-sm ${active ? 'text-nord10/80 dark:text-nord8/80' : 'text-nord3 dark:text-nord4'}`}>{desc}</div>
    </button>
  )
}

export default function CreateTask() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [workflow, setWorkflow] = useState<Workflow>('proactive')
  const [maxIterations, setMaxIterations] = useState(50)
  const [reasoning, setReasoning] = useState<ReasoningEffort>('medium')

  // common
  const [goalPrompt, setGoalPrompt] = useState('')

  // ticket
  const [ticketId, setTicketId] = useState('')
  const [ticketText, setTicketText] = useState('')
  const [summary, setSummary] = useState('')
  const [problemSummary, setProblemSummary] = useState('')
  const [solutionStrategy, setSolutionStrategy] = useState('')

  // tools
  const [toolPreset, setToolPreset] = useState<ToolPreset>('all')
  const [customTools, setCustomTools] = useState('')

  const canContinueStep2 = useMemo(() => {
    if (workflow === 'ticket') return ticketId.trim().length > 0
    if (workflow === 'self_managed') return true // Goal is optional for Self-Managed
    return goalPrompt.trim().length > 0
  }, [workflow, ticketId, goalPrompt])

  const buildRequest = (): TaskCreateRequest => {
    const available_tools = toolPreset === 'all' ? null : toolPreset === 'none' ? [] : customTools.split(',').map(s => s.trim()).filter(Boolean)
    const base: TaskCreateRequest = {
      workflow_id: workflow,
      max_iterations: maxIterations,
      reasoning_effort: reasoning,
      available_tools
    }
    if (workflow === 'ticket') {
      return {
        ...base,
        ticket_id: ticketId,
        ticket_text: ticketText || null,
        summary: summary || null,
        problem_summary: problemSummary || null,
        solution_strategy: solutionStrategy || null
      }
    }
    return {
      ...base,
      goal_prompt: goalPrompt
    }
  }

  const onSubmit = async () => {
    try {
      const payload = buildRequest()
      const res = await tasksApi.create(payload)
      toast.success('Task created')
      queryClient.invalidateQueries({ queryKey: tasksKeys.list() })
      // Navigate to Self-Managed dedicated page for self_managed, generic task page for others
      if (workflow === 'self_managed') {
        navigate(`/self-managed/${res.task_id}`)
      } else {
        navigate(`/task/${res.task_id}`)
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to create task'
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create Task</h1>

      {/* Workflow selection */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <WorkflowCard id="proactive" title="Proactive" desc="Autonomous" active={workflow==='proactive'} onClick={() => setWorkflow('proactive')} />
          <WorkflowCard id="interactive" title="Interactive" desc="Chat-driven" active={workflow==='interactive'} onClick={() => setWorkflow('interactive')} />
          <WorkflowCard id="ticket" title="Ticket" desc="Ticket-based task" active={workflow==='ticket'} onClick={() => setWorkflow('ticket')} />
          <WorkflowCard id="matrix" title="Matrix" desc="Algorithm development" active={workflow==='matrix'} onClick={() => setWorkflow('matrix')} />
          <WorkflowCard id="self_managed" title="Self-Managed" desc="Long-lived assistant" active={workflow==='self_managed'} onClick={() => setWorkflow('self_managed')} />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        {workflow !== 'ticket' ? (
          <div>
            <label className="block text-sm font-medium text-nord0 dark:text-nord6 mb-1">
              {workflow==='matrix' ? 'Aspect Goal' : workflow==='self_managed' ? 'Initial Goal (optional)' : 'Goal Prompt'} 
              {workflow !== 'self_managed' && <span className="text-nord11">*</span>}
            </label>
            <textarea 
              value={goalPrompt} 
              onChange={e => setGoalPrompt(e.target.value)} 
              rows={4} 
              className="textarea" 
              placeholder={workflow === 'self_managed' ? "Describe what you'd like the assistant to help with..." : "Describe the task goal..."} 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-nord0 dark:text-nord6 mb-1">Ticket ID <span className="text-nord11">*</span></label>
              <input value={ticketId} onChange={e => setTicketId(e.target.value)} className="input w-full" placeholder="IRIS-1234" />
            </div>
            <div>
              <label className="block text-sm font-medium text-nord0 dark:text-nord6 mb-1">Summary</label>
              <input value={summary} onChange={e => setSummary(e.target.value)} className="input w-full" placeholder="Short summary" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-nord0 dark:text-nord6 mb-1">Ticket Text</label>
              <textarea value={ticketText} onChange={e => setTicketText(e.target.value)} rows={3} className="textarea" placeholder="Full ticket text..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-nord0 dark:text-nord6 mb-1">Problem Summary</label>
              <textarea value={problemSummary} onChange={e => setProblemSummary(e.target.value)} rows={3} className="textarea" placeholder="Describe the problem..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-nord0 dark:text-nord6 mb-1">Solution Strategy</label>
              <textarea value={solutionStrategy} onChange={e => setSolutionStrategy(e.target.value)} rows={3} className="textarea" placeholder="Proposed approach..." />
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-nord0 dark:text-nord6 mb-1">Max Iterations</label>
            <input type="number" min={1} max={200} value={maxIterations} onChange={e => setMaxIterations(parseInt(e.target.value) || 50)} className="input w-full" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-nord0 dark:text-nord6 mb-1">Reasoning Effort</label>
            <div className="flex gap-2">
              {(['low','medium','high'] as ReasoningEffort[]).map(r => (
                <button key={r} type="button" onClick={() => setReasoning(r)} className={`${reasoning===r ? 'btn-primary' : 'btn-outline'}`}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-nord0 dark:text-nord6 mb-1">Tool Preset</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setToolPreset('all')} className={`${toolPreset==='all' ? 'btn-primary' : 'btn-outline'}`}>All tools</button>
            <button type="button" onClick={() => setToolPreset('none')} className={`${toolPreset==='none' ? 'btn-primary' : 'btn-outline'}`}>No tools</button>
            <button type="button" onClick={() => setToolPreset('custom')} className={`${toolPreset==='custom' ? 'btn-primary' : 'btn-outline'}`}>Custom</button>
          </div>
        </div>
        {toolPreset === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-nord0 dark:text-nord6 mb-1">Tool names (comma-separated)</label>
            <input value={customTools} onChange={e => setCustomTools(e.target.value)} className="input w-full" placeholder="read_file, list_directory" />
            <p className="text-xs text-nord3 dark:text-nord4 mt-1">Leave empty to allow none. Tool names are case-sensitive.</p>
          </div>
        )}
      </div>

      {/* Review & Create */}
      <div className="space-y-3">
        <div className="card p-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">Workflow: <span className="font-medium">{workflow}</span></div>
          {workflow!=='ticket' ? (
            <div className="text-sm text-gray-700 dark:text-gray-300">Goal: <span className="font-medium">{goalPrompt || '(empty)'}</span></div>
          ) : (
            <>
              <div className="text-sm text-gray-700 dark:text-gray-300">Ticket ID: <span className="font-medium">{ticketId || '(empty)'}</span></div>
              {summary && <div className="text-sm text-gray-700 dark:text-gray-300">Summary: <span className="font-medium">{summary}</span></div>}
            </>
          )}
          <div className="text-sm text-gray-700 dark:text-gray-300">Max Iterations: <span className="font-medium">{maxIterations}</span></div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Reasoning: <span className="font-medium">{reasoning}</span></div>
          <div className="text-sm text-gray-700 dark:text-gray-300">Tools: <span className="font-medium">{toolPreset === 'all' ? 'All' : toolPreset === 'none' ? 'None' : customTools || '(none)'}</span></div>
        </div>
        <div className="flex items-center justify-end">
          <button className="btn-primary" onClick={onSubmit} disabled={!canContinueStep2}>Create Task</button>
        </div>
      </div>
    </div>
  )
}


