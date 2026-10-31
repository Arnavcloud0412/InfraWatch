/** Approximate administrative-centre coordinates for map orientation. Not project survey points. */
export const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  "Mumbai City": [18.9388, 72.8354],
  "Mumbai Suburban": [19.1136, 72.8697],
  Mumbai: [19.076, 72.8777],
  Thane: [19.2183, 72.9781],
  Palghar: [19.6967, 72.7654],
  Raigad: [18.5158, 73.1822],
  Ratnagiri: [16.9902, 73.312],
  Sindhudurg: [16.1667, 73.55],
  Pune: [18.5204, 73.8567],
  Satara: [17.6805, 74.0183],
  Sangli: [16.8524, 74.5815],
  Kolhapur: [16.705, 74.2433],
  Solapur: [17.6599, 75.9064],
  Nashik: [19.9975, 73.7898],
  Ahilyanagar: [19.0952, 74.7496],
  Dhule: [20.9042, 74.7749],
  Nandurbar: [21.3701, 74.2405],
  Jalgaon: [21.0077, 75.5626],
  "Chhatrapati Sambhajinagar": [19.8762, 75.3433],
  Jalna: [19.841, 75.8864],
  Beed: [18.9891, 75.7601],
  Latur: [18.4088, 76.5604],
  Dharashiv: [18.1861, 76.0419],
  Nanded: [19.1383, 77.321],
  Parbhani: [19.2704, 76.7601],
  Hingoli: [19.7174, 77.1494],
  Akola: [20.7002, 77.0082],
  Washim: [20.111, 77.133],
  Amravati: [20.9374, 77.7796],
  Buldhana: [20.5293, 76.1842],
  Yavatmal: [20.3888, 78.1204],
  Wardha: [20.7453, 78.6022],
  Nagpur: [21.1458, 79.0882],
  Bhandara: [21.17, 79.65],
  Gondia: [21.4549, 80.1961],
  Chandrapur: [19.9615, 79.2961],
  Gadchiroli: [20.18, 80.0],
};

const ALIASES: Record<string, string> = {
  aurangabad: "Chhatrapati Sambhajinagar",
  sambhajinagar: "Chhatrapati Sambhajinagar",
  osmanabad: "Dharashiv",
  ahmednagar: "Ahilyanagar",
  ahmadnagar: "Ahilyanagar",
  bombay: "Mumbai",
};

export function canonicalDistrict(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const alias = ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  const match = Object.keys(DISTRICT_CENTROIDS).find((name) => name.toLowerCase() === trimmed.toLowerCase());
  return match ?? trimmed;
}

export function centroidFor(district: string | null | undefined): { latitude: number; longitude: number } | null {
  const name = canonicalDistrict(district);
  if (!name) return null;
  const point = DISTRICT_CENTROIDS[name];
  if (!point) return null;
  return { latitude: point[0], longitude: point[1] };
}

export const FILTER_DISTRICTS = Object.keys(DISTRICT_CENTROIDS)
  .filter((name) => name !== "Mumbai")
  .sort((a, b) => a.localeCompare(b));
