import {
  defineVisualPlaywrightConfig,
  visualPlaywrightWebServer,
} from "@lapismd/storybook-addon-visual-delta/playwright";

const port = 6007;

export default defineVisualPlaywrightConfig({
  port,
  override: {
    webServer: {
      ...visualPlaywrightWebServer(port),
      reuseExistingServer: true,
    },
  },
});
