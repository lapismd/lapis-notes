import {
  PointerActivationConstraints,
  PointerSensor,
  type Sensors,
} from "@dnd-kit/dom";

// dnd-kit skips distance constraints for handle drags by default, which makes
// row/column grip clicks start a drag on mousedown. Require a small move so
// click-to-select and drag-to-reorder stay distinct.
export const tableReorderSensors: Sensors = [
  PointerSensor.configure({
    activationConstraints() {
      return [new PointerActivationConstraints.Distance({ value: 5 })];
    },
  }),
];
