const fetch = global.fetch || require('node-fetch')

exports.handler = async function (event, context) {
  const { q } = event.queryStringParameters || {}

  if (!q) {
    return { statusCode: 400, body: "Missing query parameter 'q'" }
  }

  const handle = process.env.BLUESKY_HANDLE
  const password = process.env.BLUESKY_APP_PASSWORD

  const hasAuth = handle && password
  let token = null

  try {
    // 1. Authenticate (if credentials exist)
    if (hasAuth) {
      console.log('Authenticating with Bluesky...')
      const sessionResp = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: handle, password: password }),
      })

      if (!sessionResp.ok) {
        throw new Error(`Auth Failed: ${sessionResp.status} ${await sessionResp.text()}`)
      }

      const sessionData = await sessionResp.json()
      token = sessionData.accessJwt
    }

    // 2. Perform Search
    const host = hasAuth ? 'https://api.bsky.app' : 'https://public.api.bsky.app'
    const endpoint = `${host}/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=25`

    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    console.log(`Searching: ${endpoint}`)
    const response = await fetch(endpoint, { headers })

    if (!response.ok) {
      if (response.status === 403 && !hasAuth) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            error:
              'Bluesky Public Search is rate-limited. Please add BLUESKY_HANDLE and BLUESKY_APP_PASSWORD to .env',
          }),
        }
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // 3. Transform Data
    const posts = (data.posts || []).map((post) => {
      // EXTRACT IMAGE LOGIC
      let image = null
      if (post.embed) {
        // Standard Images
        if (post.embed.images && post.embed.images.length > 0) {
          image = post.embed.images[0].thumb
        }
        // Media with Record (e.g. quote posts with media)
        else if (
          post.embed.media &&
          post.embed.media.images &&
          post.embed.media.images.length > 0
        ) {
          image = post.embed.media.images[0].thumb
        }
      }

      return {
        id: post.uri,
        cid: post.cid,
        image: image, // <--- NEW FIELD
        author: {
          handle: post.author.handle,
          displayName: post.author.displayName || post.author.handle,
          avatar: post.author.avatar,
        },
        content: post.record.text,
        createdAt: post.record.createdAt,
        url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`,
        likes: post.likeCount || 0,
        reposts: post.repostCount || 0,
      }
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(posts),
    }
  } catch (error) {
    console.error('Handler Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    }
  }
}
