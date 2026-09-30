import { findAvailableProfessionals } from './src/services/bookingService.js';
import { getWorkers } from './src/services/userService.js';
import { isDistrictActive } from './src/services/coverageService.js';

async function verify() {
  console.log('--- 1. Testing coverage for North 24 Parganas ---');
  const active = await isDistrictActive('West Bengal', 'North 24 Parganas');
  console.log('North 24 Parganas active:', active);

  console.log('\n--- 2. Testing userService.getWorkers() ---');
  const { data: workers, error: wErr } = await getWorkers();
  console.log('Workers count:', workers?.length, 'error:', wErr);
  const ajmalUser = workers?.find(w => w.name?.toLowerCase().includes('ajm') || w.email === 'b81219657@gmail.com');
  console.log('Ajmal in userService:', ajmalUser ? { name: ajmalUser.name, skills: ajmalUser.skills, city: ajmalUser.city, status: ajmalUser.status } : 'NOT FOUND');

  console.log('\n--- 3. Testing findAvailableProfessionals for Plumber in North 24 Parganas (Belgharia) ---');
  const res = await findAvailableProfessionals({
    serviceId: 'c0569650-cb0b-4e04-985e-f1bb9d5b7fb9',
    serviceName: 'plumber',
    category: 'Plumbing',
    state: 'West Bengal',
    district: 'North 24 Parganas',
    locality: 'Belgharia',
  });

  console.log('findAvailableProfessionals result:');
  console.log('  districtActive:', res.districtActive);
  console.log('  professionals count:', res.professionals?.length);
  if (res.professionals && res.professionals.length > 0) {
    console.log('  Found professional:', res.professionals[0]);
  }
}

verify();
