import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTasks, groupTasksForInbox, tasksKeys } from '../hooks/useTasks'
import { useSummaryWorkerStatus, useSlotStatus, useMCPServers, useTaskHandlerStatus, configKeys } from '../hooks/useConfig'
import type { Task, SlotInfo, SummaryWorkerStatusEvent } from '../types/api'
import { useWebSocket } from '../ws/WebSocketProvider'
import { TaskIdBadge } from '../components/TaskIdBadge'

/** Get the correct detail page URL for a task based on its workflow */
function getTaskDetailUrl(task: Task): string {
  if (task.workflow_id === 'self_managed') {
    return `/self-managed/${task.id}`
  }
  return `/task/${task.id}`
}

function formatUptime(seconds: number | null): string {
  if (seconds === null) return 'N/A'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`
  return `${secs}s`
}

function formatIdleTime(seconds: number | null): string {
  if (seconds === null) return '-'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

/* ========== Stat Card Component ========== */
interface StatCardProps {
  label: string
  value: string | number
  color: 'frost' | 'green' | 'yellow' | 'red' | 'purple' | 'teal' | 'muted'
  subtext?: string
  pulse?: boolean
}

function StatCard({ label, value, color, subtext, pulse }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card-label">{label}</div>
      <div className={`stat-card-value ${pulse ? 'animate-pulse' : ''}`}>{value}</div>
      {subtext && <div className="stat-card-subtext">{subtext}</div>}
    </div>
  )
}

/* ========== Inbox Section ========== */
interface InboxSectionProps {
  title: string
  tasks: Task[]
  color: 'yellow' | 'frost' | 'purple'
  icon: React.ReactNode
}

function InboxSection({ title, tasks, color, icon }: InboxSectionProps) {
  const top = tasks.slice(0, 5)

  return (
    <div className={`triage-section triage-section--${color}`}>
      <div className="triage-header">
        <div className="triage-title">
          <span className="triage-title-icon">{icon}</span>
          <h3 className="triage-title-text">{title}</h3>
        </div>
        <span className={`triage-badge triage-badge--${color}`}>{tasks.length}</span>
      </div>
      {top.length === 0 ? (
        <div className="triage-empty">No items</div>
      ) : (
        <ul className="space-y-2">
          {top.map(t => (
            <li key={t.id} className="group">
              <Link to={getTaskDetailUrl(t)} className="triage-item">
                <div className="triage-item-content">
                  <span className="triage-item-workflow">{t.workflow_id}</span>
                  <span className="triage-item-text">
                    {t.ticket_id || t.goal_prompt?.slice(0, 35) || t.id}
                  </span>
                  <TaskIdBadge taskId={t.id} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {tasks.length > 5 && (
        <div className="triage-more">
          <Link to="/tasks" className="triage-more-link">+{tasks.length - 5} more</Link>
        </div>
      )}
    </div>
  )
}

/* ========== Slot Status Card ========== */
function SlotStatusCard({ slot }: { slot: SlotInfo }) {
  const status = slot.status

  return (
    <div className={`slot-card slot-card--${status}`}>
      {/* Top row: indicator, name, IP, status badge */}
      <div className="slot-card-row">
        <div className={`slot-indicator slot-indicator--${status}`} />
        <span className="slot-id">{slot.id}</span>
        <span className="slot-ip">{slot.ip}</span>
        <span className={`slot-status-badge slot-status-badge--${status}`}>{status}</span>
      </div>
      
      {/* Bottom row: only shown when occupied */}
      {status === 'occupied' && slot.task_id && (
        <div className="slot-card-meta">
          <Link to={`/task/${slot.task_id}`} className="slot-task-link">
            {slot.task_id.slice(0, 8)}...
          </Link>
          <span className="slot-idle">idle {formatIdleTime(slot.idle_seconds)}</span>
        </div>
      )}
    </div>
  )
}

/* ========== MCP Server Card ========== */
function MCPServerCard({ server }: { server: { name: string; description: string; tools: string[] } }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mcp-card">
      <div className="mcp-card-header">
        <div className="mcp-card-content">
          <h4 className="mcp-card-name">{server.name}</h4>
          {server.description && <p className="mcp-card-description">{server.description}</p>}
        </div>
        <span className="mcp-card-badge">{server.tools.length}</span>
      </div>
      {server.tools.length > 0 && (
        <div>
          <button onClick={() => setExpanded(!expanded)} className="mcp-tools-toggle">
            <svg
              className={`mcp-tools-toggle-icon ${expanded ? 'mcp-tools-toggle-icon--expanded' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {expanded ? 'Hide tools' : 'Show tools'}
          </button>
          {expanded && (
            <div className="mcp-tools-list">
              {server.tools.map(tool => (
                <span key={tool} className="mcp-tool-tag">{tool}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ========== Icon Components ========== */
const icons = {
  approval: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  help: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chat: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  running: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  server: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
  document: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  database: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
}

/* ========== Main Dashboard Component ========== */
export default function Dashboard() {
  const queryClient = useQueryClient()
  const { subscribe, unsubscribe } = useWebSocket()

  // Data fetching
  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    page: 1, limit: 250, order_by: 'updated_at', order_direction: 'desc'
  })
  const { data: summaryWorker } = useSummaryWorkerStatus()
  const { data: slotStatus } = useSlotStatus()
  const { data: mcpServers } = useMCPServers()
  const { data: taskHandler } = useTaskHandlerStatus()

  // WebSocket subscriptions
  useEffect(() => {
    const taskSubId = subscribe(() => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.list({ page: 1, limit: 250, order_by: 'updated_at', order_direction: 'desc' }) })
    }, { eventTypes: ['task_status_changed', 'approval_requested', 'help_requested', 'message_added', 'task_deleted'] })

    const summarySubId = subscribe((event: any) => {
      if (event.event_type === 'summary_worker_status') {
        const statusEvent = event as SummaryWorkerStatusEvent
        queryClient.setQueryData(configKeys.summaryWorker, statusEvent.data)
      }
    }, { eventTypes: ['summary_worker_status'] })

    return () => {
      unsubscribe(taskSubId)
      unsubscribe(summarySubId)
    }
  }, [subscribe, unsubscribe, queryClient])

  const tasks = tasksData?.tasks || []
  const grouped = groupTasksForInbox(tasks)

  // Compute stats
  const totalTasks = tasks.length
  const runningTasks = grouped.running.length
  const pendingActions = grouped.approvals.length + grouped.help.length + grouped.userTurn.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="dashboard-header">Dashboard</h1>
        <p className="dashboard-subtitle">System overview and task triage</p>
      </div>

      {/* Top Stats Panel */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Total Tasks" value={totalTasks} color="frost" />
          <StatCard
            label="Running"
            value={runningTasks}
            color={runningTasks > 0 ? 'green' : 'muted'}
            pulse={runningTasks > 0}
            subtext={taskHandler ? `/${taskHandler.max_concurrent_tasks} max` : undefined}
          />
          <StatCard
            label="Pending Actions"
            value={pendingActions}
            color={pendingActions > 0 ? 'yellow' : 'muted'}
          />
          <StatCard
            label="Summary Queue"
            value={summaryWorker?.queue_size ?? '-'}
            color={summaryWorker?.queue_size && summaryWorker.queue_size > 0 ? 'purple' : 'muted'}
            subtext={summaryWorker ? `${summaryWorker.processed_count} processed` : undefined}
          />
          <StatCard
            label="Slots Available"
            value={slotStatus?.enabled ? `${slotStatus.available_slots}/${slotStatus.total_slots}` : 'Disabled'}
            color={slotStatus?.enabled && slotStatus.available_slots > 0 ? 'teal' : slotStatus?.enabled ? 'yellow' : 'muted'}
          />
          <StatCard
            label="MCP Servers"
            value={mcpServers?.total_servers ?? '-'}
            color="frost"
            subtext={mcpServers ? `${mcpServers.all_available_tools.length} tools` : undefined}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Inbox */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-nord0 dark:text-nord6">Inbox</h2>
              <Link to="/tasks" className="dashboard-link">View all tasks</Link>
            </div>

            {tasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="dashboard-spinner" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InboxSection title="Pending Approvals" tasks={grouped.approvals} color="yellow" icon={icons.approval} />
                <InboxSection title="Help Required" tasks={grouped.help} color="frost" icon={icons.help} />
                <InboxSection title="User Turn" tasks={grouped.userTurn} color="purple" icon={icons.chat} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - System Status */}
        <div className="space-y-4">
          {/* AgentVM Slots */}
          {slotStatus?.enabled && (
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h3 className="dashboard-panel-title">
                  <span className="text-nord7">{icons.server}</span>
                  AgentVM Slots
                </h3>
                <span className="dashboard-panel-subtitle">
                  {slotStatus.available_slots} / {slotStatus.total_slots} available
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {slotStatus.slots.map(slot => (
                  <SlotStatusCard key={slot.id} slot={slot} />
                ))}
              </div>
              {slotStatus.slot_tools.length > 0 && (
                <div className="slot-tools-section">
                  <div className="slot-tools-label">Slot Tools</div>
                  <div className="slot-tools-list">
                    {slotStatus.slot_tools.slice(0, 5).map(tool => (
                      <span key={tool} className="slot-tool-tag">{tool.replace(/_post$/, '')}</span>
                    ))}
                    {slotStatus.slot_tools.length > 5 && (
                      <span className="dashboard-panel-subtitle">+{slotStatus.slot_tools.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary Worker */}
          {summaryWorker && (
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h3 className="dashboard-panel-title">
                  <span className="text-nord15">{icons.document}</span>
                  Summary Worker
                </h3>
                <div className="summary-status">
                  <div className={`summary-indicator ${summaryWorker.running ? 'summary-indicator--active' : 'summary-indicator--inactive'}`} />
                  <span className="dashboard-panel-subtitle">{summaryWorker.running ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="summary-grid">
                <div className="summary-stat">
                  <div className="summary-stat-label">Uptime</div>
                  <div className="summary-stat-value">{formatUptime(summaryWorker.uptime_seconds)}</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-label">Processing</div>
                  <div className="summary-stat-value">{summaryWorker.pending_count}</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-label">Processed</div>
                  <div className="summary-stat-value">{summaryWorker.processed_count}</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-label">Errors</div>
                  <div className={`summary-stat-value ${summaryWorker.error_count > 0 ? 'summary-stat-value--error' : ''}`}>
                    {summaryWorker.error_count}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MCP Servers */}
          {mcpServers && mcpServers.servers.length > 0 && (
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h3 className="dashboard-panel-title">
                  <span className="text-nord9">{icons.database}</span>
                  MCP Servers
                </h3>
                <span className="dashboard-panel-subtitle">{mcpServers.all_available_tools.length} tools</span>
              </div>
              <div className="space-y-2">
                {mcpServers.servers.slice(0, 3).map((server, idx) => (
                  <MCPServerCard key={idx} server={server} />
                ))}
                {mcpServers.servers.length > 3 && (
                  <Link to="/settings#mcp-servers" className="block text-center dashboard-link py-2">
                    View all {mcpServers.servers.length} servers
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
