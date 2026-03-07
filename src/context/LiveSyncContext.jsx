import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const LiveSyncContext = createContext(null)

// ─── Job role options (exact match to backend categories) ───
export const JOB_ROLES = [
    'Software Engineer',
    'Data Analyst',
    'AI / Machine Learning Engineer',
    'Business Analyst',
    'Web Developer',
    'DevOps Engineer',
    'Digital Marketing Specialist',
    'BPO / Customer Support Executive',
    'Product Manager',
    'UI / UX Designer',
]

// ─── City options (Tier 1/2/3) ───
export const CITIES = [
    // Tier 1
    'Pune', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Kolkata',
    // Tier 2
    'Jaipur', 'Indore', 'Ahmedabad', 'Lucknow', 'Nagpur', 'Bhopal', 'Chandigarh',
    'Kochi', 'Coimbatore', 'Noida', 'Gurugram',
    // Tier 3
    'Dehradun', 'Mysore', 'Mangalore', 'Raipur', 'Bhubaneswar',
]

export function LiveSyncProvider({ children }) {
    // ─── Layer 1: Market data ───
    const [marketData, setMarketData] = useState(null)

    // ─── Layer 2: Worker data ───
    const [workerData, setWorkerData] = useState(null)

    // ─── Sync state ───
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncError, setSyncError] = useState(null)
    const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null)
    const [syncResult, setSyncResult] = useState(null)

    /**
     * Trigger Live Sync: calls POST /api/v1/market/sync-live
     * and updates both Layer 1 and Layer 2 global state.
     */
    const syncLive = useCallback(async (jobRole, city, workerContext = {}) => {
        setIsSyncing(true)
        setSyncError(null)
        setSyncResult(null)

        try {
            const payload = {
                jobRole,
                city,
                workerJobTitle: workerContext.workerJobTitle || jobRole,
                yearsOfExperience: workerContext.yearsOfExperience || 0,
                currentSkills: workerContext.currentSkills || [],
                workDescription: workerContext.workDescription || '',
            }

            const response = await api.post('/v1/market/sync-live', payload)
            const data = response.data

            if (data.status === 'ERROR') {
                throw new Error(data.message || 'Live sync failed')
            }

            // ─── Update Layer 1 (Market) ───
            setMarketData({
                aiVulnerabilityIndex: data.aiVulnerabilityIndex,
                skillsIntelligence: data.skillsIntelligence,
                hiringTrends: data.hiringTrends,
                scrapedRole: data.scrapedRole,
                scrapedCity: data.scrapedCity,
                newJobsAdded: data.newJobsAdded,
            })

            // ─── Update Layer 2 (Worker) ───
            setWorkerData({
                personalRiskScore: data.personalRiskScore,
                personalRiskLevel: data.personalRiskLevel,
                marketAVI: data.marketAVI,
                targetRolePivot: data.targetRolePivot,
                targetRoleJobCount: data.targetRoleJobCount,
                ragContext: data.ragContext,
            })

            setLastSyncTimestamp(data.syncTimestamp)
            setSyncResult(data)

            return data
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
            setSyncError(errorMsg)
            throw err
        } finally {
            setIsSyncing(false)
        }
    }, [])

    const value = {
        // Layer 1
        marketData,
        // Layer 2
        workerData,
        // Sync controls
        syncLive,
        isSyncing,
        syncError,
        lastSyncTimestamp,
        syncResult,
    }

    return (
        <LiveSyncContext.Provider value={value}>
            {children}
        </LiveSyncContext.Provider>
    )
}

export function useLiveSync() {
    const context = useContext(LiveSyncContext)
    if (!context) {
        throw new Error('useLiveSync must be used within a LiveSyncProvider')
    }
    return context
}

export default LiveSyncContext
