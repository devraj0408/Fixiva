import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Droplets, Paintbrush, Hammer, Wind, Tv, Sparkles, Bug,
  Trash2, Truck, HardHat, Home as HomeIcon,
  Star, Users, ShieldCheck, ArrowRight, Clock, ThumbsUp, Search, Lock, HelpCircle
} from 'lucide-react';
import { useApp } from '../context/AuthContext';
import HierarchicalLocationSelector from '../components/HierarchicalLocationSelector';

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

const Home = () => {
  const { services, reviews, cities = [], showToast, submitCoverageRequest } = useApp();
  const navigate = useNavigate();
  
  // Search & City selectors inside the Hero
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Coverage Request Form States
  const [reqCity, setReqCity] = useState('');
  const [reqState, setReqState] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqCity.trim() || !reqState.trim() || !reqEmail.trim()) {
      showToast("Please fill in all fields.", 'error');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reqEmail.trim())) {
      showToast("Please enter a valid email address.", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitCoverageRequest(reqCity.trim(), reqState.trim(), reqEmail.trim());
      if (res.success) {
        setIsSuccess(true);
        setReqCity('');
        setReqState('');
        setReqEmail('');
      } else if (res.error === 'duplicate') {
        showToast("You've already requested this city.", 'error');
      } else {
        showToast("Something went wrong. Please try again.", 'error');
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to submit request.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Redirect to services with query params
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedCity) params.append('city', selectedCity);
    if (selectedState) params.append('state', selectedState);
    navigate(`/services?${params.toString()}`);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 hero-shell overflow-hidden border-b border-slate-100">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-10 left-10 w-[300px] h-[300px] bg-indigo-200/20 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <motion.div 
            className="lg:col-span-7 space-y-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="section-label">
              <ShieldCheck size={13} /> Official Marketplace Launched
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[0.95]">
              One App.<br/>
              <span className="hero-title-highlight">
                Every Solution.
              </span>
            </h1>

            <p className="text-lg text-slate-600 font-medium max-w-xl leading-8">
              Book professional home services with instant dispatch, verified experts, and a clear experience from first click to final service.
            </p>

            <div className="flex flex-wrap gap-3">
              <span className="stat-pill"><ShieldCheck size={15} className="text-primary" /> Background Verified</span>
              <span className="stat-pill"><Clock size={15} className="text-primary" /> Quick Booking</span>
              <span className="stat-pill"><Lock size={15} className="text-primary" /> Secure Booking</span>
            </div>

            {/* Premium search & Select City controls combined */}
            <form onSubmit={handleSearchSubmit} className="hero-panel p-2.5 rounded-[1.6rem] flex flex-col md:flex-row gap-2 max-w-2xl">
              <div className="flex-1 flex items-center gap-2 px-3 border-b md:border-b-0 md:border-r border-slate-100 pb-2 md:pb-0">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input 
                  type="text" 
                  placeholder="What service do you need?" 
                  className="w-full bg-transparent border-0 outline-none text-slate-800 text-sm font-semibold placeholder-slate-400 focus:ring-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-none md:w-[320px] flex items-center gap-2 px-2 pb-2 md:pb-0">
                <HierarchicalLocationSelector
                  selectedState={selectedState}
                  selectedDistrict={selectedCity}
                  onChange={(district, state) => {
                    setSelectedCity(district);
                    setSelectedState(state);
                  }}
                  statePlaceholder="State"
                  districtPlaceholder="City"
                  variant="borderless"
                  layout="row"
                  className="w-full"
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary text-sm px-6 py-3.5 rounded-xl shrink-0 flex items-center justify-center gap-1.5"
              >
                Book Now
                <ArrowRight size={16} />
              </button>
            </form>


          </motion.div>

          {/* Hero Right Media */}
          <motion.div 
            className="lg:col-span-5 relative flex justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-gradient-to-tr from-primary to-indigo-500 rounded-[2rem] opacity-10 blur-3xl"></div>
              <div className="absolute -bottom-6 -left-6 hero-panel rounded-[1.4rem] p-5 min-w-[240px] z-20 space-y-2.5 shadow-xl border border-slate-100/80 bg-white/95 backdrop-blur-md">
                <div className="flex items-center gap-2 text-slate-800 text-[11px] font-extrabold">
                  <span className="text-emerald-500 text-sm font-bold">✔</span> Verified Professionals
                </div>
                <div className="flex items-center gap-2 text-slate-800 text-[11px] font-extrabold">
                  <span className="text-emerald-500 text-sm font-bold">✔</span> Transparent Pricing
                </div>
                <div className="flex items-center gap-2 text-slate-800 text-[11px] font-extrabold">
                  <span className="text-emerald-500 text-sm font-bold">✔</span> Quality Assured Services
                </div>
                <div className="flex items-center gap-2 text-slate-800 text-[11px] font-extrabold">
                  <span className="text-emerald-500 text-sm font-bold">✔</span> Easy Booking Experience
                </div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800" 
                alt="Fixiva Home Service Expert" 
                className="rounded-[2rem] border-[8px] border-white shadow-[0_30px_60px_-24px_rgba(15,23,42,0.35)] max-w-full w-96 relative z-10"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Readiness Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Uncompromising Reliability</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              We're Ready to Serve You
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base leading-relaxed">
              FIXIVA connects customers with verified professionals for fast, reliable, and hassle-free home services across your city. Book trusted experts in minutes and get quality service at your doorstep.
            </p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                icon: ShieldCheck,
                title: "Verified Workers Badge",
                desc: "Every service professional undergoes mandatory identity verification and strict background checks before active assignment.",
                color: "from-blue-500 to-indigo-500"
              },
              {
                icon: Users,
                title: "Trusted Service Partners",
                desc: "We onboard experienced local experts and contractors holding consistent high trust ratings and performance credentials.",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: Clock,
                title: "Fast Response Times",
                desc: "Automated routing engines dispatch the nearest available professional to ensure timely arrival at your home.",
                color: "from-amber-500 to-orange-500"
              },
              {
                icon: Lock,
                title: "Secure Booking Experience",
                desc: "A secure verification workflow ensures your service requests, pricing structures, and payouts remain completely safe.",
                color: "from-teal-500 to-emerald-500"
              },
              {
                icon: HelpCircle,
                title: "Customer Support Available",
                desc: "Our operations desk monitors every dispatch, offering responsive support to resolve tickets and disputes immediately.",
                color: "from-cyan-500 to-blue-500"
              },
              {
                icon: Star,
                title: "Quality Assured Services",
                desc: "We prioritize user experience, standardizing tariffs and checking completions to deliver clean, premium craftsmanship.",
                color: "from-rose-500 to-red-500"
              }
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <motion.div 
                  key={idx} 
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="elevated-card p-8 rounded-[1.65rem] transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-sm`}>
                      <IconComp size={20} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-semibold">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Popular Services Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Catalog Categories</span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">Popular Home Services</h2>
            </div>
            <Link to="/services" className="text-sm font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
              Browse All Services <ArrowRight size={16} />
            </Link>
          </div>

          {services.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl">
              <Zap size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm font-semibold">No services database records found. Populate via SQL.</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {services.slice(0, 12).map(s => {
                const Icon = IconMap[s.name] || IconMap[s.icon] || Zap;
                return (
                  <motion.div key={s.id} variants={itemVariants}>
                    <Link 
                      to={`/book/${s.id}`} 
                      className="group section-surface p-6 rounded-[1.35rem] hover:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.24)] hover:-translate-y-1 hover:border-primary transition-all text-center flex flex-col items-center h-full"
                    >
                      <div className="h-12 w-12 rounded-xl bg-slate-50 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                        <Icon size={22} />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 leading-tight group-hover:text-primary transition-colors">
                        {s.name}
                      </h4>
                      <div className="mt-auto pt-3">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          Starts ₹{s.base_price || s.inspection_fee || 0}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Simple Booking</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">How It Works</h2>
            <p className="text-slate-500 font-medium text-sm mt-3">Book home services with pricing guarantee in 4 quick steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Select Service', desc: 'Choose a service from our dynamic checklist app catalog.' },
              { step: '02', title: 'Book Appointment', desc: 'Confirm scheduled date slot, deployment details and submit request.' },
              { step: '03', title: 'Professional Dispatched', desc: 'A background-verified pro accepts and arrives at your site.' },
              { step: '04', title: 'Done & Settlement', desc: 'Pay Cash-on-Service directly after complete inspection approval.' }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="elevated-card p-8 rounded-[1.4rem] transition-all text-center flex flex-col items-center"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-black text-base flex items-center justify-center mb-6">
                  {item.step}
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mb-2">{item.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-semibold">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Region & Expansion Hub */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          
          {/* Header & Coverage Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Service Coverage</span>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">Serving Cities Across India</h2>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                Fixiva is building India's trusted home services network. We are continuously expanding into new regions to connect households with verified professionals for reliable, transparent, and hassle-free home services.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-10">
              {/* Dynamic Available Locations Grouped by State */}
              {(() => {
                const liveCities = cities.filter(c => c.status === 'Live');
                const availableGroups = {};
                liveCities.forEach(city => {
                  const region = city.region || 'India';
                  if (!availableGroups[region]) {
                    availableGroups[region] = [];
                  }
                  if (!availableGroups[region].includes(city.name)) {
                    availableGroups[region].push(city.name);
                  }
                });

                const groupEntries = Object.entries(availableGroups);
                if (groupEntries.length === 0) {
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📍</span>
                        <h3 className="font-bold text-slate-800 text-sm tracking-wide">Currently Available Locations</h3>
                      </div>
                      <p className="text-slate-400 text-xs font-semibold">Currently setting up operations. Request coverage to expand in your city!</p>
                    </div>
                  );
                }

                return groupEntries.map(([stateName, districtList]) => (
                  <div key={stateName} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📍</span>
                      <h3 className="font-bold text-slate-800 text-sm tracking-wide">Currently Available in {stateName}</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {districtList.sort().map((city) => (
                        <div 
                          key={city} 
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 hover:bg-slate-100 transition-colors"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                          <span className="font-bold text-slate-700 text-xs">{city}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}

              {/* Dynamic Coming Soon Locations */}
              {(() => {
                const comingSoonCities = cities.filter(c => c.status === 'Coming Soon');
                if (comingSoonCities.length === 0) return null;

                // Group by region to render neatly
                const comingSoonGroups = {};
                comingSoonCities.forEach(city => {
                  const region = city.region || 'Upcoming States';
                  if (!comingSoonGroups[region]) {
                    comingSoonGroups[region] = [];
                  }
                  if (!comingSoonGroups[region].includes(city.name)) {
                    comingSoonGroups[region].push(city.name);
                  }
                });

                return (
                  <div className="space-y-4 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🌍</span>
                      <h3 className="font-bold text-slate-800 text-sm tracking-wide">Coming Soon Locations</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(comingSoonGroups).map(([stateName, districtList]) => 
                        districtList.sort().map(city => (
                          <div 
                            key={city} 
                            className="p-3 py-2 rounded-xl bg-blue-50/20 border border-blue-100/50 flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                            <span className="font-bold text-slate-600 text-xs">{city} ({stateName})</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Bring Fixiva to Your City Section */}
          <div className="bg-slate-50 rounded-[2rem] border border-slate-200/60 p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-2xl font-black text-slate-900">Bring Fixiva to Your City</h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed font-semibold">
                Can't find your city? Tell us where you need Fixiva. Every request helps us decide where to expand next, and you'll be among the first to know when our services launch in your area.
              </p>
            </div>

            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm">
              {isSuccess ? (
                <div className="text-center space-y-4 py-4">
                  <div className="text-4xl">🎉</div>
                  <h4 className="text-lg font-extrabold text-slate-950">Thank you!</h4>
                  <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-md mx-auto leading-relaxed">
                    Your city has been added to our expansion wishlist. Our team reviews every request carefully, and we'll notify you as soon as Fixiva launches in your area.
                  </p>
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="btn-secondary text-xs px-4 py-2 rounded-xl mt-2 cursor-pointer"
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Select Location</label>
                    <HierarchicalLocationSelector
                      selectedState={reqState}
                      selectedDistrict={reqCity}
                      onChange={(district, state) => {
                        setReqCity(district);
                        setReqState(state);
                      }}
                      statePlaceholder="Select State"
                      districtPlaceholder="Select District/City"
                      layout="row"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. you@example.com"
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full btn-primary font-bold text-xs py-3 rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting request...' : 'Request My City'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Premium Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { emoji: '🏠', title: 'Expanding Across India', desc: 'Active growth focus' },
              { emoji: '👨‍🔧', title: 'Verified Professionals', desc: 'Strict identity check' },
              { emoji: '📍', title: 'Multiple Cities Covered', desc: 'Growing footprint' },
              { emoji: '⚡', title: 'New Cities Added Regularly', desc: 'Based on demand' }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col items-center text-center space-y-2 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] transition-shadow"
              >
                <span className="text-2xl">{stat.emoji}</span>
                <h4 className="font-extrabold text-slate-800 text-xs">{stat.title}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Guarantee Banner */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-white/10 rounded-xl text-primary"><ShieldCheck size={28} /></div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Identity Checked Experts</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Strict Aadhaar identity uploads check verification on all local workers.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
            <div className="p-3 bg-white/10 rounded-xl text-primary"><Clock size={28} /></div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Late Protection</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Automated reassignment tools protect bookings from partner delays.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
            <div className="p-3 bg-white/10 rounded-xl text-primary"><ThumbsUp size={28} /></div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Settlement Protections</h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Upfront pricing details mean you only pay flat rates directly on-site.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Reviews & Feedback</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">Verified Testimonials</h2>
          </div>

          {reviews.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/60 max-w-lg mx-auto shadow-sm">
              <Star size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm font-semibold">No reviews registered in the system yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.slice(0, 3).map((r, idx) => (
                <div key={idx} className="elevated-card p-8 rounded-[1.5rem] flex flex-col justify-between h-full">
                  <div>
                    <div className="flex gap-1 text-warning mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={14} fill={j < r.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <p className="text-slate-600 italic text-sm leading-relaxed">
                      "{r.comment}"
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-50">
                    <span className="font-bold text-sm text-slate-900">{r.userName || 'Customer'}</span>
                    <span className="text-[9px] uppercase font-black tracking-widest text-primary">
                      {r.serviceType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Book CTA callout */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-primary rounded-[2.5rem] p-12 text-center text-white shadow-[0_25px_55px_-20px_rgba(15,23,42,0.35)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl"></div>
            <div className="relative z-10 space-y-6 max-w-xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to clear your tasks list?</h2>
              <p className="text-blue-100 text-sm font-medium">
                Book professional assistance in a few clicks. Verified professionals, transparent platform billing.
              </p>
              <div className="pt-4">
                <Link 
                  to="/services" 
                  className="inline-flex btn-secondary px-8 py-4 rounded-xl shadow-lg text-center"
                >
                  Book Your First Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
