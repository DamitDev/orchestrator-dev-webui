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
# Defaults are set to use the proxy
ARG VITE_ORCHESTRATOR_API_URL=/api
ARG VITE_ORCHESTRATOR_WS_URL=/ws
ARG PORT=5173

# Create .env file from build args
RUN echo "VITE_ORCHESTRATOR_API_URL=${VITE_ORCHESTRATOR_API_URL}" > .env && \
    echo "VITE_ORCHESTRATOR_WS_URL=${VITE_ORCHESTRATOR_WS_URL}" >> .env

# Build the application
RUN npm run build

# Stage 2: Serve with custom Express server
FROM node:20-alpine

WORKDIR /app

# Copy package files to install production dependencies
COPY package*.json ./

# Install ONLY production dependencies (express, http-proxy-middleware)
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
# Copy server script
COPY server.js ./

# Set port from build arg
ARG PORT=5173
ENV PORT=${PORT}

# Expose port
EXPOSE ${PORT}

# Serve the application using the custom server
CMD ["node", "server.js"]
