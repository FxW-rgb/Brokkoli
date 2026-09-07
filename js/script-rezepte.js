// Die Funktion ließt die Rezepte Seite für Seite ein. Es beginnt mir der Anfangsurl (erste 20 Rezepte) 
// und solange es noch eine nächste URL gibt, wird es weiter ausgeführt und stoppt dann von selbst. 
//Dabei wird auch ein inner.HTML für unseren container erzeugt, das die Rezepte mit Titel und Bild anzeigt. 
//Auch wird beim Klick auf jeden Kasten auf die Rezeptdetailansicht der jeweiligen Rezept ID weiterverlinkt. 
//Das ist dann wichtig, um die Rezeptdetailseite mit den richtigen Infos aus der API zu füllen.
const alleRezepte = []; // hier wird eine leere Liste angelegt, welche beim Laden der Seite mit den Rezepten gefüllt und später zum Filtern verwendet wird
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
                alleRezepte.push(rezept); // hier werden die Rezepte für die Filterfunktion in die Liste hinzugefügt 
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



// Set mit allen Küchen aus API kreieren, um diese auf der Website im Dropdown-Menü anzeigen zu können

async function holeEinzigartigeKuechen() {
    let url = 'https://recipes.digitalhumanities.io/api/rezepte/';
    const kuechenSet = new Set(); // Erstellen eines leeres Sets, damit Küchen nicht doppelt aufgenommen werden

    try {
        while (url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP-Fehler! Status: ${response.status}`);
            }

            const data = await response.json();
            const rezepte = data.results || [];
            
            rezepte.forEach(rezept => { // Durchiterieren der aufgerufenen Rezepte
                if (rezept.kueche) {
                    kuechenSet.add(rezept.kueche); // Hinzufügen zum zuvor erstellten Set
                }
            });

            url = data.next || null;
        }
        const kuechenSetSortiert = new Set(
        [...kuechenSet].sort()
        );
        return kuechenSetSortiert;

    } catch (error) { // Abfangen eines Fehlers, sollten die API-Daten nicht abrufbar sein 
        console.error("Fehler beim Abrufen der API-Daten:", error);
        document.getElementById('kuechen-liste').innerHTML = '<li>Fehler beim Laden der Daten.</li>';
    }
}

// Auf Seite die eben erhobenen Küchenarten einspeisen
function renderKuechenListe(kuechenSetSortiert) {
    const listeElement = document.getElementById('kuecheFilter');

    if (!kuechenSetSortiert || kuechenSetSortiert.size === 0) { // Sollte aus irgendwelchen Gründen keine Küchen im Küchenset sein, soll dies transparent angezeigt werden
        listeElement.innerHTML = '<option value="">keine Küchen gefunden</option>'; // wird das hier ins Feld geschrieben
        return;
    }

    // Starten mit einem leeren String für das HTML
    let listenInhaltHtml = '';

    // Bauen für jedes Element im Set den passenden operablen HTML-String zusammen
    listenInhaltHtml += `<option value="">alle</option>` // eine Option ganz oben hinzufügen, um "alle" auswählen zu können
    kuechenSetSortiert.forEach(kueche => {
        listenInhaltHtml += `<option value="${kueche}">${kueche}</option>`; // Hinzufügen jeder iterierten Küche im Küchen-Set
    });

    // Überschreiben des alten Inhalts der <ul> komplett mit neuem String
    listeElement.innerHTML = listenInhaltHtml;
}

// Ausführen, damit das Ganze auch stattfindet
holeEinzigartigeKuechen().then(kuechen => {
    renderKuechenListe(kuechen);
});



// Ab hier kommt die wirkliche Filterfunktion
const filterKategorie = document.getElementById("kategorieFilter");
const filterKueche = document.getElementById("kuecheFilter");
const filterSchwierigkeit = document.getElementById("schwierigkeitFilter");
const suchbegriff = document.getElementById("suchbegriff");

async function suchergebnisseFiltern() {
  // Erstmal Einlesen der ausgewählten Werte und Definieren der Grund-URL für die Kombination mit den Rezept-IDs zur Zutatenabfrage
  const kategorieAuswahl = filterKategorie.value;
  const kuecheAuswahl = filterKueche.value;
  const suchbegriffAuswahl = suchbegriff.value.trim().toLowerCase(); // Whitespaces vorab und hintenan weg sowie alles klein, um eher das gewünschte Ergebnis zu finden 
  const schwierigkeitAuswahl = filterSchwierigkeit.value;
  const grundUrl = 'https://recipes.digitalhumanities.io/api/rezepte/';
  
  // Durchgehen aller Rezepte zur Überprüfung, ob die ausgewählten Filter passen 
  const ergebnisse = await Promise.all(alleRezepte.map(async (rezept) => {
    const kategorieMatch = !kategorieAuswahl || rezept.kategorie === kategorieAuswahl || kategorieAuswahl === "..."; // entweder keine Kategorieauswahl oder diese passt zum Rezept
    const kuecheMatch = !kuecheAuswahl || rezept.kueche === kuecheAuswahl || kuecheAuswahl === "..."; // ebenso für die Landesküche
    const schwierigkeitMatch = !schwierigkeitAuswahl || rezept.schwierigkeitsgrad === schwierigkeitAuswahl; // ebenso für die Schwierigkeit
    const rezeptId = rezept.id; // Erfassen, welche ID das Rezept hat, um im folgenden Teil die Detailseite für die Zutaten öffnen zu können 

    if (!kategorieMatch || !kuecheMatch || !schwierigkeitMatch) { // zur Effizienz werden folgend nur die Rezepte angeschaut, auf die die bisherigen Filter zutreffen
        return null; 
    }

    // Vergleich der Texteingabe mit Zutaten und Titel der Rezepte
    const titelMatch = !suchbegriffAuswahl || rezept.titel.toLowerCase().includes(suchbegriffAuswahl);

    // Anlegen einer Liste, welche folgend mit den Zutaten eines Rezepts von deren Detailseite befüllt wird 
    if (suchbegriffAuswahl && !titelMatch) { // nur Suche nach Zutat, wenn ein Suchbegriff vorhanden und Rezept nicht schon per Titel gefunden 
        try {
            const rezeptLink = grundUrl+rezeptId; // Zusammenfügen der Grund-URL mit der jeweiligen Rezept-ID für die Detailseite, wo sich die Zutaten finden 
            const response = await fetch(rezeptLink);
            if (response.ok) {
                const einzelRezept = await response.json();
                zutaten = einzelRezept.zutaten || [];
            }
        } catch (error) {
            console.error(`Fehler beim Laden des Rezepts mit der ID ${rezept.id}`, error);
        }
    }

    const zutatMatch = suchbegriffAuswahl && zutaten.some(item => item.name?.toLowerCase().includes(suchbegriffAuswahl));

    // finales Urteil:
    const sucheMatch = !suchbegriffAuswahl || titelMatch || zutatMatch;
    return sucheMatch ? rezept : null; // True wenn sucheMatch erfüllt ist, sonst null
    }));

    const gefiltert = ergebnisse.filter(rezept => rezept !== null);

    liste.innerHTML = ""; // die Ergebnisse werden folgend über eine zusammengefügte Liste angezeigt, um die Anzeige der gefilterten Ergebnisse flüssiger zu machen
    nulltrefferMeldung.classList.toggle("d-none", gefiltert.length !== 0); // Meldung, falls keine Treffer gefunden wurden
    // Rezepte erst im Speicher sammeln 
    const htmlInhalt = gefiltert.map(rezept => `
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
    `).join('');

    liste.innerHTML = htmlInhalt;
    statusmeldung.textContent = `${gefiltert.length} Rezepte entsprechen der aktuellen Auswahl.`;
}

// Ausführen der Filter-Funktion bei Auswahl eines neuen Filterkriteriums
filterKategorie.addEventListener("change", suchergebnisseFiltern);
filterKueche.addEventListener("change", suchergebnisseFiltern);
filterSchwierigkeit.addEventListener("change", suchergebnisseFiltern);

// Damit die Suche nicht sofort bei jedem eingebenen Buchstaben feuert und flüssiger angezeigt wird, wird die Filterfunktion für die Suchleiste leicht nach dem Tippen verzögert
function verzoegern (funktion, verzoegerung) {
    let timer;
    return (...args) => {
        clearTimeout(timer); // bisherigen Timer abbrechen

        timer= setTimeout(() => { // einen neuen Timer setzen 
            funktion(...args); // mit der gegebenen Funktion
        }, verzoegerung); // verzögert um die gegebene Zeit in ms
        };
    }

const verzoegertesFiltern = verzoegern(suchergebnisseFiltern, 250) // festlegen, dass das Verzögern für die Funktion suchergebnisseFiltern mit einer Verzögerung von 250 ms gilt 

// Auch Ausführen der Filter-Funktion durch Klicken des durch die Lupe symbolisierten Suchknopfes als weitere Option
suchbegriff.addEventListener("input", verzoegertesFiltern); // Anwenden der verzögerten Funktion
const lupenKnopf = document.getElementById("lupenKnopf");
lupenKnopf.addEventListener("click", suchergebnisseFiltern);



// Tutorial für Rezeptseite starten
document.getElementById("start-tutorial-btn-index").addEventListener("click", () => {
    introJs().setOptions({
    nextLabel: 'Weiter',
    prevLabel: 'Zurück',
    doneLabel: 'Fertig!',
    dontShowAgain: false,
    scrollToElement: true,
    scrollTo: 'tooltip',
    scrollPadding: 30
})
    .oncomplete(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    .onexit(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    .start();
});
