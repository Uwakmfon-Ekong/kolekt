/**
 * Shrinks a picked image in the browser so it's small enough to store with a collection or profile.
 * If `maxChars` is given, quality and then size are stepped down until the data URL fits, so a
 * detailed photo can't produce a cover the server will reject.
 */
export function resizeImage(file: File, maxSide: number, quality = 0.82, maxChars?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas unavailable")); return; }
      const render = (side: number, q: number) => {
        const scale = Math.min(1, side / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", q);
      };
      let side = maxSide;
      let q = quality;
      let out = render(side, q);
      for (let i = 0; maxChars && out.length > maxChars && i < 8; i++) {
        if (q > 0.55) q -= 0.1;
        else side = Math.round(side * 0.8);
        out = render(side, q);
      }
      if (maxChars && out.length > maxChars) { reject(new Error("image too large")); return; }
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable image")); };
    img.src = url;
  });
}
