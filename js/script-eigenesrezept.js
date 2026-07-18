/*-- ----------------------------------------------->
<!-- Kochbuch-Website - Eigenes Rezept - Skript   -->
<!-- ----------------------------------------------->
<!-- Webtechnologien 2026                         -->
<!-- Team Brokkoli                                -->
<!-- ----------------------------------------------/*


/* DATEIAUFBAU
   0. Vorbereitung: Konstanten & Hilfsfunktionen
   1. Formular mit vorhandenen Inhalten befüllen (JSON oder API)
   2. Formular selbst befüllen (Zutaten, Schritte, Bild)
   3. Formulardaten zu einem Rezeptobjekt zusammenführen
   4. Rezept an API senden (POST oder PATCH)
   5. Rezept lokal speichern (JSON)
   6. Formular zurücksetzen
   7. Zentrale Ereignisregistrierung und einmalige Initialisierung
*/


/* 0. Vorbereitung: Konstanten & Hilfsfunktionen */
/* 0.1 Die Konstanten speichern die zugehörigen HTML-Elemente einmalig, damit alle nachfolgenden Funktionen auf dieselben Formularbereiche zugreifen können. */
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
const apiKeyDialogElement = document.getElementById("api-key-dialog");
const apiKeyDialog = new bootstrap.Modal(apiKeyDialogElement);
const apiKeyEingabe = document.getElementById("api-key-eingabe");
const apiKeyBestaetigenButton = document.getElementById("api-key-bestaetigen");
const apiKeyFehler = document.getElementById("api-key-fehler");
const rezeptApiSendenButton = document.getElementById("rezept-api-senden");
const rezeptId = new URLSearchParams(window.location.search).get("id");
const SCHRITT_TYPEN = {
    vorbereitung: { container: vorbereitungContainer, hauptnummer: 1, label: "Vorbereitung" },
    zubereitung: { container: zubereitungContainer, hauptnummer: 2, label: "Zubereitung" }
};
let geladenesRezeptId = rezeptId || null;

/* 0.2 Bild-Upload und Bildvorschau */
const bildUploadBereich = document.getElementById("bild-upload-bereich");
const bildDateiInput = document.getElementById("bild-datei");
const bildUploadHinweis = document.getElementById("bild-upload-hinweis");
const bildVorschau = document.getElementById("bild-vorschau");
const bildEntfernenButton = document.getElementById("bild-entfernen");
let ausgewaehlteBildDatei = null;
let vorhandeneBildUrl = "";

/* 0.3 Bootstrap-Alert-Meldung für Bildvalidierung, JSON-Laden/Speichern, API-Rückmeldungen */
function meldungAnzeigen(typ, inhalt) {
    const rolle = (typ === "warning" || typ === "danger") ? "alert" : "status";
    formularMeldung.innerHTML = `<div class="alert alert-${typ}" role="${rolle}">${inhalt}</div>`;
}

/* 0.4 Umwandlung Eingabe zu Zahl */
function zahlOderNull(wert) {
    if (String(wert).trim() === "") {
        return null;
    }

    const zahl = Number(String(wert).replace(",", "."));
    return isNaN(zahl) ? null : zahl;
}

/* 0.5 Addition der Minutenangaben eines Schritt-Arrays */
function minutenSummeBerechnen(schritte) {
    return schritte.reduce((summe, schritt) => {
        return summe + (Number(schritt.zeit_min) || 0);
    }, 0);
}

/* 0.6 Prüfung Mindestanforderungen Rezept (Zutaten & Verarbeitungsschritte) */
function rezeptInhaltPruefen(rezept) {
    if (rezept.zutaten.length === 0) {
        return "Das Rezept enthält keine Zutaten.";
    }
    if (rezept.schritte.vorbereitung.length === 0 && rezept.schritte.zubereitung.length === 0) {
        return "Das Rezept enthält keine Zubereitungsschritte.";
    }
    return null;
}

