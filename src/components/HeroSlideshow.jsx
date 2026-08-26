import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, Droplets, Sparkles, HardHat, Bug, Wind, Paintbrush, Hammer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_SLIDES = [
  {
    id: 'electrician',
    title: 'Electrician Service',
    badgeIcon: Zap,
    badgeColor: 'from-amber-500 to-yellow-500',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800',
    alt: 'Professional Electrician repairing breaker box'
  },
  {
    id: 'plumber',
    title: 'Plumbing Service',
    badgeIcon: Droplets,
    badgeColor: 'from-blue-500 to-cyan-500',
    image: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&q=80&w=800',
    alt: 'Expert Plumber fixing pipe and sink fittings'
  },
  {
    id: 'cleaning',
    title: 'Home Cleaning',
    badgeIcon: Sparkles,
    badgeColor: 'from-purple-500 to-indigo-500',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800',
    alt: 'Deep Home Cleaning Specialist sanitizing home'
  },
  {
    id: 'labour',
    title: 'Construction Labour',
    badgeIcon: HardHat,
    badgeColor: 'from-orange-500 to-amber-600',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800',
    alt: 'Skilled Labourer and Construction Worker at site'
  },
  {
    id: 'pest-control',
    title: 'Pest Control Service',
    badgeIcon: Bug,
    badgeColor: 'from-emerald-500 to-teal-600',
    image: 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?auto=format&fit=crop&q=80&w=800',
    alt: 'Pest Control Expert carrying out treatment'
  },
  {
    id: 'ac-repair',
    title: 'AC Repair & Service',
    badgeIcon: Wind,
    badgeColor: 'from-sky-500 to-blue-600',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=800',
    alt: 'HVAC Technician servicing air conditioner'
  }
];

const HeroSlideshow = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const slides = DEFAULT_SLIDES;

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (idx) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const currentSlide = slides[currentIndex];
  const IconComponent = currentSlide.badgeIcon;

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.96
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    exit: (dir) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.4, ease: 'easeIn' }
    })
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e) => {
    setIsPaused(false);
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 50) {
      nextSlide();
    } else if (touchEnd - touchStart > 50) {
      prevSlide();
    }
    setTouchStart(null);
  };

  return (
    <div 
      className="relative w-full max-w-[600px] flex flex-col gap-4 items-center group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute -top-6 -right-6 w-80 h-80 sm:w-96 sm:h-96 bg-gradient-to-tr from-primary to-indigo-500 rounded-full opacity-10 blur-3xl -z-10"></div>
      
      {/* Main Image Showcase Frame */}
      <div className="relative w-full rounded-[28px] border-4 sm:border-[6px] border-white shadow-2xl shadow-slate-900/15 overflow-hidden aspect-[4/3] sm:aspect-[16/10.5] bg-slate-900 z-10">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={currentSlide.id}
            src={currentSlide.image}
            alt={currentSlide.alt}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full h-full object-cover absolute inset-0"
          />
        </AnimatePresence>

        {/* Top Right Service Category Pill Badge */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-white/20 transition-all pointer-events-none">
          <div className={`flex items-center gap-1.5 text-white font-extrabold text-xs sm:text-sm`}>
            <IconComponent size={15} />
            <span>{currentSlide.title}</span>
          </div>
        </div>

        {/* Left Circular Arrow Button */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer border border-white/20 shadow-md"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right Circular Arrow Button */}
        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer border border-white/20 shadow-md"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>

        {/* Bottom Right Pagination Indicators */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-5 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Trust Card below image container */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-[20px] p-4 sm:p-4.5 shadow-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 z-20">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-800">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">✓</span>
          <span>{t('verifiedPros', 'Verified Professionals')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-800">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">✓</span>
          <span>{t('transparentPricing', 'Transparent Pricing')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-800">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">✓</span>
          <span>{t('qualityAssured', 'Quality Assured Services')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-800">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">✓</span>
          <span>{t('easyBooking', 'Easy Booking Experience')}</span>
        </div>
      </div>
    </div>
  );
};

export default HeroSlideshow;
