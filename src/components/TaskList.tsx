import React, { useState } from 'react'
import { useTasks, useCreateTask, useCancelTask, useTaskAction } from '../hooks/useApi'
import Card from './ui/Card'
import Button from './ui/Button'
import StatusBadge from './ui/StatusBadge'
import LoadingSpinner from './ui/LoadingSpinner'
import Pagination from './ui/Pagination'
import { formatMessageTimestamp } from '../lib/utils'
import { Plus, Search, X, Check, XCircle, Settings, FileText, ChevronUp, ChevronDown } from 'lucide-react'
import type { Task, TasksQueryParams } from '../types/api'

interface TaskListProps {
  onTaskSelect: (task: Task) => void
  selectedTaskId?: string
  refreshInterval: number
}

type TaskCreationMode = 'simple' | 'advanced'

const TaskList: React.FC<TaskListProps> = ({ onTaskSelect, selectedTaskId, refreshInterval }) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creationMode, setCreationMode] = useState<TaskCreationMode>('simple')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [orderBy, setOrderBy] = useState<'created_at' | 'updated_at'>('updated_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')
  
  // Form fields
  const [ticketId, setTicketId] = useState('')
  const [goalPrompt, setGoalPrompt] = useState('')
  const [ticketText, setTicketText] = useState('')
  const [summary, setSummary] = useState('')
  const [problemSummary, setProblemSummary] = useState('')
  const [solutionStrategy, setSolutionStrategy] = useState('')
  const [maxIterations, setMaxIterations] = useState(50)
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('low')
  
  const queryParams: TasksQueryParams = {
    page: currentPage,
    limit: pageSize,
    order_by: orderBy,
    order_direction: orderDirection,
  }
  
  const { data: tasksResponse, isLoading, error } = useTasks(queryParams, refreshInterval)
  const createTaskMutation = useCreateTask()
  const cancelTaskMutation = useCancelTask()
  const taskActionMutation = useTaskAction()

  const tasks = tasksResponse?.tasks || []
  const pagination = tasksResponse?.pagination

  const filteredTasks = searchTerm.trim() ? tasks.filter(task => 
    task.goal_prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) : tasks

  const resetForm = () => {
    setTicketId('')
    setGoalPrompt('')
    setTicketText('')
    setSummary('')
    setProblemSummary('')
    setSolutionStrategy('')
    setMaxIterations(50)
    setReasoningEffort('low')
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handleSortChange = (newOrderBy: 'created_at' | 'updated_at') => {
    if (newOrderBy === orderBy) {
      // Toggle direction if same field
      setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with default direction
      setOrderBy(newOrderBy)
      setOrderDirection('desc')
    }
    setCurrentPage(1) // Reset to first page when changing sort
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketId.trim()) return
    if (creationMode === 'simple' && !goalPrompt.trim()) return

    try {
      const requestData: any = {
        ticket_id: ticketId,
        max_iterations: maxIterations,
        reasoning_effort: reasoningEffort,
      }

      if (creationMode === 'simple') {
        requestData.goal_prompt = goalPrompt
      } else {
        requestData.goal_prompt = ""
        if (ticketText.trim()) requestData.ticket_text = ticketText
        if (summary.trim()) requestData.summary = summary
        if (problemSummary.trim()) requestData.problem_summary = problemSummary
        if (solutionStrategy.trim()) requestData.solution_strategy = solutionStrategy
      }

      await createTaskMutation.mutateAsync(requestData)
      resetForm()
      setShowCreateForm(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleCancelTask = async (taskId: string) => {
    await cancelTaskMutation.mutateAsync(taskId)
  }

  const handleApproveTask = async (taskId: string) => {
    await taskActionMutation.mutateAsync({ task_id: taskId, approved: true })
  }

  const handleRejectTask = async (taskId: string) => {
    await taskActionMutation.mutateAsync({ task_id: taskId, approved: false })
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full">
        <div className="text-center text-red-600 p-8">
          <p>Failed to load tasks</p>
          <p className="text-sm text-gray-500 mt-2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">
          Tasks ({pagination?.total_items || 0})
        </h2>
        <Button
          onClick={() => setShowCreateForm(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Search */}
      <div className="relative flex-shrink-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between gap-4 flex-shrink-0">
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={orderBy === 'updated_at' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleSortChange('updated_at')}
            className="flex items-center gap-1"
          >
            Updated
            {orderBy === 'updated_at' && (
              orderDirection === 'asc' ? 
                <ChevronUp className="h-3 w-3" /> : 
                <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant={orderBy === 'created_at' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleSortChange('created_at')}
            className="flex items-center gap-1"
          >
            Created
            {orderBy === 'created_at' && (
              orderDirection === 'asc' ? 
                <ChevronUp className="h-3 w-3" /> : 
                <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </div>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <Card className="border-primary-200 flex-shrink-0">
          <form onSubmit={handleCreateTask} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium text-gray-900">Create New Task</h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false)
                  resetForm()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mode Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Creation Mode
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="creationMode"
                    value="simple"
                    checked={creationMode === 'simple'}
                    onChange={(e) => setCreationMode(e.target.value as TaskCreationMode)}
                    className="mr-2 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Simple (Goal Prompt)</span>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="creationMode"
                    value="advanced"
                    checked={creationMode === 'advanced'}
                    onChange={(e) => setCreationMode(e.target.value as TaskCreationMode)}
                    className="mr-2 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Advanced (Structured Fields)</span>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Ticket ID - Always Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ticket ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                placeholder="Enter ticket ID (e.g., TASK-123)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Simple Mode Fields */}
            {creationMode === 'simple' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Prompt <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={goalPrompt}
                  onChange={(e) => setGoalPrompt(e.target.value)}
                  placeholder="Describe what you want the agent to accomplish..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Advanced Mode Fields */}
            {creationMode === 'advanced' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Text
                  </label>
                  <textarea
                    value={ticketText}
                    onChange={(e) => setTicketText(e.target.value)}
                    placeholder="Full text of the ticket or issue description..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Summary
                  </label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Brief summary of the issue..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Problem Summary
                  </label>
                  <textarea
                    value={problemSummary}
                    onChange={(e) => setProblemSummary(e.target.value)}
                    placeholder="Detailed analysis of the problem..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solution Strategy
                  </label>
                  <textarea
                    value={solutionStrategy}
                    onChange={(e) => setSolutionStrategy(e.target.value)}
                    placeholder="Proposed approach to solve the problem..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Iterations
              </label>
              <input
                type="number"
                value={maxIterations}
                onChange={(e) => setMaxIterations(parseInt(e.target.value) || 50)}
                min={1}
                max={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reasoning Effort
              </label>
              <select
                value={reasoningEffort}
                onChange={(e) => setReasoningEffort(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={
                  createTaskMutation.isPending || 
                  !ticketId.trim() ||
                  (creationMode === 'simple' && !goalPrompt.trim())
                }
                className="flex-1"
              >
                {createTaskMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Create Task'
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Task List */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <Card>
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? 'No tasks match your search' : 'No tasks yet'}
            </div>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTaskId === task.id 
                  ? 'border-2 border-primary-500 bg-primary-50 shadow-lg' 
                  : 'border-transparent border-2 hover:bg-gray-50'
              }`}
              onClick={() => onTaskSelect(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={task.status} />
                    <span className="text-xs text-gray-500 font-mono">
                      {task.id.slice(0, 8)}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                      {task.ticket_id}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                    {task.goal_prompt}
                  </p>
                  
                  {task.status === 'action_required' && task.approval_reason && (
                    <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-amber-800 mb-1">Supervisor Action Required</p>
                          <p className="text-sm text-amber-700 leading-relaxed whitespace-pre-wrap">
                            {task.approval_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Iteration {task.iteration}/{task.max_iterations}
                    </span>
                    <span>
                      {formatMessageTimestamp(task.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="ml-4 flex flex-col gap-1">
                  {task.status === 'action_required' && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApproveTask(task.id)
                        }}
                        disabled={taskActionMutation.isPending}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRejectTask(task.id)
                        }}
                        disabled={taskActionMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {['queued', 'in_progress', 'validation', 'function_execution'].includes(task.status) && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelTask(task.id)
                      }}
                      disabled={cancelTaskMutation.isPending}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination - Only show when not searching (server-side pagination) */}
      {!searchTerm.trim() && pagination && (
        <Pagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          hasNext={pagination.has_next}
          hasPrev={pagination.has_prev}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

export default TaskList
