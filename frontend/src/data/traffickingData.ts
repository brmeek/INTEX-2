export interface ProvinceData {
  name: string;
  region: string;
  riskScore: number;
  reportedIncidents: number;
  serviceGaps: number;
  population: number;
  lat: number;
  lng: number;
}

export interface SafehouseMapEntry {
  id: number;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  capacity: number;
  occupancy: number;
  status: string;
}

export const PROVINCE_DATA: ProvinceData[] = [
  // NCR & Central Luzon
  { name: "Metro Manila", region: "NCR", riskScore: 92, reportedIncidents: 487, serviceGaps: 28, population: 13484462, lat: 14.5995, lng: 120.9842 },
  { name: "Bulacan", region: "Central Luzon", riskScore: 68, reportedIncidents: 134, serviceGaps: 52, population: 3708890, lat: 14.8527, lng: 120.8160 },
  { name: "Pampanga", region: "Central Luzon", riskScore: 72, reportedIncidents: 156, serviceGaps: 45, population: 2340585, lat: 15.0429, lng: 120.6881 },
  { name: "Tarlac", region: "Central Luzon", riskScore: 55, reportedIncidents: 67, serviceGaps: 64, population: 1366027, lat: 15.4445, lng: 120.5853 },
  { name: "Zambales", region: "Central Luzon", riskScore: 61, reportedIncidents: 88, serviceGaps: 71, population: 603047, lat: 15.5081, lng: 120.0694 },
  { name: "Nueva Ecija", region: "Central Luzon", riskScore: 58, reportedIncidents: 79, serviceGaps: 62, population: 2310134, lat: 15.5784, lng: 121.1113 },
  { name: "Bataan", region: "Central Luzon", riskScore: 47, reportedIncidents: 42, serviceGaps: 55, population: 829600, lat: 14.6417, lng: 120.4818 },
  { name: "Aurora", region: "Central Luzon", riskScore: 39, reportedIncidents: 21, serviceGaps: 82, population: 234083, lat: 15.9900, lng: 121.6324 },

  // CALABARZON
  { name: "Cavite", region: "CALABARZON", riskScore: 78, reportedIncidents: 213, serviceGaps: 38, population: 4344829, lat: 14.2456, lng: 120.8783 },
  { name: "Laguna", region: "CALABARZON", riskScore: 71, reportedIncidents: 178, serviceGaps: 41, population: 3382193, lat: 14.2691, lng: 121.4113 },
  { name: "Batangas", region: "CALABARZON", riskScore: 64, reportedIncidents: 121, serviceGaps: 48, population: 2908494, lat: 13.7565, lng: 121.0583 },
  { name: "Rizal", region: "CALABARZON", riskScore: 75, reportedIncidents: 195, serviceGaps: 35, population: 3330143, lat: 14.6037, lng: 121.3084 },
  { name: "Quezon", region: "CALABARZON", riskScore: 56, reportedIncidents: 89, serviceGaps: 67, population: 2122463, lat: 14.0313, lng: 122.1108 },

  // Ilocos Region
  { name: "Pangasinan", region: "Ilocos Region", riskScore: 52, reportedIncidents: 73, serviceGaps: 58, population: 3163190, lat: 15.8949, lng: 120.2863 },
  { name: "La Union", region: "Ilocos Region", riskScore: 44, reportedIncidents: 38, serviceGaps: 63, population: 822352, lat: 16.6159, lng: 120.3209 },
  { name: "Ilocos Sur", region: "Ilocos Region", riskScore: 41, reportedIncidents: 29, serviceGaps: 69, population: 729775, lat: 17.1477, lng: 120.3855 },
  { name: "Ilocos Norte", region: "Ilocos Region", riskScore: 38, reportedIncidents: 22, serviceGaps: 72, population: 609588, lat: 18.1647, lng: 120.7116 },

  // Cagayan Valley
  { name: "Cagayan", region: "Cagayan Valley", riskScore: 49, reportedIncidents: 57, serviceGaps: 74, population: 1268603, lat: 17.6132, lng: 121.7270 },
  { name: "Isabela", region: "Cagayan Valley", riskScore: 53, reportedIncidents: 68, serviceGaps: 70, population: 1697050, lat: 16.9754, lng: 121.8107 },
  { name: "Nueva Vizcaya", region: "Cagayan Valley", riskScore: 36, reportedIncidents: 18, serviceGaps: 78, population: 480789, lat: 16.3301, lng: 121.1710 },

  // CAR
  { name: "Benguet", region: "CAR", riskScore: 42, reportedIncidents: 35, serviceGaps: 66, population: 460683, lat: 16.4023, lng: 120.5960 },
  { name: "Mountain Province", region: "CAR", riskScore: 31, reportedIncidents: 12, serviceGaps: 85, population: 162809, lat: 17.0847, lng: 121.1111 },
  { name: "Ifugao", region: "CAR", riskScore: 28, reportedIncidents: 9, serviceGaps: 88, population: 207030, lat: 16.8311, lng: 121.1710 },

  // Bicol Region
  { name: "Albay", region: "Bicol Region", riskScore: 59, reportedIncidents: 92, serviceGaps: 56, population: 1374768, lat: 13.1391, lng: 123.7271 },
  { name: "Camarines Sur", region: "Bicol Region", riskScore: 63, reportedIncidents: 108, serviceGaps: 53, population: 2068244, lat: 13.5250, lng: 123.3486 },
  { name: "Sorsogon", region: "Bicol Region", riskScore: 51, reportedIncidents: 61, serviceGaps: 65, population: 828599, lat: 12.9942, lng: 124.0145 },
  { name: "Masbate", region: "Bicol Region", riskScore: 57, reportedIncidents: 78, serviceGaps: 79, population: 936553, lat: 12.3565, lng: 123.5504 },

  // MIMAROPA
  { name: "Palawan", region: "MIMAROPA", riskScore: 66, reportedIncidents: 127, serviceGaps: 73, population: 994340, lat: 9.8349, lng: 118.7384 },
  { name: "Oriental Mindoro", region: "MIMAROPA", riskScore: 54, reportedIncidents: 71, serviceGaps: 68, population: 879275, lat: 12.9867, lng: 121.4076 },
  { name: "Occidental Mindoro", region: "MIMAROPA", riskScore: 48, reportedIncidents: 44, serviceGaps: 76, population: 522354, lat: 12.7506, lng: 120.9940 },

  // Western Visayas
  { name: "Iloilo", region: "Western Visayas", riskScore: 67, reportedIncidents: 131, serviceGaps: 44, population: 1936423, lat: 10.7202, lng: 122.5621 },
  { name: "Negros Occidental", region: "Western Visayas", riskScore: 73, reportedIncidents: 168, serviceGaps: 49, population: 3084022, lat: 10.0000, lng: 122.5500 },
  { name: "Capiz", region: "Western Visayas", riskScore: 45, reportedIncidents: 37, serviceGaps: 61, population: 807226, lat: 11.5500, lng: 122.6309 },
  { name: "Antique", region: "Western Visayas", riskScore: 43, reportedIncidents: 33, serviceGaps: 72, population: 582015, lat: 11.3680, lng: 121.9464 },

  // Central Visayas
  { name: "Cebu", region: "Central Visayas", riskScore: 82, reportedIncidents: 298, serviceGaps: 32, population: 5022110, lat: 10.3157, lng: 123.8854 },
  { name: "Bohol", region: "Central Visayas", riskScore: 51, reportedIncidents: 63, serviceGaps: 59, population: 1394329, lat: 9.8500, lng: 124.0000 },
  { name: "Negros Oriental", region: "Central Visayas", riskScore: 58, reportedIncidents: 82, serviceGaps: 55, population: 1432990, lat: 9.6168, lng: 123.0107 },

  // Eastern Visayas
  { name: "Leyte", region: "Eastern Visayas", riskScore: 62, reportedIncidents: 104, serviceGaps: 63, population: 1998950, lat: 10.4167, lng: 124.9530 },
  { name: "Samar", region: "Eastern Visayas", riskScore: 55, reportedIncidents: 72, serviceGaps: 77, population: 815560, lat: 11.5833, lng: 124.9500 },
  { name: "Eastern Samar", region: "Eastern Visayas", riskScore: 48, reportedIncidents: 47, serviceGaps: 83, population: 490898, lat: 11.5000, lng: 125.5000 },

  // Zamboanga Peninsula
  { name: "Zamboanga del Sur", region: "Zamboanga Peninsula", riskScore: 70, reportedIncidents: 143, serviceGaps: 61, population: 1057458, lat: 7.8383, lng: 123.2967 },
  { name: "Zamboanga del Norte", region: "Zamboanga Peninsula", riskScore: 65, reportedIncidents: 118, serviceGaps: 68, population: 1047000, lat: 8.1541, lng: 122.9462 },
  { name: "Zamboanga City", region: "Zamboanga Peninsula", riskScore: 76, reportedIncidents: 187, serviceGaps: 42, population: 977234, lat: 6.9214, lng: 122.0790 },

  // Northern Mindanao
  { name: "Misamis Oriental", region: "Northern Mindanao", riskScore: 69, reportedIncidents: 138, serviceGaps: 46, population: 934800, lat: 8.5046, lng: 124.6220 },
  { name: "Bukidnon", region: "Northern Mindanao", riskScore: 56, reportedIncidents: 76, serviceGaps: 64, population: 1415226, lat: 8.0515, lng: 125.0990 },
  { name: "Lanao del Norte", region: "Northern Mindanao", riskScore: 63, reportedIncidents: 109, serviceGaps: 69, population: 690641, lat: 8.0775, lng: 123.8857 },

  // Davao Region
  { name: "Davao del Sur", region: "Davao Region", riskScore: 74, reportedIncidents: 176, serviceGaps: 37, population: 668800, lat: 6.7656, lng: 125.3284 },
  { name: "Davao City", region: "Davao Region", riskScore: 81, reportedIncidents: 276, serviceGaps: 29, population: 1776949, lat: 7.1907, lng: 125.4553 },
  { name: "Davao del Norte", region: "Davao Region", riskScore: 62, reportedIncidents: 101, serviceGaps: 51, population: 1117900, lat: 7.5622, lng: 125.6551 },
  { name: "Davao Oriental", region: "Davao Region", riskScore: 53, reportedIncidents: 66, serviceGaps: 75, population: 576021, lat: 7.3172, lng: 126.1785 },

  // SOCCSKSARGEN
  { name: "South Cotabato", region: "SOCCSKSARGEN", riskScore: 64, reportedIncidents: 114, serviceGaps: 54, population: 959455, lat: 6.2969, lng: 124.8537 },
  { name: "General Santos", region: "SOCCSKSARGEN", riskScore: 77, reportedIncidents: 192, serviceGaps: 39, population: 697315, lat: 6.1164, lng: 125.1716 },
  { name: "Sultan Kudarat", region: "SOCCSKSARGEN", riskScore: 59, reportedIncidents: 84, serviceGaps: 71, population: 811424, lat: 6.5069, lng: 124.4198 },
  { name: "Sarangani", region: "SOCCSKSARGEN", riskScore: 52, reportedIncidents: 63, serviceGaps: 76, population: 544261, lat: 5.9261, lng: 125.2875 },

  // Caraga
  { name: "Agusan del Norte", region: "Caraga", riskScore: 57, reportedIncidents: 79, serviceGaps: 62, population: 381376, lat: 8.9456, lng: 125.5319 },
  { name: "Surigao del Norte", region: "Caraga", riskScore: 54, reportedIncidents: 69, serviceGaps: 67, population: 541000, lat: 9.7894, lng: 125.4948 },
  { name: "Agusan del Sur", region: "Caraga", riskScore: 50, reportedIncidents: 56, serviceGaps: 74, population: 700653, lat: 8.5000, lng: 125.9500 },
  { name: "Surigao del Sur", region: "Caraga", riskScore: 46, reportedIncidents: 41, serviceGaps: 78, population: 624400, lat: 8.7500, lng: 126.1500 },

  // BARMM
  { name: "Maguindanao", region: "BARMM", riskScore: 85, reportedIncidents: 312, serviceGaps: 81, population: 1173933, lat: 6.9423, lng: 124.2920 },
  { name: "Lanao del Sur", region: "BARMM", riskScore: 83, reportedIncidents: 287, serviceGaps: 78, population: 1160700, lat: 7.8233, lng: 124.4356 },
  { name: "Basilan", region: "BARMM", riskScore: 79, reportedIncidents: 221, serviceGaps: 84, population: 383200, lat: 6.4221, lng: 121.9690 },
  { name: "Sulu", region: "BARMM", riskScore: 88, reportedIncidents: 341, serviceGaps: 91, population: 900000, lat: 6.0474, lng: 121.0028 },
  { name: "Tawi-Tawi", region: "BARMM", riskScore: 86, reportedIncidents: 298, serviceGaps: 93, population: 420000, lat: 5.1339, lng: 119.9500 },
];

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Manila": { lat: 14.5995, lng: 120.9842 },
  "Quezon City": { lat: 14.6760, lng: 121.0437 },
  "Makati": { lat: 14.5547, lng: 121.0244 },
  "Cebu City": { lat: 10.3157, lng: 123.8854 },
  "Cebu": { lat: 10.3157, lng: 123.8854 },
  "Davao City": { lat: 7.1907, lng: 125.4553 },
  "Davao": { lat: 7.1907, lng: 125.4553 },
  "Zamboanga City": { lat: 6.9214, lng: 122.0790 },
  "Zamboanga": { lat: 6.9214, lng: 122.0790 },
  "General Santos": { lat: 6.1164, lng: 125.1716 },
  "GenSan": { lat: 6.1164, lng: 125.1716 },
  "Cagayan de Oro": { lat: 8.4542, lng: 124.6319 },
  "CDO": { lat: 8.4542, lng: 124.6319 },
  "Iloilo City": { lat: 10.6920, lng: 122.5722 },
  "Iloilo": { lat: 10.6920, lng: 122.5722 },
  "Bacolod": { lat: 10.6840, lng: 122.9586 },
  "Tacloban": { lat: 11.2543, lng: 124.9600 },
  "Angeles": { lat: 15.1682, lng: 120.5867 },
  "Olongapo": { lat: 14.8386, lng: 120.2842 },
  "Baguio": { lat: 16.4023, lng: 120.5960 },
  "Butuan": { lat: 8.9475, lng: 125.5406 },
  "Cotabato City": { lat: 7.2047, lng: 124.2310 },
  "Cotabato": { lat: 7.2047, lng: 124.2310 },
  "Tuguegarao": { lat: 17.6132, lng: 121.7270 },
  "Legazpi": { lat: 13.1391, lng: 123.7438 },
  "Naga": { lat: 13.6192, lng: 123.1814 },
  "Puerto Princesa": { lat: 9.7392, lng: 118.7353 },
  "Dumaguete": { lat: 9.3075, lng: 123.3080 },
  "Tagbilaran": { lat: 9.6540, lng: 123.8513 },
  "Pagadian": { lat: 7.8262, lng: 123.4370 },
  "Dipolog": { lat: 8.5878, lng: 123.3404 },
  "San Fernando": { lat: 16.6159, lng: 120.3209 },
  "Laoag": { lat: 18.1647, lng: 120.5936 },
  "Vigan": { lat: 17.5747, lng: 120.3869 },
  "Calamba": { lat: 14.2114, lng: 121.1653 },
  "Antipolo": { lat: 14.5862, lng: 121.1761 },
  "Taguig": { lat: 14.5176, lng: 121.0509 },
  "Pasig": { lat: 14.5764, lng: 121.0851 },
  "Marikina": { lat: 14.6507, lng: 121.1029 },
  "Mandaluyong": { lat: 14.5794, lng: 121.0359 },
  "San Jose del Monte": { lat: 14.8139, lng: 121.0452 },
  "Malolos": { lat: 14.8433, lng: 120.8114 },
  "Cabanatuan": { lat: 15.4869, lng: 120.9740 },
  "Iligan": { lat: 8.2281, lng: 124.2452 },
  "Marawi": { lat: 8.0019, lng: 124.2878 },
  "Koronadal": { lat: 6.5022, lng: 124.8476 },
  "Kidapawan": { lat: 7.0084, lng: 125.0894 },
};

