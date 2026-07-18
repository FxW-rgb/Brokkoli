/*-- ----------------------------------------------------------------------------------------------------------------------------->
<!-- Kochbuch-Website - Rezeptdetail-Script                                                                                      -->
<!-- ----------------------------------------------------------------------------------------------------------------------------->
<!-- Webtechnologien 2026                                                                                                       -->
<!-- Team Brokkoli                                                                                                              -->
<!-- ----------------------------------------------------------------------------------------------------------------------------*/

/* DATEIAUFBAU
   0. Konstanten Hilfsfunktionen
   1. Darstellung des Rezepts
   2. Portionenrechner
   3. Übertragung zur Einkaufsliste
   4. Darstellung der Rezeptschritte
   5. Laden und Initialisieren
*/


/* 0. KONSTANTEN UND SEITENZUSTAND */
/* 0.1 Rezept-ID aus dem URL-Parameter lesen */
const urlParameter = new URLSearchParams(window.location.search);
const rezeptId = urlParameter.get("id");

/* 0.1 Hauptcontainer, in den das geladene Rezept eingefügt wird. */
const rezeptInhalt = document.getElementById("rezeptInhalt");

let aktuellesRezept = null;

/* 0.3 Hilfsfunktionen für Mengen und Brüche */
/* 0.3.1 Umwandeln von Unicode-Bruchzeichen in eine Zahl */
function unicodeBruchInZahlUmwandeln(zeichen) {
    const brueche = {
        "¼": 1 / 4,
        "½": 1 / 2,
        "¾": 3 / 4,
        "⅐": 1 / 7,
        "⅑": 1 / 9,
        "⅒": 1 / 10,
        "⅓": 1 / 3,
        "⅔": 2 / 3,
        "⅕": 1 / 5,
        "⅖": 2 / 5,
        "⅗": 3 / 5,
        "⅘": 4 / 5,
        "⅙": 1 / 6,
        "⅚": 5 / 6,
        "⅛": 1 / 8,
        "⅜": 3 / 8,
        "⅝": 5 / 8,
        "⅞": 7 / 8
    };
    return brueche[zeichen] ?? null;
}

