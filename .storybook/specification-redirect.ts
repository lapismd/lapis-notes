import legacyDocs from "../spec/legacy-docs.json";

/** Preserve links to chapters whose former flat titles gained a parent group. */
function redirectLegacySpecification() {
  const url = new URL(window.location.href);
  const route = url.searchParams.get("path");
  const id = route?.replace(/^\/docs\//, "");
  const replacement = id && legacyDocs[id as keyof typeof legacyDocs];
  if (!replacement) return;
  url.searchParams.set("path", `/docs/${replacement}`);
  window.location.replace(url.href);
}
redirectLegacySpecification();
window.addEventListener("popstate", redirectLegacySpecification);
