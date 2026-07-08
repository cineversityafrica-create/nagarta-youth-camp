// Downscale + compress an uploaded image to a small JPEG data URL.
// Mandatory camper photos would otherwise be multi-megabyte base64 strings that
// are slow to upload on mobile and can be rejected by reverse-proxy body limits.
export async function fileToCompressedDataUrl(
  file: File,
  maxDim = 1000,
  quality = 0.8,
): Promise<string> {
  const originalDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  // Decode the image (use the DOM Image constructor, not next/image)
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to decode image'));
    image.src = originalDataUrl;
  });

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return originalDataUrl; // fallback: canvas unsupported

  ctx.drawImage(img, 0, 0, width, height);
  try {
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return originalDataUrl; // fallback: tainted canvas / toDataURL failure
  }
}
