
/**
 * Location Data Store
 * Hierarchy: State -> District -> Localities
 */

export const LOCATION_DATA = [
  {
    state: "Jharkhand",
    districts: [
      {
        name: "Ranchi",
        localities: [
          { name: "Lalpur", pincode: "834001", lat: 23.3700, lng: 85.3300 },
          { name: "Main Road", pincode: "834001", lat: 23.3600, lng: 85.3200 },
          { name: "Kanke", pincode: "834006", lat: 23.4300, lng: 85.3200 },
          { name: "Bariatu", pincode: "834009", lat: 23.3900, lng: 85.3500 },
          { name: "Doranda", pincode: "834002", lat: 23.3400, lng: 85.3200 },
          { name: "Harmu", pincode: "834002", lat: 23.3500, lng: 85.3100 },
          { name: "Morabadi", pincode: "834008", lat: 23.3900, lng: 85.3200 },
          { name: "Hinoo", pincode: "834002", lat: 23.3300, lng: 85.3200 },
          { name: "Ratu Road", pincode: "834005", lat: 23.3700, lng: 85.3000 },
          { name: "Dhurwa", pincode: "834004", lat: 23.3000, lng: 85.3000 }
        ]
      },
      {
        name: "Jamshedpur",
        localities: [
          { name: "Bistupur", pincode: "831001", lat: 22.8000, lng: 86.1800 },
          { name: "Sakchi", pincode: "831001", lat: 22.8100, lng: 86.2000 },
          { name: "Kadma", pincode: "831005", lat: 22.7900, lng: 86.1600 },
          { name: "Sonari", pincode: "831011", lat: 22.8100, lng: 86.1600 },
          { name: "Golmuri", pincode: "831003", lat: 22.8000, lng: 86.2200 },
          { name: "Telco", pincode: "831004", lat: 22.7700, lng: 86.2400 }
        ]
      },
      {
        name: "Dhanbad",
        localities: [
          { name: "Bank More", pincode: "826001", lat: 23.7900, lng: 86.4300 },
          { name: "Saraidhela", pincode: "826004", lat: 23.8200, lng: 86.4500 },
          { name: "Jharia", pincode: "828111", lat: 23.7400, lng: 86.4100 },
          { name: "Govindpur", pincode: "828109", lat: 23.8300, lng: 86.5300 },
          { name: "Hirapur", pincode: "826001", lat: 23.8000, lng: 86.4400 }
        ]
      },
      {
        name: "Bokaro",
        localities: [
          { name: "Sector 4", pincode: "827004", lat: 23.6700, lng: 86.1500 },
          { name: "Chas", pincode: "827013", lat: 23.6300, lng: 86.1700 },
          { name: "Sector 1", pincode: "827001", lat: 23.6500, lng: 86.1400 },
          { name: "Sector 9", pincode: "827009", lat: 23.6800, lng: 86.1200 }
        ]
      },
      {
        name: "Deoghar",
        localities: [
          { name: "Castairs Town", pincode: "814112", lat: 24.4800, lng: 86.7000 },
          { name: "VIP Road", pincode: "814112", lat: 24.4900, lng: 86.6900 },
          { name: "Babadham Temple Area", pincode: "814112", lat: 24.4920, lng: 86.7000 },
          { name: "Jasidih", pincode: "814142", lat: 24.5200, lng: 86.6500 }
        ]
      }
    ]
  },
  {
    state: "Bihar",
    districts: [
      {
        name: "Patna",
        localities: [
          { name: "Boring Road", pincode: "800001", lat: 25.6100, lng: 85.1200 },
          { name: "Kankarbagh", pincode: "800020", lat: 25.5900, lng: 85.1500 },
          { name: "Danapur", pincode: "801503", lat: 25.6200, lng: 85.0400 },
          { name: "Patliputra Colony", pincode: "800013", lat: 25.6200, lng: 85.1100 },
          { name: "Bailey Road", pincode: "800014", lat: 25.6100, lng: 85.0900 },
          { name: "Rajendra Nagar", pincode: "800016", lat: 25.6000, lng: 85.1600 }
        ]
      },
      {
        name: "Gaya",
        localities: [
          { name: "Civil Lines", pincode: "823001", lat: 24.7900, lng: 85.0000 },
          { name: "Bodh Gaya", pincode: "824231", lat: 24.6900, lng: 84.9900 },
          { name: "AP Colony", pincode: "823001", lat: 24.7800, lng: 84.9900 }
        ]
      },
      {
        name: "Bhagalpur",
        localities: [
          { name: "Tilkamanjhi", pincode: "812001", lat: 25.2500, lng: 87.0000 },
          { name: "Khanjarpur", pincode: "812001", lat: 25.2600, lng: 87.0100 }
        ]
      }
    ]
  },
  {
    state: "Delhi NCR",
    districts: [
      {
        name: "New Delhi",
        localities: [
          { name: "Connaught Place", pincode: "110001", lat: 28.6300, lng: 77.2200 },
          { name: "South Extension", pincode: "110049", lat: 28.5700, lng: 77.2200 },
          { name: "Dwarka Sector 10", pincode: "110075", lat: 28.5800, lng: 77.0500 },
          { name: "Saket", pincode: "110017", lat: 28.5200, lng: 77.2100 },
          { name: "Vasant Kunj", pincode: "110070", lat: 28.5400, lng: 77.1500 }
        ]
      },
      {
        name: "Noida",
        localities: [
          { name: "Sector 62", pincode: "201309", lat: 28.6200, lng: 77.3600 },
          { name: "Sector 18", pincode: "201301", lat: 28.5700, lng: 77.3200 },
          { name: "Sector 76", pincode: "201304", lat: 28.5600, lng: 77.3800 },
          { name: "Greater Noida West", pincode: "201306", lat: 28.5900, lng: 77.4400 }
        ]
      },
      {
        name: "Gurugram",
        localities: [
          { name: "Cyber City", pincode: "122002", lat: 28.4900, lng: 77.0900 },
          { name: "Golf Course Road", pincode: "122003", lat: 28.4500, lng: 77.1000 },
          { name: "Sector 56", pincode: "122011", lat: 28.4300, lng: 77.1000 },
          { name: "DLF Phase 3", pincode: "122010", lat: 28.4900, lng: 77.1000 }
        ]
      }
    ]
  },
  {
    state: "Uttar Pradesh",
    districts: [
      {
        name: "Lucknow",
        localities: [
          { name: "Hazratganj", pincode: "226001", lat: 26.8500, lng: 80.9400 },
          { name: "Gomti Nagar", pincode: "226010", lat: 26.8600, lng: 81.0000 },
          { name: "Indira Nagar", pincode: "226016", lat: 26.8800, lng: 80.9900 },
          { name: "Alambagh", pincode: "226005", lat: 26.8100, lng: 80.9000 },
          { name: "Mahanagar", pincode: "226006", lat: 26.8700, lng: 80.9500 }
        ]
      },
      {
        name: "Kanpur",
        localities: [
          { name: "Civil Lines", pincode: "208001", lat: 26.4700, lng: 80.3500 },
          { name: "Swaroop Nagar", pincode: "208002", lat: 26.4800, lng: 80.3100 },
          { name: "Kakadeo", pincode: "208025", lat: 26.4700, lng: 80.2900 }
        ]
      },
      {
        name: "Varanasi",
        localities: [
          { name: "Sigra", pincode: "221002", lat: 25.3100, lng: 82.9800 },
          { name: "Lanka", pincode: "221005", lat: 25.2800, lng: 82.9900 },
          { name: "Bhelupur", pincode: "221010", lat: 25.3000, lng: 83.0000 }
        ]
      }
    ]
  },
  {
    state: "West Bengal",
    districts: [
      {
        name: "Kolkata",
        localities: [
          { name: "Park Street", pincode: "700016", lat: 22.5500, lng: 88.3500 },
          { name: "Salt Lake Sector 5", pincode: "700091", lat: 22.5700, lng: 88.4300 },
          { name: "New Town", pincode: "700156", lat: 22.5800, lng: 88.4700 },
          { name: "Ballygunge", pincode: "700019", lat: 22.5200, lng: 88.3600 },
          { name: "Behala", pincode: "700034", lat: 22.4900, lng: 88.3100 }
        ]
      }
    ]
  },
  {
    state: "Odisha",
    districts: [
      {
        name: "Bhubaneswar",
        localities: [
          { name: "Saheed Nagar", pincode: "751007", lat: 20.2800, lng: 85.8400 },
          { name: "Patia", pincode: "751024", lat: 20.3500, lng: 85.8200 },
          { name: "Jayadev Vihar", pincode: "751013", lat: 20.3000, lng: 85.8200 },
          { name: "Khandagiri", pincode: "751030", lat: 20.2500, lng: 85.7800 }
        ]
      }
    ]
  }
];

