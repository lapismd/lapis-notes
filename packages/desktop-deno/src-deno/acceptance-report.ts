interface ReportFileSystem {
  writeTextFile(path: string, data: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  remove(path: string): Promise<void>;
}

export async function writeAcceptanceReport(
  reportPath: string,
  report: Record<string, unknown>,
  fileSystem: ReportFileSystem = Deno,
): Promise<void> {
  const temporaryPath = `${reportPath}.${crypto.randomUUID()}.tmp`;
  try {
    await fileSystem.writeTextFile(
      temporaryPath,
      `${JSON.stringify(report)}\n`,
    );
    await fileSystem.rename(temporaryPath, reportPath);
  } finally {
    await fileSystem.remove(temporaryPath).catch(() => undefined);
  }
}
