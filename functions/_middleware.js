function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

export async function onRequest(context) {
  const request = context.request;
  const host = request.headers.get('host');
  const hostname = host ? host.split(':')[0].toLowerCase() : '';

  if (hostname === 'utsushi.pages.dev') {
    const url = new URL(request.url);
    url.hostname = 'utsushi.taptoclicks.com';
    return Response.redirect(url.toString(), 308);
  }

  const response = await context.next();
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  const nonce = generateNonce();
  let html = await response.text();
  html = html.replace(/__CSP_NONCE__/g, nonce);

  const newHeaders = new Headers(response.headers);
  const csp = newHeaders.get('Content-Security-Policy');
  if (csp) {
    newHeaders.set('Content-Security-Policy', csp.replace(/__CSP_NONCE__/g, nonce));
  }

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
