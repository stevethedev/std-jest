const { buildSync } = require("esbuild");

const buildResult = buildSync({
  entryPoints: ["src/entry-points/jest-transform.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  write: false,
  format: "cjs",
  external: ["*"],
});

const code = buildResult.outputFiles[0].text;

const fn = new Function("module", "require", code);

fn(module, require);
