import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShieldCheck, Zap, Sparkles, Wrench } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LOCAL_SERVICE_ASSET_IMAGES = {
  plumber: '/assets/hero-slideshow/plumber.jpg',
  plumbing: '/assets/hero-slideshow/plumber.jpg',
  electrician: '/assets/hero-slideshow/electrician.jpg',
  electrical: '/assets/hero-slideshow/electrician.jpg',
  cleaning: '/assets/hero-slideshow/cleaning.jpg',
  'house cleaning': '/assets/hero-slideshow/cleaning.jpg',
  'home cleaning': '/assets/hero-slideshow/cleaning.jpg',
  'pest control': '/assets/hero-slideshow/pestcontrol.jpg',
  pestcontrol: '/assets/hero-slideshow/pestcontrol.jpg',
  labour: '/assets/hero-slideshow/labour.jpg',
  'construction labour': '/assets/hero-slideshow/labour.jpg',
  'ac repair': '/assets/hero-slideshow/ac_service.jpg',
  'ac service': '/assets/hero-slideshow/ac_service.jpg',
  painter: '/assets/hero-slideshow/painting.jpg',
  painting: '/assets/hero-slideshow/painting.jpg',
  carpenter: '/assets/hero-slideshow/carpenter.jpg',
  carpentry: '/assets/hero-slideshow/carpenter.jpg',
  'appliance repair': '/assets/hero-slideshow/appliance.jpg',
  renovation: '/assets/hero-slideshow/renovation.jpg',
  'home renovation': '/assets/hero-slideshow/renovation.jpg'
};

const HERO_SHOWCASE_ASSETS = [
  {
    id: 'hero-asset-1',
    key: 'plumber',
    title: 'Professional Plumbing Services',
    subtitle: 'Leak repairs, pipe installations & fixture fittings by verified plumbers.',
    category: 'Plumbing',
    badgeIcon: Wrench,
    image: '/assets/hero-slideshow/plumber.jpg'
  },
  {
    id: 'hero-asset-2',
    key: 'electrician',
    title: 'Certified Electrical Solutions',
    subtitle: 'Wiring, switchboard fixes, appliance safety & power troubleshooting.',
    category: 'Electrical',
    badgeIcon: Zap,
    image: '/assets/hero-slideshow/electrician.jpg'
  },
  {
    id: 'hero-asset-3',
    key: 'cleaning',
    title: 'Deep Home & Office Cleaning',
    subtitle: 'Sanitization, floor scrubbing & full home deep-cleaning services.',
    category: 'Cleaning',
    badgeIcon: Sparkles,
    image: '/assets/hero-slideshow/cleaning.jpg'
  },
  {
    id: 'hero-asset-4',
    key: 'ac_service',
    title: 'AC Maintenance & Repair',
    subtitle: 'Cooling checks, gas charging & filter cleaning by HVAC specialists.',
    category: 'AC Service',
    badgeIcon: Wrench,
    image: '/assets/hero-slideshow/ac_service.jpg'
  },
  {
    id: 'hero-asset-5',
    key: 'pestcontrol',
    title: 'Eco-Friendly Pest Control',
    subtitle: 'Termite, cockroach & pest eradication using safe, odor-free treatments.',
    category: 'Pest Control',
    badgeIcon: ShieldCheck,
    image: '/assets/hero-slideshow/pestcontrol.jpg'
  },
  {
    id: 'hero-asset-6',
    key: 'appliance',
    title: 'Appliance Repair Experts',
    subtitle: 'Washing machine, refrigerator & microwave servicing at your doorstep.',
    category: 'Appliance Repair',
    badgeIcon: Wrench,
    image: '/assets/hero-slideshow/appliance.jpg'
  }
];

