// Die Funktion ließt die Rezepte Seite für Seite ein. Es beginnt mir der Anfangsurl (erste 20 Rezepte) 
// und solange es noch eine nächste URL gibt, wird es weiter ausgeführt und stoppt dann von selbst. 
//Dabei wird auch ein inner.HTML für unseren container erzeugt, das die Rezepte mit Titel und Bild anzeigt. 
//Auch wird beim Klick auf jeden Kasten auf die Rezeptdetailansicht der jeweiligen Rezept ID weiterverlinkt. 
//Das ist dann wichtig, um die Rezeptdetailseite mit den richtigen Infos aus der API zu füllen.
const alleRezepte = [];
const statusmeldung = document.getElementById("statusmeldung");
const nulltrefferMeldung = document.getElementById("nulltreffer-meldung");

function einlesen(url) {
    fetch(url)
        .then(antwort => {
            if (!antwort.ok) {
                throw new Error("Server antwortet mit Status " + antwort.status);
            }
            return antwort.json();
        })
        .then(daten => {
            daten.results.forEach(rezept => {
                alleRezepte.push(rezept);
                const kasten = `
            <div class="col-md-4 col-sm-6 my-4 mb-4">
                <a href="Rezept.html?id=${rezept.id}" class="position-relative d-block begrenzung overflow-hidden rounded shadow-sm">
                <img src="${rezept.bild_url}" class="img-fluid m-0 p-0" alt="${rezept.titel}">
                <div class="titel-hintergrund">
                    <div class="badges-liste">
                        <span class="rezept-badge">${rezept.kategorie}</span>
                        <span class="rezept-badge">🕒 ${rezept.zubereitungszeit.gesamt_min} Min.</span>
                        <span class="rezept-badge">🌍 ${rezept.kueche}</span>
                    </div>
                    <h2 class="rezept-titel">${rezept.titel}</h2>
                </div>
                </a>
            </div>
                `;
                liste.innerHTML += kasten;
            });
            if (daten.next) {
                einlesen(daten.next)
            } else {
                statusmeldung.textContent = `${alleRezepte.length} Rezepte wurden geladen.`;
            };
        })
        .catch(fehler => {
            console.error("Fehler beim Laden der Rezepte:", fehler);
            
            
            liste.innerHTML = `
                <div class="col-12 text-center my-5">
                    <div class="alert alert-danger d-inline-block px-4 py-3 shadow-sm" role="alert">
                        <h4 class="alert-heading mb-2">Hoppala!</h4>
                        <p class="mb-0">Die Rezepte konnten leider nicht geladen werden. Bitte versuche es später noch einmal.
                        Vielleicht tut es bis dahin auch ein Snack!</p>
                    </div>
                </div>
            `;
            statusmeldung.textContent = "Die Rezepte konnten nicht geladen werden.";
        });
}


const startUrl = "https://recipes.digitalhumanities.io/api/rezepte/?format=json"
const liste = document.getElementById("rezepteListe");
liste.innerHTML = ""
einlesen(startUrl);



// Set mit allen Küchen aus API kreieren 

