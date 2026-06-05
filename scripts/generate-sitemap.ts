// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Fetches dynamic product/category routes from Supabase so crawlers can reach them.
// Private routes (/cart, /checkout, /order-details/:id) are intentionally excluded —
// they are non-indexable and already disallowed in robots.txt.

import { writeFileSync } from "fs"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

const BASE_URL = "https://athfalplayhouse.com"

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://wjfsfojfeyznnddxfspx.supabase.co"
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""

interface SitemapEntry {
  path: string
  lastmod?: string
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: string
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/products", changefreq: "weekly", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/gallery", changefreq: "monthly", priority: "0.6" },
]

async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  if (!SUPABASE_KEY) {
    console.warn("No Supabase key found — writing static sitemap only.")
    return []
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const entries: SitemapEntry[] = []

  try {
    // Categories -> /products/:category
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .order("order_num", { ascending: true })

    for (const cat of categories || []) {
      if (!cat.slug) continue
      entries.push({
        path: `/products/${cat.slug}`,
        lastmod: cat.updated_at ? new Date(cat.updated_at).toISOString().split("T")[0] : undefined,
        changefreq: "weekly",
        priority: "0.7",
      })
    }

    // Products -> /product/:id
    const { data: products } = await supabase
      .from("products")
      .select("product_id, updated_at")
      .order("created_at", { ascending: false })

    for (const product of products || []) {
      if (!product.product_id) continue
      entries.push({
        path: `/product/${product.product_id}`,
        lastmod: product.updated_at ? new Date(product.updated_at).toISOString().split("T")[0] : undefined,
        changefreq: "weekly",
        priority: "0.7",
      })
    }

    // Blogs -> /blog/:slug
    const { data: blogs } = await supabase
      .from("blogs")
      .select("slug, updated_at")
      .eq("published", true)
      .order("created_at", { ascending: false })

    for (const blog of blogs || []) {
      if (!blog.slug) continue
      entries.push({
        path: `/blog/${blog.slug}`,
        lastmod: blog.updated_at ? new Date(blog.updated_at).toISOString().split("T")[0] : undefined,
        changefreq: "monthly",
        priority: "0.6",
      })
    }
  } catch (err) {
    console.warn("Failed to fetch dynamic sitemap entries:", err)
  }

  return entries
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  )

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n")
}

async function main() {
  const dynamicEntries = await fetchDynamicEntries()
  const entries = [...staticEntries, ...dynamicEntries]
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries))
  console.log(`sitemap.xml written (${entries.length} entries)`)
}

main()