/*-- ----------------------------------------------------------------------------------------------------------------------------->
<!-- Kochbuch-Website - Eigenes-Rezept-Script                                                                                    -->
<!-- ----------------------------------------------------------------------------------------------------------------------------->
<!-- Webtechnologien 2026                                                                                                       -->
<!-- Team Brokkoli                                                                                                              -->
<!-- ----------------------------------------------------------------------------------------------------------------------------*/

/* Grundelemente des Formulars */
const rezeptFormular = document.getElementById("rezept-formular");
const zutatenContainer = document.getElementById("zutaten-container");
const zutatHinzufuegenButton = document.getElementById("zutat-hinzufuegen");
const vorbereitungContainer = document.getElementById("vorbereitung-container");
const vorbereitungHinzufuegenButton = document.getElementById("vorbereitung-hinzufuegen");
const zubereitungContainer = document.getElementById("zubereitung-container");
const zubereitungHinzufuegenButton = document.getElementById("zubereitung-hinzufuegen");
const formularMeldung = document.getElementById("formular-meldung");
const rezeptJsonSpeichernButton = document.getElementById("rezept-json-speichern");
const rezeptJsonDateiInput = document.getElementById("rezept-json-datei");
const rezeptJsonLadenButton = document.getElementById("rezept-json-laden");

/* Bild-Upload und Bildvorschau */
const bildUploadBereich = document.getElementById("bild-upload-bereich");
const bildDateiInput = document.getElementById("bild-datei");
const bildUploadHinweis = document.getElementById("bild-upload-hinweis");
const bildVorschau = document.getElementById("bild-vorschau");
const bildEntfernenButton = document.getElementById("bild-entfernen");

let ausgewaehlteBildDatei = null;
let vorhandeneBildUrl = "";


/* Bildauswahl per Klick oder Drag-and-drop */
function bildDateiVerarbeiten(datei) {
    if (!datei || !datei.type.startsWith("image/")) {
        formularMeldung.innerHTML = `
            <div class="alert alert-warning">
                Bitte wähle eine Bilddatei aus.
            </div>
        `;
        return;
    }

    ausgewaehlteBildDatei = datei;
    vorhandeneBildUrl = "";
    bildVorschau.src = URL.createObjectURL(datei);
    bildVorschau.classList.remove("d-none");
    bildUploadHinweis.textContent = datei.name;
    bildEntfernenButton.classList.remove("d-none");
}

bildUploadBereich.addEventListener("click", () => {
    bildDateiInput.click();
});

bildDateiInput.addEventListener("change", () => {
    bildDateiVerarbeiten(bildDateiInput.files[0]);
});

bildUploadBereich.addEventListener("dragover", event => {
    event.preventDefault();
    bildUploadBereich.classList.add("bild-upload-aktiv");
});

bildUploadBereich.addEventListener("dragleave", () => {
    bildUploadBereich.classList.remove("bild-upload-aktiv");
});

bildUploadBereich.addEventListener("drop", event => {
    event.preventDefault();
    bildUploadBereich.classList.remove("bild-upload-aktiv");
    bildDateiVerarbeiten(event.dataTransfer.files[0]);
});

bildEntfernenButton.addEventListener("click", event => {
    event.stopPropagation();
    bildZuruecksetzen();
});

function bildZuruecksetzen() {
    ausgewaehlteBildDatei = null;
    vorhandeneBildUrl = "";
    bildDateiInput.value = "";
    bildVorschau.src = "";
    bildVorschau.classList.add("d-none");
    bildUploadHinweis.textContent = "Bild hier ablegen oder klicken zum Auswählen";
    bildEntfernenButton.classList.add("d-none");
}

// ACHTUNG: API-Logik fehlt noch.
// Wie die API den Upload von Bildern handhabt, ist noch nicht implementiert. Daher wird hier nur der Dateiname zurückgegeben.
async function bildZurApiHochladen() {
    if (ausgewaehlteBildDatei) {
        return ausgewaehlteBildDatei.name;
    }

    return vorhandeneBildUrl;
}

