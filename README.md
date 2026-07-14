# Kochbuch-Website

Die Kochbuch-Website ist eine browserbasierte Webanwendung zum Suchen, Anzeigen, Erstellen und Verwalten von Rezepten. Sie wurde als Uni-Projekt im Rahmen des Moduls Webtechnologien 2026 umgesetzt und verbindet klassische HTML-Seiten mit Bootstrap, eigenem CSS und JavaScript-Funktionalitaet.

Im Mittelpunkt stehen eine Rezeptuebersicht mit Such- und Filterfunktionen, eine Detailansicht einzelner Rezepte, eine Einkaufsliste sowie ein Formular zum Erstellen eigener Rezepte.

## Funktionen

### Rezepte durchsuchen und filtern

Die Start- bzw. Uebersichtsseite `Rezepte.html` laedt Rezepte aus der externen Rezept-API und stellt sie als Karten mit Bild, Titel und Kurzinformationen dar. Nutzerinnen und Nutzer koennen die angezeigten Rezepte durchsuchen und nach verschiedenen Eigenschaften filtern.

Vorhandene Filter:

- Kategorie
- Landeskueche
- Schwierigkeitsgrad
- Suchbegriff im Rezepttitel

Die Rezeptkarten verlinken auf die Detailseite `Rezept.html`. Die jeweilige Rezept-ID wird dabei als URL-Parameter uebergeben.

### Rezeptdetails anzeigen

Die Seite `Rezept.html` zeigt ein einzelnes Rezept ausfuehrlich an. Die Daten werden anhand der ID aus der URL aus der API geladen.

Angezeigt werden unter anderem:

- Rezepttitel
- Kategorie
- Gesamtzeit
- Schwierigkeitsgrad
- Rezeptbild
- Zutatenliste
- Vorbereitungsschritte
- Zubereitungsschritte

Zusaetzlich gibt es einen Portionsrechner. Wird die Portionsanzahl geaendert, werden die Mengen der Zutaten dynamisch angepasst. Dabei werden auch Dezimalzahlen und einfache Bruchangaben verarbeitet.

### Zutaten zur Einkaufsliste hinzufuegen

Auf der Rezeptdetailseite koennen die Zutaten eines Rezeptes zur Einkaufsliste hinzugefuegt werden. Die Daten werden im `localStorage` des Browsers gespeichert. Dadurch bleibt die Einkaufsliste auch nach einem Neuladen der Seite erhalten, solange der lokale Browserspeicher nicht geloescht wird.

### Einkaufsliste verwalten

Die Seite `Einkaufsliste.html` zeigt alle gespeicherten Einkaufslisten-Eintraege an. Nutzerinnen und Nutzer koennen:

- eigene Artikel hinzufuegen
- Eintraege als gekauft markieren
- einzelne Eintraege loeschen
- alle Eintraege als gekauft markieren
- die gesamte Liste loeschen

Gleiche Zutaten mit gleicher Einheit werden zusammengefasst, sofern die Mengen berechenbar sind. So werden beispielsweise mehrere Gramm- oder Milliliter-Angaben automatisch addiert.

### Eigenes Rezept erstellen

Die Seite `EigenesRezept.html` bietet ein Formular zum Erstellen eigener Rezepte. Erfasst werden koennen:

- Titel
- Portionen
- Kategorie
- Schwierigkeitsgrad
- Rezeptbild
- Vorbereitungsdauer
- Zubereitungsdauer
- Zutaten
- Vorbereitungsschritte
- Zubereitungsschritte

Zutaten und Arbeitsschritte koennen dynamisch hinzugefuegt und wieder geloescht werden. Die Schritt-Nummern werden automatisch aktualisiert.

### Rezept als JSON speichern oder laden

Eigene Rezepte koennen als JSON-Datei heruntergeladen werden. Ebenso kann eine vorhandene JSON-Datei wieder in das Formular geladen werden. Dadurch lassen sich eigene Rezepte lokal sichern, weiterbearbeiten oder als Beispieldaten verwenden.

Im Ordner `rezepte/` liegt mit `kaiserschmarrn-aus-dem-ofen(1).json` ein Beispielrezept inklusive passendem Bild.

### Rezept an die API senden

Das Formular enthaelt eine Funktion, um ein Rezept per `POST` an die API zu senden. Im JavaScript ist allerdings vermerkt, dass dies erst vollstaendig funktioniert, wenn die API Schreiboperationen erlaubt. Der JSON-Export ist daher die verlaessliche lokale Speicherfunktion.

## Projektstruktur

```text
V9/
├── EigenesRezept.html
├── Einkaufsliste.html
├── Rezept.html
├── Rezepte.html
├── css/
│   └── style.css
├── img/
│   ├── Gericht.jpg
│   ├── Logo.png
│   └── Lupensymbol.png
├── js/
│   ├── script-eigenesrezept.js
│   ├── script-einkaufsliste.js
│   ├── script-rezept.js
│   └── script-rezepte.js
└── rezepte/
    ├── kaiserschmarrn-aus-dem-ofen(1).json
    └── Kaiserschmarrn.png
```

## Seitenuebersicht

### `Rezepte.html`

Diese Seite ist die Rezeptuebersicht. Sie laedt Rezeptdaten aus der API, rendert Rezeptkarten und stellt Such- und Filterfunktionen bereit. Sie ist der zentrale Einstiegspunkt in die Anwendung.

### `Rezept.html`

Diese Seite zeigt ein einzelnes Rezept an. Die ID des Rezeptes wird ueber die URL uebergeben, zum Beispiel:

```text
Rezept.html?id=123
```

