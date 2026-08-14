export function publicFooter(html) {
  return /<footer class="public-footer">[\s\S]*?<\/footer>/i.exec(html)?.[0] ?? "";
}