export const STATES = LOCATION_DATA.map(item => item.state).sort();

export const getDistrictsForState = (stateName) => {
  if (!stateName) return [];
  const found = LOCATION_DATA.find(item => item.state.toLowerCase() === stateName.toLowerCase());
  return found ? found.districts.map(d => d.name).sort() : [];
};

export const getLocalitiesForDistrict = (districtName, stateName = '') => {
  if (!districtName) return [];

  for (const stateObj of LOCATION_DATA) {
    if (stateName && stateObj.state.toLowerCase() !== stateName.toLowerCase()) continue;
    const dist = stateObj.districts.find(d => d.name.toLowerCase() === districtName.toLowerCase());
    if (dist && dist.localities) {
      return dist.localities;
    }
  }

  // Generic default fallback localities if none defined
  return [
    { name: "Central Market", pincode: "800001", lat: 23.3600, lng: 85.3200 },
    { name: "Station Road", pincode: "800002", lat: 23.3700, lng: 85.3300 },
    { name: "Civil Lines", pincode: "800003", lat: 23.3800, lng: 85.3400 },
    { name: "Green Park", pincode: "800004", lat: 23.3900, lng: 85.3500 },
    { name: "Model Town", pincode: "800005", lat: 23.4000, lng: 85.3600 }
  ];
};
