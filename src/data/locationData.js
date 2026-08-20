/**
 * Fixiva Centralized India Location Data Store
 * Complete India Coverage: All 28 States + All 8 Union Territories
 * Hierarchy: State/UT -> District -> Localities
 */

export const OTHER_LOCATION_OPTION = "Other / Can't find your location?";

export const LOCATION_DATA = [
  // 1. Andaman and Nicobar Islands (UT)
  {
    state: "Andaman and Nicobar Islands",
    districts: [
      { name: "Port Blair", localities: [{ name: "Aberdeen Bazaar" }, { name: "Garacharma" }, { name: "Junglighat" }] },
      { name: "North and Middle Andaman", localities: [{ name: "Mayabunder" }, { name: "Diglipur" }, { name: "Rangat" }] },
      { name: "Nicobar", localities: [{ name: "Car Nicobar" }, { name: "Campbell Bay" }] }
    ]
  },
  // 2. Andhra Pradesh
  {
    state: "Andhra Pradesh",
    districts: [
      { name: "Visakhapatnam", localities: [{ name: "Gajuwaka" }, { name: "MVP Colony" }, { name: "Siripuram" }, { name: "Madhurawada" }] },
      { name: "Vijayawada", localities: [{ name: "Benz Circle" }, { name: "Governorpet" }, { name: "Labbipet" }] },
      { name: "Guntur", localities: [{ name: "Arundelpet" }, { name: "Brodipet" }, { name: "Pattabhipuram" }] },
      { name: "Tirupati", localities: [{ name: "Alipiri" }, { name: "Korlagunta" }, { name: "Tiruchanur" }] },
      { name: "Kakinada", localities: [{ name: "Bhanugudi" }, { name: "Main Road" }] },
      { name: "Nellore", localities: [{ name: "Pogathota" }, { name: "VRC Centre" }] },
      { name: "Kurnool", localities: [{ name: "Nandyal Check Post" }, { name: "Camp Centre" }] },
      { name: "Anantapur", localities: [{ name: "Clock Tower" }, { name: "Subash Road" }] },
      { name: "Kadapa", localities: [{ name: "Seven Roads" }, { name: "RSR Nagar" }] },
      { name: "Eluru", localities: [{ name: "RR Pet" }, { name: "Powerpet" }] },
      { name: "Vizianagaram", localities: [{ name: "Fort Area" }, { name: "Ring Road" }] },
      { name: "Srikakulam", localities: [{ name: "Palakonda Road" }] },
      { name: "Ongole", localities: [{ name: "Koppolu" }] },
      { name: "Machilipatnam", localities: [{ name: "Koneru Centre" }] }
    ]
  },
  // 3. Arunachal Pradesh
  {
    state: "Arunachal Pradesh",
    districts: [
      { name: "Itanagar", localities: [{ name: "Ganga Market" }, { name: "Bank Tinali" }, { name: "Nahar Lagun" }] },
      { name: "Tawang", localities: [{ name: "Tawang Town" }, { name: "Monastery Area" }] },
      { name: "Naharlagun", localities: [{ name: "Model Village" }] },
      { name: "Pasighat", localities: [{ name: "Main Market" }] },
      { name: "Ziro", localities: [{ name: "Hapoli" }] },
      { name: "Bomdila", localities: [{ name: "Main Town" }] },
      { name: "Tezu", localities: [{ name: "Bazaar" }] },
      { name: "Changlang", localities: [{ name: "Main Market" }] }
    ]
  },
  // 4. Assam
  {
    state: "Assam",
    districts: [
      { name: "Guwahati", localities: [{ name: "GS Road" }, { name: "Ganeshguri" }, { name: "Paltan Bazaar" }, { name: "Zoo Road" }, { name: "Dispur" }] },
      { name: "Silchar", localities: [{ name: "Tarapur" }, { name: "Goldighi Market" }, { name: "Rangirkhari" }] },
      { name: "Dibrugarh", localities: [{ name: "Thana Chariali" }, { name: "Chowkidinghee" }, { name: "Jalan Nagar" }] },
      { name: "Jorhat", localities: [{ name: "AT Road" }, { name: "Gar Ali" }, { name: "Tarajan" }] },
      { name: "Tezpur", localities: [{ name: "Chowk Bazaar" }, { name: "Tribeni" }] },
      { name: "Nagaon", localities: [{ name: "Haibargaon" }, { name: "Christianpatty" }] },
      { name: "Tinsukia", localities: [{ name: "Borguri" }, { name: "Makum Road" }] },
      { name: "Bongaigaon", localities: [{ name: "New Bongaigaon" }] },
      { name: "Barpeta", localities: [{ name: "Main Road" }] }
    ]
  },
  // 5. Bihar
  {
    state: "Bihar",
    districts: [
      { name: "Patna", localities: [{ name: "Boring Road" }, { name: "Kankarbagh" }, { name: "Danapur" }, { name: "Patliputra Colony" }, { name: "Bailey Road" }, { name: "Rajendra Nagar" }] },
      { name: "Gaya", localities: [{ name: "Civil Lines" }, { name: "Bodh Gaya" }, { name: "AP Colony" }] },
      { name: "Bhagalpur", localities: [{ name: "Tilkamanjhi" }, { name: "Khanjarpur" }] },
      { name: "Muzaffarpur", localities: [{ name: "Kalyani Chowk" }, { name: "Mithanpura" }, { name: "Brahmapura" }] },
      { name: "Darbhanga", localities: [{ name: "Tower Chowk" }, { name: "Laheriasarai" }] },
      { name: "Purnia", localities: [{ name: "Line Bazaar" }, { name: "Bhatta Bazaar" }] },
      { name: "Arrah", localities: [{ name: "Station Road" }] },
      { name: "Begusarai", localities: [{ name: "Harrakh" }] },
      { name: "Bihar Sharif", localities: [{ name: "Ramchandrapur" }] },
      { name: "Katihar", localities: [{ name: "Mirchaibari" }] },
      { name: "Munger", localities: [{ name: "Fort Area" }] },
      { name: "Chhapra", localities: [{ name: "Municipality Chowk" }] },
      { name: "Saharsa", localities: [{ name: "Supermarket" }] },
      { name: "Sasaram", localities: [{ name: "Gaurakshani" }] },
      { name: "Hajipur", localities: [{ name: "Cinema Road" }] },
      { name: "Bettiah", localities: [{ name: "Meena Bazaar" }] },
      { name: "Motihari", localities: [{ name: "Main Road" }] },
      { name: "Samastipur", localities: [{ name: "Magardahi Ghat" }] },
      { name: "Nawada", localities: [{ name: "Main Bazaar" }] },
      { name: "Buxar", localities: [{ name: "Station Road" }] },
      { name: "Kishanganj", localities: [{ name: "Caltex Chowk" }] },
      { name: "Sitamarhi", localities: [{ name: "Mehsaul Chowk" }] },
      { name: "Aurangabad", localities: [{ name: "Rameshwaram" }] },
      { name: "Gopalganj", localities: [{ name: "Post Office Road" }] },
      { name: "Siwan", localities: [{ name: "Hospital Road" }] }
    ]
  },
  // 6. Chandigarh (UT)
  {
    state: "Chandigarh",
    districts: [
      { name: "Chandigarh", localities: [{ name: "Sector 17" }, { name: "Sector 35" }, { name: "Sector 22" }, { name: "Sector 43" }, { name: "Sector 8" }, { name: "Manimajra" }] }
    ]
  },
  // 7. Chhattisgarh
  {
    state: "Chhattisgarh",
    districts: [
      { name: "Raipur", localities: [{ name: "Pandri" }, { name: "Telibandha" }, { name: "Shankar Nagar" }, { name: "Civil Lines" }] },
      { name: "Bhilai", localities: [{ name: "Civic Centre" }, { name: "Sector 6" }, { name: "Nehru Nagar" }] },
      { name: "Bilaspur", localities: [{ name: "Vyapar Vihar" }, { name: "Link Road" }, { name: "Tarbahar" }] },
      { name: "Korba", localities: [{ name: "Transport Nagar" }, { name: "TP Nagar" }] },
      { name: "Durg", localities: [{ name: "Station Road" }, { name: "Padmanabhpur" }] },
      { name: "Rajnandgaon", localities: [{ name: "Ganj Para" }] },
      { name: "Jagdalpur", localities: [{ name: "Main Market" }] },
      { name: "Ambikapur", localities: [{ name: "Ring Road" }] },
      { name: "Raigarh", localities: [{ name: "Boirdad" }] }
    ]
  },
  // 8. Dadra and Nagar Haveli and Daman and Diu (UT)
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    districts: [
      { name: "Daman", localities: [{ name: "Nani Daman" }, { name: "Moti Daman" }, { name: "Devka" }] },
      { name: "Diu", localities: [{ name: "Ghoghla" }, { name: "Nagoa" }] },
      { name: "Silvassa", localities: [{ name: "Amli" }, { name: "Naroli" }, { name: "Tokarkhada" }] }
    ]
  },
  // 9. Delhi NCR
  {
    state: "Delhi NCR",
    districts: [
      { name: "New Delhi", localities: [{ name: "Connaught Place" }, { name: "South Extension" }, { name: "Dwarka Sector 10" }, { name: "Saket" }, { name: "Vasant Kunj" }, { name: "Chanakyapuri" }, { name: "Lajpat Nagar" }, { name: "Karol Bagh" }] },
      { name: "Noida", localities: [{ name: "Sector 62" }, { name: "Sector 18" }, { name: "Sector 76" }, { name: "Greater Noida West" }, { name: "Sector 137" }, { name: "Sector 50" }] },
      { name: "Gurugram", localities: [{ name: "Cyber City" }, { name: "Golf Course Road" }, { name: "Sector 56" }, { name: "DLF Phase 3" }, { name: "Sohna Road" }, { name: "Sector 14" }] },
      { name: "Faridabad", localities: [{ name: "Sector 15" }, { name: "NIT Faridabad" }, { name: "Greater Faridabad" }, { name: "Sector 21" }] },
      { name: "Ghaziabad", localities: [{ name: "Indirapuram" }, { name: "Vaishali" }, { name: "Vasundhara" }, { name: "Raj Nagar Extension" }, { name: "Crossings Republik" }] },
      { name: "North Delhi", localities: [{ name: "Model Town" }, { name: "Pitampura" }, { name: "Rohini" }, { name: "Civil Lines" }] },
      { name: "South Delhi", localities: [{ name: "Hauz Khas" }, { name: "Greater Kailash" }, { name: "Green Park" }, { name: "Nehru Place" }] },
      { name: "East Delhi", localities: [{ name: "Laxmi Nagar" }, { name: "Preet Vihar" }, { name: "Mayur Vihar" }] },
      { name: "West Delhi", localities: [{ name: "Janakpuri" }, { name: "Rajouri Garden" }, { name: "Punjabi Bagh" }] }
    ]
  },
  // 10. Goa
  {
    state: "Goa",
    districts: [
      { name: "North Goa", localities: [{ name: "Panaji" }, { name: "Candolim" }, { name: "Calangute" }, { name: "Baga" }, { name: "Mapusa" }, { name: "Porvorim" }] },
      { name: "South Goa", localities: [{ name: "Margao" }, { name: "Vasco da Gama" }, { name: "Colva" }, { name: "Ponda" }] }
    ]
  },
  // 11. Gujarat
  {
    state: "Gujarat",
    districts: [
      { name: "Ahmedabad", localities: [{ name: "CG Road" }, { name: "SG Highway" }, { name: "Bodakdev" }, { name: "Satellite" }, { name: "Navrangpura" }, { name: "Maninagar" }, { name: "Prahlad Nagar" }] },
      { name: "Surat", localities: [{ name: "Vesu" }, { name: "Adajan" }, { name: "Varachha" }, { name: "Ring Road" }, { name: "Ghopad" }] },
      { name: "Vadodara", localities: [{ name: "Alkapuri" }, { name: "Sayajigunj" }, { name: "Old Padra Road" }, { name: "Gotri" }] },
      { name: "Rajkot", localities: [{ name: "Yagnik Road" }, { name: "Kalawad Road" }, { name: "Race Course Road" }] },
      { name: "Bhavnagar", localities: [{ name: "Waghawadi Road" }, { name: "Kalanala" }] },
      { name: "Jamnagar", localities: [{ name: "Park Colony" }, { name: "Patel Colony" }] },
      { name: "Gandhinagar", localities: [{ name: "Sector 11" }, { name: "Infocity" }, { name: "Sector 21" }] },
      { name: "Junagadh", localities: [{ name: "Motibaug" }] },
      { name: "Anand", localities: [{ name: "VV Nagar" }] },
      { name: "Bharuch", localities: [{ name: "Zadeshwar Road" }] },
      { name: "Navsari", localities: [{ name: "Grid Road" }] },
      { name: "Valsad", localities: [{ name: "Tithal Road" }] }
    ]
  },
  // 12. Haryana
  {
    state: "Haryana",
    districts: [
      { name: "Gurugram", localities: [{ name: "Cyber City" }, { name: "Golf Course Extension" }, { name: "Sohna Road" }, { name: "Sector 23" }] },
      { name: "Faridabad", localities: [{ name: "Sector 16" }, { name: "Greenfield Colony" }] },
      { name: "Panipat", localities: [{ name: "Model Town" }, { name: "GT Road" }] },
      { name: "Ambala", localities: [{ name: "Ambala Cantt" }, { name: "Ambala City" }] },
      { name: "Yamunanagar", localities: [{ name: "Model Town" }] },
      { name: "Rohtak", localities: [{ name: "Model Town" }, { name: "Delhi Road" }] },
      { name: "Hisar", localities: [{ name: "Urban Estate" }, { name: "Red Square Market" }] },
      { name: "Karnal", localities: [{ name: "Sector 13" }, { name: "Model Town" }] },
      { name: "Sonipat", localities: [{ name: "Subhash Chowk" }, { name: "Murthal" }] },
      { name: "Panchkula", localities: [{ name: "Sector 5" }, { name: "Sector 20" }] },
      { name: "Bhiwani", localities: [{ name: "Clock Tower" }] },
      { name: "Sirsa", localities: [{ name: "Barnala Road" }] }
    ]
  },
  // 13. Himachal Pradesh
  {
    state: "Himachal Pradesh",
    districts: [
      { name: "Shimla", localities: [{ name: "Mall Road" }, { name: "Chotta Shimla" }, { name: "Sanjauli" }, { name: "Lakkar Bazaar" }] },
      { name: "Dharamshala", localities: [{ name: "McLeod Ganj" }, { name: "Kotwali Bazaar" }, { name: "Dari" }] },
      { name: "Mandi", localities: [{ name: "Indira Market" }, { name: "Samkhetar" }] },
      { name: "Solan", localities: [{ name: "Mall Road" }, { name: "Saproon" }] },
      { name: "Kullu", localities: [{ name: "Manali" }, { name: "Dhalpur" }] },
      { name: "Hamirpur", localities: [{ name: "Main Market" }] },
      { name: "Una", localities: [{ name: "Nangal Road" }] },
      { name: "Bilaspur", localities: [{ name: "Main Bazaar" }] }
    ]
  },
  // 14. Jammu and Kashmir (UT)
  {
    state: "Jammu and Kashmir",
    districts: [
      { name: "Srinagar", localities: [{ name: "Lal Chowk" }, { name: "Karan Nagar" }, { name: "Rajbagh" }, { name: "Hazratbal" }, { name: "Sonwar" }] },
      { name: "Jammu", localities: [{ name: "Gandhi Nagar" }, { name: "Trikuta Nagar" }, { name: "Resham Ghar" }, { name: "Bahu Plaza" }] },
      { name: "Anantnag", localities: [{ name: "KP Road" }] },
      { name: "Baramulla", localities: [{ name: "Main Market" }] },
      { name: "Udhampur", localities: [{ name: "Dhar Road" }] },
      { name: "Kathua", localities: [{ name: "College Road" }] }
    ]
  },
  // 15. Jharkhand
  {
    state: "Jharkhand",
    districts: [
      { name: "Ranchi", localities: [{ name: "Lalpur" }, { name: "Main Road" }, { name: "Kanke" }, { name: "Bariatu" }, { name: "Doranda" }, { name: "Harmu" }, { name: "Morabadi" }, { name: "Hinoo" }, { name: "Ratu Road" }, { name: "Dhurwa" }] },
      { name: "Jamshedpur", localities: [{ name: "Bistupur" }, { name: "Sakchi" }, { name: "Kadma" }, { name: "Sonari" }, { name: "Golmuri" }, { name: "Telco" }] },
      { name: "Dhanbad", localities: [{ name: "Bank More" }, { name: "Saraidhela" }, { name: "Jharia" }, { name: "Govindpur" }, { name: "Hirapur" }] },
      { name: "Bokaro", localities: [{ name: "Sector 4" }, { name: "Chas" }, { name: "Sector 1" }, { name: "Sector 9" }] },
      { name: "Deoghar", localities: [{ name: "Castairs Town" }, { name: "VIP Road" }, { name: "Babadham Temple Area" }, { name: "Jasidih" }] },
      { name: "Dumka", localities: [{ name: "Civil Lines" }, { name: "Main Road" }, { name: "Dudhani" }, { name: "Rasikpur" }, { name: "Tower Chowk" }] },
      { name: "Hazaribagh", localities: [{ name: "Babu Village" }, { name: "Main Road" }] },
      { name: "Giridih", localities: [{ name: "Makatpur" }] },
      { name: "Ramgarh", localities: [{ name: "Main Market" }] },
      { name: "Chaibasa", localities: [{ name: "Post Office Chowk" }] },
      { name: "Koderma", localities: [{ name: "Jhumri Telaiya" }] },
      { name: "Sahibganj", localities: [{ name: "College Road" }] }
    ]
  },
  // 16. Karnataka
  {
    state: "Karnataka",
    districts: [
      { name: "Bengaluru Urban", localities: [{ name: "Indiranagar" }, { name: "Koramangala" }, { name: "Whitefield" }, { name: "HSR Layout" }, { name: "Jayanagar" }, { name: "JP Nagar" }, { name: "MG Road" }, { name: "Electronic City" }, { name: "Hebbal" }] },
      { name: "Mysuru", localities: [{ name: "Gokulam" }, { name: "Vijayanagar" }, { name: "Devaraja Mohalla" }, { name: "Saraswathipuram" }] },
      { name: "Mangaluru", localities: [{ name: "MG Road" }, { name: "Hampankatta" }, { name: "Lalbagh" }, { name: "Kadri" }] },
      { name: "Hubballi-Dharwad", localities: [{ name: "Vidyanagar" }, { name: "Gokul Road" }, { name: "CBT Dharwad" }] },
      { name: "Belagavi", localities: [{ name: "Tilakwadi" }, { name: "Khanapur Road" }] },
      { name: "Kalaburagi", localities: [{ name: "Super Market" }] },
      { name: "Davanagere", localities: [{ name: "PJ Extension" }] },
      { name: "Ballari", localities: [{ name: "Car Street" }] },
      { name: "Shivamogga", localities: [{ name: "Durgigudi" }] },
      { name: "Tumakuru", localities: [{ name: "BH Road" }] },
      { name: "Udupi", localities: [{ name: "Manipal" }, { name: "Car Street" }] }
    ]
  },
  // 17. Kerala
  {
    state: "Kerala",
    districts: [
      { name: "Thiruvananthapuram", localities: [{ name: "MG Road" }, { name: "Kazhakoottam/Technopark" }, { name: "Pattam" }, { name: "Kowdiar" }, { name: "Palayam" }] },
      { name: "Kochi", localities: [{ name: "MG Road Ernakulam" }, { name: "Kakkanad/Infopark" }, { name: "Fort Kochi" }, { name: "Edappally" }, { name: "Vyttila" }] },
      { name: "Kozhikode", localities: [{ name: "SM Street" }, { name: "Mavoor Road" }, { name: "Palayam" }] },
      { name: "Thrissur", localities: [{ name: "Swaraj Round" }, { name: "East Fort" }] },
      { name: "Kollam", localities: [{ name: "Chinnakada" }] },
      { name: "Palakkad", localities: [{ name: "College Road" }] },
      { name: "Alappuzha", localities: [{ name: "Mullakkal" }] },
      { name: "Kannur", localities: [{ name: "Fort Road" }] },
      { name: "Kottayam", localities: [{ name: "KK Road" }] }
    ]
  },
  // 18. Ladakh (UT)
  {
    state: "Ladakh",
    districts: [
      { name: "Leh", localities: [{ name: "Main Bazaar" }, { name: "Changspa" }, { name: "Fort Road" }] },
      { name: "Kargil", localities: [{ name: "Main Market" }, { name: "Baroo" }] }
    ]
  },
  // 19. Lakshadweep (UT)
  {
    state: "Lakshadweep",
    districts: [
      { name: "Kavaratti", localities: [{ name: "Main Island Area" }] },
      { name: "Agatti", localities: [{ name: "Airport Area" }] },
      { name: "Minicoy", localities: [{ name: "Village Area" }] }
    ]
  },
  // 20. Madhya Pradesh
  {
    state: "Madhya Pradesh",
    districts: [
      { name: "Bhopal", localities: [{ name: "MP Nagar" }, { name: "Arera Colony" }, { name: "New Market" }, { name: "Kolar Road" }, { name: "Shahpura" }] },
      { name: "Indore", localities: [{ name: "Vijay Nagar" }, { name: "MG Road" }, { name: "Palasia" }, { name: "Rau" }, { name: "Bhawarkua" }, { name: "Rajwada" }] },
      { name: "Gwalior", localities: [{ name: "City Centre" }, { name: "Lashkar" }, { name: "Morar" }] },
      { name: "Jabalpur", localities: [{ name: "Wright Town" }, { name: "Civil Lines" }, { name: "Gorakhpur" }] },
      { name: "Ujjain", localities: [{ name: "Freeganj" }, { name: "Mahakal Area" }] },
      { name: "Sagar", localities: [{ name: "Civil Lines" }] },
      { name: "Dewas", localities: [{ name: "AB Road" }] },
      { name: "Satna", localities: [{ name: "Rewa Road" }] },
      { name: "Ratlam", localities: [{ name: "Do Batti" }] },
      { name: "Rewa", localities: [{ name: "College Road" }] }
    ]
  },
  // 21. Maharashtra
  {
    state: "Maharashtra",
    districts: [
      { name: "Mumbai", localities: [{ name: "Andheri" }, { name: "Bandra" }, { name: "Colaba" }, { name: "Juhu" }, { name: "Dadar" }, { name: "Borivali" }, { name: "Powai" }, { name: "Ghatkopar" }, { name: "Worli" }] },
      { name: "Pune", localities: [{ name: "Koregaon Park" }, { name: "Kothrud" }, { name: "Baner" }, { name: "Viman Nagar" }, { name: "Hinjawadi" }, { name: "Wakad" }, { name: "Aundh" }, { name: "Camp" }] },
      { name: "Nagpur", localities: [{ name: "Dharampeth" }, { name: "Sitabuldi" }, { name: "Sadar" }, { name: "Civil Lines" }, { name: "Wardha Road" }] },
      { name: "Thane", localities: [{ name: "Ghodbunder Road" }, { name: "Majiwada" }, { name: "Naupada" }, { name: "Vartak Nagar" }] },
      { name: "Nashik", localities: [{ name: "College Road" }, { name: "Gangapur Road" }, { name: "Indira Nagar" }] },
      { name: "Aurangabad", localities: [{ name: "CIDCO" }, { name: "Nirala Bazar" }, { name: "Garkheda" }] },
      { name: "Navi Mumbai", localities: [{ name: "Vashi" }, { name: "Nerul" }, { name: "Belapur" }, { name: "Kharghar" }, { name: "Seawoods" }] },
      { name: "Solapur", localities: [{ name: "Murarji Peth" }] },
      { name: "Amravati", localities: [{ name: "Rajapeth" }] },
      { name: "Kolhapur", localities: [{ name: "Rajarampuri" }] },
      { name: "Nanded", localities: [{ name: "VIP Road" }] },
      { name: "Sangli", localities: [{ name: "Vishrambag" }] },
      { name: "Akola", localities: [{ name: "Jawtala Road" }] },
      { name: "Latur", localities: [{ name: "Subhash Chowk" }] }
    ]
  },
  // 22. Manipur
  {
    state: "Manipur",
    districts: [
      { name: "Imphal East", localities: [{ name: "Porompat" }, { name: "Palace Compound" }] },
      { name: "Imphal West", localities: [{ name: "Thangal Bazaar" }, { name: "Paona Bazaar" }, { name: "Lambulane" }] },
      { name: "Bishnupur", localities: [{ name: "Main Market" }] },
      { name: "Thoubal", localities: [{ name: "Thoubal Bazaar" }] },
      { name: "Churachandpur", localities: [{ name: "Tuibong" }] }
    ]
  },
  // 23. Meghalaya
  {
    state: "Meghalaya",
    districts: [
      { name: "East Khasi Hills", localities: [{ name: "Police Bazaar (Shillong)" }, { name: "Laitumkhrah" }, { name: "Laban" }, { name: "Rynjah" }] },
      { name: "West Garo Hills", localities: [{ name: "Tura Market" }] },
      { name: "Ri-Bhoi", localities: [{ name: "Nongpoh" }] },
      { name: "West Jaintia Hills", localities: [{ name: "Jowai Market" }] }
    ]
  },
  // 24. Mizoram
  {
    state: "Mizoram",
    districts: [
      { name: "Aizawl", localities: [{ name: "Zarkawt" }, { name: "Bawngkawn" }, { name: "Khatla" }, { name: "Chanmari" }] },
      { name: "Lunglei", localities: [{ name: "Electric Veng" }] },
      { name: "Champhai", localities: [{ name: "Main Bazaar" }] }
    ]
  },
  // 25. Nagaland
  {
    state: "Nagaland",
    districts: [
      { name: "Kohima", localities: [{ name: "Main Bazaar" }, { name: "PR Hill" }, { name: "High School Junction" }] },
      { name: "Dimapur", localities: [{ name: "NY Market" }, { name: "Hong Kong Market" }, { name: "Circular Road" }] },
      { name: "Mokokchung", localities: [{ name: "Main Market" }] },
      { name: "Wokha", localities: [{ name: "Tsumang Colony" }] }
    ]
  },
  // 26. Odisha
  {
    state: "Odisha",
    districts: [
      { name: "Bhubaneswar", localities: [{ name: "Saheed Nagar" }, { name: "Patia" }, { name: "Jayadev Vihar" }, { name: "Khandagiri" }, { name: "Master Canteen" }, { name: "Nayapalli" }] },
      { name: "Cuttack", localities: [{ name: "Badambadi" }, { name: "Chandi Road" }, { name: "Buxi Bazaar" }] },
      { name: "Rourkela", localities: [{ name: "Civil Township" }, { name: "Sector 5" }, { name: "Main Road" }] },
      { name: "Puri", localities: [{ name: "Grand Road" }, { name: "VIP Road" }, { name: "Sea Beach Road" }] },
      { name: "Sambalpur", localities: [{ name: "VSS Marg" }, { name: "Budharaja" }] },
      { name: "Berhampur", localities: [{ name: "Giri Road" }, { name: "Urban Bank Road" }] },
      { name: "Balasore", localities: [{ name: "OT Road" }] },
      { name: "Bhadrak", localities: [{ name: "By-pass" }] }
    ]
  },
  // 27. Puducherry (UT)
  {
    state: "Puducherry",
    districts: [
      { name: "Puducherry", localities: [{ name: "White Town" }, { name: "Heritage Town" }, { name: "Lawspet" }, { name: "Anna Salai" }] },
      { name: "Karaikal", localities: [{ name: "Church Street" }] },
      { name: "Mahe", localities: [{ name: "Main Town" }] },
      { name: "Yanam", localities: [{ name: "Bazaar Street" }] }
    ]
  },
  // 28. Punjab
  {
    state: "Punjab",
    districts: [
      { name: "Ludhiana", localities: [{ name: "Sarabha Nagar" }, { name: "Model Town" }, { name: "Mall Road" }, { name: "Ferozepur Road" }] },
      { name: "Amritsar", localities: [{ name: "Ranjit Avenue" }, { name: "Mall Road" }, { name: "Lawrence Road" }, { name: "Golden Temple Area" }] },
      { name: "Jalandhar", localities: [{ name: "Model Town" }, { name: "Civil Lines" }, { name: "BMC Chowk" }] },
      { name: "Patiala", localities: [{ name: "Leela Bhawan" }, { name: "Mall Road" }, { name: "Urban Estate" }] },
      { name: "Bathinda", localities: [{ name: "Mall Road" }, { name: "Model Town" }] },
      { name: "Mohali", localities: [{ name: "Phase 7" }, { name: "Sector 70" }, { name: "Phase 3B2" }, { name: "Sector 82" }] },
      { name: "Hoshiarpur", localities: [{ name: "Mall Road" }] },
      { name: "Pathankot", localities: [{ name: "Dalhousie Road" }] },
      { name: "Moga", localities: [{ name: "GT Road" }] }
    ]
  },
  // 29. Rajasthan
  {
    state: "Rajasthan",
    districts: [
      { name: "Jaipur", localities: [{ name: "Malviya Nagar" }, { name: "Vaishali Nagar" }, { name: "C Scheme" }, { name: "Raja Park" }, { name: "Mansarovar" }, { name: "Tonk Road" }, { name: "Johari Bazaar" }] },
      { name: "Jodhpur", localities: [{ name: "Sardarpura" }, { name: "Shastri Nagar" }, { name: "Ratanada" }, { name: "Paota" }] },
      { name: "Kota", localities: [{ name: "Vigyan Nagar" }, { name: "Talwandi" }, { name: "Rajeev Gandhi Nagar" }] },
      { name: "Bikaner", localities: [{ name: "Karni Nagar" }, { name: "Sadul Ganj" }] },
      { name: "Ajmer", localities: [{ name: "Panchsheel Nagar" }, { name: "Vaishali Nagar" }] },
      { name: "Udaipur", localities: [{ name: "Fatehpura" }, { name: "Hiran Magri" }, { name: "Panchwati" }] },
      { name: "Bhilwara", localities: [{ name: "Subhash Nagar" }] },
      { name: "Alwar", localities: [{ name: "Manu Marg" }] },
      { name: "Bharatpur", localities: [{ name: "Ranjeet Nagar" }] },
      { name: "Sikar", localities: [{ name: "Piprali Road" }] }
    ]
  },
  // 30. Sikkim
  {
    state: "Sikkim",
    districts: [
      { name: "Gangtok", localities: [{ name: "MG Marg" }, { name: "Deorali" }, { name: "Tadong" }, { name: "Ranipool" }] },
      { name: "Namchi", localities: [{ name: "Central Park" }] },
      { name: "Geyzing", localities: [{ name: "Main Bazaar" }] },
      { name: "Mangan", localities: [{ name: "Town Centre" }] }
    ]
  },
  // 31. Tamil Nadu
  {
    state: "Tamil Nadu",
    districts: [
      { name: "Chennai", localities: [{ name: "T. Nagar" }, { name: "Anna Nagar" }, { name: "Adyar" }, { name: "Velachery" }, { name: "Nungambakkam" }, { name: "Mylapore" }, { name: "OMR" }, { name: "Porur" }] },
      { name: "Coimbatore", localities: [{ name: "RS Puram" }, { name: "Gandhipuram" }, { name: "Peelamedu" }, { name: "Race Course" }] },
      { name: "Madurai", localities: [{ name: "KK Nagar" }, { name: "Anna Nagar" }, { name: "Simmakkal" }] },
      { name: "Tiruchirappalli", localities: [{ name: "Thillai Nagar" }, { name: "Cantonment" }, { name: "Srirangam" }] },
      { name: "Salem", localities: [{ name: "Fairlands" }, { name: "Hasthampatti" }] },
      { name: "Tiruppur", localities: [{ name: "Avinashi Road" }] },
      { name: "Erode", localities: [{ name: "Perundurai Road" }] },
      { name: "Tirunelveli", localities: [{ name: "Palayamkottai" }] },
      { name: "Vellore", localities: [{ name: "Katpadi" }] },
      { name: "Thoothukudi", localities: [{ name: "Palai Road" }] },
      { name: "Kanyakumari", localities: [{ name: "Nagercoil Town" }] }
    ]
  },
  // 32. Telangana
  {
    state: "Telangana",
    districts: [
      { name: "Hyderabad", localities: [{ name: "Banjara Hills" }, { name: "Jubilee Hills" }, { name: "Gachibowli" }, { name: "Hitec City" }, { name: "Madhapur" }, { name: "Kukatpally" }, { name: "Secunderabad" }, { name: "Kondapur" }] },
      { name: "Warangal", localities: [{ name: "Hanamkonda" }, { name: "Kazipet" }, { name: "Subedari" }] },
      { name: "Nizamabad", localities: [{ name: "Kanteshwar" }, { name: "Pragathi Nagar" }] },
      { name: "Karimnagar", localities: [{ name: "Mukarampura" }] },
      { name: "Khammam", localities: [{ name: "Wyra Road" }] },
      { name: "Ramagundam", localities: [{ name: "NTPC Colony" }] },
      { name: "Mahbubnagar", localities: [{ name: "Clock Tower" }] },
      { name: "Nalgonda", localities: [{ name: "Clock Tower Area" }] }
    ]
  },
  // 33. Tripura
  {
    state: "Tripura",
    districts: [
      { name: "Agartala", localities: [{ name: "Baman Kaman" }, { name: "Akhaura Road" }, { name: "GB Bazaar" }, { name: "Math Chowmuhani" }] },
      { name: "Udaipur", localities: [{ name: "Matabari Area" }] },
      { name: "Dharmanagar", localities: [{ name: "Main Market" }] },
      { name: "Kailashahar", localities: [{ name: "Town Area" }] }
    ]
  },
  // 34. Uttar Pradesh
  {
    state: "Uttar Pradesh",
    districts: [
      { name: "Lucknow", localities: [{ name: "Hazratganj" }, { name: "Gomti Nagar" }, { name: "Indira Nagar" }, { name: "Alambagh" }, { name: "Mahanagar" }, { name: "Janki Puram" }] },
      { name: "Kanpur", localities: [{ name: "Civil Lines" }, { name: "Swaroop Nagar" }, { name: "Kakadeo" }, { name: "Kidwai Nagar" }] },
      { name: "Varanasi", localities: [{ name: "Sigra" }, { name: "Lanka" }, { name: "Bhelupur" }, { name: "Cantonment" }] },
      { name: "Agra", localities: [{ name: "Sanjay Place" }, { name: "Tajganj" }, { name: "Dayalbagh" }, { name: "Kamla Nagar" }] },
      { name: "Meerut", localities: [{ name: "Meerut Main" }, { name: "Begum Bridge" }, { name: "Shastri Nagar" }, { name: "Rajendra Nagar" }] },
      { name: "Prayagraj", localities: [{ name: "Civil Lines" }, { name: "Katra" }, { name: "George Town" }] },
      { name: "Ghaziabad", localities: [{ name: "Indirapuram" }, { name: "Vaishali" }, { name: "Vasundhara" }, { name: "Raj Nagar Extension" }] },
      { name: "Noida", localities: [{ name: "Sector 62" }, { name: "Sector 18" }, { name: "Sector 76" }] },
      { name: "Bareilly", localities: [{ name: "Civil Lines" }] },
      { name: "Aligarh", localities: [{ name: "AMU Market" }] },
      { name: "Moradabad", localities: [{ name: "Civil Lines" }] },
      { name: "Saharanpur", localities: [{ name: "Court Road" }] },
      { name: "Gorakhpur", localities: [{ name: "Golghar" }] },
      { name: "Jhansi", localities: [{ name: "Sadar Bazaar" }] },
      { name: "Mathura", localities: [{ name: "Dampier Nagar" }] },
      { name: "Ayodhya", localities: [{ name: "Civil Lines" }] }
    ]
  },
  // 35. Uttarakhand
  {
    state: "Uttarakhand",
    districts: [
      { name: "Dehradun", localities: [{ name: "Rajpur Road" }, { name: "Clock Tower" }, { name: "Clement Town" }, { name: "Vasant Vihar" }] },
      { name: "Haridwar", localities: [{ name: "Har Ki Pauri" }, { name: "Kankhal" }, { name: "Ranipur" }] },
      { name: "Haldwani", localities: [{ name: "Heera Nagar" }, { name: "Tallital" }] },
      { name: "Roorkee", localities: [{ name: "IIT Campus Area" }, { name: "Civil Lines" }] },
      { name: "Rudrapur", localities: [{ name: "Main Market" }] },
      { name: "Rishikesh", localities: [{ name: "Triveni Ghat" }, { name: "Tapovan" }] },
      { name: "Almora", localities: [{ name: "Mall Road" }] },
      { name: "Pithoragarh", localities: [{ name: "Main Bazaar" }] }
    ]
  },
  // 36. West Bengal
  {
    state: "West Bengal",
    districts: [
      { name: "Kolkata", localities: [{ name: "Park Street" }, { name: "Salt Lake Sector 5" }, { name: "New Town" }, { name: "Ballygunge" }, { name: "Behala" }, { name: "Tollygunge" }, { name: "Alipore" }] },
      { name: "Howrah", localities: [{ name: "Shibpur" }, { name: "Bally" }, { name: "Howrah Station Area" }] },
      { name: "Durgapur", localities: [{ name: "City Centre" }, { name: "Benachity" }] },
      { name: "Asansol", localities: [{ name: "GT Road" }, { name: "Kalyanpur" }] },
      { name: "Siliguri", localities: [{ name: "Sevoke Road" }, { name: "Hill Cart Road" }] },
      { name: "Kharagpur", localities: [{ name: "IIT Area" }] },
      { name: "Bardhaman", localities: [{ name: "Curzon Gate" }] },
      { name: "Malda", localities: [{ name: "English Bazaar" }] },
      { name: "Jalpaiguri", localities: [{ name: "Main Town" }] }
    ]
  }
];

