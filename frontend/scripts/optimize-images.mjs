// Image optimizer: compress large JPG/JPEG/WEBP files in-place while keeping filenames
// Usage: node scripts/optimize-images.mjs

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const IMAGES_DIR = path.resolve(process.cwd(), 'public', 'images');
const SIZE_THRESHOLD_BYTES = 140 * 1024; // Only optimize files larger than ~140 KB
const SUPPORTED_EXT = new Set(['.jpg', '.jpeg', '.webp']);

async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map(async (dirent) => {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) return await getFiles(res);
    return res;
  }));
  return files.flat();
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXT.has(ext)) return { skipped: true, reason: 'unsupported_ext' };

  const stat = await fs.stat(filePath);
  if (stat.size < SIZE_THRESHOLD_BYTES) return { skipped: true, reason: 'below_threshold', size: stat.size };

  const input = sharp(filePath, { failOnError: false });

  // Choose encoder based on original extension to keep same file type/filename
  let pipeline = input.rotate();
  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: 72, mozjpeg: true, chromaSubsampling: '4:2:0', progressive: true });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: 72, effort: 4 });
  }

  const tmpPath = `${filePath}.tmp`;
  await pipeline.toFile(tmpPath);

  const outStat = await fs.stat(tmpPath);

  // Only replace if smaller
  if (outStat.size < stat.size) {
    // Backup original just in case
    const backupPath = `${filePath}.bak`;
    try { await fs.copyFile(filePath, backupPath); } catch {}
    await fs.rename(tmpPath, filePath);
    return { optimized: true, before: stat.size, after: outStat.size, backup: backupPath };
  } else {
    // Not smaller, discard tmp
    await fs.rm(tmpPath, { force: true });
    return { optimized: false, before: stat.size, after: outStat.size };
  }
}

async function main() {
  console.log(`Optimizing images in: ${IMAGES_DIR}`);
  const files = (await getFiles(IMAGES_DIR)).filter(p => SUPPORTED_EXT.has(path.extname(p).toLowerCase()));
  if (!files.length) {
    console.log('No supported images found.');
    return;
  }

  let totalSaved = 0;
  for (const file of files) {
    try {
      const res = await optimizeFile(file);
      const name = path.relative(IMAGES_DIR, file);
      if (res.skipped) {
        if (res.reason === 'below_threshold') {
          console.log(`SKIP  ${name}  (${formatBytes(res.size)}) below threshold`);
        } else {
          console.log(`SKIP  ${name}  (unsupported)`);
        }
        continue;
      }
      if (res.optimized) {
        const saved = res.before - res.after;
        totalSaved += saved;
        console.log(`OK    ${name}  ${formatBytes(res.before)} -> ${formatBytes(res.after)}  (saved ${formatBytes(saved)})`);
      } else {
        console.log(`NOOP  ${name}  output not smaller`);
      }
    } catch (e) {
      console.error(`ERR   ${file}:`, e.message);
    }
  }
  console.log(`Total saved: ${formatBytes(totalSaved)}`);
  console.log('Done. Verify images visually. You can delete any .bak files if satisfied.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
