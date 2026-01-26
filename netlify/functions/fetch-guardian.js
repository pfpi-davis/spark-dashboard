import fetch from 'node-fetch';

export const handler = async function (event, context) {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) return { statusCode: 500, body: "Server missing GUARDIAN_API_KEY" };

  const apiUrl = `https://content.guardianapis.com/search?section=environment&show-fields=trailText,thumbnail,byline&page-size=20&api-key=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    const items = data.response.results.map(article => ({
      pluginId: 'feed-aggregator',
      externalId: article.id,
      title: article.webTitle,
      url: article.webUrl,
      summary: article.fields?.trailText || "", 
      publishedAt: article.webPublicationDate,
      ingestedAt: new Date(),
      nativeData: { source: "The Guardian", author: article.fields?.byline, image: article.fields?.thumbnail }
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    };
  } catch (error) {
    console.error("Guardian Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
  }
};