const ascii = (value: string) => value
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/[—–]/g, '-')
  .replace(/[^\x20-\x7E\n]/g, '');

const escapePdf = (value: string) => ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const wrap = (value: string, width = 88) => {
  const lines: string[] = [];
  value.split(/\n+/).forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let line = '';
    words.forEach((word) => {
      if (`${line} ${word}`.trim().length > width) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = `${line} ${word}`.trim();
      }
    });
    if (line) lines.push(line);
    lines.push('');
  });
  return lines;
};

export function downloadTherapyBriefPdf(title: string, content: string) {
  const allLines = [title.toUpperCase(), '', ...wrap(content)];
  const pages: string[][] = [];
  for (let index = 0; index < allLines.length; index += 48) pages.push(allLines.slice(index, index + 48));

  const objects: string[] = [];
  const add = (body: string) => {
    objects.push(body);
    return objects.length;
  };
  const catalogId = add('');
  const pagesId = add('');
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds: number[] = [];

  pages.forEach((lines) => {
    const streamLines = lines.map((line, index) => {
      const size = index === 0 ? 16 : 10;
      const leading = index === 0 ? 26 : 14;
      return `${index === 0 ? '' : `0 -${leading} Td `}/F1 ${size} Tf (${escapePdf(line)}) Tj`;
    });
    const stream = `BT 56 748 Td ${streamLines.join('\n')} ET`;
    const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'therapy-session-brief.pdf';
  anchor.click();
  URL.revokeObjectURL(url);
}
