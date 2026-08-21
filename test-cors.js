async function checkHeaders() {
  const apis = [
    'https://wttr.in/?format=j1',
    'https://ipwho.is/',
    'https://freeipapi.com/api/json',
    'https://api.bigdatacloud.net/data/client-location',
    'https://ipinfo.io/json'
  ];

  for (const url of apis) {
    try {
      const res = await fetch(url);
      const cors = res.headers.get('access-control-allow-origin');
      console.log(`URL: ${url} -> Status: ${res.status}, CORS: ${cors}`);
    } catch (e) {
      console.log(`URL: ${url} -> Error: ${e.message}`);
    }
  }
}

checkHeaders();
