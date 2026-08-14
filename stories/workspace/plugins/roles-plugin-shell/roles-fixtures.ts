import type { RoleRecord } from "../lib/roles/types";

export function roleFixture(patch: Partial<RoleRecord> = {}): RoleRecord {
  const id = patch.id ?? "atlas-platform";
  return {
    schemaVersion: 1,
    id,
    company: "Atlas AI",
    title: "Engineering Manager, Infrastructure",
    status: "applied",
    sortOrder: 1000,
    sourcePath: `Roles/${id}/role.md`,
    url: "https://example.com/roles/platform",
    location: "London · Hybrid",
    salary: "GBP 120k–140k",
    tags: ["leadership", "platform"],
    contacts: ["Alex Morgan"],
    pinned: false,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-12T14:30:00.000Z",
    appliedAt: "2026-08-05T10:00:00.000Z",
    followUpAt: "2026-08-14",
    reactions: [],
    prep: {
      version: 3,
      schemaVersion: 1,
      updatedAt: "2026-08-12T14:30:00.000Z",
      stages: [
        {
          id: "screening-call",
          type: "screening",
          name: "Hiring manager screen",
          status: "scheduled",
          quickBrief: "Connect platform strategy to reliability outcomes.",
        },
      ],
      comments: {
        items: [
          {
            id: "comment-1",
            author: "Steve",
            body: "Strong match on platform ownership and team growth.",
            createdAt: "2026-08-12T14:30:00.000Z",
          },
        ],
      },
    },
    cvFile: "CVs/engineering-lead.cv.yml",
    description: "# Role description\n\nLead the infrastructure group and scale the developer platform.\n",
    ...patch,
  };
}

