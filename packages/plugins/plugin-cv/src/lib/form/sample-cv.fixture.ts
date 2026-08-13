import sampleCvYaml from "./sample-cv.fixture.yml?raw";

import { cloneSource, parseCompleteSource } from "./complete-cv-form.model";

const parsedSampleCv = parseCompleteSource(sampleCvYaml);

export function createSampleCv() {
  return cloneSource(parsedSampleCv);
}

export { sampleCvYaml };
