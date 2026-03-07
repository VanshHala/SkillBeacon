import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LiveSyncProvider } from './context/LiveSyncContext'
import App from './App'
import './index.css'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
    throw new Error("Missing Publishable Key")
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1
        }
    }
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ClerkProvider publishableKey={clerkPubKey}>
            <QueryClientProvider client={queryClient}>
                <LiveSyncProvider>
                    <BrowserRouter>
                        <GlobalErrorBoundary>
                            <App />
                        </GlobalErrorBoundary>
                    </BrowserRouter>
                </LiveSyncProvider>
            </QueryClientProvider>
        </ClerkProvider>
    </React.StrictMode>,
)
