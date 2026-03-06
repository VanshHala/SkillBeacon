import { motion } from 'framer-motion'
import { Link, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import AIChatbotFAB from '../components/AIChatbotFAB'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
}

export default function AIReportPage() {
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        try {
            const stored = localStorage.getItem('sb_latest_report')
            if (stored) setReport(JSON.parse(stored))
        } catch (e) {
            console.error('Failed to load report from storage', e)
        }
        setLoading(false)
    }, [])

    if (loading) return null
    if (!report) return <Navigate to="/analysis" replace />

    const riskScore = parseFloat(report.overallRiskScore || 0).toFixed(1)

    // Evaluate risk gauge color
    let riskColor = 'slate'
    let riskLabel = 'Unknown'
    if (riskScore < 20) { riskColor = 'emerald'; riskLabel = 'Very Low' }
    else if (riskScore < 40) { riskColor = 'blue'; riskLabel = 'Low' }
    else if (riskScore < 70) { riskColor = 'amber'; riskLabel = 'Moderate' }
    else { riskColor = 'red'; riskLabel = 'High' }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-background-light"
        >
            <Navbar />
            <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-20 py-10 space-y-12">
                {/* Page Header */}
                <motion.div {...fadeUp} className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-l-4 border-${riskColor}-500 pl-6`}>
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-2 uppercase tracking-widest">
                            <span>Intelligence Report</span>
                            <span className="material-symbols-outlined text-xs">arrow_forward_ios</span>
                            <span className={`text-${riskColor}-600 font-bold`}>Current Profile Analysis</span>
                        </div>
                        <h1 className="text-primary text-4xl md:text-5xl font-black leading-tight tracking-tight max-w-2xl">
                            AI Career Impact &amp; Resilience Audit
                        </h1>
                        <p className="text-slate-500 text-lg mt-2 font-light">Based on localized market demand and skill vulnerability indices.</p>
                    </div>
                </motion.div>

                {/* Score Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div
                        {...fadeUp}
                        className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-primary transition-all"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`material-symbols-outlined p-2 bg-${riskColor}-50 text-${riskColor}-600 rounded-lg`}>security</span>
                                <span className={`text-${riskColor}-600 bg-${riskColor}-50 text-sm font-bold flex items-center gap-1 px-2 py-1 rounded-full`}>{riskLabel} Exposure</span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium">Calculated Risk Score</p>
                            <p className={`text-${riskColor}-600 text-6xl font-black mt-2`}>{riskScore}/100</p>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${riskScore}%` }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5, duration: 1 }}
                                className={`bg-${riskColor}-500 h-full rounded-full`}
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        {...fadeUp}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="material-symbols-outlined p-2 bg-blue-50 text-blue-600 rounded-lg">model_training</span>
                            <span className="text-blue-600 bg-blue-50 text-sm font-bold flex items-center gap-1 px-2 py-1 rounded-full">AI Context</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium mb-4">Extracted Technical Skills Evaluated</p>
                        <div className="flex flex-wrap gap-2">
                            {report.extractedSkills?.length > 0 ? report.extractedSkills.map((skill, i) => (
                                <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg">{skill}</span>
                            )) : <span className="text-slate-400 italic">No explicit skills extracted by LLM.</span>}
                        </div>
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                    {/* Career Evolution Roadmap */}
                    <motion.section {...fadeUp} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-primary font-bold text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500">auto_awesome</span>
                                Gemini Generated Career Roadmap
                            </h3>
                            <button className="text-xs bg-slate-100 text-slate-500 hover:text-primary transition-colors px-3 py-1 rounded-full font-bold">Copy Text</button>
                        </div>
                        <div className="p-8 prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium">
                            {/* Simple Markdown Renderer Approximation since we didn't add react-markdown to dependencies implicitly */}
                            {report.careerRoadmapStr ? (
                                <div className="space-y-4 whitespace-pre-wrap">
                                    {report.careerRoadmapStr}
                                </div>
                            ) : (
                                <p className="italic text-slate-400">Loading AI insights or unavailable...</p>
                            )}
                        </div>
                    </motion.section>
                </div>

                {/* Final CTA */}
                <motion.section {...fadeUp} className="bg-slate-100 rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-200">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-primary">Ready to execute this exact roadmap?</h3>
                        <p className="text-slate-500 max-w-md">Browse our curated courses directly mapped to resolving the friction points identified in this analysis.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <Link to="/courses" className="px-8 py-4 bg-primary text-white rounded-full font-bold hover:opacity-90 transition-all text-center">Browse Recommended Courses</Link>
                        <Link to="/analysis" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-50 transition-all text-center">Re-run Analysis</Link>
                    </div>
                </motion.section>
            </main>

            <AIChatbotFAB />
        </motion.div>
    )
}
