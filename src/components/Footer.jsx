import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="bg-white border-t border-slate-200 px-6 lg:px-20 py-16">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
                <div className="col-span-2 space-y-6">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="size-6 bg-primary rounded flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-sm">polyline</span>
                        </div>
                        <h2 className="text-lg font-bold tracking-tight text-primary">SkillBeacon</h2>
                    </Link>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                        The world's first high-fidelity skill mapping ecosystem for elite talent and enterprise intelligence.
                    </p>
                    <div className="flex gap-4">
                        <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                            <span className="material-symbols-outlined">public</span>
                        </a>
                        <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                            <span className="material-symbols-outlined">alternate_email</span>
                        </a>
                        <a className="text-slate-400 hover:text-primary transition-colors" href="#">
                            <span className="material-symbols-outlined">share</span>
                        </a>
                    </div>
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400">Platform</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li><Link className="hover:text-primary" to="/dashboard">Skill Mapping</Link></li>
                        <li><Link className="hover:text-primary" to="/report">Verification</Link></li>
                        <li><Link className="hover:text-primary" to="/analysis">Analytics</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400">Company</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li><a className="hover:text-primary" href="#">Our Ethos</a></li>
                        <li><a className="hover:text-primary" href="#">Careers</a></li>
                        <li><a className="hover:text-primary" href="#">Manifesto</a></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400">Legal</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li><a className="hover:text-primary" href="#">Privacy Policy</a></li>
                        <li><a className="hover:text-primary" href="#">Terms of Service</a></li>
                        <li><a className="hover:text-primary" href="#">Security</a></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400">Support</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li><a className="hover:text-primary" href="#">Concierge</a></li>
                        <li><a className="hover:text-primary" href="#">API Docs</a></li>
                        <li><a className="hover:text-primary" href="#">Status</a></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium uppercase tracking-widest">
                <p>© 2024 SkillBeacon Intelligence. All rights reserved.</p>
                <div className="flex gap-8">
                    <span>London</span>
                    <span>New York</span>
                    <span>Singapore</span>
                </div>
            </div>
        </footer>
    )
}
