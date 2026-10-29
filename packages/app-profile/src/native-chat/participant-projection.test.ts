import { expect, it } from "vitest";
import {
  participantEntries,
  participantLabels,
  participantReceiptItem,
} from "./participant-projection";
import { participantFixture } from "./participant-observer.test.fixture";

it("collapses historical delivery markers to their final immutable outcome", () => {
  const recipient = {
    id: "writer",
    label: "Captured Writer",
    token: "jj-store-agent:777269746572;",
  };
  const entries = ["pending", "started", "completed"].map((state) => ({
    schemaVersion: 3,
    type: "agent.delivery",
    id: `delivery:one:${state}`,
    dispatchId: "dispatch",
    delivery: { id: "one", recipient, state },
  }));
  const values = participantEntries(entries);
  expect(values).toHaveLength(1);
  expect(participantReceiptItem(values[0], (text) => text).blocks[0].text).toBe(
    "Captured Writer: Completed.",
  );
});
it("uses native cold outcomes instead of stale portable started markers", () => {
  const f = participantFixture();
  f.seed();
  const message = f.message!;
  const dispatch = message.input.dispatch as {
    id: string;
    deliveries: Record<string, unknown>[];
  };
  const entries = message.deliveries.map((d, i) => ({
    schemaVersion: 3,
    type: "agent.delivery",
    id: `delivery:${d.delivery_id}:started`,
    dispatchId: dispatch.id,
    delivery: { ...dispatch.deliveries[i], state: "started" },
  }));
  message.deliveries[0].state = "unknown";
  message.deliveries[1].state = "not_sent";
  const values = participantEntries(entries, message).filter(
    (v) => v.type === "agent.delivery",
  );
  expect(values).toHaveLength(2);
  expect(values.map((v) => (v.delivery as { state: string }).state)).toEqual([
    "unknown",
    "not_sent",
  ]);
  f.port.close();
});
it("rejects a saved binding that changes a retained native participant label", () => {
  const f = participantFixture();
  f.seed();
  const message = f.message!;
  expect(() =>
    participantLabels(
      [
        {
          schemaVersion: 3,
          type: "binding.created",
          id: message.deliveries[0].agent_binding_id,
          participant: {
            ...f.profiles[0].selection.recipient,
            label: "Rewritten label",
          },
        },
      ],
      message,
    ),
  ).toThrow("changed its captured label");
  f.port.close();
});
