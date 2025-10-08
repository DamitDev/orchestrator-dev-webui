# WebUI Workflow Refactoring Summary

## Overview
The WebUI has been refactored to support multiple workflow types (proactive, ticket, interactive) instead of being hardcoded for just the "proactive" workflow.

## Files Modified

### 1. Type Definitions (`src/types/api.ts`)
**Changes:**
- Added `workflow_id: string` to `Task` interface
- Made `ticket_id` optional in `Task` interface (now `ticket_id?: string`)
- Updated `TaskCreateRequest` to support all workflow types:
  - Added optional `workflow_id` field (defaults to 'proactive' in backend)
  - Made `ticket_id` optional
  - Added workflow-specific fields: `agent_model_id`, `orchestrator_model_id`
  - Kept ticket-specific fields: `ticket_text`, `summary`, `problem_summary`, `solution_strategy`

### 2. New Utility File (`src/lib/taskUtils.tsx`)
**Purpose:** Shared functionality for all workflow-specific task detail components

**Exports:**
- `renderReasoningSection()` - Renders collapsible reasoning blocks
- `renderMessageContent()` - Renders messages with markdown or raw text
- `getMessageIcon()` - Returns icon for message role
- `getRoleDisplayName()` - Maps role to display name
- `getMessageBgColor()` - Returns background color class for message
- `getStateDisplayName()` - Maps backend state names to user-friendly display names
  - Maps `in_progress` → `Agent Turn`
  - Maps `agent_turn` → `Agent Turn`
  - Maps `user_turn` → `User Turn`
  - Maps `validation`/`validating` → `Validation`/`Validating`

### 3. New Workflow-Specific Components

#### `src/components/ProactiveTaskDetail.tsx`
**Features:**
- Shows "PROACTIVE" badge in purple
- Displays progress, status, conversation history
- Has "Guide Task" button (workflow-specific action)
- Shows special alerts for `action_required` and `help_required` states
- Full conversation rendering with tool calls and reasoning

#### `src/components/TicketTaskDetail.tsx`
**Features:**
- Shows "TICKET" badge in blue
- Displays ticket_id if present (with ticket icon)
- Has "Guide Task" button (workflow-specific action)
- Shows special alerts for `action_required` and `help_required` states
- Same conversation rendering as Proactive

#### `src/components/InteractiveTaskDetail.tsx`
**Features:**
- Shows "INTERACTIVE" badge in green
- Special alert for `user_turn` state (waiting for user input)
- NO "Guide Task" button (not supported for interactive workflow)
- Shows `action_required` alert if needed
- Same conversation rendering

### 4. TaskDetail Router (`src/components/TaskDetail.tsx`)
**Purpose:** Routes to the appropriate workflow-specific component

**Logic:**
```typescript
switch (task.workflow_id) {
  case 'proactive': return <ProactiveTaskDetail />
  case 'ticket': return <TicketTaskDetail />
  case 'interactive': return <InteractiveTaskDetail />
  default: return <UnknownWorkflowError />
}
```

### 5. Updated Utility Functions (`src/lib/utils.ts`)

#### `getStatusColor()`
**Added states:**
- `cancelled` (in addition to `canceled`)
- `agent_turn` (yellow, same as `in_progress`)
- `user_turn` (cyan - visually distinct)
- `validating` (yellow, same as `validation`)

#### `getStatusIcon()`
**Added states:**
- `cancelled` (🚫)
- `agent_turn` (🔄)
- `user_turn` (👤 - user icon)
- `validating` (🔍)

#### `isRunningStatus()`
**Updated logic:**
Now includes: `in_progress`, `agent_turn`, `user_turn`, `validation`, `validating`

### 6. TaskList Component (`src/components/TaskList.tsx`)
**Changes:**
- Fixed optional `ticket_id` handling in search filter:
  ```typescript
  (task.ticket_id && task.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()))
  ```

## Workflow-Specific Features Summary

| Feature | Proactive | Ticket | Interactive |
|---------|-----------|--------|-------------|
| Guide Task Button | ✅ | ✅ | ❌ |
| Ticket ID Display | ❌ | ✅ | ❌ |
| Badge Color | Purple | Blue | Green |
| User Turn State | ❌ | ❌ | ✅ |
| Action Required | ✅ | ✅ | ✅ |
| Help Required | ✅ | ✅ | ❌ |

## State Name Mappings

Backend states are automatically mapped to user-friendly names:
- `in_progress` → "Agent Turn"
- `agent_turn` → "Agent Turn"
- `user_turn` → "User Turn"
- `validation` → "Validation"
- `validating` → "Validating"
- `queued` → "Queued"
- `queued_for_function_execution` → "Function Execution"
- `action_required` → "Action Required"
- `help_required` → "Help Required"
- `completed` → "Completed"
- `failed` → "Failed"
- `cancelled`/`canceled` → "Cancelled"

## Visual Distinctions

Each workflow has a colored badge:
- **Proactive**: Purple badge
- **Ticket**: Blue badge with ticket icon
- **Interactive**: Green badge

Each state has a distinct color and icon:
- **Agent Turn**: Yellow background (🔄)
- **User Turn**: Cyan background (👤)
- **Validation**: Yellow background (🔍)
- **Action Required**: Orange background (🔶)
- **Help Required**: Blue background (💬)
- **Completed**: Green background (✅)
- **Failed**: Red background (❌)

## Testing Recommendations

1. **Type Safety**: All TypeScript types have been updated to match backend
2. **Optional Fields**: ticket_id is now optional and handled safely
3. **Workflow Routing**: Test all three workflow types render correctly
4. **State Display**: Verify all new state names display properly
5. **Actions**: Verify Guide Task only appears for proactive and ticket workflows
6. **Search**: Test search with and without ticket_id

## Next Steps (Future Enhancements)

1. Add workflow-specific data display in task headers (e.g., agent_model_id, orchestrator_model_id)
2. Implement interactive workflow user input functionality
3. Add workflow type filter to TaskList
4. Create workflow-specific task creation forms
5. Add workflow-specific metrics to Dashboard