/* Zutaten */
function zutatZeileErstellen(zutat = null) {
    const zeile = document.createElement("div");
    zeile.className = "row g-2 mb-2 zutat-eingabe";

    zeile.innerHTML = `
        <div class="col-3">
            <input type="text" class="form-control zutat-menge" placeholder="Menge" aria-label="Menge">
        </div>
        <div class="col-3">
            <input type="text" class="form-control zutat-einheit" placeholder="Einheit" aria-label="Einheit">
        </div>
        <div class="col-5">
            <input type="text" class="form-control zutat-name" placeholder="Zutat" aria-label="Zutat" required>
        </div>
        <div class="col-1">
            <button type="button" class="btn btn-rot w-100 zutat-loeschen">x</button>
        </div>
    `;

    if (zutat) {
        zeile.querySelector(".zutat-menge").value = zutat.menge ?? "";
        zeile.querySelector(".zutat-einheit").value = zutat.einheit || "";
        zeile.querySelector(".zutat-name").value = zutat.name || "";
    }

    zeile.querySelector(".zutat-loeschen").addEventListener("click", () => {
        zeile.remove();
    });

    zutatenContainer.appendChild(zeile);
}

zutatHinzufuegenButton.addEventListener("click", () => {
    zutatZeileErstellen();
});

/* Schritte */
function schrittZeileErstellen(typ, schritt = null) {
    const container = typ === "vorbereitung" ? vorbereitungContainer : zubereitungContainer;
    const zeile = document.createElement("div");
    zeile.className = "row g-2 mb-2 schritt-eingabe";
    zeile.dataset.schrittTyp = typ;

    zeile.innerHTML = `
        <div class="col-md-2">
            <input type="text" class="form-control schritt-nummer" placeholder="Nr." aria-label="Schrittnummer" readonly>
        </div>
        <div class="col-md-7">
            <input type="text" class="form-control schritt-text" placeholder="Schrittbeschreibung" aria-label="Schrittbeschreibung">
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control schritt-zeit" placeholder="Min." aria-label="Schrittzeit" min="0">
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-rot w-100 schritt-loeschen">x</button>
        </div>
    `;

    if (schritt) {
        zeile.querySelector(".schritt-text").value = schritt.text || "";
        zeile.querySelector(".schritt-zeit").value = schritt.zeit_min ?? "";
    }

    zeile.querySelector(".schritt-loeschen").addEventListener("click", () => {
        zeile.remove();
        schrittNummernAktualisieren(typ);
    });

    container.appendChild(zeile);
    schrittNummernAktualisieren(typ);
}

function schrittNummernAktualisieren(typ) {
    const container = typ === "vorbereitung" ? vorbereitungContainer : zubereitungContainer;
    const hauptnummer = typ === "vorbereitung" ? 1 : 2;

    container.querySelectorAll(".schritt-eingabe").forEach((zeile, index) => {
        zeile.querySelector(".schritt-nummer").value = `${hauptnummer}.${index + 1}`;
    });
}

function schritteAusFormularErstellen(typ) {
    const container = typ === "vorbereitung" ? vorbereitungContainer : zubereitungContainer;
    const schritte = [];

    container.querySelectorAll(".schritt-eingabe").forEach(zeile => {
        const nummer = zeile.querySelector(".schritt-nummer").value.trim();
        const text = zeile.querySelector(".schritt-text").value.trim();
        const zeitMin = zahlOderNull(zeile.querySelector(".schritt-zeit").value);

        if (text.length > 0) {
            schritte.push({
                nummer: nummer,
                text: text,
                zeit_min: zeitMin
            });
        }
    });

    return schritte;
}

function schritteInsFormularLaden(typ, schritte) {
    const container = typ === "vorbereitung" ? vorbereitungContainer : zubereitungContainer;
    container.innerHTML = "";

    (schritte || []).forEach(schritt => {
        schrittZeileErstellen(typ, schritt);
    });

    if (!schritte || schritte.length === 0) {
        schrittZeileErstellen(typ);
    }
}

vorbereitungHinzufuegenButton.addEventListener("click", () => {
    schrittZeileErstellen("vorbereitung");
});