// All 28 States + 8 UTs sorted alphabetically with "Other / Can't find your location?" at the very end
export const STATES = [
  ...LOCATION_DATA.map(item => item.state).sort(),
  OTHER_LOCATION_OPTION
];

export const getDistrictsForState = (stateName, extraDistricts = []) => {
  const safeStateName = typeof stateName === 'object' && stateName !== null
    ? String(stateName.state || stateName.name || '')
    : String(stateName || '');
  if (!safeStateName) return [OTHER_LOCATION_OPTION];

  if (safeStateName === OTHER_LOCATION_OPTION) {
    return [OTHER_LOCATION_OPTION];
  }

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

  staticNames.forEach(name => {
    const update = districtUpdates[name];
    if (update && update.status === 'Disabled') return;
    resultMap.set(name.toLowerCase(), name);
  });

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

  if (Array.isArray(extraDistricts)) {
    extraDistricts.forEach(d => {
      if (!d || d === OTHER_LOCATION_OPTION) return;
      const dName = typeof d === 'object' ? d.name : String(d);
      const dState = typeof d === 'object' ? (d.state_name || d.state || '') : '';
      if (dName && (!dState || dState.toLowerCase() === safeStateName.toLowerCase())) {
        const update = districtUpdates[dName];
        if (!update || update.status !== 'Disabled') {
          resultMap.set(dName.toLowerCase(), dName);
        }
      }
    });
  } else if (typeof extraDistricts === 'string' && extraDistricts.trim() && extraDistricts !== OTHER_LOCATION_OPTION) {
    resultMap.set(extraDistricts.trim().toLowerCase(), extraDistricts.trim());
  }

  const sortedDistricts = Array.from(resultMap.values()).sort();
  return [...sortedDistricts, OTHER_LOCATION_OPTION];
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

  if (!safeDistrictName || safeDistrictName === OTHER_LOCATION_OPTION) {
    return [{ name: OTHER_LOCATION_OPTION }];
  }

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

  let localitiesList = Array.from(resultMap.values());
  if (localitiesList.length === 0) {
    localitiesList = [
      { name: `${safeDistrictName} Main`, pincode: "800001", lat: null, lng: null },
      { name: "Central Market", pincode: "800001", lat: null, lng: null },
      { name: "Civil Lines", pincode: "800002", lat: null, lng: null },
      { name: "Station Road", pincode: "800003", lat: null, lng: null }
    ];
  }

  // Always append OTHER_LOCATION_OPTION at the very end
  return [...localitiesList, { name: OTHER_LOCATION_OPTION }];
};
