# Onderhoud

Nederlandstalige educatieve website over preventief, predictief en correctief onderhoud. Statische HTML, CSS en JavaScript; geen build, account, API-sleutels of externe runtime-afhankelijkheden nodig.

## Lokaal bekijken

```sh
cd /workspace/Onderhoud
python3 -m http.server 8000 --bind 127.0.0.1
```

Open lokaal poort 8000. De site werkt ook direct via `index.html`. De quiz bewaart antwoorden alleen zolang de pagina openstaat; er worden geen persoonsgegevens verzameld.

## GitHub Pages

1. Zorg dat deze bestanden op `main` staan.
2. Open **Settings → Pages → Build and deployment**.
3. Kies **Deploy from a branch**, branch **main**, map **/ (root)** en sla op.
4. De verwachte URL is `https://dhrhermans.github.io/Onderhoud/`. Controleer de Pages-status voordat je de link deelt.

Alle paden zijn relatief, zodat de site onder `/Onderhoud/` werkt. `.nojekyll` schakelt Jekyll-verwerking uit.

## Inhoud aanvullen

- `content/lessons.js`: leskaarten, verdiepende uitleg en meerkeuzevragen. Elke vraag heeft opties, een nulgebaseerde `answer` en een verklaring.
- `index.html`: vergelijking, praktijkaanpak, inventarislijsten met gekoppelde onderhoudstaken, LO TO TO, begrippen en bronvermelding.
- `styles.css`: responsive vormgeving en printweergave.
- `app.js`: tabbladen en quiz met feedback en resultaatreview.

Eigen praktijkcases, machinegegevens en lesmateriaal kunnen later worden toegevoegd. Er is nog geen upload-, AI- of gegevensimportfunctie. Echte meetgegevens zijn geen automatische onderhoudsadviezen; daarvoor zijn validatie en context nodig.

## Onderbouwing

