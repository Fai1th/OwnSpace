export async function optimizeImage(file: File, avatar = false): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw Error("Choose a PNG, JPEG or WebP image.");
  if (file.size > 8 * 1024 * 1024) throw Error("Choose an image smaller than 8 MB.");
  const bitmap = await createImageBitmap(file);
  const max = avatar ? 512 : 1100;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw Error("Your browser couldn't open that image.");
  }
  ctx.fillStyle = "#202020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let quality = 0.82;
  let value = canvas.toDataURL("image/jpeg", quality);
  while (value.length > 180000 && quality > 0.3) {
    quality -= 0.1;
    value = canvas.toDataURL("image/jpeg", quality);
  }
  if (value.length > 300000) throw Error("This image is too detailed. Choose a smaller image.");
  return value;
}
