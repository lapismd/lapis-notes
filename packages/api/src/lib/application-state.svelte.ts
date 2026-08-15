import { getContext, setContext } from "svelte";
import type { App } from "./context.svelte";
import { resolveApplication } from "./application-compatibility";

const APPLICATION_STATE = Symbol("lapis-application-state");

/**
 * Provide an application to the current Svelte component subtree.
 *
 * @public
 */
export function provideApplicationState(application: App): App {
  return setContext(APPLICATION_STATE, application);
}

/**
 * Resolve the owning application in explicit, component-context, then legacy
 * compatibility order.
 *
 * @public
 */
export function useApplicationState(application?: App): App {
  if (application) return application;

  let contextualApplication: App | undefined;
  try {
    contextualApplication = getContext<App>(APPLICATION_STATE);
  } catch {
    // getContext is only valid during component initialization. Plain classes
    // continue through the deliberately narrow compatibility fallback.
  }
  return resolveApplication(contextualApplication);
}
