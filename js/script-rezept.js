// Holt die Rezept-ID aus der URL, um direkt auf das Rezeptobjekt zugreifen zu koennen.
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const rezeptId = urlParams.get("id");
const rezeptInhalt = document.getElementById("rezeptInhalt");

/* Laden des Rezepts */
/* Fehlermeldung bei fehlender Rezept-ID */
if (!rezeptId) {
    rezeptInhalt.innerHTML = `
        <div class="row justify-content-center my-5">
            <div class="col-md-8 text-center">
                <div class="alert alert-warning shadow-sm py-4" role="alert">
                    <h4 class="alert-heading mb-2">Hinweis</h4>
                    <p class="mb-0">Keine Rezept-ID angegeben. Bitte wähle zuerst ein Rezept auf der Übersicht aus.</p>
                </div>
            </div>
        </div>
    `;
/* Laden der Rezept-Metadaten */
} else {
    fetch(`https://recipes.digitalhumanities.io/api/rezepte/${rezeptId}/?format=json`)
        .then(antwort => {
            if (!antwort.ok) {
                if (antwort.status === 404) {
                    throw new Error("Kein Rezept mit dieser ID gefunden.");
                }
                throw new Error("Server antwortet mit Status " + antwort.status);
            }
            return antwort.json();
        })
        .then(rezept => {
            rezeptInhalt.innerHTML = "";

            const inhalt = `
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <h1 class="my-2">${rezept.titel}</h1>
                        <div class="d-flex gap-3 mb-4 flex-wrap">
                            <span class="text-muted">${rezept.kategorie}</span>
                            <span class="text-muted">·</span>
                            <span class="text-muted">Gesamtdauer: ${rezept.zubereitungszeit?.gesamt_min || ""}${rezept.zubereitungszeit?.gesamt_min ? " Minuten" : ""}</span>
                            <span class="text-muted">·</span>
                            <span class="text-muted">Schwierigkeitsgrad: ${rezept.schwierigkeitsgrad}</span>
                        </div>
                    </div>
                </div>

                <div class="row justify-content-center mb-4">
                    <div class="col-md-8 border border-secondary rounded ps-4 py-4">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <img src="${rezept.bild_url}" alt="Abbildung des aktuellen Rezeptes" class="img-fluid rounded">
                            </div>
                            <div class="col-md-6 p-4">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h3 class="mb-0">Zutaten</h3>
                                    <button type="button" class="btn btn-sm btn-gruen" id="aufeinkaufsliste">
                                        + Einkaufsliste
                                    </button>
                                </div>

                                <div class="d-flex align-items-center gap-2 mb-3">
                                    <span class="text-muted" style="white-space: nowrap;">Portionen:</span>
                                    <input type="number" class="form-control form-control-sm text-center portionen-input"
                                        id="portionen-input" value="${rezept.portionen || 4}" min="1">
                                </div>

                                <ul class="list-group" id="zutaten-liste"></ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row justify-content-center mb-4">
                    <div class="col-md-8 border border-secondary rounded p-4" id="vorbereitung-container">
                        <h3>Vorbereitung</h3>
                        <div class="d-flex gap-3 mb-4">
                            <span class="text-muted">Vorbereitungsdauer: ${rezept.zubereitungszeit?.vorbereitung_min || ""}${rezept.zubereitungszeit?.vorbereitung_min ? " Minuten" : ""}</span>
                        </div>
                    </div>
                </div>

                <div class="row justify-content-center">
                    <div class="col-md-8 border border-secondary rounded p-4" id="zubereitung-container">
                        <h3>Zubereitung</h3>
                        <div class="d-flex gap-3 mb-4">
                            <span class="text-muted">Zubereitungsdauer: ${rezept.zubereitungszeit?.kochen_min || ""}${rezept.zubereitungszeit?.kochen_min ? " Minuten" : ""}</span>
                        </div>
                    </div>
                </div>
            `;
            rezeptInhalt.innerHTML = inhalt;

            /* Laden der Rezept-Zutaten */
            const zutatenListe = document.getElementById("zutaten-liste");
            const standardPortionen = Number(rezept.portionen || 4);
            const portionenInput = document.getElementById("portionen-input");
            const aufeinkaufslisteButton = document.getElementById("aufeinkaufsliste");

            /* Zutaten: Menge und Einheit auslesen */
            function getrennteMengenDatenAuslesen(zutat) {
                if (zutat.menge !== null && zutat.menge !== undefined && zutat.menge !== "") {
                    return {
                        name: zutat.name,
                        menge: Number(zutat.menge),
                        einheit: zutat.einheit || "",
                        hinweis: zutat.hinweis || ""
                    };
                }

                return null;
            }

            /* Zutaten: Rückfalloption, falls nur menge_original oder hinweis vorhanden ist */
            function mengeOriginalAuslesen(zutat) {
                const mengeOriginal = String(zutat.menge_original || zutat.hinweis || "").trim();
                const treffer = mengeOriginal.match(/^(\d+(?:[.,]\d+)?(?:\s+(?:\d+\/\d+|[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]))?|\d+\/\d+|[¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*(.*)$/);

                if (!treffer) {
                    return {
                        name: zutat.name,
                        menge: null,
                        einheit: "",
                        hinweis: mengeOriginal
                    };
                }

                return {
                    name: zutat.name,
                    menge: bruchInZahlUmwandeln(treffer[1]),
                    einheit: treffer[2].trim(),
                    hinweis: zutat.hinweis || ""
                };
            }

            /* Zutaten: Brüche aus Textangaben in berechenbare Zahlen umwandeln */
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

            function bruchInZahlUmwandeln(wert) {
                const bereinigterWert = String(wert).trim();
                const unicodeTreffer = bereinigterWert.match(/^(\d+(?:[.,]\d+)?)?\s*([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);

                if (unicodeTreffer) {
                    const ganzeZahl = unicodeTreffer[1] ? Number(unicodeTreffer[1].replace(",", ".")) : 0;
                    const bruch = unicodeBruchInZahlUmwandeln(unicodeTreffer[2]);

                    if (!isNaN(ganzeZahl) && bruch !== null) {
                        return ganzeZahl + bruch;
                    }
                }

                const teile = bereinigterWert.split(/\s+/);

                if (teile.length === 2 && teile[1].includes("/")) {
                    const ganzeZahl = Number(teile[0].replace(",", "."));
                    const bruchTeile = teile[1].split("/");
                    const zaehler = Number(bruchTeile[0]);
                    const nenner = Number(bruchTeile[1]);

                    if (!isNaN(ganzeZahl) && !isNaN(zaehler) && !isNaN(nenner) && nenner !== 0) {
                        return ganzeZahl + zaehler / nenner;
                    }
                }

                if (teile.length === 1 && teile[0].includes("/")) {
                    const bruchTeile = teile[0].split("/");
                    const zaehler = Number(bruchTeile[0]);
                    const nenner = Number(bruchTeile[1]);

                    if (!isNaN(zaehler) && !isNaN(nenner) && nenner !== 0) {
                        return zaehler / nenner;
                    }
                }

                const zahl = Number(bereinigterWert.replace(",", "."));
                return isNaN(zahl) ? null : zahl;
            }

            /* Zutaten: einheitliche Datenbasis fuer Anzeige, Einkaufsliste und Portionenrechner erzeugen */
            function zutatenDatenNormalisieren(zutat) {
                return getrennteMengenDatenAuslesen(zutat) || mengeOriginalAuslesen(zutat);
            }

            /* Portionenrechner */
            function mengeBerechnen(menge, gewuenschtePortionen) {
                if (menge === null || menge === undefined || isNaN(menge)) {
                    return null;
                }

                const neueMenge = Number(menge) / standardPortionen * gewuenschtePortionen;
                return Math.round(neueMenge * 100) / 100;
            }

            function mengeFormatieren(menge) {
                if (menge === null || menge === undefined || isNaN(menge)) {
                    return "";
                }

                if (Number.isInteger(menge)) {
                    return String(menge);
                }

                return String(menge).replace(".", ",");
            }

            function mengenInfoErstellen(zutat, portionen) {
                const normalisierteZutat = zutatenDatenNormalisieren(zutat);
                const berechneteMenge = mengeBerechnen(normalisierteZutat.menge, portionen);

                if (berechneteMenge === null) {
                    return {
                        name: normalisierteZutat.name,
                        menge: normalisierteZutat.hinweis || zutat.menge_original || "",
                        einheit: ""
                    };
                }

                return {
                    name: normalisierteZutat.name,
                    menge: mengeFormatieren(berechneteMenge),
                    einheit: normalisierteZutat.einheit
                };
            }

            function zutatenAnzeigen(portionen) {
                zutatenListe.innerHTML = "";

                rezept.zutaten.forEach(zutat => {
                    const mengenInfo = mengenInfoErstellen(zutat, portionen);
                    const zutatZeile = `
                        <li class="list-group-item zutat-zeile">
                            <span class="zutat-menge">${mengenInfo.menge}</span>
                            <span class="zutat-einheit">${mengenInfo.einheit}</span>
                            <span class="zutat-name">${mengenInfo.name}</span>
                        </li>
                    `;
                    zutatenListe.innerHTML += zutatZeile;
                });
            }

            zutatenAnzeigen(standardPortionen);

            portionenInput.addEventListener("input", () => {
                const portionen = Number(portionenInput.value);

                if (portionen >= 1) {
                    zutatenAnzeigen(portionen);
                }
            });

            /* Zutaten zur Einkaufsliste hinzufügen */
            aufeinkaufslisteButton.addEventListener("click", () => {
                const portionen = Number(portionenInput.value);
                const einkaufsliste = JSON.parse(localStorage.getItem("einkaufsliste")) || [];

                rezept.zutaten.forEach(zutat => {
                    const mengenInfo = mengenInfoErstellen(zutat, portionen);

                    einkaufsliste.push({
                        name: mengenInfo.name,
                        menge: mengenInfo.menge,
                        einheit: mengenInfo.einheit,
                        gekauft: false
                    });
                });

                localStorage.setItem("einkaufsliste", JSON.stringify(einkaufsliste));
                alert("Die Zutaten wurden zur Einkaufsliste hinzugefügt.");
            });

            function schrittHtmlErstellen(schritt) {
                const zeitText = schritt.zeit_min ? `<span class="rezept-schritt-zeit">${schritt.zeit_min} Minuten</span>` : "";

                return `
                    <div class="rezept-schritt">
                        <div class="rezept-schritt-kopf">
                            <h4 class="rezept-schritt-titel">Schritt ${schritt.nummer}</h4>
                            ${zeitText}
                        </div>
                        <p class="mb-0">${schritt.text}</p>
                    </div>
                `;
            }

            const vorbereitungContainer = document.getElementById("vorbereitung-container");
            (rezept.schritte?.vorbereitung || []).forEach(schritt => {
                vorbereitungContainer.innerHTML += schrittHtmlErstellen(schritt);
            });

            const zubereitungContainer = document.getElementById("zubereitung-container");
            (rezept.schritte?.zubereitung || []).forEach(schritt => {
                zubereitungContainer.innerHTML += schrittHtmlErstellen(schritt);
            });
        })
        .catch(fehler => {
            console.error("Fehler beim Laden des Rezepts:", fehler);

            rezeptInhalt.innerHTML = `
                <div class="row justify-content-center my-5">
                    <div class="col-md-8 text-center">
                        <div class="alert alert-danger shadow-sm py-4" role="alert">
                            <h4 class="alert-heading mb-2">Fehler</h4>
                            <p class="mb-0">Dieses Rezept existiert leider nicht. Vielleicht hast du Lust auf etwas anderes?</p>
                        </div>
                    </div>
                </div>
            `;
        });
}


