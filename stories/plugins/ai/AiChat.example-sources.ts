export const aiChatExampleSource = `import { AiChatPanel, FakeAgentRuntime } from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime();

<AiChatPanel runtime={runtime} />
`;

export const aiChatApprovalExampleSource = `import { AiChatPanel, FakeAgentRuntime } from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime({ requireApproval: true });

<AiChatPanel runtime={runtime} />
`;

export const aiChatMentionsExampleSource = `import {
  AiChatPanel,
  FakeAgentRuntime,
  formatFileMention,
  searchVaultFiles,
} from "@lapis-notes/ai";
import "@lapis-notes/ai/styles.css";

const runtime = new FakeAgentRuntime();
const files = [{ path: "Notes/alpha.md", name: "alpha" }];

<AiChatPanel
  runtime={runtime}
  fileSearch={async (query) =>
    searchVaultFiles(files, query).map((file) => ({
      id: file.path,
      label: file.name,
      value: formatFileMention(file.path),
      description: file.path,
    }))
  }
/>
`;
