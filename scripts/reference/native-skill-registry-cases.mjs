// Declarative lifecycle inputs for the unchanged source registry.
import { markdown, discovery } from "./native-skill-cases.mjs";
const root = ".agents/skills/research/SKILL.md";
export const registryCases = [
  {
    seed: discovery([[root, markdown()]]),
    steps: [
      { op: "snapshot" },
      { op: "getLoaded", name: "research" },
      {
        op: "modify",
        path: root,
        content: markdown("research", "", "New rules"),
      },
      { op: "invalidate" },
      { op: "snapshot" },
      { op: "loadSaved", snapshot: 0 },
      { op: "load", id: "research", versionFrom: 0 },
      { op: "load", id: "folder:research", version: "wrong" },
      { op: "getLoaded", name: "missing" },
    ],
  },
  {
    seed: discovery([[root, markdown()]]),
    steps: [
      { op: "activate", name: "research", source: "user", arguments: "" },
      {
        op: "activate",
        name: "research",
        source: "model",
        arguments: "café 📝",
      },
      { op: "activate", name: "missing", source: "app" },
      { op: "load", id: "missing", version: "missing" },
    ],
  },
  {
    seed: discovery([[root, markdown()]]),
    steps: [
      { op: "snapshot" },
      { op: "snapshot" },
      { op: "invalidate" },
      { op: "getLoaded", name: "research" },
      { op: "loadSaved", snapshot: 0 },
      { op: "snapshot" },
    ],
  },
  {
    seed: discovery([[root, "Bad"]]),
    steps: [
      { op: "discover" },
      { op: "invalidate" },
      { op: "diagnostics" },
      { op: "snapshot" },
    ],
  },
];
