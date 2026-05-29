/**
 * Pomocnicze funkcje do obsługi linków YouTube.
 *
 * - extractYoutubeId(url): zwraca ID filmu lub null.
 * - fetchYoutubeTitle(url): używa publicznego endpointu oEmbed YouTube
 *   (bez klucza API) by pobrać tytuł i nazwę kanału.
 */

const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be"
]);

export function extractYoutubeId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (!YT_HOSTS.has(url.hostname)) return null;

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }

    // /shorts/<id>, /embed/<id>, /live/<id>
    const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
    if (m) return m[1];

    return null;
  } catch {
    return null;
  }
}

export type YoutubeMeta = {
  title: string;
  author: string;
  thumbnail: string;
};

export async function fetchYoutubeMeta(url: string): Promise<YoutubeMeta | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title: string;
      author_name: string;
      thumbnail_url: string;
    };
    return {
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url
    };
  } catch {
    return null;
  }
}
