import { type TransformOptions } from "@jest/transform";
import stdTransform from "./jest-transform";
import merge from "lodash.merge";

describe("jest-transform", () => {
  it("should transform code", () => {
    const sourceCode = "console.log('Hello, World!');";
    const filename = "hello-world.ts";
    const transformOptions = getTransformOptions({
      config: { testRegex: [], testMatch: [], testPathIgnorePatterns: [] },
    });
    const transformedSource = stdTransform
      .createTransformer()
      .process(sourceCode, filename, transformOptions);
    expect(transformedSource).toMatchObject({
      code: expect.any(String),
      map: expect.any(Object),
    });
  });

  it("should transform test code", () => {
    const sourceCode = "console.log('Hello, World!');";
    const filename = "hello-world.test.ts";
    const transformOptions = getTransformOptions({
      config: { testRegex: [], testMatch: [], testPathIgnorePatterns: [] },
    });
    const transformedSource = stdTransform
      .createTransformer()
      .process(sourceCode, filename, transformOptions);
    expect(transformedSource).toMatchObject({
      code: expect.any(String),
      map: expect.any(Object),
    });
  });

  it("should add comment-tests to transformed code", () => {
    const sourceCode = `
            /**
             * \`\`\`
             * console.log('Hello, World!');
             * \`\`\`
             */
        `;
    const filename = "hello-world.ts";
    const transformOptions = getTransformOptions({
      config: { testRegex: [], testMatch: [], testPathIgnorePatterns: [] },
    });
    const transformedSource = stdTransform
      .createTransformer()
      .process(sourceCode, filename, transformOptions);
    expect(transformedSource.code).toContain("describe");
  });

  it("should not add blank comment-tests to transformed code", () => {
    const sourceCode = `
            console.log('Hello, World!');
        `;
    const filename = "hello-world.ts";
    const transformOptions = getTransformOptions({
      config: { testRegex: [], testMatch: [], testPathIgnorePatterns: [] },
    });
    const transformedSource = stdTransform
      .createTransformer()
      .process(sourceCode, filename, transformOptions);
    expect(transformedSource.code).not.toContain("describe");
  });
});

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
function getTransformOptions(
  overrides: DeepPartial<TransformOptions> = {},
): TransformOptions {
  const empty: TransformOptions = {
    cacheFS: new Map(),
    config: {
      automock: false,
      cache: false,
      cacheDirectory: "",
      clearMocks: false,
      collectCoverageFrom: [],
      coverageDirectory: "",
      coveragePathIgnorePatterns: [],
      cwd: "",
      dependencyExtractor: undefined,
      detectLeaks: false,
      detectOpenHandles: false,
      displayName: undefined,
      errorOnDeprecated: false,
      extensionsToTreatAsEsm: [],
      fakeTimers: {},
      filter: undefined,
      forceCoverageMatch: [],
      globalSetup: undefined,
      globalTeardown: undefined,
      globals: {},
      haste: {
        computeSha1: undefined,
        defaultPlatform: undefined,
        forceNodeFilesystemAPI: undefined,
        enableSymlinks: undefined,
        hasteImplModulePath: undefined,
        platforms: undefined,
        throwOnModuleCollision: undefined,
        hasteMapModulePath: undefined,
        retainAllFiles: undefined,
      },
      id: "",
      injectGlobals: false,
      moduleDirectories: [],
      moduleFileExtensions: [],
      moduleNameMapper: [],
      modulePathIgnorePatterns: [],
      modulePaths: undefined,
      openHandlesTimeout: 0,
      preset: undefined,
      prettierPath: "",
      resetMocks: false,
      resetModules: false,
      resolver: undefined,
      restoreMocks: false,
      rootDir: "",
      roots: [],
      runner: "",
      runtime: undefined,
      sandboxInjectedGlobals: [],
      setupFiles: [],
      setupFilesAfterEnv: [],
      skipFilter: false,
      skipNodeResolution: undefined,
      slowTestThreshold: 0,
      snapshotResolver: undefined,
      snapshotSerializers: [],
      snapshotFormat: {},
      testEnvironment: "",
      testEnvironmentOptions: {},
      testMatch: [],
      testLocationInResults: false,
      testPathIgnorePatterns: [],
      testRegex: [],
      testRunner: "",
      transform: [],
      transformIgnorePatterns: [],
      watchPathIgnorePatterns: [],
      unmockedModulePathPatterns: undefined,
      workerIdleMemoryLimit: undefined,
    },
    configString: "",
    transformerConfig: undefined,
    instrument: false,
    supportsDynamicImport: false,
    supportsExportNamespaceFrom: false,
    supportsStaticESM: false,
    supportsTopLevelAwait: false,
  };

  return merge(empty, overrides);
}
