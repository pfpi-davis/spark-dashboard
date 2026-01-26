// netlify/functions/fetch-nyt.js
import fetch from 'node-fetch'; // Remove this line if you already deleted it!

export const handler = async function (event, context) {
  const apiKey = process.env.NYT_API_KEY;
  if (!apiKey) return { statusCode: 500, body: "Server missing NYT_API_KEY" };

  // 1. MATCH: The Query string is identical
  const query = 'forest endangered bioenergy logging "climate change"';

  // 2. CORRECTION: This is the exact filter from your old app
  const filter = `(desk:("Environment" "Science" "Climate" "U.S." "World" "Foreign" "Politics" "Washington" "Business" "Magazine" "Opinion") OR section.name:("Climate" "Environment" "Science" "U.S." "World")) AND NOT section.name:("Arts" "Music" "Movies" "Theater" "Style")`;

  const baseUrl = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${encodeURIComponent(query)}&fq=${encodeURIComponent(filter)}&sort=newest&api-key=${apiKey}`;

  try {
    // Note: Your old code fetched 2 pages (0 and 1). This version fetches just one.
    // If you want both pages back, let me know, but Page 0 is usually sufficient for a dashboard.
    const response = await fetch(baseUrl);
    const data = await response.json();
    const docs = data?.response?.docs || [];

    const items = docs.map(doc => {
      // (Mapping logic matches your new Spark format)
      return {
        pluginId: 'feed-aggregator',
        externalId: doc._id || doc.uri, 
        title: doc.headline?.main || "Untitled Article",
        url: doc.web_url,
        summary: doc.snippet || "",
        publishedAt: doc.pub_date,
        ingestedAt: new Date(),
        nativeData: { source: "New York Times", author: doc.byline?.original?.replace('By ', '') }
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    };
  } catch (error) {
    console.error("NYT Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
  }
};