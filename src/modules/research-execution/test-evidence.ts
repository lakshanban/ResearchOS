
import { runResearchWorker } from "./services/research-worker.service";
import { extractAndValidateEvidence } from "./services/research-evidence.service";

async function main() {
  console.log("Starting Research Worker...");

  const task = {
    title: "Investigate UK property management software trends",
    description:
      "Identify current trends, challenges, and opportunities in UK property management software.",
    priority: "high" as const,
    expectedOutcome:
      "Identify evidence-backed market trends and opportunities.",
    status: "pending" as const,
  };

  const research = await runResearchWorker({
    areaName: "UK Property Management Market Analysis",
    task,
    searchLimit: 5,
    maxSources: 3,
  });

  console.log("\nResearch completed.");
  console.log("Sources collected:", research.sourcesFound);

  if (research.sourcesFound === 0) {
    throw new Error(
      "No sources were collected. Cannot test evidence extraction.",
    );
  }

  console.log("\nExtracting and validating evidence...");

  const evidence = await extractAndValidateEvidence(
    research.sources.map((source) => ({
      url: source.url,
      title: source.title,
      domain: source.domain,
      content: source.content,
    })),
  );

  console.log("\nEvidence extraction completed.");

  console.log(
    JSON.stringify(evidence, null, 2),
  );

  console.log("\nEvidence statistics:");
  console.log("Total claims:", evidence.totalClaims);
  console.log("Verified:", evidence.verifiedClaims);
  console.log("Partially verified:", evidence.partiallyVerifiedClaims);
  console.log("Unverified:", evidence.unverifiedClaims);
}

main().catch((error) => {
  console.error("Evidence test failed:", error);
  process.exitCode = 1;
});
