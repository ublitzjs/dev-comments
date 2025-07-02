import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

import { minifyFile } from "../mjs/index.mjs";

const tmpDir = path.join(os.tmpdir(), "vitest-devstrip-tests", "minifyFile");
const inputFile = (name: string) => path.join(tmpDir, `input-${name}.js`);
const outputFile = (name: string) => path.join(tmpDir, `output-${name}.js`);

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("minifyFile (worker-based)", () => {
  it("removes a single dev block", async () => {
    const inputContent = `
console.log("start");
/*_START_DEV_*/
console.log("dev only");
/*_END_DEV_*/
console.log("end");`;

    const expectedOutput = `
console.log("start");

console.log("end");`;

    const input = inputFile("single");
    const output = outputFile("single");

    await fs.writeFile(input, inputContent);
    const message = await minifyFile(input, output);
    const result = await fs.readFile(output, "utf8");

    expect(result.trim()).toBe(expectedOutput.trim());
    expect(message).toMatch(/.*input-.*\.js → .*output-.*\.js/);
  });

  it("removes multiple dev blocks", async () => {
    const inputContent = `
start
/*_START_DEV_*/ dev1 /*_END_DEV_*/
middle
/*_START_DEV_*/ dev2 /*_END_DEV_*/
end`;

    const expectedOutput = `
start

middle

end`;

    const input = inputFile("multi");
    const output = outputFile("multi");

    await fs.writeFile(input, inputContent);
    await minifyFile(input, output);
    const result = await fs.readFile(output, "utf8");

    expect(result.trim()).toBe(expectedOutput.trim());
  });

  it("leaves content alone if there are no dev blocks", async () => {
    const inputContent = `
no dev blocks
just regular code`;

    const input = inputFile("none");
    const output = outputFile("none");

    await fs.writeFile(input, inputContent);
    await minifyFile(input, output);
    const result = await fs.readFile(output, "utf8");

    expect(result).toBe(inputContent);
  });

  it("handles dev block at start and end of file", async () => {
    const inputContent = `/*_START_DEV_*/
devstart
/*_END_DEV_*/
middle
/*_START_DEV_*/
devend
/*_END_DEV_*/`;

    const expectedOutput = `
middle`;

    const input = inputFile("startend");
    const output = outputFile("startend");

    await fs.writeFile(input, inputContent);
    await minifyFile(input, output);
    const result = await fs.readFile(output, "utf8");

    expect(result.trim()).toBe(expectedOutput.trim());
  });
});
