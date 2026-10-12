/* Shared semantic IDs for the live renderer and offline build. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HandbookHeadings = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function id(text, level) {
    text = text.trim();
    const slug = value => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
    if (level === 2) {
      const chapter = text.match(/^第\s*(\d+)\s*章/), appendix = text.match(/^附录\s*([A-Z])/i);
      return chapter ? 'ch' + chapter[1] : appendix ? 'app' + appendix[1].toUpperCase() : 'chapter-' + slug(text);
    }
    const number = text.match(/^(\d+(?:\.\d+)+)(?:\s|$)/), appendix = text.match(/^([AB]\d+)(?:\s|$)/);
    return number ? 'sec-' + number[1].replace(/\./g, '-') : appendix ? appendix[1].toLowerCase() : slug(text);
  }
  return { id };
});
