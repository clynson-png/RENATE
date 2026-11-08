import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const output = path.join(root, 'docs/beta-offline/LOCAL_CARD_IMAGE_CANDIDATES_APPROVAL_2026-11-06.png');
const candidates = [
  ['P1 · Pistola de ar SH1', 'public/renate-pack/cards/photos/ADANA_WSPS_P1_AIR_PISTOL_ILLUSTRATION.png', 'Ilustração fotorrealista · não é fotografia oficial'],
  ['P2 · Pistola de ar SH1', 'public/renate-pack/cards/adana-assets/ADANA_WSPS_P2_AIR_PISTOL_ILLUSTRATION.png', 'Ilustração fotorrealista · não é fotografia oficial'],
  ['P4 · Pistola 50 m SH1', 'public/renate-pack/cards/photos/ADANA_WSPS_P4_PARALYMPIC_RANGE_ILLUSTRATION.png', 'Ilustração fotorrealista · não é fotografia oficial'],
  ['P6 · Pistola de ar · equipe', 'public/renate-pack/cards/adana-assets/ADANA_WSPS_P6_MIXED_AIR_PISTOL_ILLUSTRATION.png', 'Ilustração fotorrealista · não é fotografia oficial'],
  ['R3/R10 · Rifle prone SH1 · 10 m', 'data/imports/generated_card_images_2026-11-06/RENATE_R3_R10_SH1_PRONE_10M.png', 'Ilustração gerada · APROVADA pelo usuário · sem apoio sob a arma'],
  ['R4 · Rifle em pé SH2 · 10 m', 'data/imports/generated_card_images_2026-11-06/RENATE_R4_SH2_STANDING_10M.png', 'Ilustração gerada · aguardando aprovação · suporte fork'],
  ['R7/R8 · Rifle 3 posições SH1 · 50 m', 'data/imports/generated_card_images_2026-11-06/RENATE_R7_R8_SH1_50M_THREE_POSITIONS_STANDING.png', 'Ilustração gerada · aguardando aprovação · sem apoio sob a arma'],
  ['R5 · Carabina 10 m SH2', 'public/renate-pack/cards/adana-assets/WSPS_R5_10m_Air_Rifle_SH2_Phase_2026.png', 'Ilustração fotorrealista · apoio de mola visível · SH2'],
  ['R6 · Rifle 50 m SH1', 'public/renate-pack/cards/photos/R6_RIO2016_QUALIFICATION_THOMAS_LOVELOCK_OIS_IOC.jpg', 'Fotografia histórica · Thomas Lovelock/OIS/IOC · sem apoio sob o rifle'],
];
const cellWidth = 540;
const imageHeight = 320;
const labelHeight = 78;
const margin = 28;
const headerHeight = 100;
const rows = Math.ceil(candidates.length / 2);
const width = margin * 3 + cellWidth * 2;
const height = headerHeight + margin + rows * (imageHeight + labelHeight + margin);
const composites = [];

const svgText = (title, note) => Buffer.from(`<svg width="${cellWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0d2531"/><text x="18" y="30" font-family="Arial,sans-serif" font-size="19" font-weight="700" fill="#c8ff4d">${title}</text><text x="18" y="57" font-family="Arial,sans-serif" font-size="13" fill="#d9e7ea">${note}</text></svg>`);
for (const [index, [title, relPath, note]] of candidates.entries()) {
  const filePath = path.join(root, relPath);
  if (!fs.existsSync(filePath)) throw new Error(`Imagem local ausente: ${relPath}`);
  const x = margin + (index % 2) * (cellWidth + margin);
  const y = headerHeight + margin + Math.floor(index / 2) * (imageHeight + labelHeight + margin);
  const image = await sharp(filePath).rotate().resize(cellWidth, imageHeight, { fit: 'cover', position: 'centre' }).jpeg({ quality: 88 }).toBuffer();
  composites.push({ input: image, left: x, top: y }, { input: svgText(title, note), left: x, top: y + imageHeight });
}
const header = Buffer.from(`<svg width="${width}" height="${headerHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#06131c"/><text x="${margin}" y="42" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#42d7e5">RENATE · imagens locais para aprovação</text><text x="${margin}" y="72" font-family="Arial,sans-serif" font-size="14" fill="#d9e7ea">Arquivos já existentes no pacote local. Ilustração fotorrealista não é fotografia oficial.</text></svg>`);
composites.push({ input: header, left: 0, top: 0 });
await sharp({ create: { width, height, channels: 3, background: '#081923' } }).composite(composites).png().toFile(output);
console.log(output);
