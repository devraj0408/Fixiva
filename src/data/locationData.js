export const LOCATION_DATA = [
  {
    state: "Jharkhand",
    districts: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Dumka", "Giridih", "Jamtara"]
  },
  {
    state: "Bihar",
    districts: ["Patna", "Bhagalpur", "Gaya", "Muzaffarpur", "Darbhanga", "Purnia", "Ara", "Begusarai"]
  },
  {
    state: "Delhi NCR",
    districts: ["New Delhi", "Noida", "Greater Noida", "Ghaziabad", "Faridabad", "Gurugram"]
  },
  {
    state: "Uttar Pradesh",
    districts: ["Lucknow", "Kanpur", "Varanasi", "Prayagraj", "Agra", "Meerut", "Gorakhpur", "Jhansi"]
  },
  {
    state: "Rajasthan",
    districts: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"]
  },
  {
    state: "Gujarat",
    districts: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"]
  },
  {
    state: "Maharashtra",
    districts: ["Mumbai", "Pune", "Nagpur", "Nashik"]
  },
  {
    state: "Karnataka",
    districts: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi"]
  },
  {
    state: "Tamil Nadu",
    districts: ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"]
  },
  {
    state: "Telangana",
    districts: ["Hyderabad", "Warangal"]
  },
  {
    state: "Kerala",
    districts: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Kollam"]
  },
  {
    state: "West Bengal",
    districts: ["Kolkata", "Siliguri", "Durgapur", "Asansol"]
  },
  {
    state: "Odisha",
    districts: ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur"]
  },
  {
    state: "Punjab",
    districts: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"]
  },
  {
    state: "Haryana",
    districts: ["Gurugram", "Faridabad", "Panipat", "Hisar"]
  },
  {
    state: "Assam",
    districts: ["Guwahati", "Silchar", "Jorhat"]
  }
];

export const STATES = LOCATION_DATA.map(item => item.state).sort();

export const getDistrictsForState = (stateName) => {
  const found = LOCATION_DATA.find(item => item.state.toLowerCase() === (stateName || '').toLowerCase());
  return found ? found.districts.slice().sort() : [];
};
