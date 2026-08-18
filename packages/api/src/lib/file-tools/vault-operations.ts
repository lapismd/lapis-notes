import type { FileToolOperations } from "@lapismd/ai-host/file-tools";
import { TFile, TFolder } from "../storage/fs";
import type { Vault } from "../storage/vault.svelte";
import {
  assertPayloadSize,
  assertTextContent,
  parentDirectory,
} from "./paths";

export function createVaultFileOperations(vault: Vault): FileToolOperations {
  return {
    async readFile(path) {
      const file = vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) throw new Error(`File not found: ${path}`);
      const content = await vault.read(file);
      assertTextContent(content, path);
      return content;
    },
    async writeFile(path, content) {
      assertTextContent(content, path);
      assertPayloadSize(content, "File content");
      const parent = parentDirectory(path);
      if (parent) await vault.mkpath(parent);
      const existing = vault.getAbstractFileByPath(path);
      if (existing instanceof TFolder) {
        throw new Error(`${path} is a folder`);
      }
      if (existing instanceof TFile) {
        await vault.modify(existing, content);
        return;
      }
      await vault.create(path, content);
    },
    async mkdirp(path) {
      if (!path) return;
      await vault.mkpath(path);
    },
    async stat(path) {
      const existing = vault.getAbstractFileByPath(path);
      if (existing instanceof TFolder) return { type: "directory", size: 0 };
      if (existing instanceof TFile) {
        const stat = await vault.stat(path);
        return { type: "file", size: stat?.size ?? existing.stat.size };
      }
      return null;
    },
    async remove(path) {
      const existing = vault.getAbstractFileByPath(path);
      if (!existing) throw new Error(`File not found: ${path}`);
      await vault.trash(existing);
    },
    async rename(from, to) {
      const existing = vault.getAbstractFileByPath(from);
      if (!existing) throw new Error(`File not found: ${from}`);
      const parent = parentDirectory(to);
      if (parent) await vault.mkpath(parent);
      await vault.rename(existing, to);
    },
  };
}