export const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Luzon": { lat: 15.0, lng: 121.0 },
  "Visayas": { lat: 10.5, lng: 123.5 },
  "Mindanao": { lat: 7.5, lng: 124.5 },
  "NCR": { lat: 14.5995, lng: 120.9842 },
  "CAR": { lat: 16.4023, lng: 120.5960 },
  "Central Luzon": { lat: 15.2, lng: 120.7 },
  "CALABARZON": { lat: 14.1, lng: 121.3 },
  "MIMAROPA": { lat: 12.0, lng: 121.0 },
  "Bicol Region": { lat: 13.2, lng: 123.6 },
  "Ilocos Region": { lat: 16.5, lng: 120.4 },
  "Cagayan Valley": { lat: 17.0, lng: 121.8 },
  "Western Visayas": { lat: 10.7, lng: 122.5 },
  "Central Visayas": { lat: 10.0, lng: 123.8 },
  "Eastern Visayas": { lat: 11.0, lng: 125.0 },
  "Zamboanga Peninsula": { lat: 7.5, lng: 122.5 },
  "Northern Mindanao": { lat: 8.3, lng: 124.6 },
  "Davao Region": { lat: 7.2, lng: 125.5 },
  "SOCCSKSARGEN": { lat: 6.3, lng: 124.8 },
  "Caraga": { lat: 8.8, lng: 125.7 },
  "BARMM": { lat: 6.5, lng: 122.0 },
};

export function getRiskColor(score: number): string {
  if (score >= 80) return "#991b1b";
  if (score >= 65) return "#dc2626";
  if (score >= 50) return "#f97316";
  if (score >= 35) return "#facc15";
  return "#22c55e";
}

export function getRiskLabel(score: number): string {
  if (score >= 80) return "Critical";
  if (score >= 65) return "High";
  if (score >= 50) return "Moderate";
  if (score >= 35) return "Low";
  return "Minimal";
}

export function getServiceGapColor(score: number): string {
  if (score >= 80) return "#7c2d12";
  if (score >= 65) return "#c2410c";
  if (score >= 50) return "#ea580c";
  if (score >= 35) return "#fb923c";
  return "#86efac";
}
