import { t } from '../i18n/index.js';

/**
 * Read an image file, scale it down (longest side ≤ max px) and return a compact data URL (fits localStorage).
 * keepAlpha → WebP/PNG with transparency (cut-outs); otherwise JPEG on a neutral background.
 */
export function fileToDataUrl(file, { max = 900, quality = 0.85, keepAlpha = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error(t('Please choose an image file.')));
    if (file.size > 8 * 1024 * 1024) return reject(new Error(t('Image is larger than 8 MB.')));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const ctx = c.getContext('2d');
      if (!keepAlpha) { ctx.fillStyle = '#e5e1d7'; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let out = keepAlpha ? c.toDataURL('image/webp', quality) : c.toDataURL('image/jpeg', quality);
      if (keepAlpha && !out.startsWith('data:image/webp')) out = c.toDataURL('image/png');
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(t('Could not read that image.'))); };
    img.src = url;
  });
}

export function downloadCsv(name, rows) {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['﻿' + rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
