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

const skillFilters = ['Data Science', 'Machine Learning', 'Web Development', 'UI/UX Design', 'Cloud Computing']

function loadFromStorage(key, fallback) {
    try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : fallback
    } catch { return fallback }
}

export default function CoursesExplorerPage() {
    const [activePlatform, setActivePlatform] = useState(() => loadFromStorage('sb_course_platform', 'All'))
    const [bookmarks, setBookmarks] = useState(() => loadFromStorage('sb_course_bookmarks', {}))
    const [page, setPage] = useState(0)

    useEffect(() => { localStorage.setItem('sb_course_bookmarks', JSON.stringify(bookmarks)) }, [bookmarks])
    useEffect(() => { localStorage.setItem('sb_course_platform', JSON.stringify(activePlatform)) }, [activePlatform])

    const { data: coursesData, isLoading, isError } = useQuery({
        queryKey: ['courses', page, activePlatform],
        queryFn: () => dataApi.getCourses({
            page,
            size: 12,
            platform: activePlatform === 'All' ? '' : activePlatform
        })
    })

    const toggleBookmark = (courseId) => {
        setBookmarks(prev => ({ ...prev, [courseId]: !prev[courseId] }))
    }

    const getGradient = (index) => {
        const gradients = [
            'from-blue-500/20 to-purple-500/20',
            'from-emerald-500/20 to-teal-500/20',
            'from-orange-500/20 to-amber-500/20',
            'from-rose-500/20 to-pink-500/20',
            'from-indigo-500/20 to-blue-500/20',
            'from-slate-500/20 to-slate-700/20'
        ]
        return gradients[index % gradients.length]
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-background-light text-slate-900"
        >
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
                {/* Sidebar */}
                <aside className="w-72 hidden lg:block">
                    <div className="sticky top-28 flex flex-col gap-8">
                        <div className="flex flex-col gap-10">
                            {/* Platform Toggle */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Platform</h3>
                                <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl gap-1">
                                    {['All', 'NPTEL', 'SWAYAM', 'Coursera', 'Udemy'].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => { setActivePlatform(p); setPage(0); }}
                                            className={`flex-1 min-w-[30%] py-2 text-sm font-semibold rounded-xl transition-all ${activePlatform === p
                                                ? 'bg-white shadow-sm text-primary'
                                                : 'text-slate-500 hover:text-primary'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Skills Dummy Filter */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Skills</h3>
                                <div className="flex flex-col gap-4">
                                    {skillFilters.map((skill, i) => (
                                        <label key={skill} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                className="rounded-md border-slate-300 text-primary focus:ring-primary w-5 h-5 transition-all"
                                                type="checkbox"
                                                defaultChecked={i === 0 || i === 2}
                                            />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{skill}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </aside>

                {/* Main */}
                <section className="flex-1">
                    <motion.div {...fadeUp} className="flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Explore Courses</h1>
                            <p className="text-slate-500">Discover {coursesData?.totalElements || 0} courses to accelerate your career</p>
                        </div>
                    </motion.div>

                    {/* Course Grid */}
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <span className="material-symbols-outlined text-primary text-4xl animate-spin">refresh</span>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-20 text-red-500">Failed to load courses.</div>
                    ) : coursesData?.content?.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">No courses found on this platform.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {coursesData?.content?.map((course, i) => (
                                <motion.div
                                    key={course.id}
                                    {...fadeUp}
                                    transition={{ delay: (i % 12) * 0.08 }}
                                    className="bg-white border border-slate-200 overflow-hidden flex flex-col group shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 duration-300 rounded-[2rem]"
                                >
                                    <div className="h-40 bg-slate-100 relative overflow-hidden rounded-t-[2rem]">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(i)}`}></div>
                                        <div className="absolute top-4 right-4 z-10">
                                            <button
                                                onClick={() => toggleBookmark(course.id)}
                                                className={`w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-colors ${bookmarks[course.id] ? 'text-primary' : 'text-slate-400 hover:text-red-500'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-lg" style={bookmarks[course.id] ? { fontVariationSettings: "'FILL' 1" } : {}}>bookmark</span>
                                            </button>
                                        </div>
                                        <div className="absolute bottom-4 left-4">
                                            <span className="px-2 py-1 bg-white/90 text-[10px] font-bold rounded uppercase tracking-wider text-primary">{course.platform}</span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">{course.instructor || 'E-Learning'}</div>
                                        <h4 className="font-bold text-lg leading-tight mb-4 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h4>
                                        <div className="mt-auto flex items-center justify-between text-xs font-semibold text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">signal_cellular_alt</span>
                                                <span>{course.difficultyLevel}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                <span>{course.durationWeeks} Weeks</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {coursesData?.totalPages > 1 && (
                        <div className="mt-12 flex justify-center">
                            <nav className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 transition-colors font-semibold text-slate-600 disabled:opacity-50">
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <span className="text-sm font-bold text-slate-500 px-4">
                                    Page {page + 1} of {coursesData.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= coursesData.totalPages - 1}
                                    className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 transition-colors font-semibold text-slate-600 disabled:opacity-50">
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </nav>
                        </div>
                    )}
                </section>
            </main>

            <AIChatbotFAB />
        </motion.div>
    )
}
