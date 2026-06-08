export const INITIAL_SERVICES = [
  { id: 'electrician', name: 'Electrician', icon: 'Zap', basePrice: 149, platformFee: 29, active: true },
  { id: 'plumber', name: 'Plumber', icon: 'Droplets', basePrice: 129, platformFee: 29, active: true },
  { id: 'painter', name: 'Painter', icon: 'Paintbrush', inspectionFee: 99, platformFee: 49, active: true },
  { id: 'carpenter', name: 'Carpenter', icon: 'Hammer', basePrice: 149, platformFee: 29, active: true },
  { id: 'ac-repair', name: 'AC Repair', icon: 'Wind', basePrice: 299, platformFee: 49, active: true },
  { id: 'appliance-repair', name: 'Appliance Repair', icon: 'Tv', basePrice: 199, platformFee: 29, active: true },
  { id: 'house-cleaning', name: 'House Cleaning', icon: 'Sparkles', basePrice: 399, platformFee: 49, active: true },
  { id: 'pest-control', name: 'Pest Control', icon: 'Bug', basePrice: 499, platformFee: 49, active: true },
  { id: 'water-tank', name: 'Water Tank Cleaning', icon: 'Trash2', basePrice: 249, platformFee: 29, active: true },
  { id: 'movers', name: 'Movers & Packers', icon: 'Truck', basePrice: 999, platformFee: 99, active: true },
  { id: 'labour', name: 'Construction Labour', icon: 'HardHat', basePrice: 400, platformFee: 0, active: true },
  { id: 'renovation', name: 'Home Renovation', icon: 'Home', inspectionFee: 199, platformFee: 99, active: true },
];

export const INITIAL_CITIES = {
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur'],
  'NCR': ['Delhi', 'Noida', 'Greater Noida'],
  'Maharashtra': ['Mumbai', 'Navi Mumbai'],
  'South India': ['Bengaluru', 'Hyderabad', 'Chennai'],
};

// Initial states for the application
export const INITIAL_STATE = {
  bookings: [],
  workers: [], // Format: { id, name, email, role: 'worker', status: 'Pending Verification', trustScore: 100, skills: [], ... }
  contractors: [], // Format: { id, name, email, role: 'contractor', status: 'Pending Approval', ... }
  reviews: [],
  tickets: [],
  cityServiceControl: {}, // Format: { 'Ranchi': { 'electrician': true, ... } }
};
