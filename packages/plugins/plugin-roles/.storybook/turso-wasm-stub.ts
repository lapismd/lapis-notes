export async function connect(): Promise<never> {
  throw new Error("Turso WASM is unavailable in the Roles Storybook fixture.");
}
