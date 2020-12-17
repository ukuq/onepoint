addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
})

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {
    // preflight
    if (request.method === 'OPTIONS') return new Response(null, {
        status: 204,
        headers: new Headers({
            'access-control-allow-origin': '*',
            'access-control-max-age': '1728000',
            'Access-Control-Allow-Headers': 'Content-Type'
        }),
    });
    try {
        let j = await request.json();
        if (!j.url) throw new Error("unknown url");
        let r = await fetch(j.url, j.config || {});
        let res = { status: r.status, headers: r.headers, data: await r.json() };
        return new Response(JSON.stringify(res), { headers: { 'access-control-allow-origin': '*', 'Content-Type': "application/json" }, status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { headers: { 'access-control-allow-origin': '*', 'Content-Type': "application/json" }, status: 400 });
    }
}


