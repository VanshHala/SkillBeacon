import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
}

export default function OnboardingPage() {
    const { user, isLoaded, isSignedIn } = useUser()
    const navigate = useNavigate()

    const [role, setRole] = useState('worker')
    const [name, setName] = useState('')
    const [mobile, setMobile] = useState('')
    const [location, setLocation] = useState('')

    // Worker specific
    const [skills, setSkills] = useState([])
    const [newSkill, setNewSkill] = useState('')
    const [desiredSkills, setDesiredSkills] = useState([])
    const [newDesiredSkill, setNewDesiredSkill] = useState('')
    const [jobTitle, setJobTitle] = useState('')
    const [yoe, setYoe] = useState('')
    const [writeUp, setWriteUp] = useState('')

    // Employer specific
    const [companyName, setCompanyName] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            // Check if user is already onboarded
            if (user.unsafeMetadata?.onboardingComplete) {
                navigate('/dashboard', { replace: true })
                return
            }

            // Pre-fill from Clerk Profile if available
            setName(user.fullName || '')

            // Default to worker if nothing in metadata
            const intendedRole = user.unsafeMetadata?.role || 'worker'
            setRole(intendedRole)
        }
    }, [isLoaded, isSignedIn, user, navigate])

    const handleAddSkill = (isDesired = false) => {
        if (isDesired) {
            if (newDesiredSkill.trim() && !desiredSkills.includes(newDesiredSkill.trim())) {
                setDesiredSkills([...desiredSkills, newDesiredSkill.trim()])
                setNewDesiredSkill('')
            }
        } else {
            if (newSkill.trim() && !skills.includes(newSkill.trim())) {
                setSkills([...skills, newSkill.trim()])
                setNewSkill('')
            }
        }
    }

    const handleRemoveSkill = (idx, isDesired = false) => {
        if (isDesired) {
            setDesiredSkills(desiredSkills.filter((_, i) => i !== idx))
        } else {
            setSkills(skills.filter((_, i) => i !== idx))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (!name || !mobile || !location) {
            setError('Please fill in all required fields.')
            setLoading(false)
            return
        }

        if (role === 'employer' && !companyName) {
            setError('Please enter your company name.')
            setLoading(false)
            return
        }

        try {
            const metadata = {
                role,
                mobile,
                location,
                onboardingComplete: true
            }

            if (role === 'worker') {
                metadata.currentSkills = skills
                metadata.desiredSkills = desiredSkills
                metadata.jobTitle = jobTitle
                metadata.yoe = yoe
                metadata.writeUp = writeUp
            } else {
                metadata.companyName = companyName
            }

            // Update user metadata in Clerk
            await user.update({
                unsafeMetadata: metadata,
            })

            localStorage.removeItem('sb_signup_role') // Cleanup
            navigate('/dashboard')

        } catch (err) {
            setError(err.message || 'An error occurred during onboarding.')
        } finally {
            setLoading(false)
        }
    }

    if (!isLoaded || !isSignedIn) return null

    return (
        <div className="min-h-screen bg-slate-50 font-display flex flex-col justify-center items-center py-12 px-6">
            <motion.div
                {...fadeUp}
                className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12"
            >
                <div className="text-center mb-8">
                    <div className="size-12 bg-primary/10 text-primary mx-auto rounded-xl flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Complete Your Profile</h1>
                    <p className="text-slate-500 mt-2">Let's customize SkillBeacon for your goals.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">I am joining as a</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setRole('worker')}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === 'worker' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">person</span>
                                Professional
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('employer')}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${role === 'employer' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">domain</span>
                                Enterprise
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Number *</label>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="+1 (555) 000-0000"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Location (City, Country) *</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="San Francisco, USA"
                            required
                        />
                    </div>

                    {role === 'employer' && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name *</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="Acme Corp"
                                required={role === 'employer'}
                            />
                        </div>
                    )}

                    {role === 'worker' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Current Job Title *</label>
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="e.g. Data Analyst"
                                        required={role === 'worker'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Years of Experience *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={yoe}
                                        onChange={(e) => setYoe(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="e.g. 3"
                                        required={role === 'worker'}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Short Write-Up (Important for AI Matching) *</label>
                                <p className="text-xs text-slate-500 mb-2">Detail what you do day-to-day, what you are good at, and what work you want to move toward. This helps our AI find hidden skill overlaps.</p>
                                <textarea
                                    value={writeUp}
                                    onChange={(e) => setWriteUp(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[120px]"
                                    placeholder="I am a data analyst who specializes in Python and SQL..."
                                    required={role === 'worker'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Current Skills</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(false))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="e.g. React, Python"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddSkill(false)}
                                        className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((skill, idx) => (
                                        <div key={idx} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200">
                                            {skill}
                                            <button type="button" onClick={() => handleRemoveSkill(idx, false)} className="hover:text-red-500 material-symbols-outlined text-[16px] ml-1">close</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Desired Skills to Learn</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newDesiredSkill}
                                        onChange={(e) => setNewDesiredSkill(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(true))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="e.g. Machine Learning"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddSkill(true)}
                                        className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {desiredSkills.map((skill, idx) => (
                                        <div key={idx} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200">
                                            {skill}
                                            <button type="button" onClick={() => handleRemoveSkill(idx, true)} className="hover:text-red-500 material-symbols-outlined text-[16px] ml-1">close</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : 'Complete Setup'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
