import { app, shell } from "electron";
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DOC_VERSION, type DocSummary, type LabelDoc, type StoredDoc } from "../shared/doc";

const dir = () => join(app.getPath("userData"), "labels");
const SAFE_ID = /^[A-Za-z0-9_-]+$/;

function fileFor(id: string): string {
  if (!SAFE_ID.test(id)) throw new Error(`Invalid label id: ${id}`);
  return join(dir(), `${id}.json`);
}

function parseStored(raw: string): StoredDoc {
  const data = JSON.parse(raw) as StoredDoc;
  if (data?.doc?.version !== DOC_VERSION || !Array.isArray(data.doc.elements)) {
    throw new Error("Unknown label file format");
  }
  return data;
}

async function read(id: string): Promise<StoredDoc> {
  return parseStored(await readFile(fileFor(id), "utf8"));
}

/** Write to a temp file and rename, so a crash never leaves a half-written label. */
async function write(stored: StoredDoc): Promise<void> {
  await mkdir(dir(), { recursive: true });
  const target = fileFor(stored.doc.id);
  const tmp = `${target}.tmp`;
  await writeFile(tmp, JSON.stringify(stored, null, 2), "utf8");
  await rename(tmp, target);
}

export const library = {
  async list(): Promise<DocSummary[]> {
    await mkdir(dir(), { recursive: true });
    const files = (await readdir(dir())).filter((f) => f.endsWith(".json"));
    const summaries: DocSummary[] = [];
    for (const file of files) {
      try {
        const { doc, thumbnail, lastPrintedAt } = parseStored(await readFile(join(dir(), file), "utf8"));
        summaries.push({ id: doc.id, name: doc.name, label: doc.label, updatedAt: doc.updatedAt, lastPrintedAt, thumbnail });
      } catch (err) {
        console.warn(`Skipping ${file}:`, err);
      }
    }
    return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async load(id: string): Promise<LabelDoc> {
    return (await read(id)).doc;
  },

  async save(doc: LabelDoc, thumbnail: string): Promise<void> {
    const previous = await read(doc.id).catch(() => undefined);
    await write({ doc, thumbnail, lastPrintedAt: previous?.lastPrintedAt });
  },

  async markPrinted(id: string): Promise<void> {
    const stored = await read(id);
    await write({ ...stored, lastPrintedAt: new Date().toISOString() });
  },

  async remove(id: string): Promise<void> {
    await rm(fileFor(id), { force: true });
  },

  async reveal(): Promise<void> {
    await mkdir(dir(), { recursive: true });
    await shell.openPath(dir());
  },
};
