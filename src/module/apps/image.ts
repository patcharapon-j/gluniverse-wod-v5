/** Open Foundry's FilePicker to choose an image and write it to `doc.img`. */

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function pickImage(doc: any): Promise<void> {
  const FP =
    (foundry as any).applications?.apps?.FilePicker?.implementation ??
    (globalThis as any).FilePicker;
  if (!FP) return;
  const fp = new FP({
    type: "image",
    current: doc.img ?? "",
    callback: (path: string) => doc.update({ img: path }),
  });
  await fp.browse?.();
}
