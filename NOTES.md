# Palestra — note di sviluppo

App web per schede di allenamento (giorni → esercizi → serie con ripetizioni e pesi).
Tutto offline-first, dati sul dispositivo. Nessun backend.

## Struttura dei file
- `index.html` — l'intera app (HTML + CSS + JS inline).
- `sw.js` — service worker (offline + cache).
- `manifest.webmanifest` — metadati per l'installazione come app.
- `icon.svg` — icona dell'app.

## Dove vivono i dati
- **localStorage** (`palestra:data:v1`): giorni, esercizi, serie, impostazioni, stato UI, storico pesi.
- **IndexedDB** (`palestra-db` → store `photos`): le foto degli esercizi (ridimensionate prima del salvataggio).
- I dati sono **locali al browser/dispositivo**, non sincronizzati. Per spostarli: menu → Esporta/Importa (backup JSON che include anche le foto in base64).

## Modello dati (semplificato)
```
state = {
  days: [ { id, name, exercises: [
    { id, name, note, photoId, editing, linkAll, history:[{d,w}], sets:[{reps,weight,done}] }
  ] } ],
  ui: { view:"home"|"day", currentDayId },
  settings: { theme }
}
```

## Funzionalità aggiunte (e perché)
1. **Menu a panino** (in alto a sinistra, home): racchiude Backup (Importa/Esporta), scelta **Tema** (6 palette) e in fondo il credit "Sviluppato da Alberto Bandiera — github: Albo04Flag" in tono tenue.
2. **Due tap per modificare**: aprendo un giorno gli esercizi mostrano le serie in **sola lettura** (ripetizioni × peso + spunta "fatta"). Un secondo tap apre l'editor. Motivo: consultare la scheda durante la sessione senza aprire per sbaglio le tendine di modifica.
3. **Checkbox "Cambia tutte"** (per esercizio): se attiva, modificando una serie (peso o ripetizioni) tutte le altre si allineano allo stesso valore.
4. **Istogramma andamento peso** (per esercizio): mostra gli ultimi 12 punti.
   - **Ogni modifica del peso = un nuovo punto** nel grafico. Si registra al "commit": ogni click sugli stepper +/- del peso e quando si esce dal campo dopo aver digitato (blur). Ripetizioni e rimozione serie NON generano punti. Storico limitato a 400 voci.

## Persistenza durante una sessione di palestra
- Il **giorno selezionato resta aperto** anche chiudendo/riaprendo l'app (`state.ui.currentDayId` è salvato; al riavvio si ripristina, torna alla home solo se quel giorno è stato cancellato).
- Spunte, pesi, ripetizioni e storico persistono ad ogni modifica.
- Al riavvio le tendine di modifica dei singoli esercizi si richiudono (in `load()` forzo `editing=false`), ma l'anteprima sola-lettura è sempre visibile.
- `navigator.storage.persist()` chiede al browser di non cancellare i dati per inattività (importante su iOS, che altrimenti può cancellarli dopo ~7 giorni per i siti non installati).

## PWA / offline
- Il **service worker funziona solo via http(s) o localhost**, NON con `file://` (doppio click). Quindi l'offline "vero" e l'installazione si vedono solo una volta pubblicata.
- Strategia cache: **network-first per la pagina** (online vedi sempre l'ultima versione; offline serve la copia in cache), cache-first per gli altri file.
- **Aggiornamenti**: ri-carichi i file → online l'app prende l'ultima versione da sola. Se resta "incastrata" su una vecchia versione, alza la versione in `sw.js`: `palestra-v1` → `palestra-v2` (forza la pulizia della cache).

## Pubblicare su GitHub Pages (vera web app installabile)
1. GitHub → New repository → es. `palestra` → Public → Create.
2. Add file → Upload files → carica i 4 file **alla radice** (index.html, sw.js, manifest.webmanifest, icon.svg) → Commit.
3. Settings → Pages → Source: "Deploy from a branch" → Branch `main` / `(root)` → Save.
4. Dopo ~1 min: `https://albo04flag.github.io/palestra/`
5. Sul telefono: apri l'URL → "Aggiungi a Home" (iOS) / "Installa app" (Android).

## Idee future (non ancora fatte)
- **Schermo sempre acceso** durante la sessione (Wake Lock API).
- **Timer di recupero** tra le serie (auto-start spuntando "fatta").
- **Riferimento "ultima volta"** accanto a peso/ripetizioni (sovraccarico progressivo).
- Grafico più ricco: **volume** (ripetizioni × peso) e badge "nuovo record".
- Minori: unità lb/kg, duplica giorno/esercizio, superset.
- Icona PNG dedicata per iOS (l'apple-touch-icon SVG ha supporto limitato).
