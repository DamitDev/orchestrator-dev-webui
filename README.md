# Orchestrator WebUI

A modern, Nord-themed web interface for the DAMIT AIOps Orchestrator. Built with React, TypeScript, and Tailwind CSS.

## Features

### Core Functionality

- 🎨 **Beautiful Nord Theme** - Eye-comfortable color palette with glassmorphism effects
- 🔄 **Real-time Updates** - WebSocket integration for live task status and conversation updates
- 📋 **Multiple Workflows** - Support for Interactive, Proactive, Ticket, and Matrix workflows
- 🎯 **Task Management** - Create, monitor, cancel, and filter AI agent tasks
- ⚙️ **Unified Settings** - Single-page settings with table of contents navigation
- 📊 **Task Inbox** - Organized views for active, pending, and completed tasks

### UI/UX Enhancements

- 💬 **Smart Chat Interface** - Grouped assistant messages with collapsible reasoning and tool interactions
- 🎞️ **Overlay Chat Panel** - Slide-out chat panel on Task Detail page (750px wide, aligned to top bar)
- 🔍 **Phase Navigation** - Navigate through completed phases in Matrix workflows
- 📋 **Dynamic Input** - Context-aware input field (Guide Task / Provide Help based on task state)
- 🆔 **Click-to-Copy Task IDs** - Truncated display with full ID on hover and click-to-copy
- 🔄 **Auto-scroll Chat** - Automatic scrolling to latest messages with smooth animations
- 🎨 **Markdown Rendering** - Full markdown support with syntax highlighting and line breaks
- 🔙 **Quick Navigation** - Back arrow in Task Detail header, hover-activated dropdown menus
- 🔧 **MCP Server Display** - Shows server names, descriptions, and available tools
- 🎭 **Message Formatting** - Differentiated styling for assistant, user, system, developer, and tool messages

### Workflow-Specific Features

- **Ticket Workflow**: Displays ticket ID, summary, problem description, and solution strategy with markdown formatting
- **Matrix Workflow**: Shows aspect goals, strategy, algorithm ID, and phase-based conversation history
- **Proactive Workflow**: Help-required state support with supervisor intervention
- **All Workflows**: Task result display for completed tasks, workflow filtering on Tasks page

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Using Docker

```bash
# Build the image with custom configuration
docker build \
  --build-arg VITE_ORCHESTRATOR_API_URL=http://your-orchestrator:8080 \
  --build-arg VITE_ORCHESTRATOR_WS_URL=ws://your-orchestrator:8080/ws?client_id=webui \
  --build-arg PORT=8000 \
  -t orchestrator-webui .

# Run the container
docker run -d \
  -p 8000:8000 \
  --name orchestrator-webui \
  orchestrator-webui
```

## Configuration

The application is configured using environment variables at build time.

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
VITE_ORCHESTRATOR_API_URL=http://localhost:8080
VITE_ORCHESTRATOR_WS_URL=ws://localhost:8080/ws?client_id=webui
PORT=5173
```

### Docker Environment Variables

When using Docker Compose, you can configure via environment variables:

- `VITE_ORCHESTRATOR_API_URL` - Backend API URL for the proxy server (default: `http://host.docker.internal:8080`)
- `VITE_ORCHESTRATOR_WS_URL` - Backend WebSocket URL for the proxy server (default: `ws://host.docker.internal:8080`)
- `PORT` - Port to run the webui on (default: `5173`). This sets both the container port and host port mapping.

You can set these in a `.env` file in the same directory as `docker-compose.yml`:

```bash
VITE_ORCHESTRATOR_API_URL=http://my-orchestrator:8080
VITE_ORCHESTRATOR_WS_URL=ws://my-orchestrator:8080
PORT=8000
```

**Note**: With the proxy setup, the frontend uses relative paths (`/api` and `/ws`) by default. The `VITE_ORCHESTRATOR_API_URL` and `VITE_ORCHESTRATOR_WS_URL` environment variables configure where the proxy forwards requests to the backend.

## Connecting to Orchestrator

The WebUI expects the Orchestrator API to be available at the configured URL. By default:
- **API**: `http://localhost:8080`
- **WebSocket**: `ws://localhost:8080/ws?client_id=webui`

When running both in Docker, use `host.docker.internal` or configure Docker networking to allow container-to-container communication.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework with Nord theme
- **TanStack Query** - Data fetching and state management
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Markdown** - Markdown rendering
- **Lucide React** - Icon library

## Key UI Components

### Task Detail Page
The Task Detail page features a comprehensive two-column layout:

- **Left Side (Full Width)**: Task information including status, type, workflow-specific data (ticket info, Matrix phase data), and markdown-formatted descriptions
- **Right Side (Overlay)**: 750px slide-out panel containing:
  - **Regular Workflows**: Chat interface with agent conversation, smart message grouping, and task guidance input
  - **Matrix Workflows**: Phase selector (view past phases), phase-specific conversation, and algorithm progress

### Settings Page
Unified scrollable settings page with:
- **Navigation Menu**: Table of Contents sidebar with automatic section highlighting using IntersectionObserver
- **Setting Cards**: All configuration sections displayed sequentially (Models, LLM Backends, MCP Servers, Task Handler, Tools, System, Auth)
- **Smart Scrolling**: Click any TOC item to smooth-scroll to that section

### Message Grouping
Assistant messages are intelligently grouped to improve readability:
- **Reasoning sections**: Collapsible "Thought" indicators with smooth slide-down animations
- **Tool calls**: Collapsible "Using tool: \<name\>" with parameters and inline responses
- **Tool responses**: Expandable/collapsible with syntax-highlighted content
- **Final content**: Full markdown rendering with proper line breaks and formatting

## Project Structure

```
orchestrator-dev-webui/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── TaskIdBadge.tsx        # Click-to-copy task ID component
│   │   └── GlobalShortcuts.tsx    # Keyboard shortcut handler
│   ├── hooks/            # Custom React hooks
│   │   ├── useTasks.ts            # Task management queries
│   │   ├── useConfig.ts           # Configuration queries
│   │   └── useWebSocket.ts        # Real-time updates
│   ├── lib/              # Utilities
│   │   ├── api.ts                 # API client and endpoints
│   │   ├── markdown.tsx           # Markdown rendering with grouping logic
│   │   └── runtimeConfig.ts       # Environment configuration
│   ├── pages/            # Page components
│   │   ├── Inbox.tsx              # Task inbox with filters
│   │   ├── Tasks.tsx              # All tasks with pagination
│   │   ├── CreateTask.tsx         # Task creation form
│   │   ├── Settings.tsx           # Unified settings page
│   │   ├── task/
│   │   │   └── TaskDetail.tsx     # Task detail with overlay chat
│   │   ├── config/                # Individual config components
│   │   └── workflows/             # Workflow-specific views
│   ├── styles/           # Global styles
│   │   ├── components.css         # Nord-themed component classes
│   │   └── index.css              # Base styles and animations
│   ├── types/            # TypeScript definitions
│   │   └── api.ts                 # API response types
│   ├── App.tsx           # Main app with header and routing
│   └── main.tsx          # Entry point with React Query setup
├── public/               # Static assets
│   └── favicon.svg       # Nord-themed conductor icon
├── Dockerfile            # Multi-stage Docker build
├── docker-compose.yml    # Docker Compose with env vars
└── tailwind.config.js    # Nord color palette and theme
```

## License

Part of the DAMIT AIOps project.

