import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignIn, useSignUp } from '@clerk/clerk-react'
import { GlobalErrorBoundary } from '../components/GlobalErrorBoundary'

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const { isLoaded: isLoadedSignIn, signIn, setActive: setActiveSignIn } = useSignIn()
    const { isLoaded: isLoadedSignUp, signUp, setActive: setActiveSignUp } = useSignUp()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // For SignUp OTP verification
    const [pendingVerification, setPendingVerification] = useState(false)
    const [code, setCode] = useState('')

    // For Forgot Password flow
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const [pendingResetCode, setPendingResetCode] = useState(false)
    const [resetCode, setResetCode] = useState('')
    const [newPassword, setNewPassword] = useState('')

    const navigate = useNavigate()
    const vantaRef = useRef(null)
    const [vantaEffect, setVantaEffect] = useState(null)

    useEffect(() => {
        if (!vantaEffect && vantaRef.current && window.VANTA && window.VANTA.NET) {
            try {
                setVantaEffect(window.VANTA.NET({
                    el: vantaRef.current,
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.00,
                    minWidth: 200.00,
                    scale: 1.00,
                    scaleMobile: 1.00,
                    color: 0xd486a0,
                    backgroundColor: 0x000000,
                    points: 15.00,
                    maxDistance: 23.00
                }))
            } catch (err) {
                console.error("Vanta error:", err)
            }
        }

        return () => {
            if (vantaEffect) vantaEffect.destroy()
        }
    }, [vantaEffect])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (isLogin) {
            if (!isLoadedSignIn) return
            try {
                const result = await signIn.create({
                    identifier: email,
                    password,
                })
                if (result.status === "complete") {
                    await setActiveSignIn({ session: result.createdSessionId })
                    navigate('/dashboard')
                } else {
                    console.log("Unhandled sign in status", result)
                }
            } catch (err) {
                setError(err.errors ? err.errors[0]?.longMessage : 'An error occurred during sign in')
            } finally {
                setLoading(false)
            }
        } else {
            if (!isLoadedSignUp) return
            try {
                const result = await signUp.create({
                    emailAddress: email,
                    password,
                })

                await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
                setPendingVerification(true)

            } catch (err) {
                setError(err.errors ? err.errors[0]?.longMessage : 'An error occurred during sign up')
            } finally {
                setLoading(false)
            }
        }
    }

    const handleVerifySubmit = async (e) => {
        e.preventDefault()
        if (!isLoadedSignUp) return
        setError('')
        setLoading(true)

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            })
            if (completeSignUp.status === "complete") {
                await setActiveSignUp({ session: completeSignUp.createdSessionId })
                navigate('/dashboard')
            }
        } catch (err) {
            setError(err.errors ? err.errors[0]?.longMessage : 'Invalid verification code')
        } finally {
            setLoading(false)
        }
    }

    const handleOAuth = async (strategy) => {
        if (isLogin) {
            if (!isLoadedSignIn) return;
            await signIn.authenticateWithRedirect({
                strategy,
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard"
            })
        } else {
            if (!isLoadedSignUp) return;
            await signUp.authenticateWithRedirect({
                strategy,
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard"
            })
        }
    }

    const handleForgotPassword = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        if (!isLoadedSignIn) return

        try {
            await signIn.create({
                strategy: "reset_password_email_code",
                identifier: email,
            })
            setPendingResetCode(true)
        } catch (err) {
            setError(err.errors ? err.errors[0]?.longMessage : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        if (!isLoadedSignIn) return

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code: resetCode,
                password: newPassword,
            })

            if (result.status === "complete") {
                await setActiveSignIn({ session: result.createdSessionId })
                navigate('/dashboard')
            } else {
                console.log(result)
            }
        } catch (err) {
            setError(err.errors ? err.errors[0]?.longMessage : 'Invalid code or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <GlobalErrorBoundary>
            <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased overflow-hidden min-h-screen">
                <style>{`.glass-morphism { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); } .cyber-border:focus-within { border-color: #1b2021; box-shadow: 0 0 0 2px rgba(27, 32, 33, 0.1); }`}</style>

                <div className="flex min-h-screen w-full">
                    {/* Left Side: Vanta.js Network Animation */}
                    <div ref={vantaRef} className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
                        <div className="relative z-10 px-12 text-white">
                            <Link to="/" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
                                <div className="p-2 rounded-lg">
                                    <span className="material-symbols-outlined text-primary text-3xl font-bold bg-white p-1 rounded">hub</span>
                                </div>
                                <h1 className="text-4xl font-black tracking-tight uppercase">SkillBeacon</h1>
                            </Link>
                            <h2 className="text-6xl font-extrabold leading-tight mb-6">Illuminate Your <br /><span className="">Professional</span> Path.</h2>
                            <p className="text-xl text-slate-300 max-w-md font-light">Join the global network of experts and accelerate your career with AI-driven insights.</p>
                        </div>
                        {/* Decorative Elements */}
                        <div className="absolute bottom-10 left-10 w-32 h-32 border border-white/10 rounded-full"></div>
                        <div className="absolute top-20 right-20 w-64 h-64 border border-white/5 rounded-full"></div>
                    </div>

                    {/* Right Side: Auth Form */}
                    <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-white/50 overflow-y-auto">
                        {/* Return to Home link for larger screens */}
                        <div className="absolute top-8 right-8 hidden lg:block z-20">
                            <Link to="/" className="text-sm font-semibold text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                Home
                            </Link>
                        </div>

                        {/* Mobile Logo */}
                        <Link to="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2 z-20">
                            <span className="material-symbols-outlined text-2xl text-primary bg-primary/10 rounded-md p-1">hub</span>
                            <span className="text-xl font-bold tracking-tight text-slate-900">SkillBeacon</span>
                        </Link>

                        {/* Glass-morphic Card */}
                        <div className="w-full max-w-md glass-morphism rounded-xl p-8 shadow-2xl border border-slate-200/50 mt-16 lg:mt-0 relative z-10">
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-slate-900">
                                    {isForgotPassword
                                        ? (pendingResetCode ? "Reset Password" : "Forgot Password")
                                        : pendingVerification
                                            ? "Verify Email"
                                            : isLogin ? 'Welcome Back' : 'Get Started'}
                                </h2>
                                <p className="text-slate-500 mt-2">
                                    {isForgotPassword
                                        ? (pendingResetCode ? "Enter the code sent to your email and your new password." : "Enter your email to receive a password reset code.")
                                        : pendingVerification
                                            ? "We've sent a verification code to your email."
                                            : isLogin
                                                ? 'Sign in to access your professional dashboard.'
                                                : 'Sign up to accelerate your career.'}
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
                                    <span className="material-symbols-outlined text-[18px]">error</span>
                                    <p>{error}</p>
                                </div>
                            )}

                            {isForgotPassword ? (
                                pendingResetCode ? (
                                    <form className="space-y-5" onSubmit={handleResetPassword}>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Reset Code</label>
                                            <div className="relative group cyber-border border-2 border-slate-100 rounded-xl transition-all duration-300 bg-white">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">pin</span>
                                                <input
                                                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 focus:ring-0 text-slate-900 placeholder:text-slate-400 rounded-xl"
                                                    placeholder="Enter verification code"
                                                    type="text"
                                                    value={resetCode}
                                                    onChange={(e) => setResetCode(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">New Password</label>
                                            <div className="relative group cyber-border border-2 border-slate-100 rounded-xl transition-all duration-300 bg-white">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                                                <input
                                                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 focus:ring-0 text-slate-900 placeholder:text-slate-400 rounded-xl"
                                                    placeholder="Enter new password"
                                                    type={showPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    <span className="material-symbols-outlined text-sm">{showPassword ? "visibility_off" : "visibility"}</span>
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg active:scale-[0.98] transition-all hover:shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                            Update Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setIsForgotPassword(false); setPendingResetCode(false); }}
                                            className="w-full text-slate-500 font-semibold py-2 mt-2 hover:text-slate-900 transition-colors text-sm"
                                        >
                                            Back to login
                                        </button>
                                    </form>
                                ) : (
                                    <form className="space-y-5" onSubmit={handleForgotPassword}>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                                            <div className="relative group cyber-border border-2 border-slate-100 rounded-xl transition-all duration-300 bg-white">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                                                <input
                                                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 focus:ring-0 text-slate-900 placeholder:text-slate-400 rounded-xl"
                                                    placeholder="name@company.com"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg active:scale-[0.98] transition-all hover:shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                            Send Reset Code
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsForgotPassword(false)}
                                            className="w-full text-slate-500 font-semibold py-2 mt-2 hover:text-slate-900 transition-colors text-sm"
                                        >
                                            Back to login
                                        </button>
                                    </form>
                                )
                            ) : pendingVerification ? (
                                <form className="space-y-5" onSubmit={handleVerifySubmit}>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Verification Code</label>
                                        <div className="relative group cyber-border border-2 border-slate-100 rounded-xl transition-all duration-300 bg-white">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">pin</span>
                                            <input
                                                className="w-full bg-transparent border-none py-4 pl-12 pr-4 focus:ring-0 text-slate-900 placeholder:text-slate-400 rounded-xl"
                                                placeholder="Enter verification code"
                                                type="text"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg active:scale-[0.98] transition-all hover:shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : 'Verify Code'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPendingVerification(false)}
                                        className="w-full text-slate-500 font-semibold py-2 mt-2 hover:text-slate-900 transition-colors text-sm"
                                    >
                                        Back to sign up
                                    </button>
                                </form>
                            ) : (
                                <>
                                    {/* Toggle Switches */}
                                    <div className="flex gap-4 mb-8">
                                        <button
                                            onClick={() => { setIsLogin(true); setError(''); }}
                                            className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${isLogin ? 'bg-primary text-white shadow-lg hover:shadow-primary/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            Login
                                        </button>
                                        <button
                                            onClick={() => { setIsLogin(false); setError(''); }}
                                            className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${!isLogin ? 'bg-primary text-white shadow-lg hover:shadow-primary/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            Sign Up
                                        </button>
                                    </div>

                                    <form className="space-y-5" onSubmit={handleSubmit}>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                                            <div className="relative group cyber-border border-2 border-slate-100 rounded-xl transition-all duration-300 bg-white">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                                                <input
                                                    className="w-full bg-transparent border-none py-4 pl-12 pr-4 focus:ring-0 text-slate-900 placeholder:text-slate-400 rounded-xl"
                                                    placeholder="name@company.com"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-sm font-semibold text-slate-700">Password</label>
                                                {isLogin && (
                                                    <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); }} className="text-xs font-bold hover:underline text-primary cursor-pointer">
                                                        Forgot?
                                                    </button>
                                                )}
                                            </div>
                                            <div className="relative group cyber-border border-2 border-slate-100 rounded-xl transition-all duration-300 bg-white">
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                                                <input
                                                    className="w-full bg-transparent border-none py-4 pl-12 pr-12 focus:ring-0 text-slate-900 placeholder:text-slate-400 rounded-xl"
                                                    placeholder="••••••••"
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    <span className="material-symbols-outlined text-sm">{showPassword ? "visibility_off" : "visibility"}</span>
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg active:scale-[0.98] transition-all hover:shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {loading && <span className="material-symbols-outlined animate-spin text-sm">refresh</span>}
                                            {isLogin ? 'Sign In' : 'Create Account'}
                                        </button>
                                    </form>

                                    <div className="relative my-8">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm uppercase">
                                            <span className="bg-white px-4 text-slate-500 font-medium tracking-wider text-xs rounded-full border border-slate-200">Or continue with</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => handleOAuth('oauth_google')}
                                            type="button"
                                            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 border-slate-100 bg-white hover:bg-slate-50 transition-all font-semibold text-slate-700"
                                        >
                                            <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChZqxNRKLCU1_CGvKioLmu5BcPG-oiBwbX2VCJldFv6fj6h_hy-jZfgCxGcp81zBZgEeZBXTxIX4X1c5g3PmyT3nLPVvQrpcrdxVZeBYDVU_GsBDnk7fziaMwrFndVutv8fGaBXh9oGRkrUNULLHe9R0pmJqhzXjum0kkRHO-DbjjUQmgaAS8VsbCY5Ds_ZDKxdhnK3AkadceHgM3wmhtjlXNsAS9PyRQPGvKN8UbJ9QBBI4SfCRRjJkJZrWctf6zmu2e1VkkChj8" />
                                            Continue with Google
                                        </button>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleOAuth('oauth_facebook')}
                                                type="button"
                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-100 bg-white hover:bg-slate-50 transition-all font-semibold text-slate-700"
                                            >
                                                <img alt="Facebook" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-p2f-uTrv8RbxTzY9dIsMMj9wZ95RjWp9wig1qWz_k7GBnrnfQID3_-10zEIO5vosYuZ3Ah0i58BQ8YjVq3S5_4769ToDRcqoG5_NtvzTUv6SSFWNlm_WXZPYjQFhiPceS9gXcVAafikRqB4YatK0CS2rGPz1PhV6SgHo9Y8ZoqTsR0He1KlZBbCPdUxgCITabcXDr2Y3LASKTNwR5epBl4z5pwv3yesoewEsdz60OdEPybAGhXLf5e5faYXmFq5NyCiZv98oxcQ" />
                                                Facebook
                                            </button>
                                            <button
                                                onClick={() => handleOAuth('oauth_linkedin_oidc')}
                                                type="button"
                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-100 bg-white hover:bg-slate-50 transition-all font-semibold text-slate-700"
                                            >
                                                <img alt="LinkedIn" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0ED8j7nEjLcFMSsHkuBxu4V89IyQcee_o-_rcvkX6fNSN46cJ4ndr1m4v1grSGalnlVvyPEJyannwUkzgxJXD3vLcSceLRhcH8oDDUs18gmX-8acjLfoNv2_8PgyAzV6HqqrAM6QXf2hvHKy7XBsU-cUcxyp6Gwk9vWy5_aGmLbUpeGlv7-HTWzyDmxW1SIgIpw2MmQfqTqt-EqnNxDYb9aRz9ezokIV_oHXjvsf7kIyPtZbiT7cNXroyKLVhFx2I_nojY3vFmXI" />
                                                LinkedIn
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer links */}
                    <div className="absolute bottom-6 w-full lg:w-1/2 right-0 flex justify-center gap-6 text-xs font-medium text-slate-400 z-10">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Help Center</a>
                    </div>
                </div>

                {/* AI Chatbot FAB */}
                <div className="fixed bottom-8 right-8 z-50 group">
                    <div className="absolute -top-12 right-0 bg-primary text-white px-3 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Need help? Ask Beacon AI
                    </div>
                    <button className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl border-2 hover:scale-110 active:scale-95 transition-all hover:shadow-primary/20 border-white/20">
                        <span className="material-symbols-outlined text-white text-3xl">smart_toy</span>
                    </button>
                </div>
            </div>
        </GlobalErrorBoundary>
    )
}
