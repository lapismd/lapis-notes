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
