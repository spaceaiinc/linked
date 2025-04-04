// import { allPosts } from "@/generated";
// import { type MetadataRoute } from "next";
// import { companyConfig } from "@/config";

// export default function sitemap(): MetadataRoute.Sitemap {
//   const posts = allPosts;

//   const staticLinks = [
//     "/blog",
//     "/pdf",
//     "/audio",
//     "/chat",
//     "/openai/gpt",
//     "/openai/dalle",
//     "/openai/vision",
//     "/replicate/sdxl",
//     "/groq/llama",
//   ];

//   return [
//     {
//       url: companyConfig.company.homeUrl,
//       lastModified: new Date(),
//       changeFrequency: "yearly",
//       priority: 1,
//     },
//     ...staticLinks.map((path) => ({
//       url: `${companyConfig.company.homeUrl}${path}`,
//       lastModified: new Date(),
//       changeFrequency: "yearly",
//       priority: 0.8,
//     })),
//     ...posts.map((post) => ({
//       url: `${companyConfig.company.homeUrl}/blog${post.slug}`,
//       lastModified: new Date(post.date),
//       priority: 0.7,
//     })),
//   ];
// }

import { companyConfig } from '@/config'
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: companyConfig.company.homeUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${companyConfig.company.homeUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${companyConfig.company.homeUrl}/auth/confirm`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${companyConfig.company.homeUrl}/thanks`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
