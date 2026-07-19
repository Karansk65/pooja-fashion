import fs from "node:fs";
import zlib from "node:zlib";

function u16(buf, offset) {
  return buf.readUInt16LE(offset);
}

function u32(buf, offset) {
  return buf.readUInt32LE(offset);
}

function findEocd(buf) {
  const min = Math.max(0, buf.length - 0xffff - 22);
  for (let i = buf.length - 22; i >= min; i--) {
    if (u32(buf, i) === 0x06054b50) return i;
  }
  throw new Error("End of central directory not found");
}

function entries(zipPath) {
  const buf = fs.readFileSync(zipPath);
  const eocd = findEocd(buf);
  const count = u16(buf, eocd + 10);
  let cursor = u32(buf, eocd + 16);
  const result = [];
  for (let i = 0; i < count; i++) {
    if (u32(buf, cursor) !== 0x02014b50) throw new Error("Bad central directory");
    const method = u16(buf, cursor + 10);
    const compressedSize = u32(buf, cursor + 20);
    const uncompressedSize = u32(buf, cursor + 24);
    const nameLen = u16(buf, cursor + 28);
    const extraLen = u16(buf, cursor + 30);
    const commentLen = u16(buf, cursor + 32);
    const localOffset = u32(buf, cursor + 42);
    const name = buf.slice(cursor + 46, cursor + 46 + nameLen).toString("utf8");
    result.push({ name, method, compressedSize, uncompressedSize, localOffset });
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return { buf, result };
}

function extract(zipPath, entryName) {
  const { buf, result } = entries(zipPath);
  const entry = result.find((item) => item.name === entryName);
  if (!entry) throw new Error(`Entry not found: ${entryName}`);
  const local = entry.localOffset;
  if (u32(buf, local) !== 0x04034b50) throw new Error("Bad local header");
  const nameLen = u16(buf, local + 26);
  const extraLen = u16(buf, local + 28);
  const start = local + 30 + nameLen + extraLen;
  const compressed = buf.slice(start, start + entry.compressedSize);
  if (entry.method === 0) return compressed;
  if (entry.method === 8) return zlib.inflateRawSync(compressed);
  throw new Error(`Unsupported compression method: ${entry.method}`);
}

const args = process.argv.slice(2);
try {
  if (args[0] === "-Z1" && args.length === 2) {
    process.stdout.write(entries(args[1]).result.map((entry) => entry.name).join("\n"));
  } else if (args[0] === "-p" && args.length === 3) {
    process.stdout.write(extract(args[1], args[2]));
  } else {
    throw new Error(`Unsupported unzip arguments: ${args.join(" ")}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