export const roleFixtures: RoleRecord[] = [
  roleFixture({ id: "jpmorgan-chase", company: "JPMorgan Chase", title: "Senior Lead Software Engineer – Backend Engineer – Chase UK", status: "saved", sortOrder: 1000, location: "London, United Kingdom", tags: ["backend", "java", "cloud-native"], contacts: [], source: "JPMorgan Chase careers", createdAt: "2026-07-20T13:43:00.000Z", updatedAt: "2026-07-20T13:43:00.000Z", appliedAt: undefined, followUpAt: undefined, cvFile: undefined, prep: { version: 3, schemaVersion: 1, stages: [], comments: { items: [] } }, description: "# Senior Lead Software Engineer – Backend Engineer – Chase UK" }),
  roleFixture({ id: "nova-bank", company: "Nova Bank", title: "Staff Platform Engineer", status: "saved", sortOrder: 2000, location: "London, hybrid", salary: "GBP 110k–130k", tags: ["platform", "fintech", "backend"], contacts: ["Maya Patel"], source: "LinkedIn", pinned: true, createdAt: "2026-06-20T10:00:00.000Z", updatedAt: "2026-06-26T11:15:00.000Z", appliedAt: undefined, followUpAt: "2026-07-02", prep: { version: 3, schemaVersion: 1, stages: [{ id: "screen", type: "screening", name: "Recruiter screen", status: "completed" }, { id: "technical", type: "interview", name: "Technical", status: "completed" }, { id: "panel", type: "interview", name: "Panel", status: "planned" }], comments: { items: [{ id: "nova-comment", author: "Maya Patel", body: "Payments reliability focus.", createdAt: "2026-06-26T11:15:00.000Z" }] } }, description: "Role is focused on payments reliability, developer platforms, and internal tooling for service teams." }),
  roleFixture({ id: "atlas-ai-infra", status: "applied", sortOrder: 1000, location: "Remote UK", salary: "GBP 90k–140k", tags: ["management", "ai-platform", "infrastructure"], contacts: ["Rina Shah", "Tom Cooper"], source: "Referral", pinned: false, createdAt: "2026-06-17T09:00:00.000Z", updatedAt: "2026-06-25T14:30:00.000Z", appliedAt: "2026-06-17T10:00:00.000Z", followUpAt: "2026-07-01", description: "# Application notes\n\nSubmitted with a **platform-leadership** CV variant.\n\n## Follow-up\n\n- Send a concise note about model serving and reliability experience.\n- Prepare examples of coaching senior engineers through ambiguous platform migrations." }),
  roleFixture({ id: "cedar-cloud", company: "Cedar Cloud", title: "Principal SRE", status: "screening", sortOrder: 1000, location: "Manchester, remote first", tags: ["sre", "incident-response", "cloud"], contacts: ["Liam Brooks"], source: "Company site", createdAt: "2026-06-15T09:00:00.000Z", updatedAt: "2026-06-27T12:00:00.000Z", followUpAt: undefined, description: "Recruiter screen scheduled. They care about incident retrospectives, platform observability, and cost control." }),
  roleFixture({ id: "harbour-payments", company: "Harbour Payments", title: "Solutions Architect", status: "interview", sortOrder: 1000, location: "London", salary: "GBP 125k", tags: ["payments", "architecture", "customer-facing"], contacts: ["Aisha Grant"], source: "Recruiter", pinned: true, createdAt: "2026-06-05T09:00:00.000Z", updatedAt: "2026-06-26T18:30:00.000Z", followUpAt: "2026-06-30", description: "Technical interview next. Prepare a systems design walkthrough for high-volume payment processing." }),
  roleFixture({ id: "northstar-tools", company: "Northstar Tools", title: "Backend Lead", status: "offer", sortOrder: 1000, location: "Remote", salary: "GBP 105k base plus equity", tags: ["backend", "saas", "leadership"], contacts: ["Eve Johnson"], source: "Otta", createdAt: "2026-05-28T09:00:00.000Z", updatedAt: "2026-06-27T15:00:00.000Z", followUpAt: undefined, description: "Offer received. Need compare against current priorities and clarify equity terms." }),
  roleFixture({ id: "marketlane", company: "MarketLane", title: "Senior Software Engineer", status: "rejected", sortOrder: 1000, location: "London", tags: ["marketplace", "full-stack"], contacts: ["Noah Reed"], source: "LinkedIn", createdAt: "2026-05-10T09:00:00.000Z", updatedAt: "2026-06-12T10:00:00.000Z", appliedAt: "2026-05-12T10:00:00.000Z", followUpAt: undefined, closedAt: "2026-06-12T10:00:00.000Z", closedBy: "System", description: "Closed after final screen. Feedback was positive technically, but they wanted deeper marketplace domain experience." }),
];

export function roleFixtureSource(role: RoleRecord): string {
  const { sourcePath: _sourcePath, description, ...frontmatter } = role;
  return `---\n${Object.entries(frontmatter)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n")}\n---\n${description}`;
}

export const roleFileSource = `---
schemaVersion: 1
id: atlas-platform
company: Atlas AI
title: Engineering Manager, Infrastructure
status: applied
sortOrder: 1000
location: London · Hybrid
tags: [leadership, platform]
contacts: [Alex Morgan]
createdAt: 2026-08-01T09:00:00.000Z
updatedAt: 2026-08-12T14:30:00.000Z
appliedAt: 2026-08-05T10:00:00.000Z
followUpAt: 2026-08-14
cvFile: CVs/engineering-lead.cv.yml
reactions: []
prep:
  version: 3
  schemaVersion: 1
  updatedAt: 2026-08-12T14:30:00.000Z
  stages:
    - id: screening-call
      type: screening
      name: Hiring manager screen
      status: scheduled
      quickBrief: Connect platform strategy to reliability outcomes.
  comments:
    items:
      - id: comment-1
        author: Steve
        body: Strong match on platform ownership and team growth.
        createdAt: 2026-08-12T14:30:00.000Z
---
# Role description

Lead the infrastructure group and scale the developer platform.
`;
