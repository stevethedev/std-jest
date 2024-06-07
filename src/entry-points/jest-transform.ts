import { type TransformedSource, type TransformOptions } from "@jest/transform";
import * as acorn from "acorn";
import ts from "typescript";
// @ts-expect-error - comment-parser types cannot be imported for some reason.
import * as commentParser from "comment-parser";
import esbuild, { Format } from "esbuild";

export default { createTransformer };

/**
 * Create a transformer for jest
 *
 * @example
 * ```typescript
 * expect(createTransformer()).toMatchObject({ process: expect.any(Function) });
 * ```
 */
function createTransformer() {
  /**
   * Process the source code.
   * @param sourceCode - The source code to process
   * @param filename - The filename of the source code
   * @param transformOptions - The options for the transform
   * @returns The transformed source code
   */
  function process(
    sourceCode: string,
    filename: string,
    transformOptions: TransformOptions,
  ): TransformedSource {
    void transformOptions;
    const combinedCode = getModifiedCode(sourceCode);
    const builtSource = buildSource(filename, combinedCode);

    return {
      code: builtSource.code ?? "",
      map: builtSource.map && {
        ...JSON.parse(builtSource.map),
      },
    };
  }

  return { process };
}

function getModifiedCode(sourceCode: string): string {
  const testCases = getCommentCode(sourceCode).map(testCase);
  const testCode = testDescription(testCases);

  return `${sourceCode}\n${testCode}`;
}

function testDescription(testCases: string[]): string {
  if (testCases.length === 0) {
    return "";
  }

  return `
    /* c8 ignore start */
    /* istanbul ignore next */
    ;(() => {
      describe${testCases.length === 0 ? ".skip" : ""}("comment-test-cases", () => {
        ${testCases.join("\n")}
      });
    })();
    /* c8 ignore end */
  `;
}

/**
 * Create a test case
 * @param code - The code to test
 * @param id - The id of the test case
 *
 * @example Handle the `import` keyword.
 * ```typescript
 * import { readFileSync } from "node:fs";
 * expect(readFileSync).toBeDefined();
 * ```
 *
 * @example Handle the `require` function.
 * ```typescript
 * const { readFileSync } = require("fs");
 * expect(readFileSync).toBeDefined();
 * ```
 *
 * @example Handle the `export` keyword.
 * ```typescript
 * export const value = 1;
 * expect(value).toBe(1);
 * ```
 *
 * @example Handle the `export default` keyword.
 * ```typescript
 * export default 1;
 * ```
 *
 * @example Handle the `export *` keyword.
 * ```typescript
 * export * from "fs";
 * ```
 *
 * @example Handle the `export { ... }` keyword.
 * ```typescript
 * export { readFileSync } from "fs";
 * ```
 *
 * @example Handle the `export { ... as ... }` keyword.
 * ```typescript
 * export { readFileSync as read } from "fs";
 * ```
 */
function testCase(code: string, id: number): string {
  const builtCode = buildSource(`comment-test-case-${id}.ts`, code);
  return `
  /* istanbul ignore next */
  test("comment-test-case #${id}", async () => {
    const module = { exports: {} };
    ${builtCode.code}
  });
  `;
}

function buildSource(
  filename: string,
  sourceCode: string,
  format: Format = "cjs",
): { code?: string; map?: string } {
  const buildResult = esbuild.buildSync({
    stdin: {
      contents: sourceCode,
      loader: "tsx",
      sourcefile: filename,
    },
    bundle: true,
    platform: "node",
    target: "node20",
    write: false,
    format,
    outfile: filename,
    sourcemap: "both",
    external: ["*"],
  });

  const code = buildResult.outputFiles.find(({ path }) =>
    path.endsWith(filename),
  )?.text;
  const map = buildResult.outputFiles.find(({ path }) =>
    path.endsWith(`${filename}.map`),
  )?.text;

  return {
    code,
    map,
  };
}

function getCommentCode(sourceCode: string): string[] {
  return extractBlockComments(sourceCode).flatMap(parseCommentCode);
}

function extractBlockComments(sourceCode: string): string[] {
  const { outputText } = ts.transpileModule(sourceCode, {
    compilerOptions: { target: ts.ScriptTarget.ES5 },
  });
  const onComment: acorn.Comment[] = [];
  acorn.parse(outputText, { ecmaVersion: "latest", onComment });

  return onComment
    .filter(({ type }) => type === "Block")
    .map(({ value }) => value);
}

function parseCommentCode(comment: string): string[] {
  return commentParser
    .parse(`/**\n${comment}\n*/`, { spacing: "preserve" })
    .flatMap(
      ({
        description,
        tags,
      }: {
        description: string;
        tags: { description: string }[];
      }) => [
        ...extractCommentCode(description),
        ...tags.flatMap(({ description }) => extractCommentCode(description)),
      ],
    );
}

function extractCommentCode(comment: string): string[] {
  const lines: string[] = comment.split("\n");
  const codeBlocks: string[][] = [];
  let inBlock: boolean = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inBlock = !inBlock;
      if (inBlock) {
        codeBlocks.push([]);
      }
      continue;
    }

    if (inBlock) {
      codeBlocks[codeBlocks.length - 1].push(line);
    }
  }

  return codeBlocks.map((block: string[]) => block.join("\n"));
}
