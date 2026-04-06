'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm your Schedulr AI assistant ✨ I can help you manage your schedule, answer questions about your bookings, suggest meeting times, or generate event descriptions. How can I help?",
};

/**
 * Floating AI chat assistant powered by Groq LLaMA 3.3 70B
 */
export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response || "Sorry, I couldn't process that. Try again!" },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-[#1A1A2E] border border-[#2E2E50] rounded-2xl shadow-2xl flex flex-col max-h-[500px] animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-[#2E2E50]">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Schedulr AI</p>
              <p className="text-xs text-[#10B981] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
                Online · Powered by Groq
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#8888AA] hover:text-[#F0F0FF] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-[#6366F1]/20'
                    : 'bg-gradient-to-br from-[#6366F1] to-[#EC4899]'
                }`}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-[#6366F1]" />
                    : <Bot className="w-3.5 h-3.5 text-white" />
                  }
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#6366F1] text-white rounded-tr-sm'
                    : 'bg-[#252540] text-[#F0F0FF] rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#EC4899] flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-[#252540] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map(delay => (
                      <span key={delay} className="w-1.5 h-1.5 bg-[#8888AA] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-[#2E2E50] flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 bg-[#0F0F1A] border border-[#2E2E50] rounded-xl px-3 py-2 text-sm text-[#F0F0FF] placeholder-[#8888AA] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-xl flex items-center justify-center disabled:opacity-40 transition-all hover:opacity-90"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] rounded-full z-10">
            <span className="absolute inset-0 rounded-full bg-[#10B981] animate-ping opacity-75" />
          </span>
        )}
        <button
          onClick={() => setIsOpen(v => !v)}
          className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#EC4899] rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Toggle AI assistant"
        >
          {isOpen ? <X className="w-5 h-5 text-white" /> : <MessageSquare className="w-5 h-5 text-white" />}
        </button>
      </div>
    </>
  );
}
