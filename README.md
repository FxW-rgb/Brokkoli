# Kochbuch-Website

Die Kochbuch-Website ist eine browserbasierte Webanwendung zum Suchen, Anzeigen und Erstellen von Rezepten. Sie wurde als Uni-Projekt im Rahmen des Moduls Webtechnologien 2026 umgesetzt und verbindet klassische HTML-Seiten mit Bootstrap, eigenem CSS und JavaScript-Funktionalität.
Im Mittelpunkt stehen eine Rezeptübersicht mit Such- und Filterfunktionen, eine Detailansicht einzelner Rezepte, eine Einkaufsliste sowie ein Formular zum Erstellen eigener Rezepte.

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

## Seiten- und Funktionsübersicht

### `index.html`

Die Start- bzw. Übersichtsseite `index.html` lädt Rezepte aus der externen Rezept-API und stellt sie als Karten mit Bild, Titel und Kurzinformationen dar. Nutzende können die angezeigten Rezepte durchsuchen und nach verschiedenen Eigenschaften filtern.

Vorhandene Filter:

- Kategorie
- Landesküche
- Schwierigkeitsgrad
- Suchbegriff im Rezepttitel

Die Rezeptkarten verlinken auf die Detailseite `Rezept.html`. Die jeweilige Rezept-ID wird dabei als URL-Parameter übergeben.


### `Rezept.html`

Diese Seite zeigt ein einzelnes Rezept an. Die ID des Rezeptes wird über die URL übergeben, zum Beispiel: Rezept.html?id=123
Die Seite lädt die passenden Rezeptdaten und zeigt Zutaten sowie Schritte an.

Angezeigt werden unter anderem:

- Rezepttitel
- Kategorie
- Gesamtzeit
- Schwierigkeitsgrad
- Rezeptbild
- Zutatenliste
- Vorbereitungsschritte
- Zubereitungsschritte

Zusätzlich gibt es einen Portionsrechner. Wird die Portionsanzahl geändert, werden die Mengen der Zutaten dynamisch angepasst. Dabei werden auch Dezimalzahlen und einfache Bruchangaben verarbeitet.

Die Zutaten eines Rezeptes können von der Rezeptdetailseite aus zur Einkaufsliste hinzugefügt werden. Die Daten werden im `localStorage` des Browsers gespeichert. Dadurch bleibt die Einkaufsliste auch nach einem Neuladen der Seite erhalten, solange der lokale Browserspeicher nicht gelöscht wird.

### `Einkaufsliste.html`

Diese Seite verwaltet die Einkaufsliste. Die Einträge werden im lokalen Browserspeicher abgelegt und können dort bearbeitet, zusammengefasst, abgehakt und gelöscht werden.
Gleiche Zutaten mit gleicher Einheit werden zusammengefasst, sofern die Mengen berechenbar sind. So werden beispielsweise mehrere Gramm- oder Milliliter-Angaben automatisch addiert.

### `EigenesRezept.html`

Die Seite `EigenesRezept.html` bietet ein Formular zum Erstellen eigener Rezepte. Erfasst werden können:

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

Zutaten und Arbeitsschritte können dynamisch hinzugefuegt und wieder gelöscht werden. Die Schritt-Nummern werden automatisch aktualisiert.

Das Formular enthält eine Funktion, um ein Rezept per `POST` an die API zu senden. 

Eigene Rezepte können jedoch auch als JSON-Datei heruntergeladen werden. Ebenso kann eine vorhandene JSON-Datei wieder in das Formular geladen werden. Dadurch lassen sich eigene Rezepte lokal sichern, weiterbearbeiten oder als Beispieldaten verwenden.

Im Ordner `rezepte/` liegt mit `kaiserschmarrn-aus-dem-ofen(1).json` ein Beispielrezept inklusive passendem Bild.

## JavaScript-Dateien

### `script-rezepte.js`