Die Seite laedt die passenden Rezeptdaten, zeigt Zutaten und Schritte an und bietet den Portionsrechner sowie die Uebernahme der Zutaten in die Einkaufsliste.

### `Einkaufsliste.html`

Diese Seite verwaltet die Einkaufsliste. Die Eintraege werden im lokalen Browserspeicher abgelegt und koennen dort bearbeitet, zusammengefasst und geloescht werden.

### `EigenesRezept.html`

Diese Seite stellt ein Formular fuer eigene Rezepte bereit. Sie unterstuetzt dynamische Zutaten- und Schrittlisten, Bildauswahl, JSON-Import und JSON-Export.

## JavaScript-Dateien

### `script-rezepte.js`

Dieses Skript ist fuer die Rezeptuebersicht verantwortlich. Es laedt Rezepte aus der API, speichert sie in einem Array und rendert sie als Karten. Ausserdem werden die Filter fuer Kategorie, Landeskueche, Schwierigkeitsgrad und Suche umgesetzt.

### `script-rezept.js`

Dieses Skript steuert die Rezeptdetailseite. Es liest die Rezept-ID aus der URL, ruft die Detaildaten aus der API ab, erzeugt die HTML-Ausgabe und berechnet Zutatenmengen passend zur gewaehlten Portionsanzahl. Ausserdem schreibt es Zutaten in die Einkaufsliste im `localStorage`.

### `script-einkaufsliste.js`

Dieses Skript liest und schreibt die Einkaufsliste im `localStorage`. Es zeigt die Liste an, fasst passende Zutaten zusammen und stellt Aktionen zum Markieren, Loeschen und Hinzufuegen bereit.

### `script-eigenesrezept.js`

Dieses Skript steuert das Formular fuer eigene Rezepte. Es erzeugt dynamische Formularzeilen, verarbeitet Bildauswahl und Drag-and-drop, erstellt aus den Formulardaten ein Rezeptobjekt und ermoeglicht JSON-Import und JSON-Export.

## Gestaltung und Responsivitaet

Das Layout basiert auf Bootstrap 5.3.8 und wird durch eigene CSS-Regeln in `css/style.css` erweitert. Die Gestaltung verwendet eine warme, helle Farbpalette mit Gruen- und Beigetoenen, passend zum Kochbuch-Thema.

Umgesetzt sind unter anderem:

- gemeinsame Navigationsleiste auf allen Seiten
- responsive Bootstrap-Grid-Strukturen
- Rezeptkarten mit Bild, Overlay und Badges
- mobile Anpassungen fuer Filter, Karten, Listen und Formularbereiche
- sichtbare Fokus-Markierung fuer Tastaturbedienung
- stabilisierte Navbar-Groesse durch feste Logo-Abmessungen

## Barrierefreiheit

Das Projekt enthaelt mehrere Massnahmen zur besseren Zugaenglichkeit:

- deutsche Sprachangabe ueber `lang="de"`
- Viewport-Meta-Tag fuer korrekte Darstellung auf mobilen Geraeten
- semantische Hauptbereiche mit `main`
- Labels fuer Formularfelder
- `aria-label` fuer reine Icon- oder Aktionsbuttons
- `aria-live`-Bereich fuer Statusmeldungen auf der Rezeptuebersicht
- sichtbare Fokus-Stile fuer Tastaturbedienung
- Alternativtexte fuer Bilder

Einige Punkte koennen bei weiterer Entwicklung noch verbessert werden, zum Beispiel die vollstaendige Statusausgabe bei dynamisch aktualisierten Rezeptlisten und noch spezifischere Beschriftungen fuer dynamisch erzeugte Einkaufslisten-Buttons.

## Datenquellen und Speicherung

Die Rezeptuebersicht und Rezeptdetailseiten verwenden die API:

```text
https://recipes.digitalhumanities.io/api/rezepte/
```

Die Einkaufsliste wird lokal im Browser gespeichert:

```text
localStorage["einkaufsliste"]
```

Eigene Rezepte koennen zusaetzlich als JSON-Datei exportiert und spaeter wieder importiert werden.

## Nutzung

Die Website kann direkt im Browser geoeffnet werden. Der Einstieg erfolgt ueber:

```text
Rezepte.html
```

Fuer die API-basierten Funktionen wird eine Internetverbindung benoetigt. Dazu gehoeren insbesondere das Laden der Rezeptuebersicht, das Anzeigen einzelner Rezeptdetails und das dynamische Befuellen der Filterdaten.

## Verwendete Technologien

- HTML5
- CSS3
- JavaScript
- Bootstrap 5.3.8
- Browser `localStorage`
- Fetch API
- externe Rezept-API der Digital-Humanities-Rezeptdatenbank

## Hinweise zur Weiterentwicklung

Moegliche naechste Schritte waeren:

- Schreibzugriff auf die API fertig anbinden, sobald die API dies erlaubt
- Statusmeldungen bei Suche und Filterung vollstaendig ausgeben
- Validierung und Fehlermeldungen im Formular weiter ausbauen
- Rezeptbilder beim API-Upload serverseitig speichern
- eigene lokal gespeicherte Rezepte in der Uebersicht anzeigen
- Tests fuer Portionsberechnung und Einkaufslisten-Zusammenfassung ergaenzen

## Projektkontext

Das Projekt wurde im Rahmen eines universitaeren Webtechnologien-Kontextes entwickelt. Ziel war es, eine mehrseitige, interaktive Webanwendung mit HTML, CSS und JavaScript umzusetzen und dabei externe Daten, dynamische Oberflaechen, Formularverarbeitung und lokale Speicherung sinnvoll miteinander zu verbinden.
