import fs from "node:fs";
import { workerData, parentPort } from "node:worker_threads";
import path from "node:path";

const { input, output } = workerData;

const START_TAG = "/*_START_DEV_*/";
const END_TAG = "/*_END_DEV_*/";
(async () => {
  await fs.promises.mkdir(path.dirname(output), { recursive: true });

  const rs = fs.createReadStream(input, {
    encoding: "utf8",
    highWaterMark: 20,
  });
  const ws = fs.createWriteStream(output, { encoding: "utf8" });

  let buffer = ""; // holds leftover across chunks
  let state = "KEEPING"; // or "DELETING"

  rs.on("data", (chunk) => {
    buffer += chunk;
    let idx;

    while (true) {
      if (state === "KEEPING") {
        idx = buffer.indexOf(START_TAG);
        // No START tag – flush all except trailing possible START_TAG prefix
        if (idx === -1) {
          const safeEnd = buffer.length - START_TAG.length + 1;
          if (safeEnd > 0) {
            ws.write(buffer.slice(0, safeEnd));
            buffer = buffer.slice(safeEnd);
          }
          break;
        } else {
          // Found START tag
          ws.write(buffer.slice(0, idx));
          buffer = buffer.slice(idx + START_TAG.length);
          state = "DELETING";
        }
      } else {
        idx = buffer.indexOf(END_TAG);
        if (idx === -1) {
          // Not found yet – trim buffer to last possible END_TAG start
          buffer = buffer.slice(-END_TAG.length + 1);
          break;
        } else {
          buffer = buffer.slice(idx + END_TAG.length);
          state = "KEEPING";
        }
      }
    }
  });

  rs.on("end", () => {
    if (state === "KEEPING" && buffer.length > 0) {
      ws.write(buffer);
    }
    ws.end(() => parentPort.postMessage(`${input} → ${output}`));
  });

  rs.on("error", (err) => parentPort.postMessage(`Read error: ${err}`));
  ws.on("error", (err) => parentPort.postMessage(`Write error: ${err}`));
})();
