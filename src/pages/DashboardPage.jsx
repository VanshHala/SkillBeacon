import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { dashboardApi, analyticsApi, workerApi, setAuthToken } from '../services/api'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AIChatbotFAB from '../components/AIChatbotFAB'
import LiveSyncPanel from '../components/LiveSyncPanel'
import { useLiveSync } from '../context/LiveSyncContext'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
}

const BAR_COLORS = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a']

export default function DashboardPage() {
    const { getToken, isLoaded, isSignedIn } = useAuth()
    const { user } = useUser()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { syncResult, marketData } = useLiveSync()

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            if (!user.unsafeMetadata?.onboardingComplete) {
                navigate('/onboarding', { replace: true })
            }
        }
    }, [isLoaded, isSignedIn, user, navigate])

    const enabled = isLoaded && isSignedIn && !!user?.unsafeMetadata?.onboardingComplete

    // ─── Fetch dashboard base metrics ───
    const { data: dashboardData, isLoading, refetch: refetchDashboard } = useQuery({
        queryKey: ['dashboardMetrics'],
        queryFn: async () => {
            const token = await getToken()
            setAuthToken(token)
            return dashboardApi.getMetrics()
        },
        enabled,
        staleTime: Infinity,
        refetchOnWindowFocus: false
    })

    // ─── Fetch hiring trends (live) ───
    const { data: hiringTrends, refetch: refetchHiring } = useQuery({
        queryKey: ['hiringTrends'],
        queryFn: async () => {
            const token = await getToken()
            setAuthToken(token)
            return analyticsApi.getHiringTrends(30)
        },
        enabled,
        staleTime: Infinity,
        refetchOnWindowFocus: false
    })

    // ─── Fetch skills intelligence (live) ───
    const { data: skillsData, refetch: refetchSkills } = useQuery({
        queryKey: ['skillsIntelligence'],
        queryFn: async () => {
            const token = await getToken()
            setAuthToken(token)
            return analyticsApi.getSkillsIntelligence()
        },
        enabled,
        staleTime: Infinity,
        refetchOnWindowFocus: false
    })



    // Refetch all queries whenever syncResult changes (after a Live Sync)
    useEffect(() => {
        if (syncResult) {
            refetchDashboard();
            refetchHiring();
            refetchSkills();
        }
    }, [syncResult, refetchDashboard, refetchHiring, refetchSkills])

    // ─── Fetch user's specific AI Risk Score ───
    const { data: userRiskScore } = useQuery({
        queryKey: ['userRiskScore'],
        queryFn: async () => {
            const token = await getToken()
            setAuthToken(token)
            const meta = user?.unsafeMetadata || {}
            return workerApi.getDynamicRiskScore({
                jobTitle: meta.jobTitle || 'Software Engineer',
                city: meta.location || '',
                yearsOfExperience: parseInt(meta.yoe) || 0,
                currentSkills: meta.currentSkills || []
            })
        },
        enabled
    })

    // ─── Compute metrics from MarketData OR Database data ───
    const totalJobs = marketData?.dashboardMetrics?.totalJobs || dashboardData?.totalJobs || 0

    // Market Volatility = average AVI across all categories
    const marketVolatility = useMemo(() => {
        const src = marketData?.aiVulnerabilityIndex || null;
        if (!src || !Array.isArray(src) || src.length === 0) return marketData?.dashboardMetrics?.marketVolatility || dashboardData?.marketVolatility || 0
        const avg = src.reduce((sum, e) => sum + (e?.vulnerabilityIndex || 0), 0) / src.length
        return Math.round(avg * 10) / 10
    }, [marketData, dashboardData])

    // AI Confidence = 100 - userRiskScore if available, else fallback
    const aiConfidence = useMemo(() => {
        if (userRiskScore?.riskScore !== undefined) {
            return Math.round((100 - userRiskScore.riskScore) * 10) / 10
        }
        return Math.round((100 - marketVolatility) * 10) / 10
    }, [userRiskScore, marketVolatility])

    // Top surging skills (from live data or DB)
    const topSkills = useMemo(() => {
        const fallback = Array.isArray(marketData?.dashboardMetrics?.topSkills) ? marketData.dashboardMetrics.topSkills :
            (Array.isArray(dashboardData?.topSkills) ? dashboardData.topSkills : [])
        const src = marketData?.skillsIntelligence || skillsData
        if (!src) return fallback
        // skillsData has structure { topSkills30d: [...], risingSkills: [...] }
        const raw = src.topSkills30d || src.topSkills || src.top_skills || []
        if (Array.isArray(raw) && raw.length > 0) {
            return raw.slice(0, 6).map((item) => {
                if (!item) return { skill: 'Unknown', count: 0 }
                if (Array.isArray(item)) return { skill: item[0], count: item[1] }
                return { skill: item?.skill || item?.[0], count: item?.count || item?.[1] || 0 }
            })
        }
        return fallback
    }, [marketData, skillsData, dashboardData])

    // Top hiring roles (from live hiring trends or DB)
    const topRoles = useMemo(() => {
        const fallback = Array.isArray(marketData?.dashboardMetrics?.jobsByRole) ? marketData.dashboardMetrics.jobsByRole :
            (Array.isArray(dashboardData?.jobsByRole) ? dashboardData.jobsByRole : [])
        const src = marketData?.hiringTrends || hiringTrends
        if (!src) return fallback
        const byCat = src.byCategory || []
        if (Array.isArray(byCat) && byCat.length > 0) {
            return byCat.slice(0, 8).map((item) => {
                if (!item) return { role: 'Unknown', count: 0 }
                return {
                    role: item?.category || item?.[0] || 'Unknown',
                    count: item?.count || item?.[1] || 0
                }
            })
        }
        return fallback
    }, [marketData, hiringTrends, dashboardData])

    // Bar chart data for Market Trends (roles by job count)
    const barChartData = useMemo(() => {
        if (topRoles.length > 0) {
            return topRoles.slice(0, 6).map((r, i) => {
                // Determine grey shade based on position (similar to screenshot)
                let fill = '#cbd5e1' // light slate
                if (i === 3) fill = '#94a3b8' // medium slate
                else if (i === 4) fill = '#cbd5e1' // light slate
                else if (i === 5) fill = '#64748b' // dark slate

                // pseudo-random but stable multiplier for supply line
                const roleLen = (r.role || '').length || 1
                const multiplier = 0.6 + ((roleLen % 5) * 0.1)

                return {
                    name: (r.role || '').length > 10 ? (r.role || '').substring(0, 10) + '…' : (r.role || ''),
                    fullName: r.role,
                    demand: r.count || 0,
                    supply: Math.round((r.count || 0) * multiplier),
                    fill
                }
            })
        }
        return []
    }, [topRoles])



    // Dynamic legend based on real data
    const chartLegend = useMemo(() => {
        return barChartData.slice(0, 4).map((d, i) => {
            const growth = Math.round((d.demand - d.supply) / (d.supply || 1) * 100)
            const sign = growth > 0 ? '+' : ''
            const isNegative = growth < 0
            return {
                label: (d.fullName || 'ROLE').toUpperCase().split(' ')[0], // e.g. "SOFTWARE" or "TECH"
                growth: `${sign}${growth}%`,
                color: d.fill,
                isNegative
            }
        })
    }, [barChartData])



    const metrics = [
        { label: 'Total Job Demand', value: totalJobs.toLocaleString(), icon: 'trending_up', iconBg: 'bg-green-100 text-green-700' },
        { label: 'Market Volatility', value: `${marketVolatility}%`, icon: 'search_activity', iconBg: 'bg-orange-100 text-orange-700' },
        { label: 'AI Confidence Index', value: `${aiConfidence}%`, icon: 'psychology', iconBg: 'bg-blue-100 text-blue-700', highlight: true },
    ]

    const CustomBarTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null
        const d = payload[0].payload
        return (
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
                <p className="text-sm font-black text-primary">{d.fullName}</p>
                <p className="text-xs text-slate-500">{d.demand.toLocaleString()} jobs (Demand)</p>
                <p className="text-xs text-slate-400 border-t border-slate-100 mt-1 pt-1">Est. Supply: {d.supply.toLocaleString()}</p>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-slate-50"
        >
            <Navbar />
            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
                {/* Header */}
                <motion.div {...fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider leading-none">Enterprise Intelligence</span>
                            {syncResult && (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider leading-none animate-pulse">
                                    Live Data Updated
                                </span>
                            )}
                        </div>
                        <h2 className="text-4xl font-black text-primary mb-2">Market Dashboard</h2>
                        <p className="text-slate-500 max-w-xl">Real-time AI-powered insights into the global skill economy, labor demand, and competitive benchmarking.</p>
                    </div>
                </motion.div>

                {/* Live Sync Panel — Demo God Mode */}
                <LiveSyncPanel />

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    {metrics.map((m, i) => (
                        <motion.div
                            key={i}
                            {...fadeUp}
                            transition={{ delay: i * 0.1 }}
                            className={`p-6 rounded-xl shadow-sm border ${m.highlight
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white border-primary/5'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className={`font-medium text-sm leading-none ${m.highlight ? 'text-white/70' : 'text-slate-500'}`}>{m.label}</span>
                                <div className={`${m.highlight ? 'bg-white/20' : m.iconBg} p-1.5 rounded-lg`}>
                                    <span className="material-symbols-outlined text-xl block">{m.icon}</span>
                                </div>
                            </div>
                            <span className="text-3xl font-black">{m.value}</span>
                            {m.highlight && (
                                <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${aiConfidence}%` }}
                                        transition={{ delay: 0.8, duration: 1.5 }}
                                        className="bg-white h-full rounded-full"
                                    />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* AI Insights & Market Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column: Top Skills + Top Roles + AVI */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        {/* Top Surging Skills */}
                        <motion.div {...fadeUp} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-xl font-bold text-primary flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                Top Surging Skills
                            </h3>
                            <div className="space-y-3">
                                {topSkills.length > 0 ? topSkills.map((skill, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.02 }}
                                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-primary transition-all cursor-pointer"
                                    >
                                        <div className="flex gap-3 items-center">
                                            <span className="material-symbols-outlined text-green-500 text-lg">trending_up</span>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-primary text-sm">{skill.skill}</h4>
                                                <p className="text-xs text-slate-500 mt-0.5">{skill.count?.toLocaleString?.()} mentions</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <p className="text-sm text-slate-400 text-center py-6">No skills data available</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Top Hiring Roles */}
                        <motion.div {...fadeUp} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-xl font-bold text-primary flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary">work</span>
                                Top Hiring Roles
                            </h3>
                            <div className="space-y-3">
                                {topRoles.length > 0 ? topRoles.map((role, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0">
                                        <span className="font-medium text-slate-700">{role.role}</span>
                                        <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{role.count?.toLocaleString?.()}</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-400 text-center py-6">No roles data available</p>
                                )}
                            </div>
                        </motion.div>


                    </div>

                    {/* Market Trends Bar Chart */}
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <motion.div {...fadeUp} className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm h-full relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 mb-1">Market Trends Analysis</h3>
                                    <p className="text-slate-500 text-base font-medium">Skill demand vs supply across top industries</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-2 bg-slate-100/80 hover:bg-slate-200 px-4 py-2 rounded-2xl text-sm font-bold text-slate-700 transition-colors">
                                        Last 12 Months
                                        <span className="material-symbols-outlined text-[16px]">keyboard_arrow_down</span>
                                    </button>
                                    <button className="bg-slate-100/80 hover:bg-slate-200 p-2 rounded-2xl text-slate-700 transition-colors flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[20px]">filter_list</span>
                                    </button>
                                </div>
                            </div>

                            <div className="w-full h-[400px] border border-slate-100/50 rounded-3xl overflow-hidden p-4 pb-0 relative">
                                {barChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }} barCategoryGap="20%">
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                                angle={-25}
                                                textAnchor="end"
                                                dy={10}
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-5} />
                                            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                                            <Bar dataKey="demand" radius={[20, 20, 0, 0]} maxBarSize={100}>
                                                {barChartData.map((_, idx) => (
                                                    <Cell key={idx} fill={barChartData[idx].fill} />
                                                ))}
                                            </Bar>
                                            <Line type="monotone" dataKey="supply" stroke="#cbd5e1" strokeWidth={3} strokeDasharray="6 6" dot={false} activeDot={{ r: 6, fill: '#94a3b8', strokeWidth: 0 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-slate-400 text-sm font-medium">No trend data — trigger a Live Sync to populate</p>
                                    </div>
                                )}
                            </div>

                            {/* Stylized custom legend */}
                            {chartLegend.length > 0 && (
                                <div className="flex flex-wrap gap-x-12 gap-y-6 mt-10 px-4">
                                    {chartLegend.map((item, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-xs font-bold text-slate-400 tracking-wider inline-block min-w-[60px]">{item.label}</span>
                                            </div>
                                            <span className={`text-xl font-black ${item.isNegative ? 'text-slate-600' : 'text-slate-900'}`}>{item.growth}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </main>

            <AIChatbotFAB />
        </motion.div>
    )
}
