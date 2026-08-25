# AVV-Fassungen

Hier liegt je Fassung genau eine PDF-Datei:

    public/avv/avv-1.0.pdf
    public/avv/avv-2.0.pdf
    ...

Diese Datei geht nach der Zustimmung per Mail an den Nutzer
(`lib/avv/mail.ts`). Sie muss Wort fuer Wort dem Volltext in
`lib/avv/text.ts` entsprechen - gelesen wird das eine, zugeschickt das
andere.

Eine alte Fassung wird NIE ueberschrieben. Wer den Vertrag aendert, legt eine
neue Datei daneben und erhoeht `AVV_VERSION` in `lib/avv.ts`. Sonst haetten
Leute einer Fassung zugestimmt, die es nicht mehr gibt.

**Das Gate ist aus, solange `AVV_VERSION` in `lib/avv.ts` leer ist.**
Zum Einschalten: Volltext eintragen, PDF hierher legen, Fassung setzen.