De vergelijking is gebaseerd op het geraadpleegde publieke [Microsoft Predictive Maintenance-voorbeeld](https://github.com/Azure-Samples/MachineLearningSamples-PredictiveMaintenance). Dit is ouder, gearchiveerd materiaal; de conceptuele introductie is gebruikt, niet de verouderde installatiehandleiding. De uitleg is in eigen woorden, met extra nuance rond conditiegestuurd onderhoud, risico en onzekerheid. Cijfers en situaties zijn fictieve lesvoorbeelden.

## Controle

`node --check app.js` en `node --check content/lessons.js` controleren de JavaScript-syntaxis. `tests/browser.cjs` gebruikt Playwright (extern geïnstalleerd) voor echte browsercontroles van tabbladen, quiz, herkansing, mobiele weergave, lokale links en het projectpad van GitHub Pages. Zie het script voor de uitvoeropdracht.

## Inventaris en veiligstellen

De site toont een fictieve koppeling via asset-ID en taak-ID tussen inventaris, onderhoudsplan en werkorder/historiek. Eigen inventarislijsten worden nog niet automatisch geïmporteerd. LO TO TO (Lock Out, Tag Out, Try Out) wordt uitgelegd als veiligheidsprincipe voor alle strategieën; de tekst vervangt geen opleiding of machinegebonden procedure. De kennischeck bevat zeven situaties, inclusief inventariskoppeling en energie-isolatie.

De LO TO TO-sectie bevat ook een leeroverzicht van de Gouden 8 voor elektrische werkzaamheden: voorbereiding, scheiden, beveiligen tegen wederinschakeling, spanningsloosheid vaststellen, aarden/kortsluiten waar vereist, afschermen/afbakenen, vrijgave en gecontroleerde herinschakeling. De indeling kan per organisatie verschillen; de plaatselijke elektrische werkprocedure blijft leidend.

De door de gebruiker aangeleverde [Volta-fiche De Gouden Acht (2020)](https://volta-org.be/media/e4igcxbr/volta-informatie_gouden_acht_2020.pdf) is rechtstreeks gelinkt. Downloaden bleef tijdens deze wijziging geblokkeerd door het cloudnetwerkbeleid (HTTP 403); de inhoud is dus niet onafhankelijk geraadpleegd. De acht stappen op de site zijn een algemeen leeroverzicht, geen geverifieerde transcriptie van Volta. Een aparte vergelijking verduidelijkt hoe LO TO TO ook mechanische energie beheerst, en waarom elektrische maatregelen alleen achterwege blijven als de risicoanalyse en bevoegde beoordeling bevestigen dat ze niet van toepassing zijn.

## Eigen veiligheidsillustraties

`content/safety.js` bevat zes reeksen van acht leerfasen: elektrisch, mechanisch, pneumatisch, hydraulisch, thermisch en zwaartekracht. De 48 originele SVG-principebeelden in `assets/safety/` zijn scherp schaalbaar en afzonderlijk te openen. `safety.js` toont de gekozen reeks met bijschriften en toetsenbordbediening. `assets/safety/energiebronnen.png` is een eigen met beeldgeneratie gemaakte conceptuele overzichtsillustratie; deze is geen technische tekening of weergave van een bewezen veilige toestand.

De elektrische reeks behandelt de thema’s van de Gouden 8; de overige achtfasenreeksen zijn eigen didactische indelingen en worden niet aan Volta toegeschreven. Geen van de beelden vervangt een machinegebonden procedure. De tekst behandelt onder meer restdruk, accumulatoren, veren, lastondersteuning en controle van de veilige toestand. Fasen zijn leeronderwerpen: de veilige volgorde van handelingen volgt uit de installatieprocedure (bijvoorbeeld eerst een last borgen voordat druk wordt afgebouwd).

Educatieve website en lesmateriaal: gemaakt door dhr. Hermans. Deze vermelding staat zichtbaar bij de tekeningen en in de voettekst.


## Compressoratelier

`compressor.html` is een aparte educatieve machinecase voor alle zeven Atlas Copco LE-types. `content/compressors.js` bouwt gekoppelde inventarissen en preventieve, predictieve en correctieve plannen; `planner.js` rekent per kalenderdag de vroegste uren- of kalenderdeadline en twee onafhankelijke bundelscenario’s uit. `compressor.js` verzorgt de invoerhistoriek per taak, resultaten en CSV-exports (ook alle zeven types). Er zijn geen extra pakketten nodig. Open de case via de hoofdnavigatie.

Lees [bronnotities en rekenafspraken](docs/compressor-bronnen.md) voor de overgenomen intervallen, het ontbrekende LE 10-filterinterval, de conservatieve 3.000 uur-keuze, voorgestelde predictieve frequenties en grenzen van de stilstandsvergelijking. De PDF wordt niet integraal gepubliceerd.

Validatie: `node --test tests/planner.test.cjs` controleert modelkoppelingen, deadlines, kalendermaanden, stilstand, achterstand en bundeling. `node tests/compressor-browser.cjs` gebruikt Playwright en de bestaande lokale server vanuit `/workspace` voor de interactieve case en CSV-export. De generieke regressiecontrole blijft `node tests/browser.cjs`.

## Beknopte weekchecklist

De compressorcase toont een jaarmatrix naar de opbouw van het aangeleverde voorbeeld `onderhoudslijst compressor.pdf`: taken en intervallen links, maandgroepen en ISO-weeknummers bovenaan, kleurcodes C/O/V en afvinkvakjes in de geplande weken. De inhoud blijft afgeleid van de LE-handleiding en de huidige simulatie, niet van de taakvoorbeelden voor een andere compressor. Jaar en onderhoudstype zijn selecteerbaar. Correctieve en overige gebeurtenistaken blijven zichtbaar zonder verzonnen kalenderplanning.

`checklist.js` ontvangt de berekende scenario’s via `compressor-plan-change`. Vinkjes zijn tijdelijke lesregistratie per taak/week; ze veranderen geen servicehistoriek en wissen bij andere scenario-invoer of herladen. Dagelijkse controles worden als C×n samengevat zonder hun frequentie te verlagen. Een eigen CSV-export en afdrukweergave (A4 liggend, alleen checklist) zijn beschikbaar. Validatie: `node tests/checklist-browser.cjs`.
