import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUser, useClerk, useAuth } from '@clerk/clerk-react'
import { userApi, setAuthToken } from '../services/api'
import Navbar from '../components/Navbar'

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
}

export default function ProfilePage() {
    const { user, isLoaded, isSignedIn } = useUser()
    const { getToken } = useAuth()
    const { signOut } = useClerk()
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncSuccess, setSyncSuccess] = useState(false)

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            syncUserData(user)
        }
    }, [isLoaded, isSignedIn, user])

    const syncUserData = async (clerkUser) => {
        setIsSyncing(true)
        try {
            const token = await getToken()
            setAuthToken(token)

            const authProviders = clerkUser.externalAccounts
                .map(acc => acc.provider)
                .join(',')

            const userData = {
                clerkUserId: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress || '',
                name: clerkUser.fullName || '',
                firstName: clerkUser.firstName || '',
                lastName: clerkUser.lastName || '',
                profileImageUrl: clerkUser.imageUrl || '',
                authProviders: authProviders || 'email',
            }

            await userApi.syncProfile(userData)
            setSyncSuccess(true)
        } catch (error) {
            console.error('Failed to sync profile data:', error)
        } finally {
            setIsSyncing(false)
        }
    }

    if (!isLoaded || !isSignedIn) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-primary text-5xl animate-spin mb-4">refresh</span>
                <p className="font-bold text-slate-500">Loading Profile...</p>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen bg-slate-50 font-display"
        >
            <style>{`.ai-glow { box-shadow: 0 0 20px rgba(27, 32, 33, 0.05); }`}</style>
            <Navbar />

            <main className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider leading-none">Enterprise Intelligence</span>
                        </div>
                        <h2 className="text-4xl font-black text-primary mb-2">User Profile</h2>
                        <p className="text-slate-500 max-w-xl">Manage your personal and professional information, security settings, and connected accounts.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-white border border-primary px-5 py-2.5 rounded-full font-bold text-sm hover:bg-slate-50 transition-colors">
                            <span className="material-symbols-outlined text-lg">download</span>
                            Export PDF
                        </button>
                        <button className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                            <span className="material-symbols-outlined text-lg">edit</span>
                            Edit Profile
                        </button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl border border-slate-200 ai-glow mb-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    {/* Sync Indicator */}
                    <div className="absolute top-4 right-4">
                        {isSyncing ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                                <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                                Syncing...
                            </span>
                        ) : syncSuccess ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Synced
                            </span>
                        ) : null}
                    </div>

                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 flex-shrink-0">
                        <img alt={user.fullName || "User Avatar"} className="w-full h-full object-cover" src={user.imageUrl} />
                    </div>
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className="text-3xl font-black text-primary mb-1">{user.fullName}</h3>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 mb-3">
                            {user.username && <span className="font-medium">@{user.username}</span>}
                            {user.username && <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>}
                            <span>{user.primaryEmailAddress?.emailAddress}</span>
                        </div>
                        {user.externalAccounts && user.externalAccounts.length > 0 && (
                            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                                <span className="material-symbols-outlined text-sm">link</span>
                                <span className="text-xs font-bold text-slate-600 uppercase">Linked via {user.externalAccounts[0].provider}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-8">
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined">person</span>
                                Account Information
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                                    <p className="font-medium text-slate-800">{user.fullName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                                    <p className="font-medium text-slate-800">{user.primaryEmailAddress?.emailAddress || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                                    <p className="font-medium text-slate-800">{user.primaryPhoneNumber?.phoneNumber || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                                    <p className="font-medium text-slate-800">Not provided</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joined Date</p>
                                    <p className="font-medium text-slate-800">{new Date(user.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Login</p>
                                    <p className="font-medium text-slate-800">{new Date(user.lastSignInAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined">work</span>
                                Professional Information
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Job Title</p>
                                    <p className="font-medium text-slate-800 text-sm italic">Information not available yet</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Company</p>
                                    <p className="font-medium text-slate-800 text-sm italic">Information not available yet</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Experience</p>
                                    <p className="font-medium text-slate-800">N/A</p>
                                </div>
                            </div>
                            <div className="mb-6">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Core Skills</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-sm text-slate-500 italic">No skills added yet. Complete an analysis.</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bio</p>
                                <p className="text-sm text-slate-600 leading-relaxed italic">Add your bio here...</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined">share</span>
                                Social Accounts
                            </h4>
                            <div className="space-y-4">
                                {user.externalAccounts && user.externalAccounts.length > 0 ? (
                                    user.externalAccounts.map((acc, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-slate-600 text-sm">
                                                        {acc.provider === 'google' ? 'public' : 'account_circle'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm capitalize">{acc.provider}</p>
                                                    <p className="text-xs text-slate-500">{acc.emailAddress}</p>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined text-green-500">check_circle</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                                        <p className="text-sm text-slate-500">No external accounts connected.</p>
                                    </div>
                                )}
                                {/* Keep the UI style for connecting a new account placeholder */}
                                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-slate-400 text-sm">add</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-600 text-sm">Link New Account</p>
                                            <p className="text-xs text-slate-500">Google, LinkedIn, etc.</p>
                                        </div>
                                    </div>
                                    <button className="text-sm font-bold border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">Connect</button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined">security</span>
                                Security & Privacy
                            </h4>
                            <div className="space-y-2 mb-8">
                                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200 group">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">key</span>
                                        <span className="font-medium text-slate-700 group-hover:text-primary transition-colors">Change Password</span>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                                </button>
                                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200 group">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">devices</span>
                                        <span className="font-medium text-slate-700 group-hover:text-primary transition-colors">Manage Sessions</span>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                                </button>
                                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200 group">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">phonelink_setup</span>
                                        <span className="font-medium text-slate-700 group-hover:text-primary transition-colors">Enable 2FA</span>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                                </button>
                            </div>
                            <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                                <button className="text-red-500 font-bold text-sm hover:underline flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">delete_forever</span>
                                    Delete Account
                                </button>
                                <button
                                    onClick={() => signOut()}
                                    className="bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">logout</span>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-primary px-6 lg:px-12 py-12 mt-12 border-t border-slate-800">
                <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3 opacity-80">
                        <div className="bg-white text-primary p-1 rounded">
                            <span className="material-symbols-outlined text-lg block">deployed_code</span>
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-white">SkillBeacon</h1>
                    </div>
                    <div className="flex gap-8 text-sm font-medium text-slate-400">
                        <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
                        <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
                        <a className="hover:text-white transition-colors" href="#">Contact Support</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => signOut()} className="text-slate-400 hover:text-white transition-colors font-medium text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">logout</span>
                            Logout
                        </button>
                    </div>
                </div>
                <div className="max-w-[1440px] mx-auto mt-8 text-center md:text-left">
                    <p className="text-xs text-slate-500">© 2024 SkillBeacon AI. All rights reserved.</p>
                </div>
            </footer>
        </motion.div>
    )
}

