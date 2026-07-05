import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the build works both at <user>.github.io/codemine-game/
  // and at the custom-domain root once DNS points to Pages.
  base: "./",
  build: {
    target: "es2022",
  },
});
