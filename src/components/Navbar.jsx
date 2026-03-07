import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Market', path: '/jobs' },
    { label: 'Courses', path: '/courses' },
]

export default function Navbar() {
    const location = useLocation()
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 lg:px-12 py-4">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-12">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="bg-primary text-white p-2 rounded-lg">
                            <span className="material-symbols-outlined block">deployed_code</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-primary">SkillBeacon</h1>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-colors ${location.pathname === link.path
                                    ? 'text-primary font-semibold border-b-2 border-primary pb-1'
                                    : 'text-slate-500 hover:text-primary'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative hidden sm:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                        <input
                            className="bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 w-64 focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                            placeholder="Search..."
                            type="text"
                        />
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
                        <span className="material-symbols-outlined text-slate-600">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <Link to="/profile" className="h-10 w-10 text-slate-500 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center overflow-hidden transition-colors">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                    </Link>
                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>
            {/* Mobile Navigation */}
            {mobileOpen && (
                <div className="md:hidden mt-4 pb-4 border-t border-slate-100 pt-4">
                    <nav className="flex flex-col gap-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setMobileOpen(false)}
                                className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${location.pathname === link.path
                                    ? 'text-primary font-semibold bg-primary/5'
                                    : 'text-slate-500 hover:text-primary hover:bg-slate-50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    )
}
