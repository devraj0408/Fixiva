import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check } from 'lucide-react';

const SearchableDropdown = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option',
  disabled = false,
  icon: Icon,
  className = '',
  id,
  variant = 'boxed', // 'boxed' | 'borderless'
  isStateDropdown = false,
  totalStatesFromAPI = 0,
  totalStatesAfterFiltering = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const triggerRef = useRef(null);
  const optionsListRef = useRef(null);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    String(option).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen && isStateDropdown) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen, isStateDropdown]);

  if (isStateDropdown) {
    console.log("Total states received from API:", totalStatesFromAPI);
    console.log("Total states after filtering:", totalStatesAfterFiltering);
    console.log("Total states rendered:", filteredOptions.length);
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-scroll active item into view
  useEffect(() => {
    if (focusedIndex >= 0 && optionsListRef.current) {
      const activeEl = optionsListRef.current.children[focusedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setFocusedIndex(-1);
  };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery('');
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(-1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          filteredOptions.length > 0 
            ? (prev + 1) % filteredOptions.length 
            : -1
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          filteredOptions.length > 0 
            ? (prev - 1 + filteredOptions.length) % filteredOptions.length 
            : -1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex]);
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchQuery('');
        break;
      default:
        break;
    }
  };

  const isBorderless = variant === 'borderless';

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        ref={triggerRef}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={isBorderless
          ? `w-full h-10 pl-9 pr-6 bg-transparent border-0 outline-none text-xs font-bold text-slate-700 text-left cursor-pointer flex items-center justify-between focus:ring-0 focus:outline-none transition-all ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`
          : `w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl text-xs font-bold text-slate-700 text-left outline-none cursor-pointer transition-all flex items-center justify-between ${
              disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
            }`
        }
      >
        {Icon && (
          <Icon 
            className={isBorderless 
              ? "absolute left-2.5 top-3 text-slate-400" 
              : "absolute left-3.5 top-3.5 text-slate-400"
            } 
            size={16} 
          />
        )}
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isStateDropdown ? (
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-[0_15px_50px_-12px_rgba(0,0,0,0.08)] overflow-hidden"
                style={{
                  top: `${coords.top + 8}px`,
                  left: `${coords.left}px`,
                  width: `${coords.width}px`,
                  zIndex: 9999
                }}
              >
                {/* Search Input */}
                <div className="relative border-b border-slate-100 p-2.5 bg-slate-50/50">
                  <Search className="absolute left-4.5 top-4.5 text-slate-400" size={14} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFocusedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search..."
                    className="w-full h-9.5 pl-8 pr-3 bg-white border border-slate-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all placeholder-slate-400"
                  />
                </div>

                {/* Options List */}
                <div
                  ref={optionsListRef}
                  className="max-h-56 overflow-y-auto py-1.5 px-1.5 custom-scrollbar"
                  role="listbox"
                >
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, idx) => {
                      const isSelected = option === value;
                      const isFocused = idx === focusedIndex;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleSelect(option)}
                          role="option"
                          aria-selected={isSelected}
                          className={`w-[calc(100%-8px)] mx-1 px-3.5 py-2.5 text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer rounded-xl ${
                            isSelected 
                              ? 'text-primary bg-primary/5 font-extrabold' 
                              : isFocused 
                                ? 'text-slate-800 bg-slate-50/80' 
                                : 'text-slate-650 hover:bg-slate-50/50 hover:text-slate-850'
                          }`}
                        >
                          <span>{option}</span>
                          {isSelected && <Check size={12} className="text-primary" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3.5 text-center text-xs font-medium text-slate-400">
                      No matches found
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      ) : (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-[0_15px_50px_-12px_rgba(0,0,0,0.08)] overflow-hidden"
            >
              {/* Search Input */}
              <div className="relative border-b border-slate-100 p-2.5 bg-slate-50/50">
                <Search className="absolute left-4.5 top-4.5 text-slate-400" size={14} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setFocusedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className="w-full h-9.5 pl-8 pr-3 bg-white border border-slate-200 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all placeholder-slate-400"
                />
              </div>

              {/* Options List */}
              <div
                ref={optionsListRef}
                className="max-h-56 overflow-y-auto py-1.5 px-1.5 custom-scrollbar"
                role="listbox"
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option, idx) => {
                    const isSelected = option === value;
                    const isFocused = idx === focusedIndex;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelect(option)}
                        role="option"
                        aria-selected={isSelected}
                        className={`w-[calc(100%-8px)] mx-1 px-3.5 py-2.5 text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer rounded-xl ${
                          isSelected 
                            ? 'text-primary bg-primary/5 font-extrabold' 
                            : isFocused 
                              ? 'text-slate-800 bg-slate-50/80' 
                              : 'text-slate-650 hover:bg-slate-50/50 hover:text-slate-850'
                        }`}
                      >
                        <span>{option}</span>
                        {isSelected && <Check size={12} className="text-primary" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-3.5 text-center text-xs font-medium text-slate-400">
                    No matches found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default SearchableDropdown;