Dieses Skript ist für die Rezepüebersicht verantwortlich. Es lädt Rezepte aus der API, speichert sie in einem Array und rendert sie als Karten. Ausserdem werden die Filter für Kategorie, Landesküche, Schwierigkeitsgrad und Suche umgesetzt.

### `script-rezept.js`

Dieses Skript steuert die Rezeptdetailseite. Es liest die Rezept-ID aus der URL, ruft die Detaildaten aus der API ab, erzeugt die HTML-Ausgabe und berechnet Zutatenmengen passend zur gewählten Portionsanzahl. Ausserdem schreibt es Zutaten in die Einkaufsliste im `localStorage`.

### `script-einkaufsliste.js`

Dieses Skript liest und schreibt die Einkaufsliste im `localStorage`. Es zeigt die Liste an, fasst passende Zutaten zusammen und stellt Aktionen zum Markieren, Löschen und Hinzufügen bereit.

### `script-eigenesrezept.js`

Dieses Skript steuert das Formular fuer eigene Rezepte. Es erzeugt dynamische Formularzeilen, verarbeitet Bildauswahl und Drag-and-drop, erstellt aus den Formulardaten ein Rezeptobjekt und ermöglicht JSON-Import und JSON-Export.

## Gestaltung und Responsivität

Das Layout basiert auf Bootstrap 5.3.8 und wird durch eigene CSS-Regeln in `css/style.css` erweitert. Die Gestaltung verwendet eine warme, helle Farbpalette mit Grün- und Beigetönen, und greift damit die Farben aus dem Titelbild auf.

Umgesetzt sind unter anderem:

- gemeinsame Navigationsleiste auf allen Seiten
- responsive Bootstrap-Grid-Strukturen
- Rezeptkarten mit Bild, Overlay und Badges
- mobile Anpassungen für Filter, Karten, Listen und Formularbereiche
- sichtbare Fokus-Markierung für Tastaturbedienung
- stabilisierte Navbar-Größe durch feste Logo-Abmessungen

## Barrierefreiheit

Das Projekt enthält mehrere Massnahmen zur besseren Zugänglichkeit:

- deutsche Sprachangabe ueber `lang="de"`
- Viewport-Meta-Tag für korrekte Darstellung auf mobilen Geräten
- semantische Hauptbereiche mit `main`
- Labels für Formularfelder
- `aria-label` für reine Icon- oder Aktionsbuttons
- `aria-live`-Bereich für Statusmeldungen auf der Rezeptübersicht
- sichtbare Fokus-Stile für Tastaturbedienung
- Alternativtexte für Bilder

## Datenquellen und Speicherung

Die Rezeptübersicht und Rezeptdetailseiten verwenden die API:

```text
https://recipes.digitalhumanities.io/api/rezepte/
```

Die Einkaufsliste wird lokal im Browser gespeichert:

```text
localStorage["einkaufsliste"]
```

Eigene Rezepte können zusätzlich als JSON-Datei exportiert und später wieder importiert werden.

## Nutzung

Die Website kann direkt im Browser geöffnet werden. Der Einstieg erfolgt über:

```text
index.html
```

Für die API-basierten Funktionen wird eine Internetverbindung benötigt. Dazu gehören insbesondere das Laden der Rezeptübersicht, das Anzeigen einzelner Rezeptdetails und das dynamische Befüllen der Filterdaten.

## Verwendete Technologien

- HTML5
- CSS3
- JavaScript
- Bootstrap 5.3.8
- Browser `localStorage`
- Fetch API
- externe Rezept-API der Digital-Humanities-Rezeptdatenbank

## Hinweise zur Weiterentwicklung

Mögliche nächste Schritte wären:



## Projektkontext

Das Projekt wurde im Rahmen eines universitären Webtechnologien-Kontextes entwickelt. Ziel war es, eine mehrseitige, interaktive Webanwendung mit HTML, CSS und JavaScript umzusetzen und dabei externe Daten, dynamische Oberflaechen, Formularverarbeitung und lokale Speicherung sinnvoll miteinander zu verbinden.