/* 1. Formular befüllen (JSON oder API)*/
/* 1.1 Grundfunktion zum Befüllen der Formularfelder mit Inhalten aus einem bestehenden Rezept (JSON oder API) */
function rezeptInFormularLaden(rezept) {
    document.getElementById("titel").value = rezept.titel || "";
    document.getElementById("portionen").value = rezept.portionen || 4;
    document.getElementById("kategorie").value = rezept.kategorie || "";
    document.getElementById("kueche").value = rezept.kueche?.trim() || "";
    document.getElementById("schwierigkeit").value = rezept.schwierigkeitsgrad === "leicht" ? "einfach" : (rezept.schwierigkeitsgrad || "einfach");
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
    bildAnzeigeAktualisieren(rezept.bild_url);
}

/* 1.2 Auswahl und Laden einer lokalen Rezept-Datei (JSON) */
function jsonLadenEventRegistrieren() {
    rezeptJsonLadenButton.addEventListener("click", () => rezeptJsonDateiInput.click());
    rezeptJsonDateiInput.addEventListener("change", () => {
        jsonDateiInsFormularLaden(rezeptJsonDateiInput.files[0]);
        rezeptJsonDateiInput.value = "";
    });
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
            geladenesRezeptId = null;

            meldungAnzeigen("info", "Die JSON-Datei wurde ins Formular geladen.");
        } catch (fehler) {
            console.error("Fehler beim Laden der JSON-Datei:", fehler);
            meldungAnzeigen("warning", "Die JSON-Datei konnte nicht gelesen werden.");
        }
    });

    dateiLeser.readAsText(datei);
}

/* 1.3 Laden eines bestehenden Rezepts (über ID) */
function bearbeitungsmodusInitialisieren() {
    if (!rezeptId) return;

    document.getElementById("formular-titel").textContent = "Rezept bearbeiten";
    rezeptApiSendenButton.textContent = "Änderungen an API senden";
    rezeptApiSendenButton.setAttribute("aria-label", "Änderungen mit PATCH an die API senden");
    fetch(`https://recipes.digitalhumanities.io/api/rezepte/${encodeURIComponent(rezeptId)}/?format=json`)
        .then(async antwort => {
            if (!antwort.ok) throw await apiFehlerErstellen(antwort);
            return antwort.json();
        })
        .then(rezeptInFormularLaden)
        .catch(fehler => {
            meldungAnzeigen("danger", `<strong>Rezept konnte nicht geladen werden.</strong><br>${fehler.message}`);
        });
}

/* 1.4 Schritte in das Formular laden (Vorbereitung oder Zubereitung) */
function schritteInsFormularLaden(typ, schritte) {
    const { container } = SCHRITT_TYPEN[typ];
    container.innerHTML = "";

    (schritte || []).forEach(schritt => {
        schrittZeileErstellen(typ, schritt);
    });

    if (!schritte || schritte.length === 0) {
        schrittZeileErstellen(typ);
    }
}

/* 2. Formular selbst befüllen (Zutaten, Schritte, Bild) */
function dynamischeFormularEventsRegistrieren() {
    zutatHinzufuegenButton.addEventListener("click", () => zutatZeileErstellen());
    vorbereitungHinzufuegenButton.addEventListener("click", () => schrittZeileErstellen("vorbereitung"));
    zubereitungHinzufuegenButton.addEventListener("click", () => schrittZeileErstellen("zubereitung"));
}

/* 2.1 Bild hinzufügen */
function bildEventsRegistrieren() {
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
}
/* 2.2 Bild prüfen */
function bildDateiVerarbeiten(datei) {
    if (!datei || !datei.type.startsWith("image/")) {
        meldungAnzeigen("warning", "Bitte wähle eine Bilddatei aus.");
        return;
    }

    ausgewaehlteBildDatei = datei;
    vorhandeneBildUrl = "";
    bildVorschau.src = URL.createObjectURL(datei);
    bildVorschau.classList.remove("d-none");
    bildUploadHinweis.textContent = datei.name;
    bildEntfernenButton.classList.remove("d-none");
}

/* 2.3 Bild zurücksetzen */
function bildZuruecksetzen() {
    ausgewaehlteBildDatei = null;
    bildAnzeigeAktualisieren("");
}

