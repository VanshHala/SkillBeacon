import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SignedIn, SignedOut, useAuth, AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { setAuthToken } from './services/api'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import AIReportPage from './pages/AIReportPage'
import AnalysisWizardPage from './pages/AnalysisWizardPage'
import JobSearchPage from './pages/JobSearchPage'
import CoursesExplorerPage from './pages/CoursesExplorerPage'
import ProfilePage from './pages/ProfilePage'

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

function App() {
    return (
        <AnimatePresence mode="wait">
            <ApiTokenHandler />
            <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<><SignedOut><AuthPage /></SignedOut><SignedIn><Navigate to="/dashboard" replace /></SignedIn></>} />
                <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback signInForceRedirectUrl="/dashboard" signUpForceRedirectUrl="/dashboard" />} />

                {/* Protected */}
                <Route path="/dashboard" element={<><SignedIn><DashboardPage /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
                <Route path="/report" element={<><SignedIn><AIReportPage /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
                <Route path="/analysis" element={<><SignedIn><AnalysisWizardPage /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
                <Route path="/jobs" element={<><SignedIn><JobSearchPage /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
                <Route path="/courses" element={<><SignedIn><CoursesExplorerPage /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
                <Route path="/profile" element={<><SignedIn><ProfilePage /></SignedIn><SignedOut><Navigate to="/login" replace /></SignedOut></>} />
            </Routes>
        </AnimatePresence>
    )
}

export default App
