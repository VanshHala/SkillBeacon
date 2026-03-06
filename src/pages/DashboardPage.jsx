import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../services/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Navbar from '../components/Navbar'
import AIChatbotFAB from '../components/AIChatbotFAB'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
}

export default function DashboardPage() {
    const { data: dashboardData, isLoading, isError } = useQuery({
        queryKey: ['dashboardMetrics'],
        queryFn: dashboardApi.getMetrics
    })

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-primary text-5xl animate-spin mb-4">refresh</span>
                <p className="font-bold text-slate-500">Loading Intelligence Dashboard...</p>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
                <p className="font-bold text-slate-500 mb-4">Failed to load dashboard data. Retrying...</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Retry</button>
            </div>
        )
    }

    const metrics = [
        { label: 'Total Job Demand', value: dashboardData?.totalJobs?.toLocaleString() || '0', trend: '+5.2%', trendColor: 'text-green-600', icon: 'trending_up', iconBg: 'bg-green-100 text-green-700' },
        { label: 'Market Volatility', value: `${dashboardData?.marketVolatility || 0}%`, trend: '-1.8%', trendColor: 'text-red-600', icon: 'search_activity', iconBg: 'bg-orange-100 text-orange-700' },
        { label: 'Avg. Annual Salary', value: dashboardData?.avgSalary || 'N/A', trend: '+4.1%', trendColor: 'text-green-600', icon: 'payments', iconBg: 'bg-blue-100 text-blue-700' },
    ]

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
                        </div>
                        <h2 className="text-4xl font-black text-primary mb-2">Market Dashboard</h2>
                        <p className="text-slate-500 max-w-xl">Real-time AI-powered insights into the global skill economy, labor demand, and competitive benchmarking.</p>
                    </div>
                </motion.div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {metrics.map((m, i) => (
                        <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="bg-white p-6 rounded-xl border border-primary/5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-500 font-medium text-sm leading-none">{m.label}</span>
                                <div className={`${m.iconBg} p-1.5 rounded-lg`}>
                                    <span className="material-symbols-outlined text-xl block">{m.icon}</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-primary">{m.value}</span>
                                <span className={`${m.trendColor} text-sm font-bold`}>{m.trend}</span>
                            </div>
                        </motion.div>
                    ))}
                    {/* AI Confidence Index */}
                    <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="bg-primary text-white p-6 rounded-xl shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-white/70 font-medium text-sm leading-none">AI Confidence Index</span>
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <span className="material-symbols-outlined text-xl block">psychology</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black">{dashboardData?.aiConfidence || 0}%</span>
                            <span className="text-white/80 text-sm font-bold">+0.5%</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${dashboardData?.aiConfidence || 0}%` }}
                                transition={{ delay: 0.8, duration: 1.5 }}
                                className="bg-white h-full rounded-full"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* AI Insights & Market Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Insights & Top Skills */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <motion.div {...fadeUp} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                    Top Surging Skills
                                </h3>
                            </div>
                            <div className="space-y-4 flex-1">
                                {dashboardData?.topSkills?.map((skill, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.02 }}
                                        className="p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-primary transition-all cursor-pointer"
                                    >
                                        <div className="flex gap-4 items-center">
                                            <span className="material-symbols-outlined text-green-500">trending_up</span>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-primary text-sm">{skill.skill}</h4>
                                                <p className="text-xs text-slate-500 mt-1">Growth rate: +{skill.growth}%</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Jobs By Role */}
                        <motion.div {...fadeUp} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6 flex-1">
                            <h3 className="text-xl font-bold text-primary flex items-center gap-2">Top Hiring Roles</h3>
                            <div className="space-y-4">
                                {dashboardData?.jobsByRole?.map((role, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0">
                                        <span className="font-medium text-slate-700">{role.role}</span>
                                        <span className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{role.count}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Market Trends Chart */}
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        <motion.div {...fadeUp} className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm h-full shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-primary">Market Trends Analysis</h3>
                                    <p className="text-slate-500 text-sm">Skill demand vs supply across recent months</p>
                                </div>
                            </div>

                            {/* Recharts Area Chart */}
                            <div className="w-full h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dashboardData?.trendData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1e293b" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area type="monotone" dataKey="demand" stroke="#1e293b" strokeWidth={3} fillOpacity={1} fill="url(#colorDemand)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                        <Area type="monotone" dataKey="supply" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorSupply)" activeDot={{ r: 6, fill: '#14b8a6', strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex gap-6 mt-6 justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <span className="text-sm font-bold text-slate-600">Talent Demand</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                                    <span className="text-sm font-bold text-slate-600">Talent Supply</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <AIChatbotFAB />
        </motion.div>
    )
}
