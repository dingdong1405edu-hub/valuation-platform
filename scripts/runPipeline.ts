/**
 * CLI để smoke-test full pipeline với fixture data (không cần DB).
 *
 * Note: pipeline thực dùng Prisma để load Document + cache; CLI này chỉ chạy
 * composer với 1 fixture FullReport để verify rendering.
 */
import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { composeReport } from "../apps/worker/src/report/compose.js";

async function main(): Promise<void> {
  const fixturePath = process.argv[2] ?? "fixtures/full-report.json";
  const outputPath = process.argv[3] ?? "out.html";
  const data = JSON.parse(await readFile(path.resolve(fixturePath), "utf8"));
  const html = composeReport(data);
  await writeFile(path.resolve(outputPath), html, "utf8");
  console.log(`Composed report → ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
