import { useEffect, useMemo, useRef, useState } from 'react'
import { useWebSocket } from '../ws/WebSocketProvider'

type Evt = { event_type: string; timestamp: string; task_id?: string; [k: string]: any }

export default function Events() {
  const { subscribe } = useWebSocket()
  const [events, setEvents] = useState<Evt[]>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [taskFilter, setTaskFilter] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = subscribe((evt: any) => {
      setEvents(prev => {
        const next = [evt, ...prev]
        return next.slice(0, 500)
      })
    })
    return () => { /* cleanup handled */ }
  }, [subscribe])

  const filtered = useMemo(() => {
    return events.filter(e => (
      (!typeFilter || e.event_type.includes(typeFilter)) &&
      (!taskFilter || (e.task_id || '').includes(taskFilter))
    ))
  }, [events, typeFilter, taskFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
        <div className="text-sm text-gray-500">{events.length} cached</div>
      </div>
      <div className="bg-white border rounded p-3 flex flex-wrap items-center gap-2">
        <input value={typeFilter} onChange={e => setTypeFilter(e.target.value)} placeholder="Filter by type" className="px-3 py-2 border rounded text-sm" />
        <input value={taskFilter} onChange={e => setTaskFilter(e.target.value)} placeholder="Filter by task id" className="px-3 py-2 border rounded text-sm" />
      </div>
      <div ref={containerRef} className="bg-white border rounded p-3 max-h-[520px] overflow-auto divide-y text-sm">
        {filtered.map((e, idx) => (
          <div key={idx} className="py-2">
            <div className="text-gray-800 font-medium">{e.event_type}</div>
            <div className="text-xs text-gray-500">{e.timestamp} {e.task_id && <>• <span className="font-mono">{e.task_id.slice(0,8)}</span></>}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