zubereitungHinzufuegenButton.addEventListener("click", () => {
    schrittZeileErstellen("zubereitung");
});

/* Hilfsfunktionen für Zahlen, Zeiten und JSON-Dateien */
function zahlOderNull(wert) {
    if (String(wert).trim() === "") {
        return null;
    }

    const zahl = Number(String(wert).replace(",", "."));
    return isNaN(zahl) ? null : zahl;
}

function minutenSummeBerechnen(schritte) {
    return schritte.reduce((summe, schritt) => {
        return summe + (Number(schritt.zeit_min) || 0);
    }, 0);
}

function dateinameAusTitelErstellen(titel) {
    const bereinigterTitel = titel
        .toLowerCase()
        .replaceAll("ä", "ae")
        .replaceAll("ö", "oe")
        .replaceAll("ü", "ue")
        .replaceAll("ß", "ss")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return `${bereinigterTitel || "eigenes-rezept"}.json`;
}

function rezeptAlsJsonHerunterladen() {
    if (!rezeptFormular.reportValidity()) {
        return;
    }

    const rezept = rezeptAusFormularErstellen();

    if (ausgewaehlteBildDatei) {
        rezept.bild_url = ausgewaehlteBildDatei.name;
    }

    const jsonText = JSON.stringify(rezept, null, 2);
    const blob = new Blob([jsonText], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = dateinameAusTitelErstellen(rezept.titel);
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);

    formularMeldung.innerHTML = `
        <div class="alert alert-success">
            Das Rezept wurde als JSON-Datei heruntergeladen.
        </div>
    `;
}

function jsonDateiInsFormularLaden(datei) {
    if (!datei) {
        return;
    }

    const dateiLeser = new FileReader();

    dateiLeser.addEventListener("load", () => {
        try {
            const rezept = JSON.parse(dateiLeser.result);

            rezeptInFormularLaden(rezept);
            geladenesLokalesRezeptId = null;

            formularMeldung.innerHTML = `
                <div class="alert alert-info">
                    Die JSON-Datei wurde ins Formular geladen.
                </div>
            `;
        } catch (fehler) {
            console.error("Fehler beim Laden der JSON-Datei:", fehler);

            formularMeldung.innerHTML = `
                <div class="alert alert-warning">
                    Die JSON-Datei konnte nicht gelesen werden.
                </div>
            `;
        }
    });

    dateiLeser.readAsText(datei);
}

function formularLeeren() {
    rezeptFormular.reset();
    zutatenContainer.innerHTML = "";
    zutatZeileErstellen();
    schritteInsFormularLaden("vorbereitung", []);
    schritteInsFormularLaden("zubereitung", []);
    bildZuruecksetzen();
    geladenesLokalesRezeptId = null;
}

/* Rezeptdaten aus JSON/API ins Formular übertragen */
function rezeptInFormularLaden(rezept) {
    document.getElementById("titel").value = rezept.titel || "";
    document.getElementById("portionen").value = rezept.portionen || 4;
    document.getElementById("kategorie").value = rezept.kategorie || "";
    document.getElementById("schwierigkeit").value = rezept.schwierigkeitsgrad || "einfach";
    document.getElementById("vorbereitung-min").value = rezept.zubereitungszeit?.vorbereitung_min || 0;
    document.getElementById("kochen-min").value = rezept.zubereitungszeit?.kochen_min || 0;

    zutatenContainer.innerHTML = "";
    (rezept.zutaten || []).forEach(zutat => zutatZeileErstellen(zutat));

    if (!rezept.zutaten || rezept.zutaten.length === 0) {
        zutatZeileErstellen();
    }

    schritteInsFormularLaden("vorbereitung", rezept.schritte?.vorbereitung || []);
    schritteInsFormularLaden("zubereitung", rezept.schritte?.zubereitung || []);

    ausgewaehlteBildDatei = null;
    vorhandeneBildUrl = rezept.bild_url || "";
    bildDateiInput.value = "";
    bildVorschau.src = "";
    bildVorschau.classList.add("d-none");
    bildUploadHinweis.textContent = vorhandeneBildUrl || "Bild hier ablegen oder klicken zum Auswählen";
    bildEntfernenButton.classList.toggle("d-none", !vorhandeneBildUrl);
}

