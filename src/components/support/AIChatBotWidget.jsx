import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, X, Send, Loader2, ShieldCheck, RefreshCw, Zap, LogIn, UserPlus, ArrowRight, Wrench, Calendar, User, Phone, FileText, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { generateAIResponse } from '../../services/aiChatService';
import { startListening, stopListening, speakText, stopSpeaking, isSpeechRecognitionSupported } from '../../services/voiceService';

const getActionIcon = (type) => {
  if (type === 'register') return <UserPlus size={14} />;
  if (type === 'services' || type === 'book_service') return <Wrench size={14} />;
  if (type === 'dashboard') return <Calendar size={14} />;
  if (type === 'profile' || type === 'worker_dashboard' || type === 'contractor_dashboard') return <User size={14} />;
  if (type === 'cancellation') return <FileText size={14} />;
  if (type === 'contact') return <Phone size={14} />;
  return <LogIn size={14} />;
};

export default function AIChatBotWidget() {
  const navigate = useNavigate();
  const { user, bookings, services, cities } = useApp();
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: typeof t('welcomeAi') === 'function' 
        ? t('welcomeAi')(user?.name || 'there')
        : `Hello ${user?.name || 'there'}! 👋 I am the **Fixiva AI Assistant**.\n\nHow can I help you with your home service bookings, worker dispatches, payouts, or platform questions today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Voice Assistant States
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speakLang, setSpeakLang] = useState(language || 'en');

  // Sync speakLang when active site language changes
  useEffect(() => {
    setSpeakLang(language || 'en');
  }, [language]);

  // Stop voice speech/listening if widget closes
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      stopListening();
      setIsListening(false);
    }
  }, [isOpen]);

  // Update initial message if language changes and chat has 1 message
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'ai') {
      const welcomeFn = t('welcomeAi');
      if (typeof welcomeFn === 'function') {
        setMessages([
          {
            ...messages[0],
            text: welcomeFn(user?.name || 'there')
          }
        ]);
      }
    }
  }, [language]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto Redirection State for Widget
  const [widgetAction, setWidgetAction] = useState(null);
  const [widgetCountdown, setWidgetCountdown] = useState(0);
  const [widgetCancelled, setWidgetCancelled] = useState(false);

  const userRole = user?.role || 'Customer';

  // Auto-scroll to bottom of widget chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isTyping]);

  // Handle auto-redirect countdown
  useEffect(() => {
    let timer;
    if (widgetAction && widgetCountdown > 0 && !widgetCancelled) {
      timer = setInterval(() => {
        setWidgetCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(widgetAction.path);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [widgetAction, widgetCountdown, widgetCancelled, navigate]);

  const quickPrompts = language === 'hi'
    ? ['फ़िक्सिवा में लॉगिन कैसे करें?', 'प्लंबिंग बुकिंग कैसे करें?', 'डिस्पैच कैसे काम करता है?', 'रद्दीकरण नीति']
    : language === 'bn'
    ? ['ফিক্সিভায় কীভাবে লগইন করবেন?', 'প্লাম্বিং সেবা বুক করবেন কীভাবে?', 'ডিসপ্যাচ কীভাবে কাজ করে?', 'বাতিলকরণ নীতি']
    : language === 'hinglish'
    ? ['How to login in Fixiva?', 'Plumbing kaise book karein?', 'Dispatches kaise kaam karta hai?', 'Cancellation policy kya hai?']
    : ['How to login in Fixiva?', 'How to track booking?', 'Available services', 'Cancellation policy'];

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    stopSpeaking();
    stopListening();
    setIsListening(false);

    const msgId = `msg-usr-${messages.length + 1}`;
    const userMsg = {
      id: msgId,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const res = await generateAIResponse({
        userMessage: query,
        chatHistory: messages,
        userRole,
        userProfile: user,
        userLanguage: speakLang || language,
        activeBookings: bookings || [],
        availableServices: services || [],
        availableCities: cities || []
      });

      setTimeout(() => {
        const aiMsg = {
          id: `msg-ai-${messages.length + 2}`,
          sender: 'ai',
          text: res.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: res.suggestions,
          action: res.action,
          detectedLanguage: res.detectedLanguage
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);

        // Speak AI Response in detected language if Voice Output is enabled
        if (isVoiceEnabled) {
          speakText({
            text: res.text,
            language: res.detectedLanguage || speakLang || language
          });
        }

        if (res.action) {
          setWidgetAction(res.action);
          setWidgetCountdown(res.action.countdownSeconds || 5);
          setWidgetCancelled(false);
        }
      }, 500);
    } catch (err) {
      console.error('Error generating AI response in widget:', err);
      setIsTyping(false);
    }
  };

  const handleMicToggle = async (targetLang = null) => {
    const langToUse = targetLang || speakLang || language;
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      stopSpeaking();
      setIsListening(true);
      await startListening({
        language: langToUse,
        onResult: ({ transcript, isFinal }) => {
          if (transcript) {
            setInput(transcript);
          }
          if (isFinal && transcript.trim()) {
            handleSend(transcript);
            setIsListening(false);
          }
        },
        onError: (errMsg) => {
          setIsListening(false);
          console.warn('Voice input error:', errMsg);
        },
        onEnd: () => {
          // Handled continuously by voiceService
        }
      });
    }
  };

  const handleReset = () => {
    stopSpeaking();
    stopListening();
    setIsListening(false);
    setWidgetAction(null);
    setWidgetCountdown(0);
    setWidgetCancelled(false);
    const welcomeFn = t('welcomeAi');
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        text: typeof welcomeFn === 'function'
          ? welcomeFn(user?.name || 'User')
          : `Chat reset! How can I assist you today, ${user?.name || 'User'}?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-2xl border border-slate-700/80 transition-all duration-300 transform hover:scale-105 active:scale-95"
          title="Ask Fixiva AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <div className="p-2 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
              <Bot size={20} className="group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-start text-left pr-1">
            <span className="text-xs font-bold leading-tight flex items-center gap-1 text-slate-100">
              {t('aiTitle', 'Fixiva AI Assistant')} <Sparkles size={12} className="text-amber-400 animate-pulse" />
            </span>
            <span className="text-[10px] text-blue-400 font-medium">{t('askQuestion', 'Ask any question')}</span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[380px] h-[520px] max-h-[85vh] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
                <Bot size={20} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-wide">{t('aiTitle', 'Fixiva AI Assistant')}</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-0.5">
                    <Zap size={9} /> AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">{t('aiHeaderDesc', '24/7 Smart Marketplace Assistant')}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (isVoiceEnabled) stopSpeaking();
                  setIsVoiceEnabled(!isVoiceEnabled);
                }}
                title={isVoiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
                className={`p-1.5 rounded-lg transition-colors ${
                  isVoiceEnabled ? 'text-blue-400 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={handleReset}
                title={t('resetChat', 'Reset Chat')}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/70 text-xs">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm space-y-1.5 ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 border border-slate-700/70 rounded-tl-none'
                  }`}
                >
                  {m.sender === 'ai' && (
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-blue-400 border-b border-slate-700/50 pb-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={12} /> {t('aiResponseTag', 'Fixiva AI Response')}
                      </div>
                      <button
                        type="button"
                        onClick={() => speakText({ text: m.text, language })}
                        className="p-1 hover:bg-slate-700 rounded text-blue-300 transition-all flex items-center gap-0.5"
                        title="Listen to response"
                      >
                        <Volume2 size={12} />
                      </button>
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-line font-medium text-[11.5px]">{m.text}</p>
                  
                  {m.action && (
                    <button
                      type="button"
                      onClick={() => navigate(m.action.path)}
                      className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      {getActionIcon(m.action.type)}
                      <span>{m.action.label}</span>
                      <ArrowRight size={13} />
                    </button>
                  )}

                  <span
                    className={`text-[9px] block text-right font-medium ${
                      m.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Animation */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700/70 text-slate-300 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
                  <Bot size={15} className="text-blue-400 animate-bounce" />
                  <span className="text-[11px] text-slate-400 font-medium">{t('aiThinking', 'Fixiva AI is thinking...')}</span>
                  <Loader2 size={13} className="animate-spin text-blue-400" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Auto Redirection Countdown Banner */}
          {widgetAction && (
            <div className="px-3.5 py-2 bg-blue-950/90 border-t border-blue-800/80 flex items-center justify-between gap-2 text-[10.5px] shrink-0">
              <div className="flex items-center gap-1.5 text-blue-200 font-medium truncate">
                {!widgetCancelled && widgetCountdown > 0 ? (
                  <>
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="truncate">
                      Redirecting in <strong className="text-white font-bold px-1 rounded bg-blue-900">{widgetCountdown}s</strong>
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 truncate">Auto-redirect paused</span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!widgetCancelled && widgetCountdown > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate(widgetAction.path)}
                      className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[9.5px] transition-colors"
                    >
                      Go Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setWidgetCancelled(true)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[9.5px] transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setWidgetCancelled(false);
                      setWidgetCountdown(5);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-[9.5px] transition-colors"
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick Suggestions */}
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-blue-600 hover:text-white border border-slate-700 text-[10px] text-slate-300 font-medium whitespace-nowrap transition-all duration-150 shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Active Voice Listening Banner */}
          {isListening && (
            <div className="px-3.5 py-1.5 bg-red-950/90 border-t border-red-800/90 flex items-center justify-between text-[11px] text-red-200 shrink-0">
              <div className="flex items-center gap-2 font-bold truncate">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="truncate">Listening... Speak now 🎙️</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  setIsListening(false);
                }}
                className="px-2.5 py-0.5 rounded bg-red-900/80 hover:bg-red-800 text-white font-extrabold text-[9.5px] transition-colors shrink-0"
              >
                Stop
              </button>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder={t('aiPlaceholder', 'Ask anything about Fixiva...')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 font-medium"
            />
            <button
              type="button"
              onClick={handleMicToggle}
              className={`p-2 rounded-xl transition-all shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-lg ring-2 ring-red-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title={isListening ? 'Stop Listening' : 'Speak to AI'}
            >
              {isListening ? <MicOff size={16} className="animate-bounce" /> : <Mic size={16} />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors disabled:opacity-40 shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