function bildAnzeigeAktualisieren(url) {
    vorhandeneBildUrl = url || "";
    bildDateiInput.value = "";
    bildVorschau.src = "";
    bildVorschau.classList.add("d-none");
    bildUploadHinweis.textContent = vorhandeneBildUrl || "Bild hier ablegen oder klicken zum Auswählen";
    bildEntfernenButton.classList.toggle("d-none", !vorhandeneBildUrl);
}

/* 2.4 Zutatenzeile hinzufügen */
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
            <button type="button" class="btn btn-rot w-100 zutat-loeschen" aria-label="Zutat entfernen">x</button>
        </div>
    `;

    if (zutat) {
        zeile.querySelector(".zutat-menge").value = zutat.menge ?? "";
        zeile.querySelector(".zutat-einheit").value = zutat.einheit || "";
        zeile.querySelector(".zutat-name").value = zutat.name || "";
    }

    zeile.querySelector(".zutat-loeschen").addEventListener("click", () => {
        zeile.remove();
        zutatenBeschriftungenAktualisieren();
    });

    zutatenContainer.appendChild(zeile);
    zutatenBeschriftungenAktualisieren();
}

function zutatenBeschriftungenAktualisieren() {
    zutatenContainer.querySelectorAll(".zutat-eingabe").forEach((zeile, index) => {
        const nummer = index + 1;
        zeile.querySelector(".zutat-menge").setAttribute("aria-label", `Menge der Zutat ${nummer}`);
        zeile.querySelector(".zutat-einheit").setAttribute("aria-label", `Einheit der Zutat ${nummer}`);
        zeile.querySelector(".zutat-name").setAttribute("aria-label", `Name der Zutat ${nummer}`);
        zeile.querySelector(".zutat-loeschen").setAttribute("aria-label", `Zutat ${nummer} entfernen`);
    });
}

/* 2.5 Vorbereituns- oder Verarbeitungsschritt hinzufügen */
function schrittZeileErstellen(typ, schritt = null) {
    const { container } = SCHRITT_TYPEN[typ];
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
            <button type="button" class="btn btn-rot w-100 schritt-loeschen" aria-label="${SCHRITT_TYPEN[typ].label}sschritt entfernen">x</button>
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
    const { container, hauptnummer, label: lesbarerTyp } = SCHRITT_TYPEN[typ];

    container.querySelectorAll(".schritt-eingabe").forEach((zeile, index) => {
        const nummer = `${hauptnummer}.${index + 1}`;
        zeile.querySelector(".schritt-nummer").value = nummer;
        zeile.querySelector(".schritt-nummer").setAttribute("aria-label", `Schrittnummer ${nummer}`);
        zeile.querySelector(".schritt-text").setAttribute("aria-label", `${lesbarerTyp}, Beschreibung von Schritt ${index + 1}`);
        zeile.querySelector(".schritt-zeit").setAttribute("aria-label", `${lesbarerTyp}, Minuten für Schritt ${index + 1}`);
        zeile.querySelector(".schritt-loeschen").setAttribute("aria-label", `${lesbarerTyp}, Schritt ${index + 1} entfernen`);
    });
}

/* 2.6Schritte zusammenfassen */
function schritteAusFormularErstellen(typ) {
    const { container } = SCHRITT_TYPEN[typ];
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


/* 3. Formulardaten zu einem Rezeptobjekt zusammenführen */
/* 3.1 Erstellen eines gemeinsamen Rezeptobjekts zum Download, POST oder PATCH */
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
            hinweis: menge === null ? (mengeText || " ") : " "
        });
    });
    return {
        titel: document.getElementById("titel").value.trim(),
        kategorie: document.getElementById("kategorie").value.trim(),
        kueche: document.getElementById("kueche").value.trim(),
        schwierigkeitsgrad: document.getElementById("schwierigkeit").value === "einfach" ? "leicht" : document.getElementById("schwierigkeit").value,
        oekobilanz: " ",
        kurzbeschreibung: " ",
        bild: " ",
        bild_url: vorhandeneBildUrl || " ",
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



/* 4. Rezept an API senden (POST oder PATCH) */
/* 4.1 API Key abfragen */
function apiDialogOeffnen(event) {
    event.preventDefault();

    if (!rezeptFormular.reportValidity()) return;

    const fehlermeldung = rezeptInhaltPruefen(rezeptAusFormularErstellen());
    if (fehlermeldung) {
        meldungAnzeigen("warning", fehlermeldung);
        return;
    }

    apiKeyEingabe.value = "";
    apiKeyFehler.classList.add("d-none");
    apiKeyDialog.show();
    apiKeyDialogElement.addEventListener("shown.bs.modal", () => apiKeyEingabe.focus(), { once: true });
}

async function rezeptSendenNachBestaetigung() {
    const apiKey = apiKeyEingabe.value.trim();
    if (!apiKey) {
        apiKeyFehler.textContent = "Bitte gib einen API-Key ein.";
        apiKeyFehler.classList.remove("d-none");
        return;
    }
    apiKeyBestaetigenButton.disabled = true;
    apiKeyBestaetigenButton.textContent = "Wird gesendet …";
    apiKeyFehler.classList.add("d-none");
    try {
        const gespeichertesRezept = await rezeptAnApiSenden(apiKey);
        const gespeicherteId = gespeichertesRezept.id || geladenesRezeptId;
        apiKeyDialog.hide();
        apiKeyEingabe.value = "";
        formularLeeren();
        meldungAnzeigen("success", "Das Rezept wurde erfolgreich gespeichert.");
        if (gespeicherteId) window.location.href = `Rezept.html?id=${encodeURIComponent(gespeicherteId)}`;
    } catch (fehler) {
        console.error("Fehler beim Speichern in der API:", fehler);
        apiKeyFehler.textContent = fehler instanceof TypeError
            ? "Der API-Server ist nicht erreichbar. Prüfe deine Internetverbindung und versuche es erneut."
            : (fehler.message || "Beim API-Aufruf ist ein unbekannter Fehler aufgetreten.");
        apiKeyFehler.classList.remove("d-none");
    } finally {
        apiKeyBestaetigenButton.disabled = false;
        apiKeyBestaetigenButton.textContent = "OK";
    }
}

/* 4.2 API-Request ausführen */
async function rezeptAnApiSenden(apiKey) {
    const rezept = rezeptAusFormularErstellen();

    /* API-Request für Bild-Upload (falls eine neue Bilddatei ausgewählt wurde)
    if (ausgewaehlteBildDatei) {
        const bildDaten = new FormData();
        bildDaten.append("bild", ausgewaehlteBildDatei);
        const bildAntwort = await fetch("https://recipes.digitalhumanities.io/api/bilder/", {
            method: "POST", headers: { "X-API-Key": apiKey }, body: bildDaten
        });
        if (!bildAntwort.ok) throw await apiFehlerErstellen(bildAntwort);
        rezept.bild_url = (await bildAntwort.json()).url;
    }
    */

    // API-Request für Rezept-Upload (POST oder PATCH)
    if (ausgewaehlteBildDatei) rezept.bild_url = " ";
    const antwort = await fetch(
        geladenesRezeptId ? `https://recipes.digitalhumanities.io/api/rezepte/${encodeURIComponent(geladenesRezeptId)}/` : "https://recipes.digitalhumanities.io/api/rezepte/",
        {
            method: geladenesRezeptId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
            body: JSON.stringify(rezept)
        }
    );
    if (!antwort.ok) throw await apiFehlerErstellen(antwort);
    return antwort.json();
}

