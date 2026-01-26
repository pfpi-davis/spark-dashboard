import fetch from 'node-fetch';

export const handler = async function (event, context) {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) return { statusCode: 500, body: "Server missing CONGRESS_API_KEY" };

  // Fetch latest 100 bills (sorted by update date)
  const baseUrl = `https://api.congress.gov/v3/bill?api_key=${apiKey}&format=json&limit=100&sort=updateDate+desc`;

  const KEYWORDS = [
    'biomass', 'bioenergy', 'forest', 'logging', 'timber', 
    'wood', 'carbon', 'climate', 'renewable', 'energy', 
    'pollution', 'environment', 'emissions'
  ];

  try {
    const response = await fetch(baseUrl);
    const data = await response.json();

    if (!data.bills) return { statusCode: 200, body: JSON.stringify([]) };

    const relevantBills = data.bills.filter(bill => {
      const text = (bill.title + ' ' + (bill.latestAction?.text || '')).toLowerCase();
      return KEYWORDS.some(k => text.includes(k));
    }).map(bill => {
      let typeSlug = 'house-bill';
      if (bill.type === 'S') typeSlug = 'senate-bill';
      else if (bill.type === 'HRES') typeSlug = 'house-resolution';
      else if (bill.type === 'SRES') typeSlug = 'senate-resolution';
      else if (bill.type === 'HJRES') typeSlug = 'house-joint-resolution';
      else if (bill.type === 'SJRES') typeSlug = 'senate-joint-resolution';

      return {
        // Spark Standard Fields
        pluginId: 'feed-aggregator',
        externalId: `congress-${bill.type}${bill.number}`,
        title: `${bill.type}${bill.number}: ${bill.title}`,
        url: `https://www.congress.gov/bill/${bill.congress}th-congress/${typeSlug}/${bill.number}`,
        summary: `Latest Action: ${bill.latestAction?.text || 'No recent action'}`,
        publishedAt: bill.updateDate || bill.latestAction?.actionDate,
        ingestedAt: new Date(),
        nativeData: { source: "US Congress", origin: bill.originChamber, isOfficial: true }
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(relevantBills),
    };
  } catch (error) {
    console.error("Congress Fetch Failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
  }
};