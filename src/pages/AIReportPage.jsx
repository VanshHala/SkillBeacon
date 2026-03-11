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

    const riskScore = parseFloat(report.riskScore || 0).toFixed(1)

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

                {/* Safer Roles & Skills */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Safer Roles */}
                    <motion.div {...fadeUp} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined p-2 bg-emerald-50 text-emerald-600 rounded-lg">shield</span>
                            <h3 className="font-bold text-primary">Safer Roles</h3>
                        </div>
                        <div className="space-y-2">
                            {report.saferRoles?.length > 0 ? report.saferRoles.map((role, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-emerald-50/50 rounded-lg">
                                    <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                                    <span className="text-sm font-medium text-slate-700">{role}</span>
                                </div>
                            )) : <p className="text-slate-400 text-sm italic">Not available</p>}
                        </div>
                    </motion.div>

                    {/* Recommended Skills */}
                    <motion.div {...fadeUp} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined p-2 bg-blue-50 text-blue-600 rounded-lg">trending_up</span>
                            <h3 className="font-bold text-primary">Recommended Skills</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {report.recommendedSkills?.length > 0 ? report.recommendedSkills.map((skill, i) => (
                                <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">{skill}</span>
                            )) : <p className="text-slate-400 text-sm italic">Not available</p>}
                        </div>
                    </motion.div>

                    {/* Missing Skills */}
                    <motion.div {...fadeUp} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined p-2 bg-amber-50 text-amber-600 rounded-lg">warning</span>
                            <h3 className="font-bold text-primary">Skill Gaps</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {report.missingSkills?.length > 0 ? report.missingSkills.map((skill, i) => (
                                <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">{skill}</span>
                            )) : <p className="text-slate-400 text-sm italic">No gaps identified</p>}
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
                        </div>
                        <div className="p-8 prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium">
                            {report.careerRoadmapStr ? (
                                <div className="space-y-4 whitespace-pre-wrap">
                                    {report.careerRoadmapStr}
                                </div>
                            ) : (
                                <p className="italic text-slate-400">Loading AI insights or unavailable...</p>
                            )}
                        </div>
                    </motion.section>

                    {/* Recommended Courses */}
                    {report.recommendedCourses?.length > 0 && (
                        <motion.section {...fadeUp} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-primary font-bold text-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-500">school</span>
                                    Recommended Courses
                                </h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {report.recommendedCourses.map((course, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-primary/20 transition-all">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{course.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{course.platform}</p>
                                        </div>
                                        {course.url && course.url !== '#' && (
                                            <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                                                View <span className="material-symbols-outlined text-xs">open_in_new</span>
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}
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
