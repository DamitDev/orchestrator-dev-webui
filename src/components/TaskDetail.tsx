import React from 'react'
import { useTask } from '../hooks/useApi'
import Card from './ui/Card'
import LoadingSpinner from './ui/LoadingSpinner'
import ProactiveTaskDetail from './ProactiveTaskDetail'
import TicketTaskDetail from './TicketTaskDetail'
import InteractiveTaskDetail from './InteractiveTaskDetail'
import { AlertTriangle } from 'lucide-react'

interface TaskDetailProps {
  taskId: string
}

/**
 * TaskDetail router component that renders the appropriate workflow-specific
 * task detail component based on the task's workflow_id
 */
const TaskDetail: React.FC<TaskDetailProps> = ({ taskId }) => {
  const { data: task, isLoading: taskLoading } = useTask(taskId)

  if (taskLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  if (!task) {
    return (
      <Card className="h-full">
        <div className="text-center text-gray-500 p-8">
          <p>Task not found</p>
        </div>
      </Card>
    )
  }

  // Route to the appropriate workflow-specific component
  switch (task.workflow_id) {
    case 'proactive':
      return <ProactiveTaskDetail taskId={taskId} />
    case 'ticket':
      return <TicketTaskDetail taskId={taskId} />
    case 'interactive':
      return <InteractiveTaskDetail taskId={taskId} />
    default:
      return (
        <Card className="h-full">
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Unknown Workflow Type</p>
            <p className="text-sm text-gray-600">
              Task workflow "{task.workflow_id}" is not supported by this UI.
            </p>
          </div>
        </Card>
      )
  }
}

export default TaskDetail
