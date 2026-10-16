import type { Workspace } from "../../dist/index.js";

declare const workspace: Workspace;
const completion: Promise<void> = workspace.flushLayout();
void completion;
