export type DailyReferenceInput = {
  name: string;
  date: string;
  operation: "locate" | "ensure";
  files?: Record<string, string>;
  cached?: Record<string, Record<string, unknown>>;
  configuration?: Record<string, unknown>;
};

const date = "2026-08-21";
const canonical = (day = date) =>
  `---\ntype: daily-note\ndate: ${day}\n---\n\nExisting\n`;

export function providerInputs(): DailyReferenceInput[] {
  const inputs: DailyReferenceInput[] = [
    { name: "locate never creates", date, operation: "locate" },
    { name: "default canonical seed", date, operation: "ensure" },
    { name: "canonical former path wins", date, operation: "ensure",
      files: { "archive/former.md": canonical() },
      configuration: { "dailyNotes.folder": "new", "dailyNotes.dateFormat": "dd-LL-yyyy" } },
    { name: "duplicate canonical dates", date, operation: "ensure",
      files: { "daily/one.md": canonical(), "archive/two.md": canonical() } },
    { name: "occupied unrelated target", date, operation: "ensure",
      files: { [`daily/${date}.md`]: "# Unrelated\n" } },
    { name: "different date is not canonical", date, operation: "ensure",
      files: { [`daily/${date}.md`]: canonical("2026-08-20") } },
    { name: "cached metadata wins over bytes", date, operation: "ensure",
      files: { "old.md": "# Cached\n" },
      cached: { "old.md": { type: "daily-note", date } } },
    { name: "cached noncanonical metadata wins", date, operation: "ensure",
      files: { "old.md": canonical() }, cached: { "old.md": { type: "note", date } } },
    { name: "canonical CRLF", date, operation: "locate",
      files: { "old.md": canonical().replaceAll("\n", "\r\n") } },
    { name: "nonleading frontmatter ignored", date, operation: "locate",
      files: { "old.md": `\n${canonical()}` } },
    { name: "array type rejected", date, operation: "locate",
      files: { "old.md": "# Cached\n" },
      cached: { "old.md": { type: ["daily-note"], date } } },
    { name: "date type remains strict", date, operation: "locate",
      files: { "old.md": "# Cached\n" },
      cached: { "old.md": { type: "daily-note", date: 20260821 } } },
    { name: "canonical target bypasses invalid new configuration", date,
      operation: "ensure", files: { "old.md": canonical() },
      configuration: { "dailyNotes.folder": "../bad", "dailyNotes.dateFormat": "" } },
    { name: "custom filename and nested directory", date, operation: "ensure",
      configuration: { "dailyNotes.folder": "Journal/Daily", "dailyNotes.dateFormat": "yyyy LLL dd" } },
  ];
  for (const folder of [" daily ", "/daily/", "\\daily\\", "one\\two", "a b/c d",
    "\ufeffdaily\ufeff", "\u0085daily\u0085", "", " ", "/", ".", "..", "a/../b",
    "a/./b", "a//b", "a:b", "a\nb", "a\0b", "a\u001fb", "a\u007fb", "a/ b"]) {
    inputs.push({ name: `folder ${JSON.stringify(folder)}`, date, operation: "ensure",
      configuration: { "dailyNotes.folder": folder } });
  }
  for (const invalid of ["2026-02-30", "2026-2-01", "2026-08-21T00:00:00Z", "", " 2026-08-21 "])
    for (const operation of ["locate", "ensure"] as const)
      inputs.push({ name: `${operation} invalid date ${JSON.stringify(invalid)}`,
        date: invalid, operation });
  return inputs;
}

export function filenameInputs(): Array<{ date: string; format: string }> {
  const formats = ["yyyy-MM-dd", "dd-LL-yyyy", "yyyy LLL dd", "yyyy LLLL dd",
    "y yy yyyy yyyyyy", "M MM MMM MMMM MMMMM", "L LL LLL LLLL LLLLL",
    "d dd c ccc cccc ccccc E EEE EEEE EEEEE", "o ooo q qq", "k kk kkkk W WW",
    "n nn ii iiii", "G GG GGGGG", "S u uu uuu s ss m mm H HH h hh a",
    "Z ZZ ZZZ ZZZZ ZZZZZ z", "X x", "D DD DDD DDDD", "t tt ttt tttt",
    "T TT TTT TTTT", "f ff fff ffff", "F FF FFF FFFF", "'day' yyyy-MM-dd",
    "yyyy 'a''b' MM", "''", "'literal'", "'unterminated", "unknown J JJ",
    "yyyy/MM/dd", "yyyy\\MM\\dd", "HH:mm", "'.'", "'..'", "'a:b'", "'a\nb'",
    "'a\u001fb'", "'a\u007fb'", "", " ", "\ufeffyyyy\ufeff", "\u0085yyyy\u0085"];
  return ["2026-08-21", "2024-02-29", "2021-01-01", "0000-01-01", "0099-12-31"]
    .flatMap((date) => formats.map((format) => ({ date, format })))
    .concat(["2026-02-30", "2026-2-01", "2026-08-21T00:00:00Z", "", " 2026-08-21 "]
      .map((date) => ({ date, format: "yyyy-MM-dd" })));
}
