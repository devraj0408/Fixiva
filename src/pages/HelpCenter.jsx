import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, Book, Shield, XCircle,
  Mail, CheckCircle, ChevronDown,
  ChevronUp, Loader2, MapPin, AlertTriangle,
  Bot, Sparkles, Send, LogIn, UserPlus, ArrowRight, X,
  Wrench, Calendar, User, Phone, FileText, Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';
import { useApp } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import { useCms } from '../context/CmsContext';
import { generateAIResponse } from '../services/aiChatService';
import { startListening, stopListening, speakText, stopSpeaking } from '../services/voiceService';

const getActionIcon = (type) => {
  if (type === 'register') return <UserPlus size={16} />;
  if (type === 'services' || type === 'book_service') return <Wrench size={16} />;
  if (type === 'dashboard') return <Calendar size={16} />;
  if (type === 'profile' || type === 'worker_dashboard' || type === 'contractor_dashboard') return <User size={16} />;
  if (type === 'cancellation') return <FileText size={16} />;
  if (type === 'contact') return <Phone size={16} />;
  return <LogIn size={16} />;
};

const HelpCenter = () => {
  const navigate = useNavigate();
  const { user, addTicket, showToast, bookings, services, cities } = useApp();
  const { faqs: cmsFaqs } = useCms();
  const { language, t } = useLanguage();
  const [activeFaq, setActiveFaq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiAction, setAiAction] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Voice Assistant States
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  // Stop voice speech/listening if component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  // Auto Redirection Timer State
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [redirectCancelled, setRedirectCancelled] = useState(false);

  // Handle countdown interval
  useEffect(() => {
    let timer;
    if (aiAction && redirectCountdown > 0 && !redirectCancelled) {
      timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(aiAction.path);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [aiAction, redirectCountdown, redirectCancelled, navigate]);

  const handleAskAI = async (e, customQuery = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const query = (customQuery || aiQuery).trim();
    if (!query || aiLoading) return;

    stopSpeaking();
    stopListening();
    setIsListening(false);

    setAiQuery(query);
    setAiLoading(true);
    setAiAction(null);
    setRedirectCancelled(false);

    try {
      const res = await generateAIResponse({
        userMessage: query,
        userRole: user?.role || 'Customer',
        userProfile: user,
        userLanguage: language,
        activeBookings: bookings || [],
        availableServices: services || [],
        availableCities: cities || []
      });
      setAiAnswer(res.text);

      if (isVoiceEnabled) {
        speakText({
          text: res.text,
          language: res.detectedLanguage || language
        });
      }

      if (res.action) {
        setAiAction(res.action);
        setRedirectCountdown(res.action.countdownSeconds || 5);
      }
    } catch (err) {
      console.error('Error answering AI query:', err);
      setAiAnswer('Sorry, I encountered an issue fetching the response. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const [speakLang, setSpeakLang] = useState(language || 'en');

  useEffect(() => {
    setSpeakLang(language || 'en');
  }, [language]);

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
            setAiQuery(transcript);
          }
          if (isFinal && transcript.trim()) {
            handleAskAI(null, transcript);
            setIsListening(false);
          }
        },
        onError: () => setIsListening(false),
        onEnd: () => setIsListening(false)
      });
    }
  };

  const fallbackFaqs = [
    { 
      q: "How does the pricing work?", 
      a: "Every service has a Base Price or Inspection Fee. In addition, we charge a fixed Fixiva Convenience Fee to handle booking and professional verification. No hidden charges." 
    },
    { 
      q: "Is it safe to book with Fixiva?", 
      a: "Yes. Every professional undergoes a strict background check and identity verification. We also monitor their performance via our proprietary Trust Score system." 
    },
    { 
      q: "What if the worker doesn't arrive?", 
      a: "If a worker is a 'No Show', you can report it via your dashboard. We will either assign a new worker immediately or provide a full explanation and reschedule. No-shows are penalized in our trust system." 
    },
    { 
      q: "When do I pay?", 
      a: "Fixiva currently operates on a 'Cash on Service' model. You pay the professional directly only after the job is completed to your satisfaction." 
    }
  ];

  const faqs = (cmsFaqs || []).length > 0
    ? cmsFaqs.map((f) => ({ q: f.question, a: f.answer }))
    : fallbackFaqs;


  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const ticketData = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    setLoading(true);
    setTimeout(async () => {
      const payload = {
        ...ticketData,
        ...(user?.id ? { user_id: user.id } : {}),
      };
      const { error } = await addTicket(payload);
      setLoading(false);
      if (error) {
        showToast('Failed to submit ticket: ' + error.message, 'error');
      } else {
        setSubmitted(true);
        e.target.reset();
      }
    }, 1000);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <section className="bg-slate-900 py-20 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{t('helpTitle', 'Fixiva Help Center')}</h1>
          <p className="text-slate-400 font-medium text-sm sm:text-base max-w-xl mx-auto">
            {t('helpSubtitle', 'Find answers to common questions, browse policy guidelines, or raise an operations resolution ticket.')}
          </p>
        </div>
      </section>

      {/* Main Workspace content */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* FAQ Accordions & Policy Cards */}
          <div className="lg:col-span-8 space-y-8">
            {/* Interactive Fixiva AI Assistant Card */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-blue-400">
                <Bot size={160} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md text-white">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                      {t('aiTitle', 'Fixiva AI Assistant')} <Sparkles size={16} className="text-amber-400" />
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">{t('aiBadge', 'Instant AI answers trained on Fixiva concepts & dispatches')}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isVoiceEnabled) stopSpeaking();
                    setIsVoiceEnabled(!isVoiceEnabled);
                  }}
                  title={isVoiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
                  className={`p-2 rounded-xl border transition-all ${
                    isVoiceEnabled ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>

              <form onSubmit={handleAskAI} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('aiPlaceholder', 'Ask anything about Fixiva...')}
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={handleMicToggle}
                  className={`p-3 rounded-xl transition-all ${
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
                  disabled={!aiQuery.trim() || aiLoading}
                  className="btn-primary rounded-xl px-5 py-3 text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <><Send size={14} /> {t('askQuestion', 'Ask AI')}</>}
                </button>
              </form>

              {/* Sample AI Prompts */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[10px] font-bold text-slate-400 shrink-0">{t('tryAskingLabel', 'Try asking:')}</span>
                {(language === 'hi' 
                  ? ['फ़िक्सिवा में लॉगिन कैसे करें?', 'प्लंबिंग बुकिंग कैसे करें?', 'डिस्पैच कैसे काम करता है?', 'रद्दीकरण नीति']
                  : language === 'bn'
                  ? ['ফিক্সিভায় কীভাবে লগইন করবেন?', 'প্লাম্বিং সেবা বুক করবেন কীভাবে?', 'ডিসপ্যাচ কীভাবে কাজ করে?', 'বাতিলকরণ নীতি']
                  : language === 'hinglish'
                  ? ['How to login in Fixiva?', 'Plumbing kaise book karein?', 'Dispatches kaise kaam karta hai?', 'Cancellation policy kya hai?']
                  : ['How to Login in fixiva?', 'How to book plumbing?', 'How do dispatches work?', 'Worker trust score rules', 'Cancellation policy']
                ).map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => handleAskAI(e, q)}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-blue-600 text-[10px] text-slate-300 font-medium whitespace-nowrap transition-all border border-slate-700 shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* AI Answer Display */}
              {aiAnswer && (
                <div className="mt-4 p-5 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200 leading-relaxed whitespace-pre-line space-y-4 animate-in fade-in duration-200 shadow-inner">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Bot size={14} /> {t('answerFromAi', 'Answer from Fixiva AI Assistant:')}
                    </div>
                    <button
                      type="button"
                      onClick={() => speakText({ text: aiAnswer, language })}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-blue-300 text-xs font-bold transition-all flex items-center gap-1"
                      title="Listen to response"
                    >
                      <Volume2 size={13} /> Listen
                    </button>
                  </div>
                  
                  <p className="text-slate-100 font-medium">{aiAnswer}</p>

                  {/* Interactive Action Button & Auto Redirect Notice */}
                  {aiAction && (
                    <div className="pt-2 border-t border-slate-700/80 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => navigate(aiAction.path)}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                          {getActionIcon(aiAction.type)}
                          <span>{aiAction.label}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>

                      {/* Auto-redirect countdown banner */}
                      <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2 text-blue-300 font-medium">
                          {!redirectCancelled && redirectCountdown > 0 ? (
                            <>
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                              <span>
                                Redirecting to page in <strong className="text-white font-bold text-xs px-1.5 py-0.5 rounded bg-blue-900 border border-blue-700">{redirectCountdown}s</strong>...
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400">Auto-redirect paused. Click above button when ready!</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!redirectCancelled && redirectCountdown > 0 ? (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate(aiAction.path)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-colors"
                              >
                                Go Now
                              </button>
                              <button
                                type="button"
                                onClick={() => setRedirectCancelled(true)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] transition-colors flex items-center gap-1"
                              >
                                <X size={12} /> Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setRedirectCancelled(false);
                                setRedirectCountdown(5);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-[10px] transition-colors"
                            >
                              Resume Auto-Redirect
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FAQ Accordions */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <HelpCircle className="text-primary" size={20} />
                Frequently Asked Questions
              </h2>

              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const active = activeFaq === idx;
                  return (
                    <div 
                      key={idx} 
                      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                        active ? 'border-primary bg-blue-50/10' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <button 
                        onClick={() => setActiveFaq(active ? null : idx)}
                        className="w-full px-6 py-4 flex justify-between items-center text-left font-bold text-slate-800 text-sm focus:outline-none"
                      >
                        <span>{faq.q}</span>
                        {active ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </button>
                      <AnimatePresence initial={false}>
                        {active && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 pb-4 text-xs font-semibold text-slate-500 leading-relaxed"
                          >
                            {faq.a}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Policy Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Book, title: 'Booking Guide', desc: 'New to Fixiva? Learn how to book in under 2 minutes.' },
                { icon: XCircle, title: 'Cancellations', desc: 'Our cancellation terms, limits and protective safety guidelines.' },
                { icon: Shield, title: 'Identity & Safety', desc: 'How we check background records of worker partners.' }
              ].map((guide, idx) => (
                <div 
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="h-10 w-10 bg-slate-50 text-primary rounded-xl flex items-center justify-center">
                    <guide.icon size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{guide.title}</h4>
                    <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">{guide.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support Ticket Side Desk */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base leading-tight">Submit Help Ticket</h3>
                <p className="text-slate-400 text-[11px] font-semibold mt-1">Need help with a booking? Open an operations ticket.</p>
              </div>

              {submitted ? (
                <div className="text-center py-10 space-y-4 animate-fade-in">
                  <div className="w-16 h-16 bg-green-50 text-success rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">Ticket Opened!</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed max-w-[200px] mx-auto">Our support crew will respond via registered email within 24 hours.</p>
                  </div>
                  <button onClick={() => setSubmitted(false)} className="w-full btn-secondary text-xs px-4 py-2 rounded-xl">Open New Ticket</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" name="name" type="text" required placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" name="email" type="email" required placeholder="john@email.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inquiry Category</label>
                    <select className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer" name="subject" required>
                      <option value="">Select Topic</option>
                      <option value="Issue with professional">Professional Problem</option>
                      <option value="Booking Cancellation">Booking/Cancellation</option>
                      <option value="Payment Inquiry">Payment Question</option>
                      <option value="Partner Application">Partner Support</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Detailed Message</label>
                    <textarea className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none" name="message" rows="3" required placeholder="Describe your issue..."></textarea>
                  </div>
                  <button type="submit" className="w-full btn-primary text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-1.5" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={14} /> : 'Open Support Ticket'}
                  </button>
                </form>
              )}

              <div className="border-t border-slate-100 pt-6 space-y-3 text-slate-500 font-semibold text-xs">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-primary shrink-0" />
                  <a href="mailto:fixiva869@gmail.com" className="hover:text-primary transition-all text-xs break-all">fixiva869@gmail.com</a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary shrink-0" />
                  <span>Deoghar, Jharkhand, India</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50/50 text-warning border border-amber-100/50 rounded-2xl flex gap-2.5 items-start text-[10px] leading-relaxed font-semibold">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <p>For urgent inquiries concerning existing dispatches, please include your generated Booking ID (e.g. BK-123456) in the message details.</p>
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
