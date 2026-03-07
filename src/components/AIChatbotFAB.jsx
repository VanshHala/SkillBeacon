import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@clerk/clerk-react'
import api from '../services/api'

// Simple markdown-like formatting for chatbot messages
function FormatMessage({ text }) {
    if (!text) return null
    const lines = text.split('\n')
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                // Bold **text**
                const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Bullet points
                if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                    return (
                        <div key={i} className="flex gap-1.5 items-start">
                            <span className="text-primary mt-0.5 shrink-0">•</span>
                            <span dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, '') }} />
                        </div>
                    )
                }
                // Numbered list
                const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/)
                if (numMatch) {
                    return (
                        <div key={i} className="flex gap-1.5 items-start">
                            <span className="text-primary font-bold shrink-0 text-xs mt-0.5">{numMatch[1]}.</span>
                            <span dangerouslySetInnerHTML={{ __html: numMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>
                    )
                }
                // Headers
                if (line.trim().startsWith('### ')) return <h4 key={i} className="font-bold text-xs uppercase tracking-wider text-primary mt-2">{line.replace(/^###\s*/, '')}</h4>
                if (line.trim().startsWith('## ')) return <h3 key={i} className="font-bold text-sm text-primary mt-2">{line.replace(/^##\s*/, '')}</h3>
                // Empty line
                if (!line.trim()) return <div key={i} className="h-1" />
                // Normal text
                return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
            })}
        </div>
    )
}

const QUICK_PROMPTS = [
    { icon: 'trending_up', text: 'Is my job safe?' },
    { icon: 'school', text: 'What should I learn?' },
    { icon: 'work', text: 'Best jobs for me?' },
    { icon: 'route', text: 'Career roadmap' },
]

export default function AIChatbotFAB() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hey there! 👋 I'm **SkillBeacon AI**, your personal career mentor.\n\nI can help you with:\n- Career guidance & job safety\n- Skill improvement suggestions\n- Course recommendations\n- Job market insights\n\nAsk me anything!" }
    ])
    const endOfMessagesRef = useRef(null)
    const inputRef = useRef(null)
    const { getToken } = useAuth()

    useEffect(() => {
        if (isOpen && endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    const chatContainerRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            // Only close if clicking outside both the chat modal AND the FAB button
            if (chatContainerRef.current && !chatContainerRef.current.contains(event.target)) {
                // Look for the FAB button ID or ignore if it's the fab button to prevent immediate reopen
                if (!event.target.closest('#chatbot-fab')) {
                    setIsOpen(false)
                }
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleSend = async (messageText) => {
        const text = messageText || input.trim()
        if (!text || loading) return
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: text }])
        setLoading(true)

        try {
            const token = await getToken()
            const response = await api.post('/worker/chat', { message: text }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }])
        } catch (err) {
            console.error('Chat error:', err)
            let errorMsg = "I'm having trouble connecting right now. Please try again later."
            if (err.response?.status === 401) {
                errorMsg = "Please sign in first to use the AI mentor."
            }
            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed bottom-8 right-8 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={chatContainerRef}
                        initial={{ scale: 0, opacity: 0, originX: 1, originY: 1 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="absolute bottom-20 right-0 shadow-2xl rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col"
                        style={{
                            width: '400px',
                            height: '600px',
                            minWidth: '320px',
                            minHeight: '400px',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            resize: 'both',
                            direction: 'rtl', // Trick to make the resize handle appear on the top-left or bottom-left depending on positioning
                        }}
                    >
                        <div style={{ direction: 'ltr', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            {/* Drag Handle Indicator */}
                            <div className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-50 flex items-start justify-start p-1 opacity-50 hover:opacity-100">
                                <span className="material-symbols-outlined text-[10px] text-white rotate-90">open_in_full</span>
                            </div>

                            {/* Header */}
                            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 pl-6 flex items-center justify-between shrink-0 relative cursor-default">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-lg">psychology</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white text-sm font-bold">SkillBeacon AI</h4>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-widest">Career Mentor • Online</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 z-10"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50/50 flex flex-col items-start w-full" style={{ scrollbarWidth: 'thin' }}>
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className={`max-w-[88%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="material-symbols-outlined text-primary text-xs">psychology</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SkillBeacon AI</span>
                                            </div>
                                        )}
                                        <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-primary text-white rounded-br-md'
                                            : 'bg-white text-slate-700 border border-slate-200/80 shadow-sm rounded-bl-md'
                                            }`}>
                                            {msg.role === 'assistant' ? <FormatMessage text={msg.content} /> : msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="self-start max-w-[88%]"
                                    >
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="material-symbols-outlined text-primary text-xs">psychology</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SkillBeacon AI</span>
                                        </div>
                                        <div className="p-3 bg-white text-slate-500 rounded-2xl rounded-bl-md border border-slate-200/80 shadow-sm text-sm flex items-center gap-2">
                                            <span className="flex gap-1">
                                                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </span>
                                            <span className="text-xs text-slate-400">Analyzing your profile...</span>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={endOfMessagesRef} />
                            </div>

                            {/* Quick Prompts */}
                            {messages.length <= 1 && !loading && (
                                <div className="px-3 pb-2 flex gap-1.5 flex-wrap bg-white border-t border-slate-100 flex-shrink-0 w-full pl-4">
                                    {QUICK_PROMPTS.map((prompt, i) => (
                                        <button
                                            key={i}
                                            className="flex items-center gap-1.5 px-3 py-1.5 mt-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-primary/5 hover:text-primary border border-slate-200 rounded-full transition-colors"
                                            onClick={() => handleSend(prompt.text)}
                                        >
                                            <span className="material-symbols-outlined text-xs">{prompt.icon}</span>
                                            {prompt.text}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div className="p-3 border-t border-slate-100 bg-white shrink-0 w-full relative z-10">
                                <form
                                    className="relative w-full"
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                >
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        className="w-full border-none bg-slate-100 rounded-xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all"
                                        placeholder="Ask about your career, skills, courses..."
                                        type="text"
                                        disabled={loading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || loading}
                                        className="absolute right-1.5 top-1.5 bg-primary text-white p-2 rounded-lg hover:bg-primary/90 disabled:opacity-30 disabled:bg-slate-300 transition-all z-20"
                                    >
                                        <span className="material-symbols-outlined text-sm">send</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB Button */}
            <motion.button
                id="chatbot-fab"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="h-14 w-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center relative"
            >
                <AnimatePresence mode="wait">
                    <motion.span
                        key={isOpen ? 'close' : 'chat'}
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        className="material-symbols-outlined text-2xl absolute"
                    >
                        {isOpen ? 'close' : 'chat'}
                    </motion.span>
                </AnimatePresence>
            </motion.button>
        </div>
    )
}
