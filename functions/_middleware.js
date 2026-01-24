export async function onRequest(context) {
  const request = context.request;
  const host = request.headers.get('host');

  if (host && host.toLowerCase() === 'utsushi.pages.dev') {
    const url = new URL(request.url);
    url.hostname = 'utsushi.taptoclicks.com';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