/* 4.3 Fehlermeldungen erstellen */
async function apiFehlerErstellen(antwort) {
    let details = "";
    try {
        const fehlerDaten = await antwort.json();
        details = fehlerDaten.detail || fehlerDaten.message || Object.entries(fehlerDaten)
            .map(([feld, meldung]) => `${feld}: ${Array.isArray(meldung) ? meldung.join(", ") : meldung}`)
            .join("; ");
    } catch {
        details = "Die API hat keine lesbare Fehlerbeschreibung zurückgegeben.";
    }
    if (antwort.status === 400) return new Error(`Die Rezeptdaten sind unvollständig oder ungültig. ${details}`);
    if (antwort.status === 401 || antwort.status === 403) return new Error("Der API-Key fehlt oder ist falsch.");
    if (antwort.status === 404) return new Error("Das zu bearbeitende Rezept wurde nicht gefunden.");
    if (antwort.status >= 500) return new Error("Der API-Server ist momentan nicht verfügbar. Bitte versuche es später erneut.");
    return new Error(`API-Fehler ${antwort.status}: ${details || antwort.statusText}`);
}



/* 5. Rezept lokal speichern (JSON) */
/* 5.1 Titel normalisieren */
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

/* 5.2 Rezept speichern */
async function rezeptAlsJsonHerunterladen() {
    if (!rezeptFormular.reportValidity()) {
        return;
    }

    const rezept = rezeptAusFormularErstellen();
    const fehlermeldung = rezeptInhaltPruefen(rezept);

    if (ausgewaehlteBildDatei) {
        rezept.bild_url = ausgewaehlteBildDatei.name;
    }

    const jsonText = JSON.stringify(rezept, null, 2);
    const dateiname = dateinameAusTitelErstellen(rezept.titel);

    try {
        if ("showSaveFilePicker" in window) {
            const dateiHandle = await window.showSaveFilePicker({
                suggestedName: dateiname,
                types: [{ description: "JSON-Datei", accept: { "application/json": [".json"] } }]
            });
            const schreibzugriff = await dateiHandle.createWritable();
            await schreibzugriff.write(jsonText);
            await schreibzugriff.close();
        } else {
            const blob = new Blob([jsonText], { type: "application/json" });
            const downloadUrl = URL.createObjectURL(blob);
            const downloadLink = document.createElement("a");
            downloadLink.href = downloadUrl;
            downloadLink.download = dateiname;
            downloadLink.click();
            URL.revokeObjectURL(downloadUrl);
        }
    } catch (fehler) {
        // Abbrechen im Betriebssystemdialog ist kein Fehler und lässt das Formular unverändert.
        if (fehler.name === "AbortError") return;
        meldungAnzeigen("danger", `Die JSON-Datei konnte nicht gespeichert werden: ${fehler.message}`);
        return;
    }

    meldungAnzeigen(
        fehlermeldung ? "warning" : "success",
        fehlermeldung
            ? `Das Rezept wurde als JSON-Datei gespeichert. Hinweis: ${fehlermeldung}`
            : "Das Rezept wurde als JSON-Datei gespeichert."
    );
}

