import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Droplets, Paintbrush, Hammer, Wind, Tv, Sparkles, Bug, 
  Trash2, Truck, HardHat, Home as HomeIcon, Search, ShieldCheck,
  ArrowRight, MapPin, IndianRupee, Star, Filter, RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AuthContext';

const IconMap = {
  zap: Zap,
  droplets: Droplets,
  paintbrush: Paintbrush,
  hammer: Hammer,
  wind: Wind,
  tv: Tv,
  sparkles: Sparkles,
  bug: Bug,
  trash2: Trash2,
  truck: Truck,
  hardhat: HardHat,
  home: HomeIcon,
  Electrician: Zap,
  Plumber: Droplets,
  Painting: Paintbrush,
  Carpenter: Hammer,
  Cleaning: Sparkles,
  "AC Repair": Wind
};

const DEFAULT_CITIES = [
  { id: 1, name: 'Ranchi', region: 'Jharkhand' },
  { id: 2, name: 'Jamshedpur', region: 'Jharkhand' },
  { id: 3, name: 'Dhanbad', region: 'Jharkhand' },
  { id: 4, name: 'Bokaro', region: 'Jharkhand' },
  { id: 5, name: 'Deoghar', region: 'Jharkhand' }
];

const Services = () => {
  const { services, cities } = useApp();
  const displayCities = cities && cities.length > 0 ? cities : DEFAULT_CITIES;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const initialSearch = queryParams.get('search') || '';
  const initialCity = queryParams.get('city') || '';

  // Filter States
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [activeCategory, setActiveCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(3000);

  // Sync with query params changes (e.g. from Hero)
  useEffect(() => {
    setSearchTerm(queryParams.get('search') || '');
    setSelectedCity(queryParams.get('city') || '');
  }, [location.search]);

  // Unique categories list
  const categories = ['all', ...new Set(services.map(s => s.category || 'General').filter(Boolean))];

  // Filtering Logic
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (service.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeCategory === 'all' || 
                            (service.category || '').toLowerCase() === activeCategory.toLowerCase();
    
    const basePrice = service.base_price || service.inspection_fee || 0;
    const matchesPrice = basePrice <= maxPrice;

    // Optional city verification filter - if selectedCity is specified, check if there's any active workers in this city or if there's any config. 
    // In our context, all services are visible, but the city selector helps customer pick city before clicking book.
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setActiveCategory('all');
    setMaxPrice(3000);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-full text-xs font-bold uppercase tracking-wider border border-primary/10">
            <ShieldCheck size={14} /> 100% Satisfaction Protect Policy
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Every Home Solution, On Demand
          </h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base max-w-xl mx-auto">
            Book top-rated plumbers, electricians, painters, and carpenter experts. Standardized base tariffs. Pay only on-site after job completion.
          </p>
        </div>
      </section>

      {/* Catalog Workspace */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar Filters */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Filter size={16} className="text-slate-400" /> Filter Options
                </span>
                <button 
                  onClick={resetFilters}
                  className="text-[10px] font-extrabold text-slate-400 hover:text-primary transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>

              {/* Text Search Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Search Keyword</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search services..."
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-semibold placeholder-slate-400 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* City Selection dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Target Location</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <select
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-bold text-slate-700 cursor-pointer outline-none transition-all"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    <option value="">All Operating Cities</option>
                    {displayCities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Max Base Tariff</span>
                  <span className="text-primary font-bold">₹{maxPrice}</span>
                </div>
                <input 
                  type="range" 
                  min="99" 
                  max="3000" 
                  step="50"
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>₹99</span>
                  <span>₹3,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Grid */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Category pills inside main layout */}
            {categories.length > 1 && (
              <div className="flex gap-2 flex-wrap pb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2.5 rounded-xl text-xs capitalize transition-all ${
                      activeCategory === cat 
                        ? 'btn-primary shadow-md' 
                        : 'btn-secondary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Services Cards List Grid */}
            <AnimatePresence mode="wait">
              {filteredServices.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {filteredServices.map(service => {
                    const Icon = IconMap[service.name] || IconMap[service.icon] || Zap;
                    const startingPrice = service.base_price || service.inspection_fee || 0;
                    
                    return (
                      <div key={service.id} className="h-full flex">
                        <Link 
                          to={`/book/${service.id}${selectedCity ? `?city=${encodeURIComponent(selectedCity)}` : ''}`} 
                          className="group bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between h-full w-full hover:-translate-y-1 hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                        >
                          <div>
                            {/* Card Top Icon & Starting tariff */}
                            <div className="flex justify-between items-start gap-4 mb-6">
                              <div className="h-12 w-12 rounded-xl bg-slate-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <Icon size={22} />
                              </div>
                              <div className="text-right space-y-0.5">
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">tariff starts</span>
                                <span className="text-lg font-black text-primary group-hover:scale-105 transition-transform block">
                                  ₹{startingPrice}
                                </span>
                              </div>
                            </div>

                            {/* Card Content Info */}
                            <div className="space-y-2">
                              <h3 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-primary transition-colors">
                                {service.name}
                              </h3>
                              <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                                {service.description || `Professional ${service.name.toLowerCase()} experts in your city. Background checked and verified.`}
                              </p>
                              
                              {/* Average review rating badge */}
                              <div className="flex items-center gap-1 text-[10px] font-extrabold text-amber-500 pt-1">
                                <Star size={12} fill="currentColor" />
                                <span>4.9 (Verified reviews)</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer action button */}
                          <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Book Expert</span>
                            <div className="h-8 w-8 rounded-full btn-primary flex items-center justify-center shadow-sm">
                              <ArrowRight size={14} />
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-2xl max-w-md mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Search size={36} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">No matching service</h3>
                  <p className="text-slate-400 text-xs mt-1.5 font-medium px-6">
                    We couldn't find any services matching your search filter rules. Please try resetting your filters.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Services;
