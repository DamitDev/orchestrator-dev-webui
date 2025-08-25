# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Orchestrator WebUI

A modern React-based dashboard for the Orchestrator API, providing real-time task monitoring, management, and configuration.

## Features

### Dashboard
- **Real-time Overview**: Live statistics of total, active, queued, and pending approval tasks
- **System Status**: Current configuration including agent and orchestrator models
- **Health Monitoring**: API connectivity and system status indicators

### Task Management
- **Live Task List**: Real-time updates of all tasks with status indicators
- **Task Creation**: Simple form to create new tasks with customizable parameters
- **Task Actions**: Approve/reject tasks requiring action, cancel running tasks
- **Detailed View**: Full conversation history and task progress tracking
- **Search & Filter**: Find tasks by ID, status, or goal prompt

### Real-time Updates
- **Configurable Polling**: Choose refresh intervals from 1-30 seconds
- **Status Animations**: Visual indicators for running tasks
- **Live Notifications**: Toast notifications for task state changes
- **Background Updates**: Continuous polling even when tab is not active

### Configuration Management
- **Model Selection**: Set agent and orchestrator models from available backends
- **Backend Overview**: View all configured LLM backends and their models
- **MCP Servers**: Monitor configured MCP servers and available tools
- **System Settings**: Adjust refresh intervals and other preferences

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query) for server state
- **API Client**: Axios
- **UI Components**: Custom components with Headless UI
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites
- Node.js 18+ (project is compatible with Node 18.19.1)
- npm
- Running Orchestrator API (default: http://localhost:8081)

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd orchestrator-webui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Configuration

The WebUI is configured to connect to the Orchestrator API at `http://localhost:8081` by default. To change this, modify the `API_BASE_URL` in `src/lib/api.ts`:

```typescript
const API_BASE_URL = 'http://your-api-host:port'
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## API Integration

The WebUI integrates with all Orchestrator API endpoints:

### Task Endpoints
- `GET /tasks` - List all tasks
- `POST /task/create` - Create new task
- `GET /task/status` - Get task details
- `GET /task/conversation` - Get task conversation
- `POST /task/action` - Approve/reject task
- `POST /task/cancel` - Cancel task

### Configuration Endpoints
- `GET /configuration/status` - System overview
- `POST /configuration/agent` - Set agent model
- `POST /configuration/orchestrator` - Set orchestrator model
- `GET /configuration/llmbackend/status` - LLM backends
- `GET /configuration/mcpserver/status` - MCP servers

## Task Status Indicators

The WebUI provides visual indicators for all task statuses:

| Status | Color | Icon | Animation |
|--------|-------|------|-----------|
| `completed` | Green | ✅ | None |
| `failed` | Red | ❌ | None |
| `canceled` | Red | 🚫 | None |
| `action_required` | Yellow | ⚠️ | None |
| `in_progress` | Blue | 🔄 | Spinning |
| `validation` | Blue | 🔄 | Spinning |
| `function_execution` | Blue | 🔄 | Spinning |
| `queued` | Gray | ⏳ | None |
| `queued_for_function_execution` | Gray | ⏳ | None |

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── TaskList.tsx    # Task list and creation
│   ├── TaskDetail.tsx  # Task conversation view
│   └── Settings.tsx    # Configuration panel
├── hooks/              # Custom React hooks
│   └── useApi.ts      # API integration hooks
├── lib/               # Utilities and API client
│   ├── api.ts         # API client
│   └── utils.ts       # Helper functions
├── types/             # TypeScript type definitions
│   └── api.ts         # API types
└── App.tsx           # Main application
```

### Adding New Features

1. **New API Endpoints**: Add to `src/lib/api.ts`
2. **New Types**: Define in `src/types/api.ts`
3. **New Hooks**: Create in `src/hooks/useApi.ts`
4. **New Components**: Add to `src/components/`

### Styling

The project uses Tailwind CSS with a custom color palette:
- **Primary**: Blue variants for main actions
- **Success**: Green for completed/successful states
- **Warning**: Yellow for attention-required states
- **Danger**: Red for failed/error states

Custom utilities in `src/lib/utils.ts` provide status-based styling helpers.

## License

This project is part of the Orchestrator system.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
