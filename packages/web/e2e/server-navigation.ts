import type { Page, Request } from "@playwright/test";

export interface ServerNavigationRetry {
  failedRequests: string[];
  firstFailure: string;
}

export async function navigateServerPage(
  page: Page,
  url: string,
  assertReady: () => Promise<void>,
  onRetry?: (retry: ServerNavigationRetry) => Promise<void>,
): Promise<number> {
  const origin = new URL(url).origin;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const failedRequests: string[] = [];
    const observeFailure = (request: Request) => {
      if (
        request.failure()?.errorText === "net::ERR_NETWORK_CHANGED" &&
        ["document", "script"].includes(request.resourceType()) &&
        new URL(request.url()).origin === origin
      ) {
        failedRequests.push(request.url());
      }
    };
    page.on("requestfailed", observeFailure);
    let navigating = true;
    try {
      await page.goto(url);
      navigating = false;
      await assertReady();
      return attempt;
    } catch (error) {
      const navigationChanged =
        navigating && /\bnet::ERR_NETWORK_CHANGED\b/u.test(String(error));
      if (attempt === 2 || (!navigationChanged && !failedRequests.length))
        throw error;
      await onRetry?.({
        failedRequests: [...failedRequests],
        firstFailure: String(error),
      });
    } finally {
      page.off("requestfailed", observeFailure);
    }
  }
  throw new Error("Server startup retry exhausted");
}
