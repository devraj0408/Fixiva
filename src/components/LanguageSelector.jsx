import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector({ isMobile = false }) {
  const { language, changeLanguage, languages, currentLangObj } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isMobile) {
    return (
      <div className="py-2 px-1 border-t border-slate-100 mt-2">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 px-2">
          <Globe size={14} className="text-primary" /> Select Language
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {languages.map((lang) => {
            const active = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span className="text-sm">{lang.flag}</span>
                <span className="truncate">{lang.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all border border-slate-200/80 hover:border-slate-300"
        title="Change Language"
      >
        <Globe size={14} className="text-primary shrink-0" />
        <span className="text-sm shrink-0">{currentLangObj.flag}</span>
        <span className="font-bold text-xs">{currentLangObj.short}</span>
        <ChevronDown size={12} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 mb-1">
            Language / भाषा
          </div>
          {languages.map((lang) => {
            const active = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active ? 'bg-blue-50/80 text-primary font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
                {active && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
