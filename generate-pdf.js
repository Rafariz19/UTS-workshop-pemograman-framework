const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { execSync } = require('child_process');

const mdPath = path.join(__dirname, 'docs', 'Laporan_Fallback.md');
const htmlPath = path.join(__dirname, 'docs', 'Laporan_Fallback.html');
const pdfPath = path.join(__dirname, 'docs', 'Laporan_Fallback.pdf');

let mdContent = fs.readFileSync(mdPath, 'utf8');

// Ganti path relatif screenshot dengan base64 data URLs agar langsung ter-embed di PDF
mdContent = mdContent.replace(/\!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
  try {
    let cleanSrc = src.trim();
    if (cleanSrc.startsWith('../docs/')) {
      cleanSrc = cleanSrc.replace('../docs/', 'docs/');
    } else if (!cleanSrc.startsWith('docs/')) {
      cleanSrc = path.join('docs', cleanSrc);
    }
    const absImgPath = path.resolve(__dirname, cleanSrc);
    if (fs.existsSync(absImgPath)) {
      const ext = path.extname(absImgPath).replace('.', '');
      const base64 = fs.readFileSync(absImgPath).toString('base64');
      return `![${alt}](data:image/${ext};base64,${base64})`;
    }
  } catch (err) {
    console.error('Gagal convert gambar:', src, err.message);
  }
  return match;
});

// Ganti caption gambar khusus (*Gambar x.x: ...*) menjadi class caption terpisah,
// agar tidak mengganggu tag <em> inline biasa di dalam paragraf.
mdContent = mdContent.replace(/\*(Gambar \d+\.\d+:.*?)\*/g, '<p class="caption">$1</p>');

const htmlBody = marked.parse(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title></title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }
    * {
      font-family: 'Times New Roman', Times, serif;
      color: #000000 !important;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 12pt;
      line-height: 1.5;
      color: #000000 !important;
      background: #ffffff !important;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 16pt;
      text-align: center;
      margin-top: 15px;
      margin-bottom: 6px;
      font-weight: bold;
      color: #000000 !important;
      line-height: 1.3;
    }
    h2 {
      font-size: 14pt;
      margin-top: 22px;
      margin-bottom: 10px;
      font-weight: bold;
      border-bottom: 1px solid #000000;
      padding-bottom: 4px;
      color: #000000 !important;
      page-break-after: avoid;
    }
    h3 {
      font-size: 13pt;
      margin-top: 16px;
      margin-bottom: 6px;
      font-weight: bold;
      color: #000000 !important;
      page-break-after: avoid;
    }
    h4 {
      font-size: 12pt;
      margin-top: 12px;
      margin-bottom: 4px;
      font-weight: bold;
      color: #000000 !important;
      page-break-after: avoid;
    }
    p, li {
      font-size: 12pt;
      color: #000000 !important;
      text-align: justify;
      margin-bottom: 8px;
    }
    /* Pastikan teks miring (em / italic) selalu inline murni tanpa jeda baris */
    em, i {
      display: inline !important;
      font-style: italic !important;
      margin: 0 !important;
      padding: 0 !important;
      text-align: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
    }
    strong, b {
      display: inline !important;
      font-weight: bold !important;
      margin: 0 !important;
      padding: 0 !important;
      text-align: inherit !important;
    }
    ul, ol {
      margin-top: 4px;
      margin-bottom: 10px;
      padding-left: 28px;
    }
    a {
      color: #000000 !important;
      text-decoration: underline;
    }
    hr {
      border: 0;
      border-top: 1px solid #000000;
      margin: 15px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10.5pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #000000;
      padding: 6px 10px;
      text-align: left;
      color: #000000 !important;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
      color: #000000 !important;
    }
    tr:nth-child(even) td {
      background-color: #ffffff;
    }
    pre {
      background-color: #fafafa;
      border: 1px solid #000000;
      border-radius: 2px;
      padding: 8px 12px;
      font-family: 'Consolas', 'Courier New', monospace !important;
      font-size: 9pt;
      overflow-x: auto;
      page-break-inside: avoid;
      line-height: 1.35;
      color: #000000 !important;
      white-space: pre;
    }
    code {
      font-family: 'Consolas', 'Courier New', monospace !important;
      font-size: 10.5pt;
      background-color: #f2f2f2;
      padding: 1px 3px;
      color: #000000 !important;
      display: inline !important;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      color: #000000 !important;
      display: block !important;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 12px auto 4px auto;
      border: 1px solid #000000;
      page-break-inside: avoid;
    }
    p.caption {
      text-align: center !important;
      font-size: 10pt !important;
      font-style: italic !important;
      margin-top: 4px !important;
      margin-bottom: 14px !important;
      color: #000000 !important;
      page-break-after: avoid;
    }
    blockquote {
      border-left: 3px solid #000000;
      background-color: #fafafa;
      margin: 10px 0;
      padding: 6px 12px;
      font-size: 11pt;
      color: #000000 !important;
    }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

fs.writeFileSync(htmlPath, fullHtml, 'utf8');
console.log('HTML berhasil diperbarui dengan em inline murni:', htmlPath);

// Konversi ke PDF menggunakan Edge headless tanpa header dan footer bawaan peramban
const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cmd = `"${edgeExe}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
console.log('Menjalankan konversi PDF...');
execSync(cmd, { stdio: 'inherit' });

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log(`PDF berhasil dibuat: ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB)`);
} else {
  console.error('Gagal membuat PDF');
  process.exit(1);
}
