# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_ORCHESTRATOR_API_URL=http://localhost:8080
ARG VITE_ORCHESTRATOR_WS_URL=ws://localhost:8080/ws?client_id=webui
ARG PORT=5173

# Create .env file from build args
RUN echo "VITE_ORCHESTRATOR_API_URL=${VITE_ORCHESTRATOR_API_URL}" > .env && \
    echo "VITE_ORCHESTRATOR_WS_URL=${VITE_ORCHESTRATOR_WS_URL}" >> .env

# Build the application
RUN npm run build

# Stage 2: Serve with a lightweight web server
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set port from build arg
ARG PORT=5173
ENV PORT=${PORT}

# Expose port
EXPOSE ${PORT}

# Serve the application (port is set via environment variable)
CMD sh -c "serve -s dist -l ${PORT} -n"

