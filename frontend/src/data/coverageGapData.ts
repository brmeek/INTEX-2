import {
  PROVINCE_DATA,
  REGION_COORDINATES,
  REGION_TO_ZONE,
  ALL_PROVINCES,
  type ProvinceData,
} from "./traffickingData";

export interface CoverageGap {
  region: string;
  lat: number;
  lng: number;
  avgRiskScore: number;
  avgServiceGap: number;
  totalIncidents: number;
  totalPopulation: number;
  provinces: ProvinceData[];
  uncoveredProvinceCount: number;
  totalProvinceCount: number;
  estimatedCostUsd: number;
  priorityTier: "critical" | "high" | "moderate";
}

const COST_PER_CAPACITY_SLOT = 850;
const BASE_SAFEHOUSE_CAPACITY = 20;

function estimateCost(population: number): number {
  const scale = population > 2_000_000 ? 1.4 : population > 1_000_000 ? 1.2 : 1.0;
  return Math.round(BASE_SAFEHOUSE_CAPACITY * COST_PER_CAPACITY_SLOT * scale);
}

function priorityTier(avgRisk: number, avgGap: number): CoverageGap["priorityTier"] {
  const composite = avgRisk * 0.6 + avgGap * 0.4;
  if (composite >= 70) return "critical";
  if (composite >= 55) return "high";
  return "moderate";
}

/**
 * Accepts a set of covered **province names** (not zones).
 * Groups uncovered PROVINCE_DATA entries by zone to produce gap summaries.
 */
export function computeCoverageGaps(coveredProvinces: Set<string>): CoverageGap[] {
  const zoneMap = new Map<string, ProvinceData[]>();
  for (const p of PROVINCE_DATA) {
    if (coveredProvinces.has(p.name)) continue;
    const zone = REGION_TO_ZONE[p.region] ?? p.region;
    const list = zoneMap.get(zone) ?? [];
    list.push(p);
    zoneMap.set(zone, list);
  }

  const zoneProvinceCounts = new Map<string, { total: number; uncovered: number }>();
  for (const prov of ALL_PROVINCES) {
    const entry = zoneProvinceCounts.get(prov.zone) ?? { total: 0, uncovered: 0 };
    entry.total++;
    if (!coveredProvinces.has(prov.name)) entry.uncovered++;
    zoneProvinceCounts.set(prov.zone, entry);
  }

  const gaps: CoverageGap[] = [];
  for (const [zone, provinces] of zoneMap) {
    const coords = REGION_COORDINATES[zone] ?? { lat: 12.5, lng: 122 };
    const avgRiskScore = Math.round(provinces.reduce((s, p) => s + p.riskScore, 0) / provinces.length);
    const avgServiceGap = Math.round(provinces.reduce((s, p) => s + p.serviceGaps, 0) / provinces.length);
    const totalIncidents = provinces.reduce((s, p) => s + p.reportedIncidents, 0);
    const totalPopulation = provinces.reduce((s, p) => s + p.population, 0);
    const counts = zoneProvinceCounts.get(zone) ?? { total: 0, uncovered: 0 };

    gaps.push({
      region: zone,
      lat: coords.lat,
      lng: coords.lng,
      avgRiskScore,
      avgServiceGap,
      totalIncidents,
      totalPopulation,
      provinces,
      uncoveredProvinceCount: counts.uncovered,
      totalProvinceCount: counts.total,
      estimatedCostUsd: estimateCost(totalPopulation),
      priorityTier: priorityTier(avgRiskScore, avgServiceGap),
    });
  }

  return gaps.sort((a, b) => {
    const order = { critical: 0, high: 1, moderate: 2 };
    return order[a.priorityTier] - order[b.priorityTier] || b.avgRiskScore - a.avgRiskScore;
  });
}

export const TIER_COLORS: Record<CoverageGap["priorityTier"], string> = {
  critical: "#dc2626",
  high: "#f97316",
  moderate: "#facc15",
};

export const TIER_LABELS: Record<CoverageGap["priorityTier"], string> = {
  critical: "Critical Priority",
  high: "High Priority",
  moderate: "Moderate Priority",
};
