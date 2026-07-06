// Minimale RSS 2.0 + Atom parser. Bewust simpel gehouden (regex-gebaseerd):
// vacature-feeds zijn kleine, vlakke XML-documenten waarvoor geen volledige
// XML-parser nodig is.

export interface FeedItem {
  titel: string;
  url: string;
  samenvatting: string | null;
  gepubliceerdOp: string | null;
}

function stripCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1').trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function tagContent(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decodeEntities(stripCdata(m[1])) : null;
}

export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];

  // RSS 2.0: <item>…</item>
  const rssItems = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  for (const block of rssItems) {
    const titel = tagContent(block, 'title');
    const url = tagContent(block, 'link');
    if (!titel || !url) continue;
    const beschrijving = tagContent(block, 'description');
    items.push({
      titel: stripHtml(titel),
      url: url.trim(),
      samenvatting: beschrijving ? stripHtml(beschrijving).slice(0, 500) : null,
      gepubliceerdOp: tagContent(block, 'pubDate'),
    });
  }

  // Atom: <entry>…</entry> met <link href="..."/>
  if (items.length === 0) {
    const entries = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
    for (const block of entries) {
      const titel = tagContent(block, 'title');
      const linkMatch = block.match(/<link[^>]*href="([^"]+)"/i);
      if (!titel || !linkMatch) continue;
      const samenvatting = tagContent(block, 'summary') ?? tagContent(block, 'content');
      items.push({
        titel: stripHtml(titel),
        url: decodeEntities(linkMatch[1]),
        samenvatting: samenvatting ? stripHtml(samenvatting).slice(0, 500) : null,
        gepubliceerdOp: tagContent(block, 'updated') ?? tagContent(block, 'published'),
      });
    }
  }

  return items;
}

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'vacatures-dashboard/1.0 (persoonlijke feedreader)' },
  });
  if (!res.ok) throw new Error(`feed gaf status ${res.status}`);
  return parseFeed(await res.text());
}
