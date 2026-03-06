import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { workerApi } from '../services/api'

export default function AIChatbotFAB() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hey there! I'm Beacon AI. How can I help you navigate your career today?" }
    ])
    const endOfMessagesRef = useRef(null)

    // Scroll chat to bottom when new messages arrive
    useEffect(() => {
        if (isOpen && endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen])

    const chatMutation = useMutation({
        mutationFn: workerApi.chat,
        onSuccess: (data) => {
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        },
        onError: () => {
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again later." }])
        }
    })

    const handleSend = () => {
        if (!input.trim()) return
        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        chatMutation.mutate({ query: userMessage })
    }

    return (
        <div className="fixed bottom-8 right-8 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, originX: 1, originY: 1 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="absolute bottom-20 right-0 w-80 shadow-2xl rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col"
                        style={{ height: '400px' }}
                    >
                        {/* Header */}
                        <div className="bg-primary p-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-sm">bolt</span>
                                </div>
                                <div>
                                    <h4 className="text-white text-sm font-bold">Beacon AI</h4>
                                    <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Career Assistant</p>
                                </div>
                            </div>
                            <button
                                className="text-white/50 hover:text-white transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50 flex flex-col">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user'
                                            ? 'bg-primary text-white self-end rounded-tr-none'
                                            : 'bg-white text-slate-700 border border-slate-200 shadow-sm self-start rounded-tl-none'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            ))}
                            {chatMutation.isPending && (
                                <div className="p-3 bg-white text-slate-500 rounded-lg rounded-tl-none border border-slate-200 shadow-sm self-start text-sm">
                                    <span className="material-symbols-outlined animate-spin text-primary inline-block">refresh</span>
                                </div>
                            )}
                            <div ref={endOfMessagesRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-slate-100 bg-white shrink-0">
                            <form
                                className="relative"
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            >
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="w-full border-none bg-slate-100 rounded-xl pl-4 pr-10 py-3 focus:ring-0 text-sm outline-none"
                                    placeholder="Ask about skills or roles..."
                                    type="text"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || chatMutation.isPending}
                                    className="absolute right-2 top-2 text-primary p-1 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB Button */}
            <motion.button
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
