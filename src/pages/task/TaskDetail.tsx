import { useParams } from 'react-router-dom'

export default function TaskDetail() {
  const { id } = useParams()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Task Detail</h1>
      <p className="text-gray-600">Workflow-specific detail view will render here.</p>
      <div className="text-sm text-gray-500">Task ID: {id}</div>
    </div>
  )
}


