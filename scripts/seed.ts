/**
 * Seed Comparable companies — top 30 mã sàn HOSE/HNX phổ biến.
 * Đây là seed minh hoạ; số liệu ratios cần update định kỳ qua web search.
 */
import "dotenv/config";
import { prisma } from "../packages/db/src/index.js";

const SEED = [
  { ticker: "VNM", name: "Vinamilk", country: "VN", industry: "Consumer Staples", evEbitda: 14.5, pe: 16.2, pb: 4.8 },
  { ticker: "HPG", name: "Hoà Phát Group", country: "VN", industry: "Materials", evEbitda: 8.1, pe: 12.4, pb: 1.6 },
  { ticker: "FPT", name: "FPT Corp", country: "VN", industry: "Information Technology", evEbitda: 16.0, pe: 19.5, pb: 4.1 },
  { ticker: "MWG", name: "Mobile World Investment", country: "VN", industry: "Consumer Discretionary", evEbitda: 12.0, pe: 18.0, pb: 3.2 },
  { ticker: "VHM", name: "Vinhomes", country: "VN", industry: "Real Estate", evEbitda: 9.0, pe: 7.0, pb: 1.6 },
  { ticker: "VIC", name: "Vingroup", country: "VN", industry: "Conglomerate", evEbitda: 11.0, pe: 24.0, pb: 1.4 },
  { ticker: "ACB", name: "Asia Commercial Bank", country: "VN", industry: "Financials", evEbitda: null, pe: 7.5, pb: 1.5 },
  { ticker: "VCB", name: "Vietcombank", country: "VN", industry: "Financials", evEbitda: null, pe: 14.5, pb: 2.7 },
  { ticker: "TCB", name: "Techcombank", country: "VN", industry: "Financials", evEbitda: null, pe: 7.0, pb: 1.4 },
  { ticker: "GAS", name: "PV Gas", country: "VN", industry: "Energy", evEbitda: 7.0, pe: 14.0, pb: 2.6 },
  { ticker: "PNJ", name: "Phu Nhuan Jewelry", country: "VN", industry: "Consumer Discretionary", evEbitda: 11.0, pe: 14.5, pb: 3.0 },
  { ticker: "DGW", name: "Digiworld", country: "VN", industry: "Consumer Discretionary", evEbitda: 10.5, pe: 15.5, pb: 3.4 },
  { ticker: "MSN", name: "Masan Group", country: "VN", industry: "Consumer Staples", evEbitda: 13.0, pe: 28.0, pb: 2.4 },
  { ticker: "SAB", name: "Sabeco", country: "VN", industry: "Consumer Staples", evEbitda: 12.0, pe: 16.0, pb: 3.0 },
  { ticker: "GMD", name: "Gemadept", country: "VN", industry: "Industrials", evEbitda: 9.5, pe: 15.0, pb: 2.0 },
  { ticker: "REE", name: "REE Corp", country: "VN", industry: "Industrials", evEbitda: 9.0, pe: 11.5, pb: 1.4 },
  { ticker: "DHG", name: "DHG Pharma", country: "VN", industry: "Healthcare", evEbitda: 11.0, pe: 17.0, pb: 2.6 },
  { ticker: "PLX", name: "Petrolimex", country: "VN", industry: "Energy", evEbitda: 8.5, pe: 18.0, pb: 1.9 },
  { ticker: "POW", name: "PV Power", country: "VN", industry: "Utilities", evEbitda: 7.5, pe: 16.0, pb: 1.1 },
  { ticker: "BVH", name: "Bao Viet Holdings", country: "VN", industry: "Financials", evEbitda: null, pe: 22.0, pb: 1.6 },
  { ticker: "SSI", name: "SSI Securities", country: "VN", industry: "Financials", evEbitda: null, pe: 14.0, pb: 1.6 },
  { ticker: "HSG", name: "Hoa Sen Group", country: "VN", industry: "Materials", evEbitda: 9.0, pe: 12.0, pb: 1.2 },
  { ticker: "NVL", name: "Novaland", country: "VN", industry: "Real Estate", evEbitda: 14.0, pe: 18.0, pb: 1.0 },
  { ticker: "KDH", name: "Khang Dien House", country: "VN", industry: "Real Estate", evEbitda: 10.0, pe: 14.0, pb: 1.4 },
  { ticker: "BCM", name: "Becamex IDC", country: "VN", industry: "Real Estate", evEbitda: 12.5, pe: 22.0, pb: 1.5 },
  { ticker: "DXG", name: "Dat Xanh Group", country: "VN", industry: "Real Estate", evEbitda: 11.0, pe: 16.0, pb: 1.0 },
  { ticker: "VRE", name: "Vincom Retail", country: "VN", industry: "Real Estate", evEbitda: 9.5, pe: 13.5, pb: 1.6 },
  { ticker: "HDB", name: "HDBank", country: "VN", industry: "Financials", evEbitda: null, pe: 6.0, pb: 1.3 },
  { ticker: "VPB", name: "VPBank", country: "VN", industry: "Financials", evEbitda: null, pe: 8.0, pb: 1.2 },
  { ticker: "STB", name: "Sacombank", country: "VN", industry: "Financials", evEbitda: null, pe: 9.0, pb: 1.3 },
];

async function main(): Promise<void> {
  for (const c of SEED) {
    await prisma.comparable.upsert({
      where: { ticker: c.ticker },
      create: c,
      update: { ...c, updatedAt: new Date() },
    });
  }
  console.log(`Seeded ${SEED.length} comparables.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
