import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Footer from '../components/Footer'

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: 'easeOut' },
}

const stagger = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.15 },
}

export default function LandingPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen w-full flex flex-col overflow-x-hidden bg-background-light"
        >
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 w-full px-6 lg:px-20 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-8 bg-primary rounded flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-xl">polyline</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-primary">SkillBeacon</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-10">
                        <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Platform</a>
                        <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Enterprise</a>
                        <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Resources</a>
                        <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Pricing</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="px-5 py-2 text-sm font-semibold hover:bg-slate-100 rounded-full transition-all">
                            Sign In
                        </Link>
                        <Link to="/login" className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative px-6 lg:px-20 pt-16 pb-24 hero-gradient">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-widest"
                            >
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                <span>Talent Intelligence Ecosystem</span>
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.7 }}
                                className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-primary"
                            >
                                Decode the <br /> <span className="text-slate-400">Future of Work.</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg text-slate-600 max-w-lg leading-relaxed"
                            >
                                A sophisticated ecosystem designed for elite professionals. Map, analyze, and accelerate your career trajectory with AI-driven clarity and glass-morphic precision.
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap gap-4"
                            >
                                <Link
                                    to="/analysis"
                                    className="px-8 py-4 bg-primary text-white font-bold rounded-xl flex items-center gap-2 hover:translate-y-[-2px] transition-all shadow-lg shadow-primary/20"
                                >
                                    Start Your Mapping
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </Link>
                                <button className="px-8 py-4 glass-card font-bold rounded-xl border border-slate-200 hover:bg-white transition-all">
                                    Watch Product Film
                                </button>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="flex items-center gap-6 pt-4"
                            >
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="size-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Trusted by 50,000+ industry leaders</p>
                            </motion.div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="relative"
                        >
                            <div className="aspect-square glass-card rounded-xl overflow-hidden shadow-2xl relative border border-white/50 bg-gradient-to-tr from-primary/5 to-slate-100">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"></div>
                                {/* Floating UI Elements */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                    className="absolute top-10 left-10 p-4 glass-card rounded-lg shadow-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">trending_up</span>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Proficiency</p>
                                            <p className="text-lg font-bold text-primary">+24.8%</p>
                                        </div>
                                    </div>
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, 8, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
                                    className="absolute bottom-10 right-10 p-6 glass-card rounded-lg shadow-xl max-w-[200px]"
                                >
                                    <p className="text-sm font-bold mb-2 text-primary">Skill Cluster Alpha</p>
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '80%' }}
                                            transition={{ delay: 1, duration: 1.5 }}
                                            className="h-full bg-primary rounded-full"
                                        />
                                    </div>
                                </motion.div>
                                {/* Abstract circles */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary/10 rounded-full"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-primary/5 rounded-full"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-primary/[0.03] rounded-full"></div>
                                {/* Center icon */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-20 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-4xl">hub</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Stats Grid */}
                <section className="px-6 lg:px-20 py-12">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Active Ecosystem', value: '50,000+', trend: '12% growth MoM' },
                            { label: 'Skills Analyzed', value: '2.4M', trend: '24% database expansion' },
                            { label: 'Placement Accuracy', value: '98.2%', trend: 'Industry gold standard' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                {...fadeUp}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1"
                            >
                                <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">{stat.label}</span>
                                <h3 className="text-4xl font-black tracking-tight">{stat.value}</h3>
                                <p className="text-sm font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">arrow_upward</span> {stat.trend}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Features Grid */}
                <section className="px-6 lg:px-20 py-24 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <motion.div {...fadeUp} className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                            <div className="max-w-2xl space-y-4">
                                <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-primary">Precision Engineering for Modern Talent</h2>
                                <p className="text-lg text-slate-500">Our high-fidelity architecture transforms abstract career paths into actionable, data-driven roadmaps.</p>
                            </div>
                            <Link to="/dashboard" className="px-8 py-3 bg-primary text-white font-bold rounded-full text-sm whitespace-nowrap">
                                Explore Core Architecture
                            </Link>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Main Feature Card */}
                            <motion.div {...fadeUp} className="md:col-span-8 group relative overflow-hidden rounded-xl bg-slate-50 min-h-[300px]">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-slate-100"></div>
                                <div className="relative p-10 h-full flex flex-col justify-end">
                                    <div className="bg-white/90 backdrop-blur p-8 rounded-lg max-w-md shadow-2xl">
                                        <span className="material-symbols-outlined text-primary mb-4 text-3xl">insights</span>
                                        <h4 className="text-2xl font-bold mb-2">Dynamic Analytics Engine</h4>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-4">Experience real-time skill verification powered by our proprietary Neural-Mapping technology.</p>
                                        <Link className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all" to="/report">
                                            Learn more <span className="material-symbols-outlined text-sm">chevron_right</span>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                            {/* Side Cards */}
                            <div className="md:col-span-4 flex flex-col gap-6">
                                {[
                                    { icon: 'blur_on', title: 'Glass-morphic UI', desc: 'Aesthetic excellence meets functional utility. Designed for deep focus and visual clarity.' },
                                    { icon: 'radar', title: 'Trend Synchronization', desc: 'Automated industry benchmark updates ensures your profile stays relevant in shifting markets.' },
                                ].map((card, i) => (
                                    <motion.div key={i} {...fadeUp} transition={{ delay: 0.2 + i * 0.1 }} className="flex-1 glass-card p-8 rounded-xl border border-slate-200">
                                        <div className="size-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary mb-6">
                                            <span className="material-symbols-outlined">{card.icon}</span>
                                        </div>
                                        <h4 className="text-xl font-bold mb-2">{card.title}</h4>
                                        <p className="text-slate-500 text-sm">{card.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                            {/* Bottom Grid */}
                            {[
                                { icon: 'security', title: 'Encrypted Verification', desc: 'Blockchain-backed skill certificates for absolute trust and portability.' },
                                { icon: 'hub', title: 'Network Topology', desc: 'Visualize your professional connections as a strategic growth asset.' },
                                { icon: 'psychology', title: 'Cognitive Profiling', desc: 'AI analysis of soft skills and leadership potential through behavioral data.' },
                            ].map((card, i) => (
                                <motion.div key={i} {...fadeUp} transition={{ delay: 0.3 + i * 0.1 }} className="md:col-span-4 glass-card p-8 rounded-xl border border-slate-200">
                                    <span className="material-symbols-outlined text-primary text-3xl mb-4">{card.icon}</span>
                                    <h4 className="text-xl font-bold mb-2">{card.title}</h4>
                                    <p className="text-slate-500 text-sm">{card.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonial */}
                <section className="px-6 lg:px-20 py-24 bg-primary text-white">
                    <motion.div {...fadeUp} className="max-w-5xl mx-auto text-center space-y-12">
                        <span className="material-symbols-outlined text-5xl opacity-30">format_quote</span>
                        <h2 className="text-3xl lg:text-5xl font-light italic leading-tight">
                            "SkillBeacon isn't just a platform; it's the lens through which we now view human potential. The fidelity of the mapping is unprecedented."
                        </h2>
                        <div className="space-y-2">
                            <p className="text-xl font-bold">Adrian Sterling</p>
                            <p className="text-slate-400 uppercase tracking-widest text-sm">Chief Talent Officer, NexaCorp</p>
                        </div>
                    </motion.div>
                </section>

                {/* CTA Section */}
                <section className="px-6 lg:px-20 py-24">
                    <motion.div {...fadeUp} className="max-w-7xl mx-auto bg-slate-50 rounded-xl overflow-hidden relative">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #1b2021 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                        </div>
                        <div className="relative z-10 p-12 lg:p-24 flex flex-col items-center text-center space-y-8">
                            <h2 className="text-4xl lg:text-6xl font-black text-primary tracking-tight">Ready to illuminate?</h2>
                            <p className="text-lg text-slate-500 max-w-2xl">Join the elite network of professionals using SkillBeacon to define the future of their industries.</p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <input className="px-6 py-4 rounded-xl border border-slate-200 focus:ring-primary focus:border-primary w-full max-w-sm outline-none" placeholder="Enter your professional email" type="email" />
                                <Link to="/login" className="px-10 py-4 bg-primary text-white font-bold rounded-xl whitespace-nowrap text-center">Reserve Access</Link>
                            </div>
                            <p className="text-sm text-slate-400 italic">Limited-availability beta for senior management and above.</p>
                        </div>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </motion.div>
    )
}
