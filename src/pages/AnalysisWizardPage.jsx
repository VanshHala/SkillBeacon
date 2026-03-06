import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { workerApi } from '../services/api'
import AIChatbotFAB from '../components/AIChatbotFAB'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 },
}

function loadFromStorage(key, fallback) {
    try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : fallback
    } catch { return fallback }
}

export default function AnalysisWizardPage() {
    const navigate = useNavigate()
    const [jobTitle, setJobTitle] = useState(() => loadFromStorage('sb_analysis_job', ''))
    const [location, setLocation] = useState(() => loadFromStorage('sb_analysis_loc', ''))
    const [experience, setExperience] = useState(() => loadFromStorage('sb_analysis_exp', 8))
    const [skills, setSkills] = useState(() => loadFromStorage('sb_analysis_skills', ['UI/UX Design']))
    const [newSkill, setNewSkill] = useState('')
    const [summary, setSummary] = useState(() => loadFromStorage('sb_analysis_summary', ''))

    useEffect(() => { localStorage.setItem('sb_analysis_job', JSON.stringify(jobTitle)) }, [jobTitle])
    useEffect(() => { localStorage.setItem('sb_analysis_loc', JSON.stringify(location)) }, [location])
    useEffect(() => { localStorage.setItem('sb_analysis_exp', JSON.stringify(experience)) }, [experience])
    useEffect(() => { localStorage.setItem('sb_analysis_skills', JSON.stringify(skills)) }, [skills])
    useEffect(() => { localStorage.setItem('sb_analysis_summary', JSON.stringify(summary)) }, [summary])

    const removeSkill = (idx) => setSkills(skills.filter((_, i) => i !== idx))
    const addSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()])
            setNewSkill('')
        }
    }

    const analyzeMutation = useMutation({
        mutationFn: workerApi.analyzeProfile,
        onSuccess: (data) => {
            localStorage.setItem('sb_latest_report', JSON.stringify(data))
            navigate('/report')
        },
        onError: (err) => {
            alert('Analysis failed: ' + err.message)
        }
    })

    const handleGenerate = () => {
        if (!jobTitle) { alert('Please enter your current job title.'); return; }
        analyzeMutation.mutate({
            jobTitle,
            targetLocation: location || 'Global',
            yearsOfExperience: parseInt(experience, 10),
            currentSkills: skills,
            professionalSummary: summary,
            industry: 'Technology' // Default for now
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex min-h-screen flex-col bg-white text-slate-900"
        >
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/70 backdrop-blur-xl px-6 md:px-20 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">api</span>
                    <h2 className="text-lg font-bold tracking-tight text-primary">SkillBeacon</h2>
                </Link>
                <div className="flex items-center gap-6">
                    <a className="text-sm font-medium text-slate-500 hover:text-primary transition-colors" href="#">Help Center</a>
                    <Link to="/dashboard" className="size-9 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/50 hover:bg-slate-100 transition-colors">
                        <span className="material-symbols-outlined text-slate-500 text-xl">close</span>
                    </Link>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
                {/* Progress Section */}
                <motion.div {...fadeUp} className="mb-12">
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-slate-400 font-medium text-xs tracking-[0.2em] uppercase mb-2 block">Step 02 / 03</span>
                                <h1 className="text-3xl font-semibold text-primary tracking-tight">Experience &amp; Skills</h1>
                            </div>
                            <span className="text-slate-400 text-sm font-medium">66% Complete</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '66%' }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-primary rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Form Container */}
                <div className="space-y-10">
                    {/* Job & Location */}
                    <motion.div {...fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Current Job Title *</label>
                            <input
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-primary/5 focus:border-primary/20 focus:bg-white transition-all outline-none placeholder:text-slate-400 text-sm"
                                placeholder="e.g. Senior Product Designer"
                                type="text"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Target City</label>
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-primary/5 focus:border-primary/20 focus:bg-white transition-all outline-none placeholder:text-slate-400 text-sm"
                                placeholder="e.g. Austin, TX"
                                type="text"
                            />
                        </div>
                    </motion.div>

                    {/* Experience Slider */}
                    <motion.div {...fadeUp} className="space-y-4 pt-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Total Years of Experience</label>
                            <span className="text-sm font-bold text-primary">{experience} Years</span>
                        </div>
                        <div className="px-1">
                            <input className="w-full accent-primary" max="25" min="0" step="1" type="range" value={experience} onChange={(e) => setExperience(e.target.value)} />
                        </div>
                    </motion.div>

                    {/* Skills Tags */}
                    <motion.div {...fadeUp} className="space-y-3">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Technical Skills</label>
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 border border-slate-200/60 rounded-xl min-h-[64px] items-center">
                            {skills.map((skill, i) => (
                                <motion.span
                                    key={skill + i}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-sm"
                                >
                                    {skill}
                                    <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-red-500 transition-colors" onClick={() => removeSkill(i)}>close</span>
                                </motion.span>
                            ))}
                            <input
                                className="flex-1 min-w-[120px] border-none focus:ring-0 bg-transparent text-sm p-0 ml-2 outline-none"
                                placeholder="Press Enter to add skill..."
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                            />
                        </div>
                    </motion.div>

                    {/* Professional Summary */}
                    <motion.div {...fadeUp} className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Professional Summary</label>
                        </div>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-primary/5 focus:border-primary/20 focus:bg-white transition-all outline-none placeholder:text-slate-400 text-sm resize-none"
                            placeholder="Briefly describe your current responsibilities and career goals..."
                            rows="4"
                        ></textarea>
                    </motion.div>

                    {/* Action */}
                    <motion.div {...fadeUp} className="pt-8">
                        <button
                            onClick={handleGenerate}
                            disabled={analyzeMutation.isPending}
                            className={`w-full py-5 rounded-xl text-sm font-bold tracking-[0.1em] transition-all flex items-center justify-center gap-3 shadow-lg ${analyzeMutation.isPending ? 'bg-slate-300 text-slate-500' : 'bg-primary text-white hover:bg-slate-800 shadow-primary/10'}`}
                        >
                            {analyzeMutation.isPending ? 'ANALYZING PROFILE (LLM IN PROGRESS)...' : 'GENERATE INTELLIGENCE REPORT'}
                            {!analyzeMutation.isPending && <span className="material-symbols-outlined text-[18px]">north_east</span>}
                        </button>
                        <p className="text-center text-slate-400 text-[11px] mt-6 tracking-wide">ESTIMATED ANALYSIS TIME: 10-30 SECONDS (VIA CLERK & GEMINI API)</p>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-auto px-6 md:px-20 py-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-slate-400 text-xs">© 2024 SkillBeacon. Minimal Analysis Interface.</p>
                <div className="flex gap-10 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                    <a className="hover:text-primary transition-colors" href="#">Terms</a>
                    <a className="hover:text-primary transition-colors" href="#">Support</a>
                </div>
            </footer>

            <AIChatbotFAB />
        </motion.div>
    )
}