function jsonSpeichernEventRegistrieren() {
    rezeptJsonSpeichernButton.addEventListener("click", rezeptAlsJsonHerunterladen);
}



/* 6. Formular zurücksetzen */
function formularLeeren() {
    rezeptFormular.reset();
    zutatenContainer.innerHTML = "";
    zutatZeileErstellen();
    schritteInsFormularLaden("vorbereitung", []);
    schritteInsFormularLaden("zubereitung", []);
    bildZuruecksetzen();
    geladenesRezeptId = null;
}



/* 7. Initialisierung und Ereignisregistrierung */
function seiteInitialisieren() {
    /* 1. Leeres Formular aufbauen und Laden aus JSON oder URL-ID ermöglichen. */
    dynamischeFormularEventsRegistrieren();
    jsonLadenEventRegistrieren();
    zutatZeileErstellen();
    schrittZeileErstellen("vorbereitung");
    schrittZeileErstellen("zubereitung");
    bearbeitungsmodusInitialisieren();

    /* 2. Bildauswahl und Vorschau aktivieren. */
    bildEventsRegistrieren();

    /* 3. POST/PATCH über den API-Key-Dialog aktivieren. */
    rezeptFormular.addEventListener("submit", apiDialogOeffnen);
    apiKeyBestaetigenButton.addEventListener("click", rezeptSendenNachBestaetigung);

    /* 4. Lokales Speichern im API-kompatiblen JSON-Format aktivieren. */
    jsonSpeichernEventRegistrieren();
}

seiteInitialisieren();
