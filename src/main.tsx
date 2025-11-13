import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'
import { ModeProvider } from './state/ModeContext'
import { WebSocketProvider } from './ws/WebSocketProvider'
import { AuthProvider } from './context/AuthContext'
import { loadRuntimeConfig } from './lib/runtimeConfig'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false
    }
  }
})

async function bootstrap() {
  await loadRuntimeConfig()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ModeProvider>
            <WebSocketProvider>
              <BrowserRouter>
                <App />
                <Toaster position="top-right" />
              </BrowserRouter>
            </WebSocketProvider>
          </ModeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}

bootstrap()


