/*-- ----------------------------------------------------------------------------------------------------------------------------->
<!-- Kochbuch-Website - Einkauflisten-Script                                                                                     -->
<!-- ----------------------------------------------------------------------------------------------------------------------------->
<!-- Webtechnologien 2026                                                                                                       -->
<!-- Team Brokkoli                                                                                                              -->
<!-- ----------------------------------------------------------------------------------------------------------------------------*/

const zutatInput = document.getElementById("zutat-input");
const mengeInput = document.getElementById("menge-input");
const einheitInput = document.getElementById("einheit-input");
const hinzufuegenButton = document.getElementById("hinzufuegen-button");
const allesGekauftButton = document.getElementById("allesgekauft");
const allesLoeschenButton = document.getElementById("allesloeschen");
const einkaufslisteElement = document.getElementById("einkaufsliste");

function ladeEinkaufsliste() {
    return JSON.parse(localStorage.getItem("einkaufsliste")) || [];
}

function speichereEinkaufsliste(einkaufsliste) {
    localStorage.setItem("einkaufsliste", JSON.stringify(einkaufsliste));
}

/* Mengen auslesen & normalisieren */
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

function eintragSchluessel(eintrag) {
    const name = String(eintrag.name || "").trim().toLowerCase();
    const einheit = einheitNormalisieren(eintrag.einheit);
    return `${name}|${einheit}`;
}

/* mehrere Einträge mit gleicher Zutat und Einheit zusammenfassen */
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

/* Grundeinstellungen Einkaufsliste, inkl. Buttons gekauft + löschen */
function einkaufslisteAnzeigen() {
    const einkaufsliste = einkaufslisteZusammenfassen(ladeEinkaufsliste());
    speichereEinkaufsliste(einkaufsliste);
    einkaufslisteElement.innerHTML = "";

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
                <button type="button" class="btn btn-sm btn-gruen gekauft-button">gekauft</button>
                <button type="button" class="btn btn-sm btn-rot loeschen-button">Löschen</button>
            </div>
        `;

        listenEintrag.querySelector(".gekauft-button").addEventListener("click", () => {
            einkaufsliste[index].gekauft = true;
            speichereEinkaufsliste(einkaufsliste);
            einkaufslisteAnzeigen();
        });

        listenEintrag.querySelector(".loeschen-button").addEventListener("click", () => {
            einkaufsliste.splice(index, 1);
            speichereEinkaufsliste(einkaufsliste);
            einkaufslisteAnzeigen();
        });

        einkaufslisteElement.appendChild(listenEintrag);
    });
}


/* eigene Einträge hinzufügen */
hinzufuegenButton.addEventListener("click", () => {
    const name = zutatInput.value.trim();
    const menge = mengeInput.value.trim();
    const einheit = einheitInput.value.trim();

    if (!name || !menge) {
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
});

/* alle Einträge als gekauft markieren */
allesGekauftButton.addEventListener("click", () => {
    const einkaufsliste = ladeEinkaufsliste();

    einkaufsliste.forEach(eintrag => {
        eintrag.gekauft = true;
    });

    speichereEinkaufsliste(einkaufsliste);
    einkaufslisteAnzeigen();
});


/* gesamte Einkaufsliste löschen */
allesLoeschenButton.addEventListener("click", () => {
    if (confirm("Möchtest du wirklich die gesamte Einkaufsliste löschen?")) {
        localStorage.removeItem("einkaufsliste");
        einkaufslisteAnzeigen();
    }
});

einkaufslisteAnzeigen();



