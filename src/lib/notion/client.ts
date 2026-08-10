const NOTION_VERSION = "2022-06-28";

export function getNotionToken(): string | undefined {
  return process.env.NOTION_API_KEY?.trim();
}

export function notionConfig(): {
  token: string;
  contentDatabaseId: string;
  pipelineDatabaseId: string;
} | null {
  const token = getNotionToken();
  const contentDatabaseId = process.env.NOTION_CONTENT_DB_ID?.trim();
  const pipelineDatabaseId = process.env.NOTION_PIPELINE_DB_ID?.trim();
  if (!token || !contentDatabaseId || !pipelineDatabaseId) return null;
  return { token, contentDatabaseId, pipelineDatabaseId };
}

type RichText = { plain_text?: string };

function richTextPlain(richText: RichText[] = []): string {
  return richText.map((t) => t.plain_text ?? "").join("");
}

export type NotionPage = {
  properties?: Record<
    string,
    {
      type: string;
      title?: RichText[];
      rich_text?: RichText[];
      select?: { name: string } | null;
      date?: { start?: string } | null;
      checkbox?: boolean;
    }
  >;
};

async function notionFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const token = getNotionToken();
  if (!token) throw new Error("NOTION_API_KEY not set");

  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    },
  });
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) {
    throw new Error(`Notion ${path}: ${body.message ?? res.statusText}`);
  }
  return body;
}

export function propTitle(page: NotionPage, name: string): string {
  const p = page.properties?.[name];
  if (!p || p.type !== "title") return "";
  return richTextPlain(p.title);
}

export function propRich(page: NotionPage, name: string): string {
  const p = page.properties?.[name];
  if (!p) return "";
  if (p.type === "rich_text") return richTextPlain(p.rich_text);
  if (p.type === "title") return richTextPlain(p.title);
  return "";
}

export function propSelect(page: NotionPage, name: string): string | null {
  const p = page.properties?.[name];
  if (!p || p.type !== "select" || !p.select) return null;
  return p.select.name;
}

export function propDate(page: NotionPage, name: string): string | null {
  const p = page.properties?.[name];
  if (!p || p.type !== "date" || !p.date?.start) return null;
  return p.date.start;
}

export function propCheckbox(page: NotionPage, name: string): boolean {
  const p = page.properties?.[name];
  if (!p || p.type !== "checkbox") return false;
  return Boolean(p.checkbox);
}

export async function queryDatabaseAll(databaseId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const res = (await notionFetch(`/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify(cursor ? { start_cursor: cursor } : {}),
    })) as {
      results?: NotionPage[];
      has_more?: boolean;
      next_cursor?: string | null;
    };
    pages.push(...(res.results ?? []));
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);

  return pages;
}
