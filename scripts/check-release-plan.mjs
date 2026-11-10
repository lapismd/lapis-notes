import getReleasePlan from "@changesets/get-release-plan";

// Validate every pending changeset, independently of checkout branch names.
await getReleasePlan(process.cwd());
console.log("Changesets release plan is valid.");
