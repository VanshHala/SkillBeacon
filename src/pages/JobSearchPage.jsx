import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { dataApi } from '../services/api'
import Navbar from '../components/Navbar'
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

export default function JobSearchPage() {
    const [searchCity, setSearchCity] = useState('')
    const [searchTitle, setSearchTitle] = useState('')
    const [page, setPage] = useState(0)

    const [favorites, setFavorites] = useState(() => loadFromStorage('sb_job_favorites', {}))

    useEffect(() => { localStorage.setItem('sb_job_favorites', JSON.stringify(favorites)) }, [favorites])

    const { data: jobsData, isLoading, isError } = useQuery({
        queryKey: ['jobs', page, searchCity, searchTitle],
        queryFn: () => dataApi.getJobs({ page, size: 12, city: searchCity, search: searchTitle })
    })

    const toggleFav = (jobId) => {
        setFavorites(prev => ({ ...prev, [jobId]: !prev[jobId] }))
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#fcfcfc] text-slate-900"
        >
            <Navbar />

            <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1440px] mx-auto w-full">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Filters */}
                    <aside className="w-full lg:w-72 shrink-0">
                        <motion.div {...fadeUp} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-primary text-lg font-bold">Filters</h3>
                                <button
                                    onClick={() => { setSearchCity(''); setSearchTitle(''); setPage(0); }}
                                    className="text-xs font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-wider"
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="space-y-6">
                                {/* Search Title */}
                                <div className="space-y-2.5">
                                    <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-widest">Search Title</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                                        <input
                                            value={searchTitle}
                                            onChange={(e) => setSearchTitle(e.target.value)}
                                            className="w-full pl-10 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-primary focus:border-primary text-sm py-2.5 outline-none"
                                            placeholder="e.g. Engineer"
                                            type="text"
                                        />
                                    </div>
                                </div>
                                {/* Location */}
                                <div className="space-y-2.5">
                                    <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-widest">Location (City)</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">location_on</span>
                                        <input
                                            value={searchCity}
                                            onChange={(e) => setSearchCity(e.target.value)}
                                            className="w-full pl-10 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-primary focus:border-primary text-sm py-2.5 outline-none"
                                            placeholder="City Name"
                                            type="text"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button className="w-full mt-8 bg-primary text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-[0.98]">
                                <span className="material-symbols-outlined text-lg">tune</span>
                                Apply Filters
                            </button>
                        </motion.div>
                    </aside>

                    {/* Right: Job Grid */}
                    <div className="flex-1 space-y-6">
                        <motion.div {...fadeUp} className="flex items-center justify-between">
                            <div>
                                <h1 className="text-primary text-2xl font-bold leading-tight">Recommended Jobs</h1>
                                <p className="text-slate-500 text-sm mt-1">Found {jobsData?.totalElements || 0} opportunities based on your profile</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
                                <button className="p-2 rounded-lg bg-slate-100 text-primary">
                                    <span className="material-symbols-outlined">grid_view</span>
                                </button>
                                <button className="p-2 rounded-lg text-slate-400">
                                    <span className="material-symbols-outlined">list</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* Grid */}
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
                            </div>
                        ) : isError ? (
                            <div className="text-center py-20 text-red-500">Failed to load jobs.</div>
                        ) : jobsData?.content?.length === 0 ? (
                            <div className="text-center py-20 text-slate-500">No jobs found matching your criteria.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {jobsData?.content?.map((job, i) => {
                                    const requiredSkills = job.skillsRequired ? JSON.parse(job.skillsRequired) : []
                                    const displayedSkills = Array.isArray(requiredSkills) ? requiredSkills.slice(0, 4) : []

                                    return (
                                        <motion.div
                                            key={job.id}
                                            {...fadeUp}
                                            transition={{ delay: (i % 12) * 0.05 }}
                                            className="bg-white rounded-xl p-6 border border-slate-200 transition-all hover:shadow-lg group job-card-hover hover:border-slate-300"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="h-14 w-14 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 uppercase font-black text-xl text-slate-400">
                                                    {job.company ? job.company.charAt(0) : 'B'}
                                                </div>
                                                <button
                                                    className={`transition-colors ${favorites[job.id] ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}
                                                    onClick={() => toggleFav(job.id)}
                                                >
                                                    <span className="material-symbols-outlined" style={favorites[job.id] ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-lg text-primary line-clamp-1" title={job.title}>{job.title}</h3>
                                                <p className="text-slate-600 font-medium">{job.company} • {job.locationCity || 'Remote'}</p>
                                            </div>
                                            <div className="mt-4 flex items-center gap-2 text-slate-500 text-sm">
                                                <span className="material-symbols-outlined text-base">payments</span>
                                                <span className="font-semibold text-primary">{job.salaryRange || 'Competitive'}</span>
                                            </div>
                                            <div className="mt-5 flex flex-wrap gap-2">
                                                {displayedSkills.map((tag, j) => (
                                                    <span
                                                        key={j}
                                                        className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-widest ${j === displayedSkills.length - 1
                                                            ? 'bg-slate-900 text-white'
                                                            : 'bg-slate-50 text-slate-500 border border-slate-100'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {jobsData?.totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 pt-8 pb-12">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="px-6 py-2 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="font-bold text-sm">Page {page + 1} of {jobsData.totalPages}</span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= jobsData.totalPages - 1}
                                    className="px-6 py-2 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <AIChatbotFAB />
        </motion.div>
    )
}
