# Steve the Dev's Jest Preset

Main features:

1. Execute in-comment code-samples as tests.
2. Supports TypeScript and JavaScript.
3. Uses esbuild for fast transformations.

## Installation

To install this Jest preset, you can use npm or yarn:

```bash
npm install --save-dev jest-preset-transformer
# or
yarn add --dev jest-preset-transformer
```

## Usage

To use this transformer in your Jest configuration, you need to add it to your
`jest.config.js` or `jest` section in `package.json`:

```javascript
// jest.config.js
module.exports = {
  preset: "std-jest",
};
```

Or:

```json
{
  "jest": {
    "transform": {
      "^.+\\.[mc]?[tj]sx?$": "std-jest/jest-transform.js"
    }
  }
}
```

## How It Works

This transformer scans your source code for comment blocks containing test
cases. It then extracts these test cases and wraps them in Jest's test
functions, allowing them to be executed as part of your test suite.

## Example

Consider the following source code:

````typescript
/**
 * This is a sample function.
 *
 * @example
 * ```typescript
 * const result = sampleFunction();
 * expect(result).toBe(true);
 * ```
 */
function sampleFunction() {
  return true;
}
````

The transformer will extract the test case from the comment and generate a
corresponding Jest test:

```typescript
test("comment-test-case #0", async () => {
  const result = sampleFunction();
  expect(result).toBe(true);
});
```

## License

This project is provided as-is, free of charge, for private and commercial use under the MIT License.
