import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SignedIn, SignedOut, useAuth, useUser, AuthenticateWithRedirectCallback, ClerkLoading, ClerkLoaded } from '@clerk/clerk-react'
import { setAuthToken } from './services/api'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import EnterpriseDashboardPage from './pages/EnterpriseDashboardPage'
import AIReportPage from './pages/AIReportPage'
import AnalysisWizardPage from './pages/AnalysisWizardPage'
import JobSearchPage from './pages/JobSearchPage'
import CoursesExplorerPage from './pages/CoursesExplorerPage'
import ProfilePage from './pages/ProfilePage'
import OnboardingPage from './pages/OnboardingPage'

// Helper component to keep Axios token fresh
function ApiTokenHandler() {
    const { getToken } = useAuth()

    useEffect(() => {
        const syncToken = async () => {
            const token = await getToken()
            setAuthToken(token)
        }
        syncToken()
    }, [getToken])

    return null
}

function DashboardRouter() {
    const { user, isLoaded } = useUser()
    if (!isLoaded) return null
    if (user?.unsafeMetadata?.role === 'employer') {
        return <EnterpriseDashboardPage />
    }
    return <DashboardPage />
}

function App() {
    return (
        <AnimatePresence mode="wait">
            <ApiTokenHandler />

            <ClerkLoading>
                <div className="min-h-screen flex flex-col items-center justify-center bg-background-light">
                    <div className="size-16 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-6"></div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Connecting to Authentication Server...</h2>
                    <p className="text-slate-500 max-w-md text-center">
                        Securely establishing token context. If this screen does not go away, your Clerk API project has been deleted or is currently blocking the connection (Cloudflare 530 Error).
                    </p>
                </div>
            </ClerkLoading>

            <ClerkLoaded>
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<><SignedOut><AuthPage /></SignedOut><SignedIn><Navigate to="/dashboard" replace /></SignedIn></>} />
                    <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />

                    {/* Protected */}
                    <Route path="/onboarding" element={<><SignedIn><OnboardingPage /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
                    <Route path="/dashboard" element={<><SignedIn><DashboardRouter /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
                    <Route path="/jobs" element={<><SignedIn><JobSearchPage /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
                    <Route path="/courses" element={<><SignedIn><CoursesExplorerPage /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
                    <Route path="/profile" element={<><SignedIn><ProfilePage /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
                </Routes>
            </ClerkLoaded>
        </AnimatePresence>
    )
}

export default App
