/* Service worker di Palestra.
   ──────────────────────────────────────────────────────────────
   Quando modifichi index.html (o gli altri file) e vuoi essere
   SICURO che tutti ricevano la nuova versione, alza il numero qui:
   "palestra-v1" -> "palestra-v2" -> ...
   In condizioni normali non è obbligatorio: per la pagina si usa
   "network-first", quindi online vedi sempre l'ultima versione e
   la cache serve solo da rete di sicurezza quando sei offline.
*/
var CACHE = "palestra-v1";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;

  // La pagina: prima la rete (così online vedi sempre l'ultima versione),
  // se non c'è rete servo la copia in cache.
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put("./index.html", copy); });
        return res;
      }).catch(function(){
        return caches.match("./index.html").then(function(r){ return r || caches.match("./"); });
      })
    );
    return;
  }

  // Tutto il resto (manifest, icona): prima la cache, poi la rete.
  e.respondWith(
    caches.match(req).then(function(r){
      return r || fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){ return r; });
    })
  );
});
