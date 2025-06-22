import { Worker } from "node:worker_threads";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
var cpus = os.cpus().length;

async function minifyFolder(inputDir, outputDir, filesToMinify) {
  await fs.mkdir(outputDir, { recursive: true });
  for (let i = 1; i <= cpus && filesToMinify.length; i++)
    RegisterWorkersToFiles(inputDir, outputDir, filesToMinify);
}
async function RegisterWorkersToFiles(inputDir, outputDir, filesToMinify) {
  do {
    const fileName = filesToMinify.shift();
    if (!fileName) return;
    const inputPath = path.join(inputDir, fileName);
    const outputPath = path.join(outputDir, fileName);
    await minifyFile(inputPath, outputPath);
  } while (filesToMinify.length);
}

async function minifyFile(input, output) {
  const worker = new Worker(new URL("./worker.mjs", import.meta.url), {
    workerData: {
      input,
      output,
    },
  });
  return new Promise((resolve, reject) => {
    worker.on("message", (msg) => {
      resolve(msg);
    });

    worker.on("error", (err) => {
      reject(err);
    });
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(code);
      }
    });
  });
}
export { minifyFile, minifyFolder };
