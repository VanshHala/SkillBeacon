import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { dataApi, setAuthToken } from '../services/api'
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

function companyColor(name) {
    const colors = [
        'bg-teal-700', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-600',
        'bg-rose-600', 'bg-sky-600', 'bg-violet-600', 'bg-fuchsia-600',
        'bg-cyan-700', 'bg-orange-600'
    ]
    let hash = 0
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
}

function timeAgo(dateStr) {
    if (!dateStr) return ''
    try {
        const posted = new Date(dateStr)
        const now = new Date()
        const diffMs = now - posted
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        if (diffDays === 0) return 'Just now'
        if (diffDays === 1) return '1 day ago'
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        return `${Math.floor(diffDays / 30)} months ago`
    } catch { return '' }
}

// Custom debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

// Autocomplete input component
// Helper to highlight matched text
function HighlightMatch({ text, query }) {
    if (!query || query.length < 2) return <>{text}</>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <>{text}</>
    return (
        <>
            {text.slice(0, idx)}
            <span className="font-extrabold text-primary">{text.slice(idx, idx + query.length)}</span>
            {text.slice(idx + query.length)}
        </>
    )
}

const MATCH_BADGE = {
    exact: { label: 'Exact', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: 'check_circle' },
    startsWith: { label: 'Close', bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', icon: 'near_me' },
    similar: { label: 'Similar', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', icon: 'explore' },
}

function AutocompleteInput({ value, onChange, fetchSuggestions, placeholder, icon, label }) {
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [loading, setLoading] = useState(false)
    const [activeIdx, setActiveIdx] = useState(-1)
    const wrapperRef = useRef(null)
    const listRef = useRef(null)
    const debounced = useDebounce(value, 300)

    useEffect(() => {
        if (debounced.length < 2) { setSuggestions([]); return }
        let cancelled = false
        setLoading(true)
        fetchSuggestions(debounced).then(data => {
            if (!cancelled) {
                // Handle both old (string[]) and new (object[]) response format
                const parsed = Array.isArray(data) ? data.map(item =>
                    typeof item === 'string' ? { value: item, matchType: 'similar' } : item
                ) : []
                setSuggestions(parsed)
                setLoading(false)
                setActiveIdx(-1)
            }
        }).catch(() => { if (!cancelled) { setSuggestions([]); setLoading(false) } })
        return () => { cancelled = true }
    }, [debounced, fetchSuggestions])

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIdx(prev => Math.min(prev + 1, suggestions.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIdx(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter' && activeIdx >= 0) {
            e.preventDefault()
            onChange(suggestions[activeIdx].value)
            setShowSuggestions(false)
        } else if (e.key === 'Escape') {
            setShowSuggestions(false)
        }
    }

    // Scroll active item into view
    useEffect(() => {
        if (activeIdx >= 0 && listRef.current) {
            const activeEl = listRef.current.children[activeIdx]
            if (activeEl) activeEl.scrollIntoView({ block: 'nearest' })
        }
    }, [activeIdx])

    // Group suggestions by matchType for section headers
    const grouped = suggestions.reduce((acc, s, idx) => {
        if (idx === 0 || s.matchType !== suggestions[idx - 1].matchType) {
            acc.push({ type: 'header', matchType: s.matchType })
        }
        acc.push({ type: 'item', ...s, originalIdx: suggestions.findIndex(x => x === s) })
        return acc
    }, [])

    // Recompute originalIdx correctly
    let itemIdx = -1
    const groupedWithIdx = grouped.map(g => {
        if (g.type === 'item') {
            itemIdx++
            return { ...g, flatIdx: itemIdx }
        }
        return g
    })

    return (
        <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-widest">{label}</label>
            <div className="relative" ref={wrapperRef}>
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">{icon}</span>
                <input
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setShowSuggestions(true) }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 pr-8 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm py-2.5 outline-none transition-all"
                    placeholder={placeholder}
                    type="text"
                    autoComplete="off"
                />
                {loading && (
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-primary/40 text-sm animate-spin">progress_activity</span>
                )}
                {!loading && value.length > 0 && (
                    <button
                        className="absolute right-3 top-2.5 text-slate-300 hover:text-slate-500 transition-colors"
                        onMouseDown={(e) => { e.preventDefault(); onChange(''); setSuggestions([]) }}
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                )}
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="absolute z-50 top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] max-h-64 overflow-y-auto overscroll-contain"
                            style={{ scrollbarWidth: 'thin' }}
                        >
                            <div className="p-1.5" ref={listRef}>
                                {groupedWithIdx.map((g, i) => {
                                    if (g.type === 'header') {
                                        const badge = MATCH_BADGE[g.matchType] || MATCH_BADGE.similar
                                        return (
                                            <div key={`h-${i}`} className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
                                                <span className={`material-symbols-outlined text-xs ${badge.text}`} style={{ fontSize: '14px' }}>{badge.icon}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${badge.text}`}>{badge.label} matches</span>
                                                <div className="flex-1 h-px bg-slate-100 ml-1" />
                                            </div>
                                        )
                                    }
                                    const isActive = g.flatIdx === activeIdx
                                    return (
                                        <div
                                            key={`i-${i}`}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${isActive
                                                ? 'bg-primary/8 ring-1 ring-primary/20'
                                                : 'hover:bg-slate-50'
                                                }`}
                                            onMouseDown={() => { onChange(g.value); setShowSuggestions(false) }}
                                            onMouseEnter={() => setActiveIdx(g.flatIdx)}
                                        >
                                            <span className={`material-symbols-outlined text-base transition-colors ${isActive ? 'text-primary' : 'text-slate-300 group-hover:text-slate-400'}`}>
                                                {icon === 'location_on' ? 'location_on' : 'work'}
                                            </span>
                                            <span className={`flex-1 text-sm truncate transition-colors ${isActive ? 'text-primary font-semibold' : 'text-slate-700'}`}>
                                                <HighlightMatch text={g.value} query={debounced} />
                                            </span>
                                            {g.matchType === 'exact' && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                                                    Best
                                                </span>
                                            )}
                                            <span className={`material-symbols-outlined text-sm transition-all ${isActive ? 'text-primary opacity-100 translate-x-0' : 'text-slate-300 opacity-0 -translate-x-1'}`}>
                                                north_west
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs">keyboard</span>
                                    <span className="opacity-70">↑↓ navigate</span>
                                    <span className="text-slate-300 mx-0.5">•</span>
                                    <span className="opacity-70">↵ select</span>
                                    <span className="text-slate-300 mx-0.5">•</span>
                                    <span className="opacity-70">esc close</span>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default function JobSearchPage() {
    const [searchCity, setSearchCity] = useState('')
    const [searchTitle, setSearchTitle] = useState('')
    const [page, setPage] = useState(0)
    const [viewMode, setViewMode] = useState('grid')
    const { getToken, isLoaded, isSignedIn } = useAuth()

    // Debounce the actual API query values (500ms delay to reduce re-renders)
    const debouncedCity = useDebounce(searchCity, 500)
    const debouncedTitle = useDebounce(searchTitle, 500)

    const [favorites, setFavorites] = useState(() => loadFromStorage('sb_job_favorites', {}))
    useEffect(() => { localStorage.setItem('sb_job_favorites', JSON.stringify(favorites)) }, [favorites])

    const { data: jobsData, isLoading, isError } = useQuery({
        queryKey: ['jobs', page, debouncedCity, debouncedTitle],
        queryFn: async () => {
            const token = await getToken()
            setAuthToken(token)
            return dataApi.getJobs({ page, size: 12, city: debouncedCity, search: debouncedTitle })
        },
        enabled: isLoaded && isSignedIn,
        keepPreviousData: true,
    })

    const { data: similarJobsData } = useQuery({
        queryKey: ['similarJobs', debouncedCity, debouncedTitle],
        queryFn: async () => {
            if (!debouncedTitle) return { content: [] }
            const token = await getToken()
            setAuthToken(token)
            return dataApi.getSimilarJobs({ search: debouncedTitle, city: debouncedCity, size: 6 })
        },
        enabled: isLoaded && isSignedIn && !!debouncedTitle,
        keepPreviousData: true,
    })

    // Reset page when search terms change
    useEffect(() => { setPage(0) }, [debouncedCity, debouncedTitle])

    const toggleFav = (jobId) => {
        setFavorites(prev => ({ ...prev, [jobId]: !prev[jobId] }))
    }

    const fetchCitySuggestions = useCallback(async (q) => {
        const token = await getToken()
        setAuthToken(token)
        return dataApi.suggestCities(q)
    }, [getToken])

    const fetchTitleSuggestions = useCallback(async (q) => {
        const token = await getToken()
        setAuthToken(token)
        return dataApi.suggestTitles(q)
    }, [getToken])

    const handleApply = (job) => {
        if (job.jobUrl) {
            window.open(job.jobUrl, '_blank', 'noopener,noreferrer')
        }
    }

    // -- Card renderer (shared between grid and list) --
    const renderJobCard = (job, i, isSimilar = false) => {
        let parsedSkills = []
        try { parsedSkills = job.skillsRequired ? JSON.parse(job.skillsRequired) : [] } catch { parsedSkills = [] }
        const displayedSkills = Array.isArray(parsedSkills) ? parsedSkills.slice(0, 4) : []
        const company = job.companyName || 'Confidential'
        const bgColor = companyColor(company)
        const hasApplyUrl = !!job.jobUrl

        if (viewMode === 'list') {
            return (
                <motion.div
                    key={`list-${isSimilar ? 'sim' : 'main'}-${job.id}`}
                    {...fadeUp}
                    transition={{ delay: (i % 12) * 0.03 }}
                    className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-lg hover:-translate-y-0.5 group flex items-center gap-5 ${isSimilar ? 'border-amber-100 bg-amber-50/10' : 'border-slate-100'}`}
                >
                    <div className={`h-12 w-12 rounded-xl ${bgColor} flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0`}>
                        {company.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[15px] text-slate-900 leading-snug truncate group-hover:text-primary transition-colors" title={job.jobTitle}>
                                {job.jobTitle}
                            </h3>
                            {isSimilar && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Similar Role</span>
                            )}
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5 font-medium truncate">
                            {company} <span className="text-slate-300 mx-1">•</span> {job.locationCity || 'Remote'}
                            {job.salary && job.salary !== 'Not Specified' && (
                                <><span className="text-slate-300 mx-1">•</span>{job.salary}</>
                            )}
                            {job.jobPostedDate && (
                                <><span className="text-slate-300 mx-1">•</span>{timeAgo(job.jobPostedDate)}</>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {displayedSkills.slice(0, 2).map((tag, j) => (
                            <span key={j} className="px-2.5 py-1 text-[9px] font-bold rounded-md uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100 hidden md:inline-block">
                                {tag}
                            </span>
                        ))}
                        <button
                            onClick={() => handleApply(job)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${hasApplyUrl
                                ? 'bg-primary text-white hover:shadow-md active:scale-95'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            disabled={!hasApplyUrl}
                            title={hasApplyUrl ? 'Apply on job portal' : 'Application link not available'}
                        >
                            Apply
                        </button>
                        <button
                            className={`p-1 rounded-full transition-all ${favorites[job.id] ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}
                            onClick={() => toggleFav(job.id)}
                        >
                            <span className="material-symbols-outlined text-xl" style={favorites[job.id] ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
                        </button>
                    </div>
                </motion.div>
            )
        }

        return (
            <motion.div
                key={`grid-${isSimilar ? 'sim' : 'main'}-${job.id}`}
                {...fadeUp}
                transition={{ delay: (i % 12) * 0.05 }}
                className={`bg-white rounded-3xl p-6 border transition-all hover:shadow-xl hover:-translate-y-1 relative group flex flex-col h-full ${isSimilar ? 'border-amber-100 bg-amber-50/10' : 'border-slate-100'}`}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                    <div className={`h-14 w-14 rounded-2xl shadow-sm flex items-center justify-center text-white font-black text-2xl ${bgColor}`}>
                        {company.charAt(0).toUpperCase()}
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleFav(job.id); }}
                        className={`p-2 rounded-full transition-all ${favorites[job.id] ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-rose-400'}`}
                    >
                        <span className={`material-symbols-outlined text-lg ${favorites[job.id] ? 'fill-current' : ''}`}>favorite</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors leading-tight line-clamp-2" title={job.jobTitle}>
                            {job.jobTitle}
                        </h3>
                    </div>
                    {isSimilar && (
                        <div className="mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Similar Role</span>
                        </div>
                    )}
                    <p className="text-slate-500 text-sm font-medium mb-4 flex flex-col gap-1">
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">business_center</span>{company}</span>
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">location_on</span>{job.locationCity || 'Remote'}</span>
                        {job.salary && job.salary !== 'Not Specified' && (
                            <span className="flex items-center gap-1.5 text-emerald-600"><span className="material-symbols-outlined text-[16px]">payments</span>{job.salary}</span>
                        )}
                        {job.jobPostedDate && (
                            <span className="flex items-center gap-1.5 text-slate-400 text-xs mt-1"><span className="material-symbols-outlined text-[14px]">schedule</span>{timeAgo(job.jobPostedDate)}</span>
                        )}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-auto">
                        {displayedSkills.map((tag, i) => (
                            <span
                                key={i}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border ${i === 0 ? 'bg-primary/5 text-primary border-primary/10' : 'bg-slate-50 text-slate-500 border-slate-100'
                                    }`}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Apply Button */}
                <button
                    onClick={() => handleApply(job)}
                    className={`mt-5 w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${hasApplyUrl
                        ? 'bg-primary text-white hover:shadow-lg active:scale-[0.97]'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    disabled={!hasApplyUrl}
                    title={hasApplyUrl ? 'Apply on job portal' : 'Link Not Available'}
                >
                    <span className="material-symbols-outlined text-base">{hasApplyUrl ? 'open_in_new' : 'block'}</span>
                    {hasApplyUrl ? 'Apply Now' : 'Link Not Available'}
                </button>
            </motion.div>
        )
    }

    const hasSimilarJobs = debouncedTitle && similarJobsData?.content?.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#f8f9fb] text-slate-900"
        >
            <Navbar />

            <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1440px] mx-auto w-full">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Filters */}
                    <aside className="w-full lg:w-72 shrink-0">
                        <motion.div {...fadeUp} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
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
                                <AutocompleteInput
                                    value={searchTitle}
                                    onChange={setSearchTitle}
                                    fetchSuggestions={fetchTitleSuggestions}
                                    placeholder="e.g. Data Analyst"
                                    icon="search"
                                    label="Job Title"
                                />
                                <AutocompleteInput
                                    value={searchCity}
                                    onChange={setSearchCity}
                                    fetchSuggestions={fetchCitySuggestions}
                                    placeholder="e.g. Delhi"
                                    icon="location_on"
                                    label="Location (City)"
                                />
                            </div>
                        </motion.div>
                    </aside>

                    {/* Right: Job Grid */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <motion.div {...fadeUp} className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-primary text-2xl font-bold leading-tight">Recommended Jobs</h1>
                                    <p className="text-slate-500 text-sm mt-1">
                                        Found {jobsData?.totalElements || 0} exact opportunities
                                        {(debouncedTitle || debouncedCity) && <span className="text-primary font-semibold"> matching your criteria</span>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-primary'}`}
                                        title="Grid view"
                                    >
                                        <span className="material-symbols-outlined text-xl">grid_view</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-primary'}`}
                                        title="List view"
                                    >
                                        <span className="material-symbols-outlined text-xl">view_list</span>
                                    </button>
                                </div>
                            </motion.div>

                            {/* Main Job Cards */}
                            {isLoading ? (
                                <div className="flex justify-center py-20">
                                    <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
                                </div>
                            ) : isError ? (
                                <div className="text-center py-20 text-red-500">Failed to load jobs.</div>
                            ) : jobsData?.content?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                    <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">search_off</span>
                                    <p className="font-bold text-lg mb-1">No exact jobs found</p>
                                    <p className="text-sm">Try adjusting your filters or checking similar roles below.</p>
                                </div>
                            ) : (
                                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'flex flex-col gap-4'}>
                                    {jobsData?.content?.map((job, i) => renderJobCard(job, i, false))}
                                </div>
                            )}

                            {/* Pagination */}
                            {jobsData?.totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 pt-8 pb-4">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="px-6 py-2.5 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="font-bold text-sm text-slate-600">Page {page + 1} of {jobsData.totalPages}</span>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page >= jobsData.totalPages - 1}
                                        className="px-6 py-2.5 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Similar Jobs Section */}
                        {hasSimilarJobs && (
                            <motion.div {...fadeUp} className="pt-8 border-t border-slate-200">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-amber-600">explore</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 leading-tight">Similar Roles</h2>
                                        <p className="text-slate-500 text-sm">You might also be interested in these related opportunities</p>
                                    </div>
                                </div>

                                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'flex flex-col gap-4'}>
                                    {similarJobsData.content.map((job, i) => renderJobCard(job, i, true))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>

            <AIChatbotFAB />
        </motion.div>
    )
}
