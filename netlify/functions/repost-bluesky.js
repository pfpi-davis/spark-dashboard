const fetch = global.fetch || require('node-fetch')

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { uri, cid } = JSON.parse(event.body)
  const handle = process.env.BLUESKY_HANDLE
  const password = process.env.BLUESKY_APP_PASSWORD

  if (!uri || !cid) {
    return { statusCode: 400, body: "Missing 'uri' or 'cid'" }
  }

  if (!handle || !password) {
    return { statusCode: 403, body: 'Missing BlueSky Credentials in .env' }
  }

  try {
    // 1. Authenticate
    const sessionResp = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password: password }),
    })

    if (!sessionResp.ok) throw new Error('Auth Failed')
    const session = await sessionResp.json()

    // 2. Create Repost Record
    const repostRecord = {
      $type: 'app.bsky.feed.repost',
      subject: { uri, cid },
      createdAt: new Date().toISOString(),
    }

    const createResp = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({
        repo: session.did,
        collection: 'app.bsky.feed.repost',
        record: repostRecord,
      }),
    })

    if (!createResp.ok) {
      throw new Error(`Repost Failed: ${await createResp.text()}`)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (error) {
    console.error(error)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }
}
