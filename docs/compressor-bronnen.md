# Compressorcase: bron en rekenafspraken

Educatief lesmateriaal, gemaakt door dhr. Hermans. De voorbeeldassets zijn fictief; het selecteren van een model bewijst geen bestaande installatie of bestelbare optiecombinatie.

## Bron

Door de gebruiker aangeleverde `ATLAS_COPCO_Industrial_Aluminium_Piston_Compressor_Product_Manual.pdf`, LE 2, 3, 5, 7, 10, 15 en 20; omslag mei 2012, No. 2920 7089 82. Paginavoeten noemen 2920 7089 80. De onderhoudstabel is zowel als tekst uitgelezen als visueel gecontroleerd. Gedrukte pagina = PDF-pagina minus twee voor de aangehaalde hoofdstukken. Er wordt geen kopie van de volledige PDF gepubliceerd.

## Overgenomen feiten, in eigen woorden

- §2.1, p.9–14: gesmeerde, luchtgekoelde tweecilinder eentrapscompressoren; uitvoering en componentreferenties. Inventarisobjecten volgen gemonteerde opties en vereisen verificatie.
- §5.2, p.56 (PDF-p.58): dagelijks condensaat afvoeren, wekelijks oliepeil, zesmaandelijks veiligheidsventieltest en filterinspectie.
- Filter vervangen: LE 2/3: 800 uur of één jaar; LE 5/7: 600 uur of één jaar; LE 15/20: 500 uur of één jaar. **LE 10 staat niet in die regels.** Er wordt geen vervangingsinterval aangenomen, ook geen jaartermijn voor dit ontbrekende type. De zesmaandelijkse inspectie blijft staan.
- Afblaasgeluiddemper, indien aanwezig: 2.000 uur of één jaar.
- Minerale olie: 2.000 uur of één jaar; Piston Fluid: 3.000 uur of twee jaar. §5.4, p.58: eerst bereikte interval geldt.
- Terugslagklep/ontlastventiel: 3.000–4.000 uur. Simulator kiest conservatief 3.000; de bevoegde serviceorganisatie moet de toepasselijke keuze bevestigen.
- Klepschijven: LE 2/3/5/15/20: 4.000 uur; LE 7/10: 5.000 uur.
- §5.2, p.57: Full Feature koeldroger dagelijks afvoerfilter inspecteren/reinigen, wekelijks condensorlamellen reinigen. DD/PD-filtervervangingsintervallen ontbreken; extra componentdocumentatie blijft nodig.
- §9, p.71: dagelijks condensaat uit vat, ook bij automatische afvoer; wekelijks werking automatische afvoer controleren. Periodieke vatinspectie en lokale regels. §3.6, p.51 vermeldt op het pictogram jaarlijkse wanddiktecontrole. De jaarlijkse wanddiktecontrole is als fabrikanttaak ingepland; dit is geen universele wettelijke keuringsdatum. De bevoegde instantie moet de afzonderlijke lokale keuringsverplichtingen en methode voor het echte vat vastleggen; dat blijft een open documentatiepunt.
- §6.7, p.65–66: veiligheidsventieltest alleen door bevoegde personen, niet bijstellen. Deze site publiceert geen uitvoeringsstappen voor het verhogen van druk tijdens een test.
- §7, p.67–68: storingsbeelden voor correctieve plannen; geen kalenderinterval.
- §8.3, p.69–70: olie-inhoud LE 2/3/5: 0,8 l; LE 7/10: 1,4 l; LE 15/20: 5,4 l. Dit is identificatie-informatie, geen navuladvies.

De handleiding vraagt kortere controles mee te nemen bij langere service, nieuwe verstoorde pakkingen en termijnen aan te passen aan omgeving en serviceafspraken. Die randvoorwaarden blijven expliciet zichtbaar.

- §4.2, p.52–53: oliepeil vóór iedere start controleren, naast de wekelijkse controle. Dit is een gebeurtenistaak, niet een afgeleide kalenderherhaling.
- §4.1, p.52 en §6.7, p.65: na meer dan zes maanden stilstand / niet-gebruik gelden extra aandachtspunten voor smering en veiligheidsventieltest. Hiervoor staat een heringebruiknametaak; draaiuren alleen bewijzen niet hoe lang een machine werkelijk buiten dienst was.

## Aanvullende onderwijskeuzes

Predictieve meetcontroles van 7/30 kalenderdagen zijn voorstellen, geen fabrikantfrequenties. Ze geven geen bewezen resterende levensduur en mogen preventieve termijnen niet opschuiven. Alarmcriteria en referentiegegevens ontbreken nog. Correctief onderhoud volgt een vastgestelde storing; urgente veiligheidsafwijkingen mogen niet wachten op bundeling.

Alle elektrische uitvoeringen zijn didactische profielen. Benzinemotor-, exacte drukvat-, koudemiddel-, droger- en filterspecifieke documenten zijn niet volledig beschikbaar. De inventaris heeft geen verzonnen serienummers, partnummers of vatinhoud.

## Simulatie

- Invoer: startdatum, 0–24 draaiuren per productiedag, 0–7 dagen/week (maandag eerst), 1–1.095 kalenderdagen, beginmeter en per taak de laatst uitgevoerde datum/meter. De tijdzone voor de standaarddatum is Europe/Brussels; rekenkundige datums zijn datumwaarden zonder zomertijdverschuiving.
- Standaardhistoriek is een fictieve volledige service op de startdatum. Het startmoment is een aanname voor onderwijs, geen operationele vrijgave. Aanpassen per taak is mogelijk. Gebruik `Lesvoorbeeld` om bewust de startdatum en actuele beginmeter als nieuwe fictieve basis te nemen.
- Kalendertermijnen lopen door bij 0 productie-uren. Maandtermijnen gebruiken kalendermaanden, met afkappen naar de laatste dag bij bijvoorbeeld 31 januari + één maand.
- De eerst bereikte grens wordt gekozen. De urenplanning vindt plaats vóór de dagproductie die de limiet zou bereiken; dat kan maximaal een productiedag eerder zijn. Tellerstanden en volgende termijnen worden berekend vanaf de werkelijke gesimuleerde uitvoering, niet vanaf de oude deadline.
- De twee scenario’s worden apart doorgerekend. Bij een noodzakelijk servicebezoek kunnen geschikte interventietaken maximaal 0–30 dagen vervroegd worden. Geen taak wordt uitgesteld. Veiligheidsventieltests worden niet vervroegd en houden hun aparte testfase.
- Routine- en meetcontroles worden apart geteld; ze zijn geen servicebezoek. Kalenderdagen buiten productie blijven beschikbaar voor voorgeschreven controles en service.
- Achterstallige taken staan bij start onmiddellijk in het resultaat met een waarschuwing. Een datum in de simulator is geen toestemming om door te werken.
- Minder bezoeken is geen berekende totale stilstandsbesparing. Alleen het verschil in bezoeken maal de door de gebruiker ingestelde vaste voorbereidingstijd wordt getoond. Extra vervroegde onderhoudstaken worden apart geteld; arbeid, onderdelen, productieverlies en testtijd zijn niet gemodelleerd.
- CSV’s bevatten gekozen configuratie via de inventaris, drie onderhoudsplannen, bronverwijzingen en in de planning ook invoerhistoriek, controles, open punten en werkordercheck. De export `alle 7 types` gebruikt dezelfde gekozen opties voor zeven fictieve voorbeeldassets, geen zeven aangetroffen machines. Invoer wordt niet permanent opgeslagen.