/* Formularwerte in das API-nahe Rezeptobjekt umwandeln */
function rezeptAusFormularErstellen() {
    const vorbereitungSchritte = schritteAusFormularErstellen("vorbereitung");
    const zubereitungSchritte = schritteAusFormularErstellen("zubereitung");
    const vorbereitungSumme = minutenSummeBerechnen(vorbereitungSchritte);
    const zubereitungSumme = minutenSummeBerechnen(zubereitungSchritte);
    const vorbereitungMin = vorbereitungSumme || Number(document.getElementById("vorbereitung-min").value) || 0;
    const kochenMin = zubereitungSumme || Number(document.getElementById("kochen-min").value) || 0;
    const zutaten = [];

    document.querySelectorAll(".zutat-eingabe").forEach(zeile => {
        const mengeText = zeile.querySelector(".zutat-menge").value.trim();
        const einheit = zeile.querySelector(".zutat-einheit").value.trim();
        const name = zeile.querySelector(".zutat-name").value.trim();
        const menge = zahlOderNull(mengeText);

        zutaten.push({
            name: name,
            menge: menge,
            einheit: einheit,
            menge_original: `${mengeText}${einheit ? " " + einheit : ""}`,
            hinweis: menge === null ? mengeText : null
        });
    });

    return {
        titel: document.getElementById("titel").value.trim(),
        kategorie: document.getElementById("kategorie").value.trim(),
        schwierigkeitsgrad: document.getElementById("schwierigkeit").value,
        bild_url: vorhandeneBildUrl,
        portionen: Number(document.getElementById("portionen").value),
        zubereitungszeit: {
            vorbereitung_min: vorbereitungMin,
            kochen_min: kochenMin,
            gesamt_min: vorbereitungMin + kochenMin
        },
        zutaten: zutaten,
        schritte: {
            vorbereitung: vorbereitungSchritte,
            zubereitung: zubereitungSchritte
        }
    };
}

rezeptJsonSpeichernButton.addEventListener("click", () => {
    rezeptAlsJsonHerunterladen();
});

rezeptJsonLadenButton.addEventListener("click", () => {
    rezeptJsonDateiInput.click();
});

rezeptJsonDateiInput.addEventListener("change", () => {
    jsonDateiInsFormularLaden(rezeptJsonDateiInput.files[0]);
    rezeptJsonDateiInput.value = "";
});

/* Rezeptobjekt erzeugen und an API senden */
rezeptFormular.addEventListener("submit", async event => {
    event.preventDefault();

    const neuesRezept = rezeptAusFormularErstellen();
    neuesRezept.bild_url = await bildZurApiHochladen();

    // ACHTUNG: Dieser POST funktioniert erst, wenn die API Schreiboperationen erlaubt.
    fetch("https://recipes.digitalhumanities.io/api/rezepte/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(neuesRezept)
    })
        .then(antwort => {
            if (!antwort.ok) {
                throw new Error("Das Rezept konnte nicht gespeichert werden.");
            }

            return antwort.json();
        })
        .then(rezept => {
            formularMeldung.innerHTML = `
                <div class="alert alert-success">
                    Das Rezept wurde in der API gespeichert.
                </div>
            `;

            if (rezept.id) {
                window.location.href = `Rezept.html?id=${rezept.id}`;
            }
        })
        .catch(fehler => {
            console.error("Fehler beim Speichern in der API:", fehler);
            lokalesRezeptSpeichern(neuesRezept);

            formularMeldung.innerHTML = `
                <div class="alert alert-warning">
                    Das Rezept konnte nicht gesendet werden. Wenn du willst, kannst du das Rezept aber auch herunterladen
                    und zu einem späteren Zeitpunkt wieder laden.
                </div>
            `;
        });
});

/* Startzustand der Seite */
zutatZeileErstellen();
schrittZeileErstellen("vorbereitung");
schrittZeileErstellen("zubereitung");
