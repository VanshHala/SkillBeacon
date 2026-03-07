import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveSync, JOB_ROLES } from '../context/LiveSyncContext'

export default function LiveSyncPanel() {
    const { syncLive, isSyncing, syncError, syncResult, workerData, marketData } = useLiveSync()
    const [selectedRole, setSelectedRole] = useState(JOB_ROLES[0])

    const handleSync = async () => {
        try {
            await syncLive(selectedRole, 'India', {
                workerJobTitle: selectedRole,
                city: 'India',
                yearsOfExperience: 0,
                currentSkills: [],
                workDescription: '',
            })
        } catch (e) {
            // error is already captured in context
        }
    }

    const getRiskColor = (level) => {
        if (level === 'High') return 'text-red-600 bg-red-50 border-red-200'
        if (level === 'Medium') return 'text-amber-600 bg-amber-50 border-amber-200'
        return 'text-green-600 bg-green-50 border-green-200'
    }

    const getRiskBarColor = (score) => {
        if (score > 70) return 'bg-red-500'
        if (score >= 40) return 'bg-amber-500'
        return 'bg-green-500'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden mb-10"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary via-slate-800 to-primary p-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                        <span className="material-symbols-outlined text-white text-2xl block">cell_tower</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Trigger Live Sync</h3>
                        <p className="text-white/60 text-xs font-medium">Real-time LinkedIn scraping via Apify — Demo God Mode</p>
                    </div>
                    {syncResult && (
                        <div className="ml-auto hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                            <span className="text-white/80 text-xs font-bold">Last: +{syncResult.newJobsAdded} jobs</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Job Role Dropdown */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            <span className="material-symbols-outlined text-[14px] align-middle mr-1">work</span>
                            Job Role
                        </label>
                        <select
                            id="livesync-role"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            disabled={isSyncing}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50"
                        >
                            {JOB_ROLES.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sync Button */}
                    <div className="flex items-end">
                        <button
                            id="livesync-trigger"
                            onClick={handleSync}
                            disabled={isSyncing}
                            className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isSyncing
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {isSyncing ? (
                                <>
                                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                    <span>Scraping live signals...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">cell_tower</span>
                                    <span>Trigger Live Sync</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                <AnimatePresence>
                    {syncError && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4"
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-500">error</span>
                                <p className="text-sm font-medium text-red-700">{syncError}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading Skeleton */}
                <AnimatePresence>
                    {isSyncing && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border border-primary/10 bg-primary/5 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-primary">Scraping LinkedIn via Apify…</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Fetching 15 fresh job postings for {selectedRole}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-white/60 rounded-lg animate-pulse"></div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results Display */}
                <AnimatePresence>
                    {syncResult && !isSyncing && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Success Banner */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                                <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                                <div>
                                    <p className="text-sm font-bold text-green-800">{syncResult.message}</p>
                                    <p className="text-xs text-green-600 mt-0.5">Synced at {new Date(syncResult.syncTimestamp).toLocaleTimeString()}</p>
                                </div>
                            </div>

                            {/* Metrics Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* New Jobs */}
                                <motion.div
                                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                                    className="bg-blue-50 border border-blue-200 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-blue-600 text-lg">work</span>
                                        <span className="text-xs font-bold text-blue-400 uppercase">New Jobs</span>
                                    </div>
                                    <p className="text-3xl font-black text-blue-700">+{syncResult.newJobsAdded}</p>
                                    <p className="text-xs text-blue-500 mt-1">Appended to database</p>
                                </motion.div>

                                {/* Market AVI */}
                                <motion.div
                                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.05 }}
                                    className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-slate-600 text-lg">psychology</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase">AI Vulnerability</span>
                                    </div>
                                    <p className="text-3xl font-black text-primary">{workerData?.marketAVI ?? '—'}</p>
                                    <p className="text-xs text-slate-500 mt-1">Index for {syncResult.scrapedRole}</p>
                                </motion.div>

                                {/* Personal Risk Score */}
                                <motion.div
                                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}
                                    className={`rounded-xl p-4 border ${getRiskColor(workerData?.personalRiskLevel)}`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-lg">shield_person</span>
                                        <span className="text-xs font-bold uppercase opacity-70">Personal Risk</span>
                                    </div>
                                    <p className="text-3xl font-black">{workerData?.personalRiskScore?.toFixed(1) ?? '—'}</p>
                                    <div className="w-full bg-black/5 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${workerData?.personalRiskScore || 0}%` }}
                                            transition={{ delay: 0.3, duration: 1 }}
                                            className={`h-full rounded-full ${getRiskBarColor(workerData?.personalRiskScore)}`}
                                        />
                                    </div>
                                    <p className="text-xs mt-1.5 font-bold uppercase">{workerData?.personalRiskLevel ?? '—'} Risk</p>
                                </motion.div>

                                {/* Target Role Pivot */}
                                <motion.div
                                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.15 }}
                                    className={`rounded-xl p-4 border ${workerData?.targetRolePivot
                                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                                        : 'bg-green-50 border-green-200 text-green-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-lg">
                                            {workerData?.targetRolePivot ? 'swap_horiz' : 'verified'}
                                        </span>
                                        <span className="text-xs font-bold uppercase opacity-70">Reskilling Target</span>
                                    </div>
                                    {workerData?.targetRolePivot ? (
                                        <>
                                            <p className="text-lg font-black leading-tight">{workerData.targetRolePivot}</p>
                                            <p className="text-xs mt-1 opacity-70">
                                                {workerData.targetRoleJobCount} jobs available
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-lg font-black">No Pivot Needed</p>
                                            <p className="text-xs mt-1 opacity-70">Risk score is below threshold</p>
                                        </>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
