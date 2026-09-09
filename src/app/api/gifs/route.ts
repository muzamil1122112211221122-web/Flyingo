import { NextRequest, NextResponse } from "next/server";

const GIPHY_KEY = "3eFQvabDx69SMoOemSPiYfh9FY0nzO9x";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "trending";
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 50);

  let url = "";
  if (q.trim()) {
    url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g&lang=en`;
  } else if (category === "trending") {
    url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=g`;
  } else {
    url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(category)}&limit=${limit}&rating=g&lang=en`;
  }

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    const json = await res.json();

    if (!json.data) {
      return NextResponse.json({ gifs: [] });
    }

    const gifs = json.data.map((g: {
      id: string;
      title: string;
      images: {
        fixed_height: { url: string; width: string; height: string };
        fixed_height_small: { url: string };
        original: { url: string };
      };
    }) => ({
      id: g.id,
      title: g.title,
      url: g.images.fixed_height.url,
      preview: g.images.fixed_height_small?.url || g.images.fixed_height.url,
    }));

    return NextResponse.json({ gifs });
  } catch (err) {
    console.error("GIF fetch error:", err);
    return NextResponse.json({ gifs: [], error: "Failed to fetch GIFs" }, { status: 500 });
  }
}
