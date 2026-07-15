import { existsSync, lstatSync, readlinkSync, symlinkSync } from "node:fs";
import { relative, resolve } from "node:path";

const links = [
  ["module", "dist/module"],
  ["packs", "dist/packs"],
];

for (const [linkPath, targetPath] of links) {
  const link = resolve(linkPath);
  const target = resolve(targetPath);

  if (!existsSync(target)) {
    throw new Error(`Cannot link ${linkPath}: build output ${targetPath} does not exist.`);
  }

  if (existsSync(link)) {
    const stat = lstatSync(link);
    if (!stat.isSymbolicLink()) {
      throw new Error(`Cannot link ${linkPath}: the path already exists and is not a link.`);
    }

    const currentTarget = resolve(linkPath, "..", readlinkSync(link));
    if (currentTarget !== target) {
      throw new Error(`Cannot link ${linkPath}: it points outside ${targetPath}.`);
    }

    console.log(`${linkPath} already links to ${targetPath}`);
    continue;
  }

  const linkTarget = process.platform === "win32" ? target : relative(resolve(linkPath, ".."), target);
  symlinkSync(linkTarget, link, process.platform === "win32" ? "junction" : "dir");
  console.log(`Linked ${linkPath} -> ${targetPath}`);
}
