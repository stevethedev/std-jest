import * as acorn from "acorn";
import * as ts from "typescript";
// @ts-expect-error - comment-parser types cannot be imported for some reason.
import * as commentParser from "comment-parser";
import esbuild from "esbuild";

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
  function process(src: string, filename: string): { code: string } {
    const testCases = getCommentCode(src)
      .map(
        (code, id) =>
          `test("comment-test-case #${id}", async () => {\n${code}\n});`,
      )
      .join("\n");

    const combinedCode = `${src}
        ;(() => {
            describe("comment-test-cases", () => {
              ${testCases || "test.skip('no comment test cases found', () => {})"}
            });
        })();
        `;

    const code = buildSource(filename, combinedCode, true);
    return { code };
  }

  return { process };
}

function buildSource(
  filename: string,
  sourceCode: string,
  createSourceMap: boolean = false,
): string {
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
    format: "cjs",
    sourcemap: createSourceMap,
    external: ["*"],
  });

  return buildResult.outputFiles[0].text;
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
