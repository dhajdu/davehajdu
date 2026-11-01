// Built-in airport reference for trip building. Pure data, no imports, so the
// test script can load it with `node --experimental-strip-types`.
// Airports missing from this map are not guessed: a leg that uses one goes to
// review_queue (unless a places row with that IATA already exists).

export interface AirportInfo {
  city: string;
  country: string;
  tz: string;
  lat: number;
  lng: number;
}

const A = (city: string, country: string, tz: string, lat: number, lng: number): AirportInfo => ({
  city,
  country,
  tz,
  lat,
  lng,
});

export const AIRPORTS: Record<string, AirportInfo> = {
  // Vietnam
  SGN: A('Ho Chi Minh City', 'Vietnam', 'Asia/Ho_Chi_Minh', 10.8188, 106.6519),
  HAN: A('Hanoi', 'Vietnam', 'Asia/Ho_Chi_Minh', 21.2212, 105.8072),
  DAD: A('Da Nang', 'Vietnam', 'Asia/Ho_Chi_Minh', 16.0439, 108.1994),
  CXR: A('Nha Trang', 'Vietnam', 'Asia/Ho_Chi_Minh', 11.9982, 109.2194),
  PQC: A('Phu Quoc', 'Vietnam', 'Asia/Ho_Chi_Minh', 10.1698, 103.9931),
  HPH: A('Hai Phong', 'Vietnam', 'Asia/Ho_Chi_Minh', 20.8194, 106.7247),
  DLI: A('Da Lat', 'Vietnam', 'Asia/Ho_Chi_Minh', 11.75, 108.3667),
  HUI: A('Hue', 'Vietnam', 'Asia/Ho_Chi_Minh', 16.4015, 107.7026),
  VCA: A('Can Tho', 'Vietnam', 'Asia/Ho_Chi_Minh', 10.0851, 105.7119),
  // Rest of Southeast Asia
  BKK: A('Bangkok', 'Thailand', 'Asia/Bangkok', 13.69, 100.7501),
  DMK: A('Bangkok', 'Thailand', 'Asia/Bangkok', 13.9126, 100.6068),
  HKT: A('Phuket', 'Thailand', 'Asia/Bangkok', 8.1132, 98.3169),
  CNX: A('Chiang Mai', 'Thailand', 'Asia/Bangkok', 18.7668, 98.9626),
  USM: A('Koh Samui', 'Thailand', 'Asia/Bangkok', 9.5478, 100.0623),
  SIN: A('Singapore', 'Singapore', 'Asia/Singapore', 1.3644, 103.9915),
  KUL: A('Kuala Lumpur', 'Malaysia', 'Asia/Kuala_Lumpur', 2.7456, 101.7099),
  PEN: A('Penang', 'Malaysia', 'Asia/Kuala_Lumpur', 5.2971, 100.2769),
  CGK: A('Jakarta', 'Indonesia', 'Asia/Jakarta', -6.1256, 106.6559),
  DPS: A('Bali', 'Indonesia', 'Asia/Makassar', -8.7482, 115.1672),
  MNL: A('Manila', 'Philippines', 'Asia/Manila', 14.5086, 121.0194),
  CEB: A('Cebu', 'Philippines', 'Asia/Manila', 10.3075, 123.9794),
  PNH: A('Phnom Penh', 'Cambodia', 'Asia/Phnom_Penh', 11.5466, 104.8441),
  KTI: A('Phnom Penh', 'Cambodia', 'Asia/Phnom_Penh', 11.38, 104.93),
  REP: A('Siem Reap', 'Cambodia', 'Asia/Phnom_Penh', 13.4107, 103.8128),
  RGN: A('Yangon', 'Myanmar', 'Asia/Yangon', 16.9073, 96.1332),
  VTE: A('Vientiane', 'Laos', 'Asia/Vientiane', 17.9883, 102.5633),
  LPQ: A('Luang Prabang', 'Laos', 'Asia/Vientiane', 19.8973, 102.1608),
  // East and South Asia
  HKG: A('Hong Kong', 'Hong Kong', 'Asia/Hong_Kong', 22.308, 113.9185),
  MFM: A('Macau', 'Macau', 'Asia/Macau', 22.1496, 113.5925),
  TPE: A('Taipei', 'Taiwan', 'Asia/Taipei', 25.0797, 121.2342),
  ICN: A('Seoul', 'South Korea', 'Asia/Seoul', 37.4602, 126.4407),
  NRT: A('Tokyo', 'Japan', 'Asia/Tokyo', 35.772, 140.3929),
  HND: A('Tokyo', 'Japan', 'Asia/Tokyo', 35.5494, 139.7798),
  KIX: A('Osaka', 'Japan', 'Asia/Tokyo', 34.4347, 135.244),
  PVG: A('Shanghai', 'China', 'Asia/Shanghai', 31.1443, 121.8083),
  PEK: A('Beijing', 'China', 'Asia/Shanghai', 40.0799, 116.6031),
  CAN: A('Guangzhou', 'China', 'Asia/Shanghai', 23.3924, 113.2988),
  SZX: A('Shenzhen', 'China', 'Asia/Shanghai', 22.6393, 113.8107),
  DEL: A('Delhi', 'India', 'Asia/Kolkata', 28.5562, 77.1),
  BOM: A('Mumbai', 'India', 'Asia/Kolkata', 19.0896, 72.8656),
  CMB: A('Colombo', 'Sri Lanka', 'Asia/Colombo', 7.1808, 79.8841),
  // Australia and New Zealand
  SYD: A('Sydney', 'Australia', 'Australia/Sydney', -33.9399, 151.1753),
  MEL: A('Melbourne', 'Australia', 'Australia/Melbourne', -37.669, 144.841),
  BNE: A('Brisbane', 'Australia', 'Australia/Brisbane', -27.3842, 153.1175),
  PER: A('Perth', 'Australia', 'Australia/Perth', -31.9385, 115.9672),
  ADL: A('Adelaide', 'Australia', 'Australia/Adelaide', -34.945, 138.5306),
  OOL: A('Gold Coast', 'Australia', 'Australia/Brisbane', -28.1644, 153.5047),
  CNS: A('Cairns', 'Australia', 'Australia/Brisbane', -16.8858, 145.7553),
  AKL: A('Auckland', 'New Zealand', 'Pacific/Auckland', -37.0082, 174.785),
  // Middle East
  DOH: A('Doha', 'Qatar', 'Asia/Qatar', 25.2731, 51.6081),
  DXB: A('Dubai', 'United Arab Emirates', 'Asia/Dubai', 25.2532, 55.3657),
  AUH: A('Abu Dhabi', 'United Arab Emirates', 'Asia/Dubai', 24.433, 54.6511),
  IST: A('Istanbul', 'Turkey', 'Europe/Istanbul', 41.2753, 28.7519),
  // Europe
  LHR: A('London', 'United Kingdom', 'Europe/London', 51.47, -0.4543),
  LGW: A('London', 'United Kingdom', 'Europe/London', 51.1537, -0.1821),
  CDG: A('Paris', 'France', 'Europe/Paris', 49.0097, 2.5479),
  AMS: A('Amsterdam', 'Netherlands', 'Europe/Amsterdam', 52.3105, 4.7683),
  FRA: A('Frankfurt', 'Germany', 'Europe/Berlin', 50.0379, 8.5622),
  MUC: A('Munich', 'Germany', 'Europe/Berlin', 48.3537, 11.775),
  ZRH: A('Zurich', 'Switzerland', 'Europe/Zurich', 47.4582, 8.5555),
  FCO: A('Rome', 'Italy', 'Europe/Rome', 41.8003, 12.2389),
  MXP: A('Milan', 'Italy', 'Europe/Rome', 45.6306, 8.7281),
  BCN: A('Barcelona', 'Spain', 'Europe/Madrid', 41.2974, 2.0833),
  MAD: A('Madrid', 'Spain', 'Europe/Madrid', 40.4983, -3.5676),
  LIS: A('Lisbon', 'Portugal', 'Europe/Lisbon', 38.7813, -9.1359),
  DUB: A('Dublin', 'Ireland', 'Europe/Dublin', 53.4264, -6.2499),
  CPH: A('Copenhagen', 'Denmark', 'Europe/Copenhagen', 55.618, 12.656),
  VIE: A('Vienna', 'Austria', 'Europe/Vienna', 48.1103, 16.5697),
  PRG: A('Prague', 'Czech Republic', 'Europe/Prague', 50.1008, 14.26),
  BUD: A('Budapest', 'Hungary', 'Europe/Budapest', 47.4398, 19.2611),
  // North America
  SFO: A('San Francisco', 'United States', 'America/Los_Angeles', 37.6213, -122.379),
  LAX: A('Los Angeles', 'United States', 'America/Los_Angeles', 33.9416, -118.4085),
  SEA: A('Seattle', 'United States', 'America/Los_Angeles', 47.4502, -122.3088),
  LAS: A('Las Vegas', 'United States', 'America/Los_Angeles', 36.084, -115.1537),
  DEN: A('Denver', 'United States', 'America/Denver', 39.8561, -104.6737),
  ORD: A('Chicago', 'United States', 'America/Chicago', 41.9742, -87.9073),
  DFW: A('Dallas', 'United States', 'America/Chicago', 32.8998, -97.0403),
  ATL: A('Atlanta', 'United States', 'America/New_York', 33.6407, -84.4277),
  MIA: A('Miami', 'United States', 'America/New_York', 25.7959, -80.287),
  IAD: A('Washington', 'United States', 'America/New_York', 38.9531, -77.4565),
  JFK: A('New York', 'United States', 'America/New_York', 40.6413, -73.7781),
  EWR: A('New York', 'United States', 'America/New_York', 40.6895, -74.1745),
  BOS: A('Boston', 'United States', 'America/New_York', 42.3656, -71.0096),
  HNL: A('Honolulu', 'United States', 'Pacific/Honolulu', 21.3187, -157.9225),
  YVR: A('Vancouver', 'Canada', 'America/Vancouver', 49.1967, -123.1815),
};

export function airportInfo(iata: string | null | undefined): AirportInfo | null {
  if (!iata) return null;
  return AIRPORTS[iata.trim().toUpperCase()] ?? null;
}
