
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
      },
      {
        name: "Dumka",
        localities: [
          { name: "Civil Lines", pincode: "814101", lat: 24.2680, lng: 87.2480 },
          { name: "Main Road", pincode: "814101", lat: 24.2690, lng: 87.2500 },
          { name: "Dudhani", pincode: "814101", lat: 24.2650, lng: 87.2550 },
          { name: "Rasikpur", pincode: "814101", lat: 24.2720, lng: 87.2430 },
          { name: "Tower Chowk", pincode: "814101", lat: 24.2670, lng: 87.2490 }
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

export const getDistrictsForState = (stateName, extraDistricts = []) => {
  const safeStateName = typeof stateName === 'object' && stateName !== null
    ? String(stateName.state || stateName.name || '')
    : String(stateName || '');
  if (!safeStateName) return [];

  // Base static districts
  const found = LOCATION_DATA.find(item => item && String(item.state || '').toLowerCase() === safeStateName.toLowerCase());
  const staticNames = found && Array.isArray(found.districts)
    ? found.districts.map(d => typeof d === 'object' ? d.name : String(d)).filter(Boolean)
    : [];

  // Retrieve custom created districts from localStorage
  let customDistricts = [];
  try {
    const raw = localStorage.getItem('fixiva_custom_districts');
    if (raw) customDistricts = JSON.parse(raw);
  } catch (e) {
    void e;
  }

  // Retrieve district updates from localStorage
  let districtUpdates = {};
  try {
    const raw = localStorage.getItem('fixiva_district_updates');
    if (raw) districtUpdates = JSON.parse(raw);
  } catch (e) {
    void e;
  }

  const resultMap = new Map();

  // Add static districts if active
  staticNames.forEach(name => {
    const update = districtUpdates[name];
    if (update && update.status === 'Disabled') return;
    resultMap.set(name.toLowerCase(), name);
  });

  // Add custom districts matching the target state if active
  customDistricts.forEach(d => {
    if (!d || !d.name) return;
    const dState = String(d.state_name || d.state || '').toLowerCase();
    if (dState === safeStateName.toLowerCase()) {
      const update = districtUpdates[d.id] || districtUpdates[d.name];
      const status = update?.status || d.status || 'Active';
      if (status !== 'Disabled') {
        resultMap.set(d.name.toLowerCase(), d.name);
      }
    }
  });

  // Add extra passed-in districts
  if (Array.isArray(extraDistricts)) {
    extraDistricts.forEach(d => {
      if (!d) return;
      const dName = typeof d === 'object' ? d.name : String(d);
      const dState = typeof d === 'object' ? (d.state_name || d.state || '') : '';
      if (dName && (!dState || dState.toLowerCase() === safeStateName.toLowerCase())) {
        const update = districtUpdates[dName];
        if (!update || update.status !== 'Disabled') {
          resultMap.set(dName.toLowerCase(), dName);
        }
      }
    });
  }

  return Array.from(resultMap.values()).sort();
};

export const getAllStaticDistricts = () => {
  const result = [];
  let idCounter = 100;
  for (const stateObj of LOCATION_DATA) {
    if (!stateObj || !Array.isArray(stateObj.districts)) continue;
    for (const distObj of stateObj.districts) {
      if (!distObj) continue;
      result.push({
        id: idCounter++,
        name: typeof distObj === 'object' ? distObj.name : String(distObj),
        state_name: stateObj.state,
        status: 'Active',
        coverage_radius_km: 15
      });
    }
  }
  return result;
};

export const getAllStaticAreas = (districtsList = []) => {
  const result = [];
  let counter = 1;

  const districtMap = new Map();
  if (Array.isArray(districtsList)) {
    districtsList.forEach(d => {
      if (d && d.name) {
        districtMap.set(d.name.toLowerCase(), d);
      }
    });
  }

  for (const stateObj of LOCATION_DATA) {
    if (!stateObj || !Array.isArray(stateObj.districts)) continue;
    const stateName = stateObj.state;

    for (const distObj of stateObj.districts) {
      if (!distObj || !Array.isArray(distObj.localities)) continue;
      const districtName = typeof distObj === 'object' ? distObj.name : String(distObj);
      const matchedDist = districtMap.get(districtName.toLowerCase());
      const cityId = matchedDist ? matchedDist.id : `dist-${districtName.toLowerCase()}`;

      for (const locObj of distObj.localities) {
        if (!locObj) continue;
        const locName = typeof locObj === 'object' ? locObj.name : String(locObj);
        const pincode = typeof locObj === 'object' ? (locObj.pincode || '') : '';
        const lat = typeof locObj === 'object' ? locObj.lat : null;
        const lng = typeof locObj === 'object' ? locObj.lng : null;

        result.push({
          id: `static-area-${counter++}`,
          name: locName,
          city_id: cityId,
          district_name: districtName,
          state_name: stateName,
          pincode: pincode,
          status: 'Active',
          lat,
          lng,
          is_static: true,
        });
      }
    }
  }

  return result;
};

export const getLocalitiesForDistrict = (districtName, stateName = '') => {
  const safeDistrictName = typeof districtName === 'object' && districtName !== null
    ? String(districtName.district || districtName.name || '')
    : String(districtName || '');

  const safeStateName = typeof stateName === 'object' && stateName !== null
    ? String(stateName.state || stateName.name || '')
    : String(stateName || '');

  if (!safeDistrictName) return [];

  // Base static localities
  let baseLocalities = [];
  for (const stateObj of LOCATION_DATA) {
    if (!stateObj || !Array.isArray(stateObj.districts)) continue;
    if (safeStateName && String(stateObj.state || '').toLowerCase() !== safeStateName.toLowerCase()) continue;
    const dist = stateObj.districts.find(d => d && String(d.name || d || '').toLowerCase() === safeDistrictName.toLowerCase());
    if (dist && Array.isArray(dist.localities)) {
      baseLocalities = dist.localities;
      break;
    }
  }

  // Retrieve custom created areas from localStorage
  let customAreas = [];
  try {
    const raw = localStorage.getItem('fixiva_custom_areas');
    if (raw) customAreas = JSON.parse(raw);
  } catch (e) {
    void e;
  }

  // Retrieve deleted areas from localStorage
  let deletedAreas = [];
  try {
    const raw = localStorage.getItem('fixiva_deleted_areas');
    if (raw) deletedAreas = JSON.parse(raw);
  } catch (e) {
    void e;
  }
  const deletedSet = new Set(deletedAreas.map(d => String(d).toLowerCase()));

  // Apply updates map from localStorage
  let areaUpdates = {};
  try {
    const raw = localStorage.getItem('fixiva_area_updates');
    if (raw) areaUpdates = JSON.parse(raw);
  } catch (e) {
    void e;
  }

  const resultMap = new Map();

  baseLocalities.forEach(loc => {
    const name = typeof loc === 'object' ? loc.name : String(loc);
    if (!name) return;
    if (deletedSet.has(name.toLowerCase())) return;

    const locObj = typeof loc === 'object' ? { ...loc } : { name };
    const update = areaUpdates[name] || areaUpdates[locObj.name];
    if (update) {
      Object.assign(locObj, update);
    }
    if (locObj.status === 'Disabled') return;

    resultMap.set(name.toLowerCase(), locObj);
  });

  customAreas.forEach(area => {
    if (!area || !area.name) return;
    const matchesDistrict =
      String(area.district_name || '').toLowerCase() === safeDistrictName.toLowerCase() ||
      String(area.city_name || '').toLowerCase() === safeDistrictName.toLowerCase() ||
      String(area.city_id || '').toLowerCase() === safeDistrictName.toLowerCase();
    if (!matchesDistrict) return;

    const isIdDeleted = deletedSet.has(String(area.id).toLowerCase());
    const isNameDeleted = deletedSet.has(String(area.name).toLowerCase());
    if (isIdDeleted || isNameDeleted) return;

    const update = areaUpdates[area.id] || areaUpdates[area.name];
    const finalArea = update ? { ...area, ...update } : area;
    if (finalArea.status === 'Disabled') return;

    resultMap.set(area.name.toLowerCase(), {
      name: finalArea.name,
      pincode: finalArea.pincode || '',
      lat: finalArea.lat || null,
      lng: finalArea.lng || null,
    });
  });

  if (resultMap.size > 0) {
    return Array.from(resultMap.values());
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
