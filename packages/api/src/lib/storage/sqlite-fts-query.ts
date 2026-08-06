function tokenizeFtsTerm(term: string): string[] {
  return (
    term
      .normalize("NFKC")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

function quoteFtsPrefixToken(token: string): string {
  return `"${token.replace(/"/g, '""')}"*`;
}

export function createSqliteFtsPrefixQueryFromTerms(terms: string[]): string {
  return [
    ...new Set(terms.flatMap((term) => tokenizeFtsTerm(term)).filter(Boolean)),
  ]
    .map(quoteFtsPrefixToken)
    .join(" AND ");
}