/* 0.3.2 Umwandeln von Dezimalzahlen, gewöhnlichen Brüche und Unicode-Brüchen in berechenbare JavaScript-Zahlen */
function bruchInZahlUmwandeln(wert) {
    const bereinigterWert = String(wert || "").trim();

    const unicodeTreffer = bereinigterWert.match(
        /^(\d+(?:[.,]\d+)?)?\s*([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/
    );

    if (unicodeTreffer) {
        const ganzeZahl = unicodeTreffer[1]
            ? Number(unicodeTreffer[1].replace(",", "."))
            : 0;

        const bruch = unicodeBruchInZahlUmwandeln(
            unicodeTreffer[2]
        );

        if (!isNaN(ganzeZahl) && bruch !== null) {
            return ganzeZahl + bruch;
        }
    }

    const teile = bereinigterWert.split(/\s+/);

    /* Gemischter Bruch, beispielsweise „1 1/2“. */
    if (teile.length === 2 && teile[1].includes("/")) {
        const ganzeZahl = Number(
            teile[0].replace(",", ".")
        );

        const bruchTeile = teile[1].split("/");
        const zaehler = Number(bruchTeile[0]);
        const nenner = Number(bruchTeile[1]);

        if (
            !isNaN(ganzeZahl) &&
            !isNaN(zaehler) &&
            !isNaN(nenner) &&
            nenner !== 0
        ) {
            return ganzeZahl + zaehler / nenner;
        }
    }

    /* Einfacher Bruch, beispielsweise „1/2“. */
    if (teile.length === 1 && teile[0].includes("/")) {
        const bruchTeile = teile[0].split("/");
        const zaehler = Number(bruchTeile[0]);
        const nenner = Number(bruchTeile[1]);

        if (
            !isNaN(zaehler) &&
            !isNaN(nenner) &&
            nenner !== 0
        ) {
            return zaehler / nenner;
        }
    }

    /* Normale Zahl mit Punkt oder Komma. */
    const zahl = Number(
        bereinigterWert.replace(",", ".")
    );

    return isNaN(zahl) ? null : zahl;
}

/* 0.3.3 Auslesen der strukturierten Mengenfelder einer Zutat */
function getrennteMengenDatenAuslesen(zutat) {
    if (
        zutat.menge === null ||
        zutat.menge === undefined ||
        zutat.menge === ""
    ) {
        return null;
    }

    const menge = Number(zutat.menge);

    return {
        name: zutat.name || "",
        menge: isNaN(menge) ? null : menge,
        einheit: zutat.einheit || "",
        hinweis: zutat.hinweis || ""
    };
}

/* 0.3.4 Rückfalloption für Zutaten, bei denen nur menge_original oder hinweis vorhanden ist. */
function mengeOriginalAuslesen(zutat) {
    const mengeOriginal = String(
        zutat.menge_original ||
        zutat.hinweis ||
        ""
    ).trim();

    const treffer = mengeOriginal.match(
        /^(\d+(?:[.,]\d+)?(?:\s+(?:\d+\/\d+|[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]))?|\d+\/\d+|[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*(.*)$/
    );

    if (!treffer) {
        return {
            name: zutat.name || "",
            menge: null,
            einheit: "",
            hinweis: mengeOriginal
        };
    }

    return {
        name: zutat.name || "",
        menge: bruchInZahlUmwandeln(treffer[1]),
        einheit: treffer[2].trim(),
        hinweis: zutat.hinweis || ""
    };
}

/* 0.3.5 Erzeugen einer einheitlichen Datenstruktur für alle Zutaten */
function zutatenDatenNormalisieren(zutat) {
    return (
        getrennteMengenDatenAuslesen(zutat) ||
        mengeOriginalAuslesen(zutat)
    );
}


/* 0.4 Berechnen der Mengen für die gewünschte Portionszahl */
function mengeBerechnen(
    menge,
    standardPortionen,
    gewuenschtePortionen
) {
    if (
        menge === null ||
        menge === undefined ||
        isNaN(menge)
    ) {
        return null;
    }

    const neueMenge =
        Number(menge) /
        standardPortionen *
        gewuenschtePortionen;

    return Math.round(neueMenge * 100) / 100;
}


/* Mengen formatieren */
function mengeFormatieren(menge) {
    if (
        menge === null ||
        menge === undefined ||
        isNaN(menge)
    ) {
        return "";
    }

    if (Number.isInteger(menge)) {
        return String(menge);
    }

    return String(menge).replace(".", ",");
}


/* Menge erzeugen */
function mengenInfoErstellen(
    zutat,
    standardPortionen,
    gewuenschtePortionen
) {
    const normalisierteZutat =
        zutatenDatenNormalisieren(zutat);

    const berechneteMenge = mengeBerechnen(
        normalisierteZutat.menge,
        standardPortionen,
        gewuenschtePortionen
    );

    if (berechneteMenge === null) {
        return {
            name: normalisierteZutat.name,
            menge:
                normalisierteZutat.hinweis ||
                zutat.menge_original ||
                "",
            einheit: ""
        };
    }

    return {
        name: normalisierteZutat.name,
        menge: mengeFormatieren(berechneteMenge),
        einheit: normalisierteZutat.einheit
    };
}


/* 1. Darstellung des Rezepts */
/* 1.1 Rezept anhand der ID aus der API laden */
async function rezeptLaden() {
    if (!rezeptId) {
        fehlerAnzeigen(
            "Keine Rezept-ID angegeben. Bitte wähle zuerst ein Rezept auf der Übersicht aus."
        );

        return;
    }

    const antwort = await fetch(
        `https://recipes.digitalhumanities.io/api/rezepte/${encodeURIComponent(rezeptId)}/?format=json`
    );

    if (!antwort.ok) {
        if (antwort.status === 404) {
            throw new Error(
                "Kein Rezept mit dieser ID gefunden."
            );
        }

        throw new Error(
            `Server antwortet mit Status ${antwort.status}.`
        );
    }

    return antwort.json();
}
/* 1.2 Grundgerüst anzeigen */
function rezeptGrundgeruestAnzeigen(rezept) {
    const bildUrl =
        rezept.bild_url &&
        rezept.bild_url.trim()
            ? rezept.bild_url
            : "img/Gericht.jpg";

    rezeptInhalt.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                    <h1 class="my-2">${rezept.titel || ""}</h1>

                    <a
                        class="btn btn-outline-secondary btn-sm"
                        href="EigenesRezept.html?id=${encodeURIComponent(rezept.id || rezeptId)}"
                        aria-label="Rezept ${rezept.titel || ""} bearbeiten">
                        Rezept bearbeiten
                    </a>
                </div>

                <div class="d-flex gap-3 mb-4 flex-wrap">
                    <span class="text-muted">
                        ${rezept.kategorie || ""}
                    </span>

                    <span class="text-muted">·</span>

                    <span class="text-muted">
                        Gesamtdauer:
                        ${rezept.zubereitungszeit?.gesamt_min || ""}
                        ${rezept.zubereitungszeit?.gesamt_min
                            ? " Minuten"
                            : ""}
                    </span>

                    <span class="text-muted">·</span>

                    <span class="text-muted">
                        Schwierigkeitsgrad:
                        ${rezept.schwierigkeitsgrad || ""}
                    </span>
                </div>
            </div>
        </div>

        <div class="row justify-content-center mb-4">
            <div class="col-md-8 border border-secondary rounded ps-4 py-4">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <img
                            src="${bildUrl}"
                            alt="Abbildung des Rezeptes ${rezept.titel || ""}"
                            class="img-fluid rounded">
                    </div>

                    <div class="col-md-6 p-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="h3 mb-0">Zutaten</h2>

                            <button
                                type="button"
                                class="btn btn-sm btn-gruen"
                                id="aufeinkaufsliste"
                                aria-label="Zutaten dieses Rezepts zur Einkaufsliste hinzufügen">
                                + Einkaufsliste
                            </button>
                        </div>

                        <div class="d-flex align-items-center gap-2 mb-3">
                            <label
                                class="text-muted"
                                for="portionen-input">
                                Portionen:
                            </label>

                            <input
                                type="number"
                                class="form-control form-control-sm text-center portionen-input"
                                id="portionen-input"
                                value="${rezept.portionen || 4}"
                                min="1">
                        </div>

                        <ul
                            class="list-group"
                            id="zutaten-liste">
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="row justify-content-center mb-4">
            <div
                class="col-md-8 border border-secondary rounded p-4"
                id="vorbereitung-container">

                <h2 class="h3">Vorbereitung</h2>

                <div class="d-flex gap-3 mb-4">
                    <span class="text-muted">
                        Vorbereitungsdauer:
                        ${rezept.zubereitungszeit?.vorbereitung_min || ""}
                        ${rezept.zubereitungszeit?.vorbereitung_min
                            ? " Minuten"
                            : ""}
                    </span>
                </div>

                <div id="vorbereitung-schritte"></div>
            </div>
        </div>

        <div class="row justify-content-center">
            <div
                class="col-md-8 border border-secondary rounded p-4"
                id="zubereitung-container">

                <h2 class="h3">Zubereitung</h2>

                <div class="d-flex gap-3 mb-4">
                    <span class="text-muted">
                        Zubereitungsdauer:
                        ${rezept.zubereitungszeit?.kochen_min || ""}
                        ${rezept.zubereitungszeit?.kochen_min
                            ? " Minuten"
                            : ""}
                    </span>
                </div>

                <div id="zubereitung-schritte"></div>
            </div>
        </div>
    `;
}

/* 1.3 Rezeptschritte erzeugen und anzeigen */
function schrittHtmlErstellen(schritt) {
    const zeitText = schritt.zeit_min
        ? `
            <span class="rezept-schritt-zeit">
                ${schritt.zeit_min} Minuten
            </span>
        `
        : "";

    return `
        <div class="rezept-schritt">
            <div class="rezept-schritt-kopf">
                <h3 class="rezept-schritt-titel">
                    Schritt ${schritt.nummer}
                </h3>

                ${zeitText}
            </div>

            <p class="mb-0">
                ${schritt.text || ""}
            </p>
        </div>
    `;
}

function schritteAnzeigen() {
    if (!aktuellesRezept) {
        return;
    }

    const vorbereitungSchritte =
        document.getElementById(
            "vorbereitung-schritte"
        );

    const zubereitungSchritte =
        document.getElementById(
            "zubereitung-schritte"
        );

    vorbereitungSchritte.innerHTML =
        (
            aktuellesRezept.schritte?.vorbereitung ||
            []
        )
            .map(schrittHtmlErstellen)
            .join("");

    zubereitungSchritte.innerHTML =
        (
            aktuellesRezept.schritte?.zubereitung ||
            []
        )
            .map(schrittHtmlErstellen)
            .join("");
}

/* 2. Portionenrechner */
/* 2.1 Erkennen einer Änderung der Portionszahl */
function portionenAenderungVerarbeiten() {
    const portionenInput =
        document.getElementById("portionen-input");

    const portionen = Number(portionenInput.value);

    if (portionen >= 1) {
        zutatenAnzeigen(portionen);
    }
}

/* 2.2 Darstellen der neuen Portionen */
function zutatenAnzeigen(portionen) {
    if (!aktuellesRezept) {
        return;
    }

    const zutatenListe =
        document.getElementById("zutaten-liste");

    if (!zutatenListe) {
        return;
    }

    const standardPortionen = Number(
        aktuellesRezept.portionen || 4
    );

    zutatenListe.innerHTML = "";

    (aktuellesRezept.zutaten || []).forEach(zutat => {
        const mengenInfo = mengenInfoErstellen(
            zutat,
            standardPortionen,
            portionen
        );

        const listenEintrag =
            document.createElement("li");

        listenEintrag.className =
            "list-group-item zutat-zeile";

        listenEintrag.innerHTML = `
            <span class="zutat-menge">
                ${mengenInfo.menge}
            </span>

            <span class="zutat-einheit">
                ${mengenInfo.einheit}
            </span>

            <span class="zutat-name">
                ${mengenInfo.name}
            </span>
        `;

        zutatenListe.appendChild(listenEintrag);
    });
}


/* 3. Zutaten auf Einkaufsliste übertragen */
function zutatenZurEinkaufslisteHinzufuegen() {
    if (!aktuellesRezept) {
        return;
    }

    const portionenInput =
        document.getElementById("portionen-input");

    const gewuenschtePortionen = Number(
        portionenInput.value
    );

    const standardPortionen = Number(
        aktuellesRezept.portionen || 4
    );

    const einkaufsliste = JSON.parse(
        localStorage.getItem("einkaufsliste")
    ) || [];

    (aktuellesRezept.zutaten || []).forEach(zutat => {
        const mengenInfo = mengenInfoErstellen(
            zutat,
            standardPortionen,
            gewuenschtePortionen
        );

        einkaufsliste.push({
            name: mengenInfo.name,
            menge: mengenInfo.menge,
            einheit: mengenInfo.einheit,
            gekauft: false
        });
    });

    localStorage.setItem(
        "einkaufsliste",
        JSON.stringify(einkaufsliste)
    );

    const erfolgDialog =
        document.getElementById(
            "einkaufsliste-erfolg-dialog"
        );

    bootstrap.Modal
        .getOrCreateInstance(erfolgDialog)
        .show();
}



/* 4. Initialisierung und Ereignisregistrierung */
/* 4.1 Ereignisse registrieren */
function rezeptEventsRegistrieren() {
    const portionenInput =
        document.getElementById("portionen-input");

    const einkaufslisteButton =
        document.getElementById("aufeinkaufsliste");

    portionenInput.addEventListener(
        "input",
        portionenAenderungVerarbeiten
    );

    einkaufslisteButton.addEventListener(
        "click",
        zutatenZurEinkaufslisteHinzufuegen
    );
}

/* Fehlermeldungen */
function fehlerAnzeigen(text) {
    rezeptInhalt.innerHTML = `
        <div class="row justify-content-center my-5">
            <div class="col-md-8 text-center">
                <div
                    class="alert alert-danger shadow-sm py-4"
                    role="alert">

                    <h2 class="alert-heading h4 mb-2">
                        Fehler
                    </h2>

                    <p class="mb-0">
                        ${text}
                    </p>
                </div>
            </div>
        </div>
    `;
}

/* Initiierung */
async function seiteInitialisieren() {
    try {
        aktuellesRezept = await rezeptLaden();

        if (!aktuellesRezept) {
            return;
        }

        rezeptGrundgeruestAnzeigen(
            aktuellesRezept
        );

        zutatenAnzeigen(
            Number(aktuellesRezept.portionen || 4)
        );

        schritteAnzeigen();
        rezeptEventsRegistrieren();
    } catch (fehler) {
        console.error(
            "Fehler beim Laden des Rezepts:",
            fehler
        );

        fehlerAnzeigen(
            fehler.message ||
            "Das Rezept konnte nicht geladen werden."
        );
    }
}

seiteInitialisieren();