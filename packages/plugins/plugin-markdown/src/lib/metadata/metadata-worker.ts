import { handleMetadataWorkerMessage } from "./metadata-worker-protocol";

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: (data: unknown) => void;
};

workerScope.onmessage = (event: MessageEvent<unknown>) => {
  const response = handleMetadataWorkerMessage(event.data);
  if (response) {
    workerScope.postMessage(response);
  }
};
