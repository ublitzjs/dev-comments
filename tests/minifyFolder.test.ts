import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { minifyFolder } from "../mjs/index.mjs";

const tmpDir = path.join(os.tmpdir(), "vitest-devstrip-tests", "minifyFolder");
const inputDir = (name: string) => path.join(tmpDir, `input-${name}`);
const outputDir = (name: string) => path.join(tmpDir, `output-${name}`);

beforeEach(async () => {
  await fs.mkdir(tmpDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});
describe("minifyFolder", () => {
  it("removes dev blocks from multiple files", async () => {
    const input = inputDir("multiple");
    const output = outputDir("multiple");

    await fs.mkdir(input, { recursive: true });
    await fs.writeFile(
      path.join(input, "file1.js"),
      `console.log("start");/*_START_DEV_*/console.log("dev code");/*_END_DEV_*/console.log("end");`
    );
    await fs.writeFile(
      path.join(input, "file2.js"),
      `start /*_START_DEV_*/ dev1 /*_END_DEV_*/middle/*_START_DEV_*/ dev2 /*_END_DEV_*/ end`
    );

    await minifyFolder(input, output, ["file1.js", "file2.js"]);

    const resultFile1 = await fs.readFile(
      path.join(output, "file1.js"),
      "utf-8"
    );
    const resultFile2 = await fs.readFile(
      path.join(output, "file2.js"),
      "utf-8"
    );

    expect(resultFile1.trim()).toBe(`console.log("start");console.log("end");`);
    expect(resultFile2.trim()).toBe(`start middle end`);
  });
  it("does not modify files if there are no dev blocks", async () => {
    const input = inputDir("no-dev");
    const output = outputDir("no-dev");

    await fs.mkdir(input, { recursive: true });
    await fs.writeFile(
      path.join(input, "file1.js"),
      `console.log("start");console.log("end");`
    );
    await fs.writeFile(path.join(input, "file2.js"), `start middle end`);

    await minifyFolder(input, output, ["file1.js", "file2.js"]);

    const resultFile1 = await fs.readFile(
      path.join(output, "file1.js"),
      "utf-8"
    );
    const resultFile2 = await fs.readFile(
      path.join(output, "file2.js"),
      "utf-8"
    );

    expect(resultFile1.trim()).toBe(`console.log("start");console.log("end");`);
    expect(resultFile2.trim()).toBe(`start middle end`);
  });
  it("removes dev blocks at the start and end of the file", async () => {
    const input = inputDir("start-end");
    const output = outputDir("start-end");

    await fs.mkdir(input, { recursive: true });
    await fs.writeFile(
      path.join(input, "file1.js"),
      `/*_START_DEV_*/devstart/*_END_DEV_*/middle/*_START_DEV_*/devend/*_END_DEV_*/`
    );
    await fs.writeFile(
      path.join(input, "file2.js"),
      `/*_START_DEV_*/dev1/*_END_DEV_*/some code`
    );

    await minifyFolder(input, output, ["file1.js", "file2.js"]);

    const resultFile1 = await fs.readFile(
      path.join(output, "file1.js"),
      "utf-8"
    );
    const resultFile2 = await fs.readFile(
      path.join(output, "file2.js"),
      "utf-8"
    );

    expect(resultFile1.trim()).toBe(`middle`);
    expect(resultFile2.trim()).toBe(`some code`);
  });
  it("preserves folder structure in nested directories", async () => {
    const input = inputDir("nested");
    const output = outputDir("nested");
    await fs.mkdir(path.join(input, "nested"), { recursive: true });
    await fs.writeFile(
      path.join(input, "file1.js"),
      `console.log("start");/*_START_DEV_*/console.log("dev code");/*_END_DEV_*/console.log("end");`
    );
    await fs.writeFile(
      path.join(input, "nested", "file2.js"),
      `start /*_START_DEV_*/ dev1 /*_END_DEV_*/ middle /*_START_DEV_*/ dev2 /*_END_DEV_*/ end`
    );

    await minifyFolder(input, output, ["file1.js", "nested/file2.js"]);

    const resultFile1 = await fs.readFile(
      path.join(output, "file1.js"),
      "utf-8"
    );
    const resultFile2 = await fs.readFile(
      path.join(output, "nested", "file2.js"),
      "utf-8"
    );

    expect(resultFile1.trim()).toBe(`console.log("start");console.log("end");`);
    expect(resultFile2.trim()).toBe(`start  middle  end`);
  });
  it("handles empty folder gracefully", async () => {
    const input = inputDir("empty");
    const output = outputDir("empty");

    await fs.mkdir(input, { recursive: true });

    await minifyFolder(input, output, []);

    const filesInOutput = await fs.readdir(output);
    expect(filesInOutput).toHaveLength(0);
  });
  it("does not modify files without dev blocks", async () => {
    const input = inputDir("single-no-dev");
    const output = outputDir("single-no-dev");

    await fs.mkdir(input, { recursive: true });
    await fs.writeFile(
      path.join(input, "file1.js"),
      `const x = 10; const y = 20; console.log(x + y);`
    );

    await minifyFolder(input, output, ["file1.js"]);

    const resultFile1 = await fs.readFile(
      path.join(output, "file1.js"),
      "utf-8"
    );
    expect(resultFile1.trim()).toBe(
      `const x = 10; const y = 20; console.log(x + y);`
    );
  });
});
