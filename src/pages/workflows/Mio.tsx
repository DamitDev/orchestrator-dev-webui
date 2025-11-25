import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWebSocket } from '../../ws/WebSocketProvider'
import { useQueryClient } from '@tanstack/react-query'
import { useTasks, tasksKeys } from '../../hooks/useTasks'
import type { Task, TasksQueryParams } from '../../types/api'
import { formatTimestamp } from '../../lib/time'

function ModeIndicator({ status, workflowData }: { status: string; workflowData?: Record<string, any> }) {
  if (status === 'sleeping') {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-nord3/20 text-nord3 px-2 py-0.5 rounded dark:bg-nord3/30 dark:text-nord4">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        Sleeping
      </span>
    )
  }
  
  const lastMode = workflowData?.last_mode
  if (lastMode === 'background') {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-nord10/20 text-nord10 px-2 py-0.5 rounded dark:bg-nord10/30 dark:text-nord8">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Background
      </span>
    )
  }
  
  // Interactive mode (default for active states)
  if (['user_turn', 'agent_turn', 'queued', 'in_progress', 'function_execution', 'validation'].includes(status)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-nord14/20 text-nord14 px-2 py-0.5 rounded dark:bg-nord14/30">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Interactive
      </span>
    )
  }
  
  // Other states (action_required, completed, failed, etc.)
  return (
    <span className="text-xs text-nord3 dark:text-nord4">
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function MioCard({ t }: { t: Task }) {
  const workflowData = t.workflow_data || {}
  const nextWakeup = workflowData.next_wakeup_at
  const lastActivity = workflowData.last_user_activity_at
  
  return (
    <div className="card p-5 hover:border-nord8/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono bg-nord5/50 px-2 py-0.5 rounded dark:bg-nord2">
            {t.id.slice(0, 8)}
          </span>
          <ModeIndicator status={t.status} workflowData={workflowData} />
        </div>
        {t.status === 'action_required' && (
          <span className="text-xs bg-nord13/20 text-nord13 px-2 py-0.5 rounded font-medium">
            Action Required
          </span>
        )}
      </div>
      
      <Link 
        to={`/mio/${t.id}`} 
        className="text-base font-medium text-nord0 dark:text-nord6 hover:text-nord10 dark:hover:text-nord8 transition-colors block mb-3"
      >
        {t.goal_prompt || 'Mio Instance'}
      </Link>
      
      <div className="space-y-1 text-xs text-nord3 dark:text-nord4">
        {t.status === 'sleeping' && nextWakeup && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Wakes: {formatTimestamp(nextWakeup)}</span>
          </div>
        )}
        {lastActivity && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Last activity: {formatTimestamp(lastActivity)}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Updated: {formatTimestamp(t.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

export default function WorkflowMio() {
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()
  const [filter, setFilter] = useState<'all' | 'active' | 'sleeping' | 'action_required'>('all')
  const params: TasksQueryParams = { page: 1, limit: 250, order_by: 'updated_at', order_direction: 'desc' }
  const { data, isLoading, error } = useTasks(params)

  useEffect(() => {
    const id = subscribe(() => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.list(params) })
    }, { eventTypes: ['task_status_changed', 'task_deleted', 'message_added', 'approval_requested'] })
    return () => {}
  }, [subscribe, queryClient, params])

  const items = useMemo(() => {
    const list = (data?.tasks || []).filter(t => t.workflow_id === 'self_managed')
    
    if (filter === 'all') return list
    if (filter === 'sleeping') return list.filter(t => t.status === 'sleeping')
    if (filter === 'action_required') return list.filter(t => t.status === 'action_required')
    if (filter === 'active') {
      return list.filter(t => 
        ['user_turn', 'agent_turn', 'queued', 'in_progress', 'function_execution', 'validation', 'queued_for_function_execution'].includes(t.status)
      )
    }
    return list
  }, [data, filter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-nord10 to-nord8 bg-clip-text text-transparent">
            Mio
          </h1>
          <span className="text-sm text-nord3 dark:text-nord4">Self-Managed Workflow</span>
        </div>
        <div className="text-sm text-gray-500">{items.length} instance{items.length !== 1 ? 's' : ''}</div>
      </div>
      
      <div className="toolbar flex items-center gap-3">
        <span className="text-sm text-gray-700 dark:text-gray-300">Filter:</span>
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value as any)} 
          className="select"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="sleeping">Sleeping</option>
          <option value="action_required">Action Required</option>
        </select>
      </div>
      
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-nord8 border-t-transparent"></div>
          <p className="mt-2 text-sm text-nord3 dark:text-nord4">Loading Mio instances…</p>
        </div>
      )}
      
      {error && (
        <div className="card p-6 bg-nord11/10 border border-nord11/30 text-center">
          <div className="text-nord11 font-semibold">Failed to load tasks</div>
        </div>
      )}
      
      {!isLoading && !error && items.length === 0 && (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-nord8/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-nord8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <div className="text-nord0 dark:text-nord6 font-medium mb-2">No Mio instances found</div>
          <div className="text-sm text-nord3 dark:text-nord4 mb-4">
            {filter !== 'all' ? 'Try changing the filter or ' : ''}
            Create a new self-managed task to get started.
          </div>
          <Link to="/create" className="btn-primary inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(t => <MioCard key={t.id} t={t} />)}
      </div>
    </div>
  )
}

