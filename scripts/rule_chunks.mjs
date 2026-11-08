const roman = 'IVXLCDM';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sectionLocatorAliases(section, subsection, item, decimal) {
  if (!section) return unique([decimal, item]);
  const values = [`Section ${section}`, section];
  if (subsection) values.push(`${section}.${subsection}`, `${subsection}`, `${section}(${subsection})`);
  if (item) {
    values.push(`${section}.${subsection ? `${subsection}.` : ''}${item}`);
    if (subsection) values.push(`${subsection}.${item}`);
  }
  if (decimal) {
    values.push(decimal);
    const dotted = decimal.replace(/\.$/, '');
    if (dotted) values.push(dotted);
    if (item && subsection) values.push(`${section}.${subsection}.${dotted}`);
    if (subsection) values.push(`${subsection}.${dotted}`);
  }
  return unique(values);
}

export function makeRuleChunks(text) {
  const lines = text.replace(/\r/g, '').split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const chunks = [];
  let buffer = [];
  let chars = 0;
  let section = null;
  let subsection = null;
  let item = null;
  let decimal = null;
  let numericParent = null;
  let appendix = null;
  let appendixSection = null;
  let alphaSection = null;
  let pageAlias = null;
  let observationList = false;
  let locator = null;
  let locatorAliases = [];

  const flush = () => {
    const content = buffer.join(' ').replace(/\s+/g, ' ').trim();
    if (content) chunks.push({ locator, locatorAliases: unique([...locatorAliases, pageAlias].filter((alias) => alias && alias !== locator)), text: content });
    buffer = [];
    chars = 0;
  };
  const setHeading = (nextLocator, nextAliases) => {
    if (buffer.length && (chars > 180 || nextLocator !== locator)) flush();
    locator = nextLocator;
    locatorAliases = unique(nextAliases);
  };

  for (const line of lines) {
    const pageMarker = line.match(/^---\s*(?:PDF\s+)?PAGE\s+0*(\d+)\b/i);
    if (pageMarker) {
      flush();
      pageAlias = `PDF p. ${Number(pageMarker[1])}`;
      continue;
    }

    const appendixHeading = line.match(/^(?:appendix|ap[eê]ndice)\s+(\d+)\b/i);
    if (appendixHeading) {
      appendix = appendixHeading[1];
      appendixSection = null; alphaSection = null; section = null; subsection = null; item = null; decimal = null; numericParent = null;
      const aliases = [`Appendix ${appendix}`, `Apêndice ${appendix}`];
      setHeading(`Appendix ${appendix}`, aliases);
      buffer.push(line); chars += line.length;
      continue;
    }

    const letterNumberHeading = line.match(/^([A-Z])\.(\d+(?:\.\d+)*)\s*(?:[-–—.:)]\s*)?(.+)$/i);
    if (letterNumberHeading) {
      alphaSection = `${letterNumberHeading[1].toUpperCase()}.${letterNumberHeading[2]}`;
      subsection = null; item = null; decimal = null; numericParent = null;
      const aliases = [alphaSection, `${letterNumberHeading[1].toUpperCase()} ${letterNumberHeading[2]}`];
      setHeading(alphaSection, aliases);
      buffer.push(line); chars += line.length;
      continue;
    }

    const appendixNumberHeading = appendix && line.match(/^(\d{1,2})\s*$/);
    if (appendixNumberHeading) {
      appendixSection = appendixNumberHeading[1]; item = null; decimal = null; numericParent = null;
      const aliases = [`Appendix ${appendix} §${appendixSection}`, `Appendix ${appendix}`, `Apêndice ${appendix}`, appendixSection];
      setHeading(`Appendix ${appendix} §${appendixSection}`, aliases);
      buffer.push(line); chars += line.length;
      continue;
    }

    const appendixTextHeading = appendix && line.match(/^(\d{1,2})\s+(.+)$/);
    if (appendixTextHeading) {
      appendixSection = appendixTextHeading[1]; item = null; decimal = null; numericParent = null;
      const aliases = [`Appendix ${appendix} §${appendixSection}`, `Appendix ${appendix}`, `Apêndice ${appendix}`, appendixSection];
      setHeading(`Appendix ${appendix} §${appendixSection}`, aliases);
      buffer.push(line); chars += line.length;
      continue;
    }

    const sectionHeading = line.match(new RegExp(`^([${roman}]{1,8})\\s*[-–—.:]\\s*(.+)$`));
    const namedSection = line.match(new RegExp(`^(?:section|se[cç][aã]o)\\s+(([${roman}]{1,8}))\\b\\s*[:.\\-–—]?\\s*(.*)$`, 'i'));
    if (sectionHeading || namedSection) {
      section = (sectionHeading?.[1] ?? namedSection?.[1]).toUpperCase();
      subsection = null; item = null; decimal = null; alphaSection = null; appendix = null; appendixSection = null; observationList = false;
      numericParent = null;
      const aliases = [`Section ${section}`, `Seção ${section}`, section];
      setHeading(`Section ${section}`, aliases);
      buffer.push(line); chars += line.length;
      continue;
    }

    const letterHeading = line.match(/^([a-z])\s*[).]\s*(.+)$/i);
    // Deeply numbered rules often put their lettered clauses on separate OCR lines.
    // A shallow number inside a Roman section is more likely to be followed by the next
    // top-level Roman subsection, so let that heading take precedence there.
    const letteredNumericSubitem = numericParent && line.match(/^\(?([a-z])(?:\)|[.])\s+(.+)$/i);
    const isDeepNumericSubitem = letteredNumericSubitem && (!section || numericParent.split('.').length >= 3);
    if (isDeepNumericSubitem) {
      const letter = letteredNumericSubitem[1].toLowerCase();
      const bareParenthetical = `${numericParent}(${letter})`;
      const parenthetical = appendix ? `Appendix ${appendix} §${bareParenthetical}` : bareParenthetical;
      const dotted = `${numericParent}.${letter}`;
      setHeading(parenthetical, [parenthetical, bareParenthetical, dotted, numericParent]);
      buffer.push(line); chars += line.length;
      continue;
    }

    if (section && letterHeading) {
      subsection = letterHeading[1].toLowerCase(); item = null; decimal = null; observationList = false;
      numericParent = null;
      const aliases = sectionLocatorAliases(section, subsection, null, null);
      setHeading(`${section}.${subsection}`, aliases);
      buffer.push(line); chars += line.length;
      continue;
    }

    const numericHeading = line.match(/^(?:art(?:igo)?\.?\s*)?((?:\d+\.)+\d+[a-z]?)\s*[.)\-–:]?\s*(.*)$/i);

    const observationItem = line.match(/^(?:(?:obs(?:erva[cç][aã]o)?|observation)\.?\s*:?)?\s*(\d+)\s*[-–—]\s*(.+)$/i);
    if (observationItem && (observationList || /^(?:obs(?:erva[cç][aã]o)?|observation)\.?\s*(?::|\d)/i.test(line))) {
      observationList = true;
      const number = observationItem[1];
      const locator = `Observação ${number}`;
      const aliases = [`Observation ${number}`, `Observacao ${number}`, `Obs. ${number}`, `Obs ${number}`];
      setHeading(locator, aliases);
      buffer.push(line); chars += line.length;
      continue;
    }

    const parentheticalSubitem = line.match(/^((?:\d+\.)+\d+)\s*\(([a-z])\)\s*(.*)$/i);
    if (parentheticalSubitem) {
      const base = parentheticalSubitem[1].replace(/\.$/, '');
      const letter = parentheticalSubitem[2].toLowerCase();
      const parenthetical = `${base}(${letter})`;
      const dotted = `${base}.${letter}`;
      decimal = base; item = letter;
      const aliases = [dotted, parenthetical, base, ...(sectionLocatorAliases(section, subsection, null, base))];
      setHeading(parenthetical, aliases);
      buffer.push(line); chars += line.length;
      continue;
    }

    if (numericHeading) {
      decimal = numericHeading[1].replace(/\.$/, '');
      numericParent = decimal;
      const aliases = sectionLocatorAliases(section, subsection, item, decimal);
      const appendixLocator = appendix ? `Appendix ${appendix} §${decimal}` : null;
      const hierarchical = alphaSection ? `${alphaSection}.${decimal}` : appendixLocator ?? (section && subsection ? `${section}.${subsection}.${decimal}` : decimal);
      if (appendixLocator) aliases.push(appendixLocator, `Appendix ${appendix}`, `Apêndice ${appendix}`, decimal);
      if (alphaSection) aliases.push(`${alphaSection}.${decimal}`, decimal);
      setHeading(hierarchical, aliases);
      buffer.push(line); chars += line.length;
      continue;
    }

    const itemHeading = line.match(/^(\d+)\s*[.)]\s+(.+)$/);
    if (itemHeading) {
      item = itemHeading[1]; decimal = null;
      const aliases = sectionLocatorAliases(section, subsection, item, null);
      let hierarchical = section ? `${section}.${subsection ? `${subsection}.` : ''}${item}` : item;
      if (alphaSection) {
        hierarchical = `${alphaSection}.${item}`;
        aliases.push(`${alphaSection}(${item})`, hierarchical, alphaSection);
      } else if (appendix) {
        const appendixPrefix = `Appendix ${appendix} §${appendixSection ? `${appendixSection}.` : ''}`;
        hierarchical = `${appendixPrefix}${item}`;
        aliases.push(hierarchical, `Appendix ${appendix}`, `Apêndice ${appendix}`);
      }
      setHeading(hierarchical, aliases);
      buffer.push(line); chars += line.length;
      continue;
    }

    buffer.push(line);
    chars += line.length;
    if (chars >= 1050) flush();
  }
  flush();
  return chunks;
}
