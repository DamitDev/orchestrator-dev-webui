import React, { useState } from 'react'
import { 
  useTasks, 
  useCreateTask, 
  useCancelTask, 
  useProactiveTaskAction,
  useInteractiveTaskAction,
  useTicketTaskAction,
  useProactiveHelpTask,
  useTicketHelpTask,
  useTools
} from '../hooks/useApi'
import Card from './ui/Card'
import Button from './ui/Button'
import StatusBadge from './ui/StatusBadge'
import LoadingSpinner from './ui/LoadingSpinner'
import Pagination from './ui/Pagination'
import ToolSelector from './ToolSelector'
import ToolOfflineWarning from './ToolOfflineWarning'
import { formatMessageTimestamp } from '../lib/utils'
import { Plus, Search, X, Check, XCircle, ChevronUp, ChevronDown, MessageCircle, Zap, Ticket, Users, Grid } from 'lucide-react'
import type { Task, TasksQueryParams } from '../types/api'

interface TaskListProps {
  onTaskSelect: (task: Task) => void
  selectedTaskId?: string
}

type WorkflowType = 'proactive' | 'ticket' | 'interactive' | 'matrix'

const TaskList: React.FC<TaskListProps> = ({ onTaskSelect, selectedTaskId }) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [workflowType, setWorkflowType] = useState<WorkflowType>('proactive')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Help dialog state
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [helpTaskId, setHelpTaskId] = useState<string>('')
  const [helpResponse, setHelpResponse] = useState('')
  
  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [orderBy, setOrderBy] = useState<'created_at' | 'updated_at'>('updated_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')
  
  // Form fields
  const [goalPrompt, setGoalPrompt] = useState('')
  // Ticket workflow fields
  const [ticketId, setTicketId] = useState('')
  const [ticketText, setTicketText] = useState('')
  const [summary, setSummary] = useState('')
  const [problemSummary, setProblemSummary] = useState('')
  const [solutionStrategy, setSolutionStrategy] = useState('')
  // Common fields
  const [maxIterations, setMaxIterations] = useState(50)
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('medium')
  const [availableTools, setAvailableTools] = useState<string[] | null>(null)
  
  const queryParams: TasksQueryParams = {
    page: currentPage,
    limit: pageSize,
    order_by: orderBy,
    order_direction: orderDirection,
  }
  
  const { data: tasksResponse, isLoading, error } = useTasks(queryParams)
  const { data: toolsData } = useTools()
  const createTaskMutation = useCreateTask()
  const cancelTaskMutation = useCancelTask()
  const proactiveTaskActionMutation = useProactiveTaskAction()
  const interactiveTaskActionMutation = useInteractiveTaskAction()
  const ticketTaskActionMutation = useTicketTaskAction()
  const proactiveHelpTaskMutation = useProactiveHelpTask()
  const ticketHelpTaskMutation = useTicketHelpTask()

  const tasks = tasksResponse?.tasks || []
  const pagination = tasksResponse?.pagination

  const filteredTasks = searchTerm.trim() ? tasks.filter(task => 
    task.goal_prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.ticket_id && task.ticket_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    task.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) : tasks

  const resetForm = () => {
    setWorkflowType('proactive')
    setGoalPrompt('')
    setTicketId('')
    setTicketText('')
    setSummary('')
    setProblemSummary('')
    setSolutionStrategy('')
    setMaxIterations(50)
    setReasoningEffort('medium')
    setAvailableTools(null)
  }

  const resetHelpDialog = () => {
    setShowHelpDialog(false)
    setHelpTaskId('')
    setHelpResponse('')
  }

  const handleShowHelpDialog = (task: Task) => {
    setHelpTaskId(task.id)
    setHelpResponse('')
    setShowHelpDialog(true)
  }

  const handleSendHelp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!helpResponse.trim()) return

    try {
      // Find the task to determine its workflow
      const task = tasks.find(t => t.id === helpTaskId)
      if (!task) return
      
      // Use appropriate workflow-specific mutation
      if (task.workflow_id === 'ticket') {
        await ticketHelpTaskMutation.mutateAsync({ taskId: helpTaskId, response: helpResponse })
      } else {
        // proactive workflow (default for proactive and any others)
        await proactiveHelpTaskMutation.mutateAsync({ taskId: helpTaskId, response: helpResponse })
      }
      resetHelpDialog()
    } catch (error) {
      // Error handled by mutation
    }
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
    
    // Validation based on workflow type
    if (workflowType === 'proactive' || workflowType === 'interactive' || workflowType === 'matrix') {
      if (!goalPrompt.trim()) return
    } else if (workflowType === 'ticket') {
      if (!ticketId.trim()) return
    }

    try {
      const requestData: any = {
        workflow_id: workflowType,
        max_iterations: maxIterations,
        reasoning_effort: reasoningEffort,
      }

      // Add available_tools based on selection state
      if (availableTools !== null) {
        requestData.available_tools = availableTools
      }

      if (workflowType === 'proactive' || workflowType === 'interactive' || workflowType === 'matrix') {
        requestData.goal_prompt = goalPrompt
      } else if (workflowType === 'ticket') {
        requestData.ticket_id = ticketId
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
    // Find the task to determine its workflow
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    // Use appropriate workflow-specific mutation
    const actionData = { task_id: taskId, approved: true }
    if (task.workflow_id === 'interactive') {
      await interactiveTaskActionMutation.mutateAsync(actionData)
    } else if (task.workflow_id === 'ticket') {
      await ticketTaskActionMutation.mutateAsync(actionData)
    } else {
      // proactive workflow (default)
      await proactiveTaskActionMutation.mutateAsync(actionData)
    }
  }

  const handleRejectTask = async (taskId: string) => {
    // Find the task to determine its workflow
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    // Use appropriate workflow-specific mutation
    const actionData = { task_id: taskId, approved: false }
    if (task.workflow_id === 'interactive') {
      await interactiveTaskActionMutation.mutateAsync(actionData)
    } else if (task.workflow_id === 'ticket') {
      await ticketTaskActionMutation.mutateAsync(actionData)
    } else {
      // proactive workflow (default)
      await proactiveTaskActionMutation.mutateAsync(actionData)
    }
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

      {/* Create Task Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6 space-y-6">
              {/* Workflow Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Workflow Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setWorkflowType('proactive')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      workflowType === 'proactive'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Zap className={`h-6 w-6 mx-auto mb-2 ${
                      workflowType === 'proactive' ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-gray-900">Proactive</div>
                    <div className="text-xs text-gray-500 mt-1">Autonomous task</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setWorkflowType('ticket')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      workflowType === 'ticket'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Ticket className={`h-6 w-6 mx-auto mb-2 ${
                      workflowType === 'ticket' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-gray-900">Ticket</div>
                    <div className="text-xs text-gray-500 mt-1">Ticket-based</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setWorkflowType('interactive')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      workflowType === 'interactive'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className={`h-6 w-6 mx-auto mb-2 ${
                      workflowType === 'interactive' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-gray-900">Interactive</div>
                    <div className="text-xs text-gray-500 mt-1">User interaction</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkflowType('matrix')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      workflowType === 'matrix'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Grid className={`h-6 w-6 mx-auto mb-2 ${
                      workflowType === 'matrix' ? 'text-orange-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-medium text-gray-900">Matrix</div>
                    <div className="text-xs text-gray-500 mt-1">Multi-phase algorithm</div>
                  </button>
                </div>
              </div>

              {/* Proactive/Interactive/Matrix Fields */}
              {(workflowType === 'proactive' || workflowType === 'interactive' || workflowType === 'matrix') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {workflowType === 'matrix' ? 'Aspect Goal Description' : 'Goal Prompt'} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={goalPrompt}
                    onChange={(e) => setGoalPrompt(e.target.value)}
                    placeholder={
                      workflowType === 'matrix' 
                        ? 'Describe the aspect for the algorithm (e.g., "professional experience", "technical knowledge")...'
                        : 'Describe what you want the agent to accomplish...'
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                  {workflowType === 'matrix' && (
                    <p className="mt-1 text-xs text-gray-500">
                      This will be used to create a new algorithm for the IRIS Matrix Optimization system.
                    </p>
                  )}
                </div>
              )}

              {/* Ticket Workflow Fields */}
              {workflowType === 'ticket' && (
                <div className="space-y-4">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket Text
                    </label>
                    <textarea
                      value={ticketText}
                      onChange={(e) => setTicketText(e.target.value)}
                      placeholder="Full text of the ticket or issue description..."
                      rows={3}
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

              {/* Tool Selection */}
              <ToolSelector
                selectedTools={availableTools}
                onToolsChange={setAvailableTools}
              />

              {/* Common Settings */}
              <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setReasoningEffort(level)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          reasoningEffort === level
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
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
                <Button
                  type="submit"
                  disabled={
                    createTaskMutation.isPending || 
                    (workflowType === 'proactive' && !goalPrompt.trim()) ||
                    (workflowType === 'interactive' && !goalPrompt.trim()) ||
                    (workflowType === 'matrix' && !goalPrompt.trim()) ||
                    (workflowType === 'ticket' && !ticketId.trim())
                  }
                  className="flex items-center gap-2"
                >
                  {createTaskMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Task
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Dialog */}
      {showHelpDialog && (
        <Card className="border-blue-200 flex-shrink-0">
          <form onSubmit={handleSendHelp} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium text-gray-900">Provide Help to Agent</h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={resetHelpDialog}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Help Response
              </label>
              <textarea
                value={helpResponse}
                onChange={(e) => setHelpResponse(e.target.value)}
                placeholder="Provide help or guidance to the agent..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                  type="submit"
                  variant="primary"
                  disabled={proactiveHelpTaskMutation.isPending || ticketHelpTaskMutation.isPending || !helpResponse.trim()}
                >
                  {(proactiveHelpTaskMutation.isPending || ticketHelpTaskMutation.isPending) ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Send Help'
                  )}
                </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={resetHelpDialog}
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
                    {task.ticket_id && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                        {task.ticket_id}
                      </span>
                    )}
                    {task.available_tools && task.available_tools.length > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                        {task.available_tools.length} tool{task.available_tools.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {task.status === 'cancelling' && (
                      <LoadingSpinner size="sm" />
                    )}
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

                  {task.status === 'help_required' && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-800 mb-1">Agent Needs Help</p>
                          <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">
                            {task.approval_reason || 'Agent is requesting help...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tool Offline Warning */}
                  {toolsData && (
                    <ToolOfflineWarning
                      task={task}
                      allTools={toolsData.tools}
                      className="mb-2"
                    />
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
                        disabled={proactiveTaskActionMutation.isPending || interactiveTaskActionMutation.isPending || ticketTaskActionMutation.isPending}
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
                        disabled={proactiveTaskActionMutation.isPending || interactiveTaskActionMutation.isPending || ticketTaskActionMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {task.status === 'help_required' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShowHelpDialog(task)
                      }}
                      disabled={proactiveHelpTaskMutation.isPending || ticketHelpTaskMutation.isPending}
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {!['completed', 'failed', 'cancelled', 'canceled'].includes(task.status) && (
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
