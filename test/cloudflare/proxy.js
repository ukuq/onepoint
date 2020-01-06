addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

const html = `
  <html><head></head><body>
  <input type="url" placeholder="url" id="url" style="width: 80%; display: block;">
  <input type="submit" id="submit" value="submit"/>
  <div id="res"></div>
  <a id="a" href=""></a>
  <div>注:该工具只针对直链有效</div>
  <script>
  document.getElementById('submit').onclick=function(){
      let url  = document.getElementById('url').value;
      console.log('url: '+url);
      let a = document.getElementById('a');
      let div = document.getElementById('res');
      if(!url || !url.startsWith('http')){
          div.textContent="链接不合法: "+url;
          a.style="display:none";
      }else{
          div.textContent="";
          let res = (new URL(window.location.href)).origin+'?url='+encodeURIComponent(url);
          a.textContent=res;
          a.href=res;
          a.style="";
      }
  }
  </script>
  </body></html>`;

/**
 * Respond to the request
 * @param {Request} request
 */
async function handleRequest(request) {

    if (request.method === 'OPTIONS' && request.headers.has('access-control-request-headers')) {
        return new Response(null, {
            status: 204,
            headers: new Headers({
                'access-control-allow-origin': '*',
                'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
                'access-control-max-age': '1728000',
            }),
        })
    }

    let url = (new URL(request.url)).searchParams.get('url');

    if (!url) {
        return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    let res;
    if (request.headers.get('Range')) {
        res = await fetch(url, { headers: { 'Range': request.headers.get('Range') }, });
    } else {
        res = await fetch(url);
    }

    let h = new Headers(res.headers);
    h.set('set-cookie', '');
    h.set('access-control-allow-origin', '*');
    h.set('access-control-expose-headers', 'Content-Length');
    return new Response(res.body, {
        status: res.status,
        headers: h,
    })
}