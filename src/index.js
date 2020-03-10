import AccountNames from '../accounts.json'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  if (event.request.method === 'GET') {
    let response = await serveAsset(event)
    if (response.status > 399) {
      response = new Response(response.statusText, { status: response.status })
    }
    return response
  } else {
    return new Response('Method not allowed', {
      status: 405
    })
  }
}

async function serveAsset(event) {
  const cache = caches.default
  let response = await cache.match(event.request)

  if (!response) {
    const url = new URL(event.request.url)

    const accountName = AccountNames[url.host]
    if (!accountName)
      return new Response('Unrecognized host', { status: 400 })

    const originUrl = `https://${accountName}.blob.core.windows.net${url.pathname}`
    console.log('Fetching from origin: ' + originUrl)

    response = await fetch(originUrl)

    const headers = { 'cache-control': 'public, max-age=14400' }
    response = new Response(response.body, { ...response, headers })
    
    event.waitUntil(cache.put(event.request, response.clone()))
  }
  return response
}