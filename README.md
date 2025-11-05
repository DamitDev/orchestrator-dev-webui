# Orchestrator WebUI

A modern, Nord-themed web interface for the DAMIT AIOps Orchestrator. Built with React, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Beautiful Nord Theme** - Eye-comfortable color palette with dark/light mode support
- 🔄 **Real-time Updates** - WebSocket integration for live task status updates
- 📋 **Multiple Workflows** - Support for Interactive, Proactive, Ticket, and Matrix workflows
- 💬 **Smart Chat Interface** - Grouped and nested agent responses with collapsible sections
- 🎯 **Task Management** - Create, monitor, and manage AI agent tasks
- ⚙️ **Configuration** - Manage LLM backends, MCP servers, and orchestrator settings
- 📊 **Task Inbox** - Organized views for active, pending, and completed tasks

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

When using Docker, configure via build args:

- `VITE_ORCHESTRATOR_API_URL` - Orchestrator API base URL (default: `http://host.docker.internal:8080`)
- `VITE_ORCHESTRATOR_WS_URL` - Orchestrator WebSocket URL (default: `ws://host.docker.internal:8080/ws?client_id=webui`)
- `PORT` - Port to run the webui on (default: `5173`)

You can set these in a `.env` file in the same directory as `docker-compose.yml`:

```bash
VITE_ORCHESTRATOR_API_URL=http://my-orchestrator:8080
VITE_ORCHESTRATOR_WS_URL=ws://my-orchestrator:8080/ws?client_id=webui
PORT=8000
```

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

## Project Structure

```
orchestrator-webui/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities (API, markdown, config)
│   ├── pages/          # Page components
│   ├── styles/         # Global styles and component CSS
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── Dockerfile          # Docker build configuration
├── docker-compose.yml  # Docker Compose configuration
└── tailwind.config.js  # Tailwind and Nord theme config
```

## License

Part of the DAMIT AIOps project.