async function holeEinzigartigeKuechen() {
    let url = 'https://recipes.digitalhumanities.io/api/rezepte/?kategorie=Hauptgericht&kueche=&schwierigkeitsgrad=&oekobilanz=&max_zeit=&min_portionen=&max_portionen=&zutat=';
    const kuechenSet = new Set();

    try {
        while (url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP-Fehler! Status: ${response.status}`);
            }

            const data = await response.json();
            const rezepte = data.results || [];
            
            rezepte.forEach(rezept => {
                if (rezept.kueche) {
                    kuechenSet.add(rezept.kueche);
                }
            });

            url = data.next || null;
        }
        return kuechenSet;

    } catch (error) {
        console.error("Fehler beim Abrufen der API-Daten:", error);
        document.getElementById('kuechen-liste').innerHTML = '<li>Fehler beim Laden der Daten.</li>';
    }
}

// auf Seite einspeisen
function renderKuechenListe(kuechenSet) {
    const listeElement = document.getElementById('kuecheFilter');

    if (!kuechenSet || kuechenSet.size === 0) {
        listeElement.innerHTML = '<option value="">keine Küchen gefunden</option>';
        return;
    }

    // 1. Wir starten mit einem leeren String für das HTML
    let listenInhaltHtml = '';

    // Wir bauen für jedes Element im Set den passenden HTML-String zusammen
    listenInhaltHtml += `<option value="">alle</option>`
    kuechenSet.forEach(kueche => {
        listenInhaltHtml += `<option value="${kueche}">${kueche}</option>`;
    });

    // 3. Wir überschreiben den alten Inhalt der <ul> komplett mit unserem neuen String
    listeElement.innerHTML = listenInhaltHtml;
}

// Ausführen, damit das Ganze auch stattfindet
holeEinzigartigeKuechen().then(kuechen => {
    renderKuechenListe(kuechen);
});


// Eigentliche Filterfunktion
const filterKategorie = document.getElementById("kategorieFilter")
const filterKueche = document.getElementById("kuecheFilter")
const filterSchwierigkeit = document.getElementById("schwierigkeitFilter")
const suchbegriff = document.getElementById("suchbegriff")

function filternUndAnzeigen() {
  const kategorieAuswahl = filterKategorie.value;
  const kuecheAuswahl = filterKueche.value;
  const suchbegriffAuswahl = suchbegriff.value.trim().toLowerCase();
  const schwierigkeitAuswahl = filterSchwierigkeit.value;

  const gefiltert = alleRezepte.filter(rezept => {
    const passtKategorie = !kategorieAuswahl || rezept.kategorie === kategorieAuswahl || kategorieAuswahl === "...";
    const passtKueche = !kuecheAuswahl || rezept.kueche === kuecheAuswahl || kuecheAuswahl === "...";
    const passtSchwierigkeit = !schwierigkeitAuswahl || rezept.schwierigkeitsgrad === schwierigkeitAuswahl;
    // rezept.zutaten gibt es in der Übersicht nicht (nur auf der Detailseite) -
    // "?." verhindert einen Absturz und lässt die Titelsuche trotzdem funktionieren
    const passtSuche =
      !suchbegriffAuswahl ||
      rezept.titel.toLowerCase().includes(suchbegriffAuswahl) ||
      (rezept.zutaten?.some(zutat => zutat.name.toLowerCase().includes(suchbegriffAuswahl)) ?? false);

    return passtKategorie && passtKueche && passtSuche && passtSchwierigkeit;
    });
    liste.innerHTML = "";
    nulltrefferMeldung.classList.toggle("d-none", gefiltert.length !== 0);
    gefiltert.forEach(rezept => {
        const kasten = `
    <div class="col-md-4 col-sm-6 my-4 mb-4">
        <a href="Rezept.html?id=${rezept.id}" class="position-relative d-block begrenzung overflow-hidden rounded shadow-sm">
        <img src="${rezept.bild_url}" class="img-fluid m-0 p-0" alt="${rezept.titel}">
        <div class="titel-hintergrund">
            <div class="badges-liste">
                <span class="rezept-badge">${rezept.kategorie}</span>
                <span class="rezept-badge">🕒 ${rezept.zubereitungszeit.gesamt_min} Min.</span>
                <span class="rezept-badge">🌍 ${rezept.kueche}</span>
            </div>
            <h2 class="rezept-titel">${rezept.titel}</h2>
        </div>
        </a>
    </div>
        `;
        liste.innerHTML += kasten;
    });
    statusmeldung.textContent = `${gefiltert.length} Rezepte entsprechen der aktuellen Auswahl.`;
}

filterKategorie.addEventListener("change", filternUndAnzeigen);
filterKueche.addEventListener("change", filternUndAnzeigen);
filterSchwierigkeit.addEventListener("change", filternUndAnzeigen);
suchbegriff.addEventListener("input", filternUndAnzeigen);
