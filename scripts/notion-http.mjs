/**
 * Minimal Notion REST client (no SDK).
 * @see https://developers.notion.com/reference/intro
 */

const NOTION_VERSION = "2022-06-28";

export function notionHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export async function notionFetch(token, path, init = {}) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: { ...notionHeaders(token), ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.message ?? res.statusText;
    throw new Error(`Notion ${path}: ${msg}`);
  }
  return body;
}

export function richTextPlain(richText = []) {
  return richText.map((t) => t.plain_text ?? "").join("");
}

export function propTitle(page, name) {
  const p = page.properties?.[name];
  if (!p || p.type !== "title") return "";
  return richTextPlain(p.title);
}

export function propRich(page, name) {
  const p = page.properties?.[name];
  if (!p) return "";
  if (p.type === "rich_text") return richTextPlain(p.rich_text);
  if (p.type === "title") return richTextPlain(p.title);
  return "";
}

export function propSelect(page, name) {
  const p = page.properties?.[name];
  if (!p || p.type !== "select" || !p.select) return null;
  return p.select.name;
}

export function propDate(page, name) {
  const p = page.properties?.[name];
  if (!p || p.type !== "date" || !p.date?.start) return null;
  return p.date.start;
}

export function propCheckbox(page, name) {
  const p = page.properties?.[name];
  if (!p || p.type !== "checkbox") return false;
  return Boolean(p.checkbox);
}

export async function queryDatabase(token, databaseId, startCursor) {
  return notionFetch(token, `/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify(
      startCursor ? { start_cursor: startCursor } : {},
    ),
  });
}

export async function queryDatabaseAll(token, databaseId) {
  const pages = [];
  let cursor;
  do {
    const res = await queryDatabase(token, databaseId, cursor);
    pages.push(...(res.results ?? []));
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

/** @param {string} urlOrId */
export function parseNotionPageId(urlOrId) {
  const raw = urlOrId.trim();
  const dashed = raw.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  if (dashed) return dashed[1];
  const hex32 =
    raw.match(/([0-9a-f]{32})(?:\?|$)/i) ||
    raw.match(/-([0-9a-f]{32})(?:\?|$)/i);
  if (hex32) {
    const h = hex32[1];
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  return raw;
}

export async function listBlockChildren(token, blockId, startCursor) {
  const q = startCursor ? `?start_cursor=${startCursor}&page_size=100` : "?page_size=100";
  return notionFetch(token, `/blocks/${blockId}/children${q}`);
}

export async function listBlockChildrenAll(token, blockId) {
  const blocks = [];
  let cursor;
  do {
    const res = await listBlockChildren(token, blockId, cursor);
    blocks.push(...(res.results ?? []));
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

export async function archiveBlock(token, blockId) {
  return notionFetch(token, `/blocks/${blockId}`, {
    method: "PATCH",
    body: JSON.stringify({ archived: true }),
  });
}

export function rt(content) {
  return [{ type: "text", text: { content: content.slice(0, 2000) } }];
}

export function paragraphBlock(text) {
  return { object: "block", type: "paragraph", paragraph: { rich_text: rt(text) } };
}

export function heading2Block(text) {
  return { object: "block", type: "heading_2", heading_2: { rich_text: rt(text) } };
}

export function bulletedItem(text) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: rt(text) },
  };
}

export async function appendBlocks(token, blockId, children) {
  const chunk = 100;
  for (let i = 0; i < children.length; i += chunk) {
    await notionFetch(token, `/blocks/${blockId}/children`, {
      method: "PATCH",
      body: JSON.stringify({ children: children.slice(i, i + chunk) }),
    });
  }
}
