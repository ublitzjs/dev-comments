var { Worker } = require("node:worker_threads"),
  path = require("node:path"),
  fs = require("fs/promises"),
  os = require("node:os"),
  cpus = os.cpus().length;

async function minifyFolder(inputDir, outputDir, filesToMinify) {
  await fs.mkdir(outputDir, { recursive: true });
  var promises = [];
  for (let i = 1; i <= cpus && filesToMinify.length; i++)
    promises.push(RegisterWorkersToFiles(inputDir, outputDir, filesToMinify));
  return Promise.all(promises);
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
  const worker = new Worker(path.resolve(__dirname, "worker.cjs"), {
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
module.exports = {
  minifyFile,
  minifyFolder,
};
