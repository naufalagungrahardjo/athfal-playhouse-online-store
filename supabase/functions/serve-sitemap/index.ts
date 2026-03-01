import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Fetch published blogs with slugs
    const { data: blogs } = await supabaseClient
      .from('blogs')
      .select('slug, updated_at')
      .eq('published', true)
      .order('created_at', { ascending: false })

    // Fetch products
    const { data: products } = await supabaseClient
      .from('products')
      .select('product_id, updated_at')
      .order('created_at', { ascending: false })

    // Fetch categories
    const { data: categories } = await supabaseClient
      .from('categories')
      .select('slug, updated_at')
      .order('order_num', { ascending: true })

    let dynamicUrls = ''

    // Add category URLs
    if (categories) {
      for (const cat of categories) {
        dynamicUrls += `
  <url>
    <loc>https://athfalplayhouse.com/products/${cat.slug}</loc>
    <lastmod>${new Date(cat.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      }
    }

    // Add product URLs
    if (products) {
      for (const product of products) {
        dynamicUrls += `
  <url>
    <loc>https://athfalplayhouse.com/product/${product.product_id}</loc>
    <lastmod>${new Date(product.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      }
    }

    // Add blog URLs
    if (blogs) {
      for (const blog of blogs) {
        if (blog.slug) {
          dynamicUrls += `
  <url>
    <loc>https://athfalplayhouse.com/blog/${blog.slug}</loc>
    <lastmod>${new Date(blog.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
        }
      }
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://athfalplayhouse.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://athfalplayhouse.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://athfalplayhouse.com/products</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://athfalplayhouse.com/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://athfalplayhouse.com/faq</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://athfalplayhouse.com/gallery</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>${dynamicUrls}
</urlset>`

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    // Fallback static sitemap on error
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://athfalplayhouse.com/</loc><priority>1.0</priority></url>
  <url><loc>https://athfalplayhouse.com/about</loc><priority>0.8</priority></url>
  <url><loc>https://athfalplayhouse.com/products</loc><priority>0.9</priority></url>
  <url><loc>https://athfalplayhouse.com/blog</loc><priority>0.8</priority></url>
</urlset>`
    return new Response(fallback, {
      headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }
})
