/*-- ----------------------------------------------->
<!-- Kochbuch-Website - Einkaufsliste - Skript   -->
<!-- ----------------------------------------------->
<!-- Webtechnologien 2026                         -->
<!-- Team Brokkoli                                -->
<!-- ----------------------------------------------*/

/* DATEIAUFBAU
   0. Konstanten und Hilfsfunktionen
   1. Einträge hinzufügen (manuell)
   2. Einkaufsliste anzeigen und bearbeiten
   4. Zentrale Ereignisregistrierung und Initialisierung 
*/

/* 0. Konstanten und Hilfsfunktionen */
/* 0.1 Konstanten */
const zutatInput = document.getElementById("zutat-input");
const mengeInput = document.getElementById("menge-input");
const einheitInput = document.getElementById("einheit-input");
const hinzufuegenButton = document.getElementById("hinzufuegen-button");
const allesGekauftButton = document.getElementById("allesgekauft");
const allesLoeschenButton = document.getElementById("allesloeschen");
const einkaufslisteElement = document.getElementById("einkaufsliste");
const loeschenDialogElement = document.getElementById("einkaufsliste-loeschen-dialog");
const loeschenDialog = new bootstrap.Modal(loeschenDialogElement);
const allesLoeschenBestaetigenButton = document.getElementById("allesloeschen-bestaetigen");
const jsonSpeichernButton = document.getElementById("einkaufsliste-json-speichern");
const statusElement = document.getElementById("einkaufsliste-status");

/* 0.2 Status für Screen reader */
function statusMelden(text) {
    statusElement.textContent = "";
    window.setTimeout(() => {
        statusElement.textContent = text;
    }, 10);
}

/* 0.3. Zusammenfassen von Zutaten */
/* 0.3.1 Mengen normalisieren und formatieren*/
function zahlAusMengeLesen(menge) {
    if (menge === null || menge === undefined || menge === "") {
        return null;
    }

    const zahl = Number(String(menge).replace(",", "."));
    return isNaN(zahl) ? null : zahl;
}

function mengeFormatieren(menge) {
    if (menge === null || menge === undefined || isNaN(menge)) {
        return "";
    }
    const gerundet = Math.round(menge * 100) / 100;
    return Number.isInteger(gerundet) ? String(gerundet) : String(gerundet).replace(".", ",");
}

/* 0.3.2 Einheiten normalisieren */
function einheitNormalisieren(einheit) {
    const wert = String(einheit || "").trim().toLowerCase();

    if (["g", "gr", "gr.", "gramm"].includes(wert)) {
        return "g";
    }

    if (["kg", "kg.", "kilogramm"].includes(wert)) {
        return "kg";
    }

    if (["ml", "ml.", "milliliter"].includes(wert)) {
        return "ml";
    }

    if (["l", "l.", "liter"].includes(wert)) {
        return "l";
    }

    return wert;
}

/* 0.3.3 Vergleichsschlüssel anlegen */
function eintragSchluessel(eintrag) {
    const name = String(eintrag.name || "").trim().toLowerCase();
    const einheit = einheitNormalisieren(eintrag.einheit);
    return `${name}|${einheit}`;
}

/* 0.3.4 Zusammenfassen von Einträgen (wenn Zutat und Einheit übereinstimmen) */
function einkaufslisteZusammenfassen(einkaufsliste) {
    const zusammengefasst = [];

    einkaufsliste.forEach(eintrag => {
        const vorhandenerEintrag = zusammengefasst.find(artikel => eintragSchluessel(artikel) === eintragSchluessel(eintrag));
        const vorhandeneMenge = vorhandenerEintrag ? zahlAusMengeLesen(vorhandenerEintrag.menge) : null;
        const neueMenge = zahlAusMengeLesen(eintrag.menge);

        if (vorhandenerEintrag && vorhandeneMenge !== null && neueMenge !== null) {
            vorhandenerEintrag.menge = mengeFormatieren(vorhandeneMenge + neueMenge);
            vorhandenerEintrag.gekauft = vorhandenerEintrag.gekauft && eintrag.gekauft;
        } else if (vorhandenerEintrag && String(vorhandenerEintrag.menge || "") === String(eintrag.menge || "")) {
            vorhandenerEintrag.gekauft = vorhandenerEintrag.gekauft && eintrag.gekauft;
        } else {
            zusammengefasst.push({
                name: eintrag.name || "",
                menge: eintrag.menge || "",
                einheit: eintrag.einheit || "",
                gekauft: Boolean(eintrag.gekauft)
            });
        }
    });

    return zusammengefasst;
}



/* 1. Einträge hinzufügen (manuell) */
function eigenenEintragHinzufuegen() {
    const name = zutatInput.value.trim();
    const menge = mengeInput.value.trim();
    const einheit = einheitInput.value.trim();

    if (!name || !menge) {
        statusMelden("Bitte gib mindestens eine Zutat und eine Menge ein.");
        return;
    }

    const einkaufsliste = ladeEinkaufsliste();

    einkaufsliste.push({
        name: name,
        menge: menge,
        einheit: einheit,
        gekauft: false
    });

    speichereEinkaufsliste(einkaufslisteZusammenfassen(einkaufsliste));

    zutatInput.value = "";
    mengeInput.value = "";
    einheitInput.value = "";

    einkaufslisteAnzeigen();
    statusMelden(`${name} wurde zur Einkaufsliste hinzugefügt.`);
}

