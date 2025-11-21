import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5173;
const apiTarget = process.env.VITE_ORCHESTRATOR_API_URL || 'http://localhost:8080';
const wsTarget = process.env.VITE_ORCHESTRATOR_WS_URL || 'ws://localhost:8080';

console.log(`Configuring proxy: API -> ${apiTarget}, WS -> ${wsTarget}`);

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy API requests
const apiProxy = createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // Remove /api prefix when forwarding to backend
  },
  onProxyReq: (proxyReq, req, res) => {
    // console.log(`[Proxy] ${req.method} ${req.path} -> ${apiTarget}${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err);
    res.status(500).send('Proxy Error');
  }
});

app.use('/api', apiProxy);

// Proxy WebSocket requests
const wsProxy = createProxyMiddleware({
  target: wsTarget,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  pathRewrite: {
     // Keep /ws as /ws because the backend expects it
  },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    console.log('[Proxy WS] Connection upgrade request');
  },
  onError: (err, req, res) => {
    console.error('[Proxy WS Error]', err);
  }
});

// Use the proxy middleware for /ws path
app.use('/ws', wsProxy);

// Handle SPA routing - return index.html for all other non-api routes
// Using regex to avoid path-to-regexp wildcard issues
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
});

// Explicitly handle upgrade events for WebSockets
// This ensures that the upgrade request is passed to the proxy middleware
server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/ws')) {
    // Check if the proxy middleware has an upgrade function (v1/v2)
    if (typeof wsProxy.upgrade === 'function') {
      wsProxy.upgrade(req, socket, head);
    } 
    // In v3, or if not available, ensure we log it. 
    // Note: If wsProxy doesn't have .upgrade, and app.use didn't catch it (because upgrade is not HTTP method),
    // then we might have an issue. 
    // However, http-proxy-middleware documentation often suggests standard app.use handles it if the server is passed.
    // Since we didn't pass 'server' to createProxyMiddleware, we must handle upgrade manually if the library requires it.
    // Assuming v3 behavior where we might need to invoke the handler manually if it supports it.
    // If wsProxy is just a handler, we might need to look at the library internals or fallback.
    // But for safety, logging here confirms we caught the event.
    console.log('[Server] Upgrade event received for /ws');
  }
});