const HeroSlideshow = ({ services: propServices }) => {
  const { t } = useLanguage();
  const { services: contextServices = [] } = useApp();
  const services = propServices && propServices.length > 0 ? propServices : contextServices;
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const heroServices = useMemo(() => {
    const active = (services || []).filter(
      (s) => s && s.active !== false && s.active !== 'false' && s.active !== 0 && s.active !== '0'
    );
    
    if (active.length === 0) {
      return HERO_SHOWCASE_ASSETS;
    }

    return active.map((s, idx) => {
      const sId = String(s.id || '').toLowerCase().trim();
      const sName = String(s.name || '').toLowerCase().trim();

      let matchedAsset = LOCAL_SERVICE_ASSET_IMAGES[sId] || LOCAL_SERVICE_ASSET_IMAGES[sName];
      if (!matchedAsset) {
        if (sName.includes('plumb')) matchedAsset = '/assets/hero-slideshow/plumber.jpg';
        else if (sName.includes('electr')) matchedAsset = '/assets/hero-slideshow/electrician.jpg';
        else if (sName.includes('clean')) matchedAsset = '/assets/hero-slideshow/cleaning.jpg';
        else if (sName.includes('pest')) matchedAsset = '/assets/hero-slideshow/pestcontrol.jpg';
        else if (sName.includes('ac') || sName.includes('cool') || sName.includes('air')) matchedAsset = '/assets/hero-slideshow/ac_service.jpg';
        else if (sName.includes('paint')) matchedAsset = '/assets/hero-slideshow/painting.jpg';
        else if (sName.includes('carpent') || sName.includes('wood')) matchedAsset = '/assets/hero-slideshow/carpenter.jpg';
        else if (sName.includes('applianc') || sName.includes('repair')) matchedAsset = '/assets/hero-slideshow/appliance.jpg';
        else if (sName.includes('labour') || sName.includes('work')) matchedAsset = '/assets/hero-slideshow/labour.jpg';
        else if (sName.includes('renovat') || sName.includes('home')) matchedAsset = '/assets/hero-slideshow/renovation.jpg';
        else matchedAsset = HERO_SHOWCASE_ASSETS[idx % HERO_SHOWCASE_ASSETS.length].image;
      }

      const resolvedImage = s.image_url || s.image || (s.icon && (s.icon.startsWith('http') || s.icon.startsWith('data:')) ? s.icon : null) || matchedAsset;

      return {
        id: String(s.id),
        name: s.name,
        title: s.name,
        description: s.description || 'Professional service dispatched on demand.',
        subtitle: s.description || 'Professional service dispatched on demand.',
        base_price: Number(s.base_price || s.inspection_fee || 0),
        price: Number(s.base_price || s.inspection_fee || 0),
        category: s.category || 'Home Service',
        badgeIcon: Wrench,
        image: resolvedImage,
        alt: s.name
      };
    });
  }, [services]);

  const slides = heroServices;

  const nextSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (idx) => {
    if (slides.length <= 1) return;
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, slides.length]);

  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const currentSlide = slides[currentIndex] || slides[0];
  if (!currentSlide) return null;

  const IconComponent = currentSlide.badgeIcon || Wrench;

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.45, ease: 'easeOut' }
    },
    exit: (dir) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
      transition: { duration: 0.35, ease: 'easeIn' }
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
      className="relative w-full max-w-[560px] flex flex-col gap-4 items-center group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Showcase Panel Frame */}
      <div 
        onClick={() => {
          if (heroServices.length > 0 && currentSlide.id && !currentSlide.id.startsWith('hero-asset-')) {
            navigate(`/book/${currentSlide.id}`);
          }
        }}
        className={`relative w-full rounded-[22px] border border-[#E7E9E6] shadow-md overflow-hidden bg-[#171918] p-5 sm:p-6 text-white flex flex-col justify-between z-10 transition-all ${
          heroServices.length > 0 && !currentSlide.id?.startsWith('hero-asset-') ? 'cursor-pointer hover:border-[#2F6B5F]/60' : ''
        }`}
      >
        {/* Top Header Row with Category Pill Badge */}
        <div className="flex items-center justify-between mb-4 z-20">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-white text-xs font-bold">
            <ShieldCheck size={14} className="text-[#2F6B5F]" />
            <span>{currentSlide.category || 'Fixiva Service'}</span>
          </div>
          {currentSlide.price > 0 && (
            <span className="px-3 py-1 rounded-full bg-[#2F6B5F] text-white text-xs font-extrabold shadow-sm">
              Starts ₹{currentSlide.price}
            </span>
          )}
        </div>

        {/* Primary Image Anchor Container (Responsive 16:7 Wide Landscape Frame) */}
        <div className="relative w-full h-[170px] sm:h-[210px] lg:h-[240px] aspect-[16/7] rounded-xl overflow-hidden bg-slate-900 border border-white/10 mb-3.5 flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {currentSlide.image ? (
              <motion.img
                key={currentSlide.id}
                src={currentSlide.image}
                alt={currentSlide.alt || currentSlide.title}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full object-cover object-center absolute inset-0"
              />
            ) : (
              <motion.div
                key={currentSlide.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full absolute inset-0 bg-gradient-to-br from-[#171918] via-[#2F6B5F]/40 to-[#171918] flex flex-col items-center justify-center p-6 text-center space-y-2"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#2F6B5F] text-white flex items-center justify-center shadow-lg border border-white/20">
                  <IconComponent size={24} />
                </div>
                <span className="text-xs font-bold text-slate-300">Fixiva Guaranteed Service</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Slide Title & Description Footer */}
        <div className="space-y-1 z-20 px-1 pb-6 sm:pb-5">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-1"
            >
              <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight tracking-tight">
                {currentSlide.title}
              </h3>
              {currentSlide.subtitle && (
                <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">
                  {currentSlide.subtitle}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls: Left & Right Arrows */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-[#171918]/80 hover:bg-[#171918] text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer border border-white/20 shadow-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-[#171918]/80 hover:bg-[#171918] text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer border border-white/20 shadow-sm"
              aria-label="Next slide"
            >
              <ChevronRight size={18} />
            </button>

            {/* Bottom Dynamic Indicators */}
            <div className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5 bg-[#171918]/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goToSlide(idx); }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Trust Bar below image container */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-[16px] p-4 border border-[#E7E9E6] dark:border-slate-800 shadow-xs grid grid-cols-2 gap-3 z-20">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#171918] dark:text-slate-200">
          <span className="w-4 h-4 rounded-full bg-[#E8F0ED] dark:bg-emerald-950/80 text-[#3D8068] dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
          <span>{t('verifiedPros', 'Verified Professionals')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#171918] dark:text-slate-200">
          <span className="w-4 h-4 rounded-full bg-[#E8F0ED] dark:bg-emerald-950/80 text-[#3D8068] dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
          <span>{t('transparentPricing', 'Transparent Pricing')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#171918] dark:text-slate-200">
          <span className="w-4 h-4 rounded-full bg-[#E8F0ED] dark:bg-emerald-950/80 text-[#3D8068] dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
          <span>{t('qualityAssured', 'Quality Assured Services')}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#171918] dark:text-slate-200">
          <span className="w-4 h-4 rounded-full bg-[#E8F0ED] dark:bg-emerald-950/80 text-[#3D8068] dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
          <span>{t('easyBooking', 'Easy Booking Experience')}</span>
        </div>
      </div>
    </div>
  );
};

export default HeroSlideshow;
