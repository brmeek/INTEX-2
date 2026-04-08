import { PROVINCE_DATA, REGION_COORDINATES, type ProvinceData } from "./traffickingData";

export interface CoverageGap {
  region: string;
  lat: number;
  lng: number;
  avgRiskScore: number;
  avgServiceGap: number;
  totalIncidents: number;
  totalPopulation: number;
  provinces: ProvinceData[];
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

export function computeCoverageGaps(coveredRegions: Set<string>): CoverageGap[] {
  const regionMap = new Map<string, ProvinceData[]>();
  for (const p of PROVINCE_DATA) {
    if (coveredRegions.has(p.region)) continue;
    const list = regionMap.get(p.region) ?? [];
    list.push(p);
    regionMap.set(p.region, list);
  }

  const gaps: CoverageGap[] = [];
  for (const [region, provinces] of regionMap) {
    const coords = REGION_COORDINATES[region] ?? { lat: 12.5, lng: 122 };
    const avgRiskScore = Math.round(provinces.reduce((s, p) => s + p.riskScore, 0) / provinces.length);
    const avgServiceGap = Math.round(provinces.reduce((s, p) => s + p.serviceGaps, 0) / provinces.length);
    const totalIncidents = provinces.reduce((s, p) => s + p.reportedIncidents, 0);
    const totalPopulation = provinces.reduce((s, p) => s + p.population, 0);

    gaps.push({
      region,
      lat: coords.lat,
      lng: coords.lng,
      avgRiskScore,
      avgServiceGap,
      totalIncidents,
      totalPopulation,
      provinces,
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
