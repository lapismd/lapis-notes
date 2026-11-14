import { collectAppSkillPackages } from "./skill-package-sources";
import type { App } from "./context.svelte";
import {
  manageSkills,
  type SkillAction,
  type SkillManagementHost,
  type SkillManagementResult,
} from "./skill-management";

/**
 * Native transports retain authority; browser stores use the portable
 * implementation.
 */
export function createAppSkillManagement(
  app: App,
  host?: SkillManagementHost,
): SkillManagementHost {
  // Files can change without a new size or a distinguishable browser timestamp.
  const reconcile = () =>
    app.vault.reconcile(
      app.vault
        .getFilesByGlob(".agents/**")
        .map(({ path }) => ({ type: "modify" as const, path })),
    );
  const project = (service: SkillManagementHost): SkillManagementHost => ({
    async manage(action, skill) {
      const results = await service.manage(action, skill);
      if (action !== "list") await reconcile();
      return results;
    },
  });
  if (host) return project(host);
  if (app.operations)
    return project({
      async manage(action, skill) {
        const reply = await app.operations!.invoke("skills", action, {
          protocol_version: 1,
          request_id: crypto.randomUUID(),
          version: 1,
          input: skill ? { skill } : {},
        });
        if (reply.outcome.status === "error")
          throw new Error(reply.outcome.error.message);
        return reply.outcome.value as SkillManagementResult[];
      },
    });
  return {
    async manage(action, selected) {
      if (app.session && !["web-pwa", "test"].includes(app.session.runtime))
        throw new Error("Native skill-management service is unavailable");
      const bundles = await collectAppSkillPackages(app);
      const run = async () => {
        const results = await manageSkills(
          app.vault.adapter,
          bundles,
          action,
          selected,
        );
        if (action !== "list") await reconcile();
        return results;
      };
      return action === "list"
        ? run()
        : app.fileEditingSessions.guard(undefined, run);
    },
  };
}
export function registerSkillManagementCommands(app: App): void {
  for (const action of ["install", "update"] as SkillAction[])
    app.commands.registerCommand({
      id: `app:${action}-plugin-skills`,
      name:
        action === "install" ? "Install plugin skills" : "Update plugin skills",
      callback: async () => {
        try {
          const results = await app.skillManagement.manage(action);
          const count = (status: SkillManagementResult["status"]) =>
            results.filter((item) => item.status === status).length;
          const skipped = results.filter((item) => item.status === "skipped");
          app.notifications.notify({
            source: "app",
            message: `Skills: ${count("installed")} installed, ${count("updated")} updated, ${count("unchanged")} unchanged, ${skipped.length} skipped${skipped.length ? ": " + skipped.map((item) => `${item.name} (${item.reason})`).join(", ") : ""}`,
          });
        } catch (error) {
          app.notifications.notify({
            source: "app",
            message:
              error instanceof Error ? error.message : "Skill operation failed",
          });
        }
      },
    });
}