/* 2. Einkaufsliste anzeigen (inkl. Überträge aus Rezepten) und bearbeiten */
/* 2.1 Einkaufsliste anzeigen */
function einkaufslisteAnzeigen() {
    const einkaufsliste = einkaufslisteZusammenfassen(ladeEinkaufsliste());
    speichereEinkaufsliste(einkaufsliste);
    einkaufslisteElement.innerHTML = "";

    if (einkaufsliste.length === 0) {
        einkaufslisteElement.innerHTML = `<li class="list-group-item p-3">Die Einkaufsliste ist leer.</li>`;
        return;
    }

    einkaufsliste.forEach((eintrag, index) => {
        const listenEintrag = document.createElement("li");
        listenEintrag.className = "list-group-item listen-eintrag p-3";

        const menge = eintrag.menge || "";
        const einheit = eintrag.einheit || "";
        const name = eintrag.name || "";
        const gekauftKlasse = eintrag.gekauft ? " text-decoration-line-through" : "";

        listenEintrag.innerHTML = `
            <div class="artikel-info${gekauftKlasse}">
                <span class="artikel-menge">${menge}</span>
                <span class="artikel-einheit">${einheit}</span>
                <span class="artikel-name fw-bold">${name}</span>
            </div>
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-sm btn-gruen gekauft-button" aria-label="${name} als gekauft markieren" aria-pressed="${eintrag.gekauft}">gekauft</button>
                <button type="button" class="btn btn-sm btn-rot loeschen-button" aria-label="${name} von der Einkaufsliste löschen">Löschen</button>
            </div>
        `;

        listenEintrag.querySelector(".gekauft-button").addEventListener("click", () => {
            einkaufsliste[index].gekauft = true;
            speichereEinkaufsliste(einkaufsliste);
            einkaufslisteAnzeigen();
            statusMelden(`${name} wurde als gekauft markiert.`);
        });

        listenEintrag.querySelector(".loeschen-button").addEventListener("click", () => {
            einkaufsliste.splice(index, 1);
            speichereEinkaufsliste(einkaufsliste);
            einkaufslisteAnzeigen();
            statusMelden(`${name} wurde aus der Einkaufsliste entfernt.`);
        });

        einkaufslisteElement.appendChild(listenEintrag);
    });
}

/* 2.2 Eintrag als gekauft markieren */
function alleEintraegeAlsGekauftMarkieren() {
    const einkaufsliste = ladeEinkaufsliste();

    einkaufsliste.forEach(eintrag => {
        eintrag.gekauft = true;
    });

    speichereEinkaufsliste(einkaufsliste);
    einkaufslisteAnzeigen();
    statusMelden("Alle Einträge wurden als gekauft markiert.");
}

/* 2.3 Gesamte Liste löschen */
function gesamteListeLoeschen() {
    localStorage.removeItem("einkaufsliste");
    einkaufslisteAnzeigen();
    loeschenDialog.hide();
    statusMelden("Die gesamte Einkaufsliste wurde gelöscht.");
}

function loeschenDialogOeffnen() {
    loeschenDialog.show();
}



/* 3. Einkaufsliste als JSON speichern */
/* 3.1 Einkaufsliste aus Brwoser-Speicher laden */
function ladeEinkaufsliste() {
    return JSON.parse(localStorage.getItem("einkaufsliste")) || [];
}

/* 3.2 Einkaufsliste als JSON anlegen */
async function einkaufslisteAlsJsonSpeichern() {
    const daten = einkaufslisteZusammenfassen(ladeEinkaufsliste());
    const jsonText = JSON.stringify(daten, null, 2);
    const dateiname = "einkaufsliste.json";

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
        statusMelden("Die Einkaufsliste wurde als JSON-Datei gespeichert.");
    } catch (fehler) {
        if (fehler.name !== "AbortError") {
            statusMelden("Die Einkaufsliste konnte nicht als JSON-Datei gespeichert werden.");
            console.error("Fehler beim Speichern der Einkaufsliste:", fehler);
        }
    }
}

/* 3.3 Einkaufsliste speichern */
function speichereEinkaufsliste(einkaufsliste) {
    localStorage.setItem("einkaufsliste", JSON.stringify(einkaufsliste));
}



/* 4. Initialer Seitenaufbau & Ereignis-Registrierung */
function seiteInitialisieren() {
    eventsRegistrieren();
    einkaufslisteAnzeigen();
}

function eventsRegistrieren() {
    hinzufuegenButton.addEventListener("click", eigenenEintragHinzufuegen);
    allesGekauftButton.addEventListener("click", alleEintraegeAlsGekauftMarkieren);
    allesLoeschenButton.addEventListener("click", loeschenDialogOeffnen);
    allesLoeschenBestaetigenButton.addEventListener("click", gesamteListeLoeschen);
    jsonSpeichernButton.addEventListener("click", einkaufslisteAlsJsonSpeichern);
}

seiteInitialisieren();
