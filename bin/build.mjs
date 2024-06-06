import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { cp, readdir } from "node:fs/promises";

main()
  .then(() => {
    process.stdout.write("Build successful\n");
  })
  .catch((err) => {
    process.stderr.write(`Build failed: ${err.message}\n`);
    process.exit(1);
  });

async function main() {
  const entryPoints = await readdir(srcDir("entry-points"));

  await cp(rootDir("package.json"), distDir("package.json"));
  await cp(rootDir("package-lock.json"), distDir("package-lock.json"));
  for (const entryPoint of entryPoints) {
    const inputFp = srcDir("entry-points", entryPoint);
    const outputFp = distDir();
    await buildFile(inputFp, outputFp);
  }
}

function rootDir(...fp) {
  return fileURLToPath(new URL(join("..", ...fp), import.meta.url));
}

function srcDir(...fp) {
  return rootDir("src", ...fp);
}

function distDir(...fp) {
  return rootDir("dist", ...fp);
}

async function buildFile(inputFp, outputFp) {
  process.stdout.write(`Building ${inputFp} -> ${outputFp}...`);
  await build({
    entryPoints: [inputFp],
    outdir: outputFp,
    bundle: true,
    platform: "node",
    target: "node20",
    format: "cjs",
    external: ["esbuild"],
  });
  process.stdout.write(" done\n");
}
