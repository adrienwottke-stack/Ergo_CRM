# Review: Arbeitslagen und Onboarding

Review-Branch: `codex/review-arbeitslagen-onboarding`.

Die Arbeitslagen-Umsetzung und der vollständige Onboarding-Flow sind gemeinsam enthalten. Der reguläre Merge führt den Onboarding-Commit `422ef706445c66a2b1becedcdca5254be33d13aa` in die Review-Historie ein. Seine Inhalte waren zuvor gezielt in den Arbeitslagen-Stand übernommen worden.

Bei der Merge-Auflösung blieben alle Anwendungs-, Schema- und Testdateien identisch mit dem bereits geprüften Integrationsstand. Die Abweichungen zum Onboarding-Branch betreffen die neue Heute-Anordnung, Navy-Beschriftungen, additive Arbeitslagenmodelle sowie zusammengeführte Testkonfiguration und Dokumentation. Routing, Checkpoints, Sammlung, Nummern, Anrufvorbereitung und Storno-Flow bleiben erhalten.

Prüfstand: 42 automatisierte Tests, TypeScript, beide Browserdurchläufe und isolierter Produktionsbuild erfolgreich. ESLint: keine Fehler, eine vorbestehende Warnung im lokalen Audit-Skript. Details und noch ausstehende Geräte-/Nutzerabnahme: [Umsetzung](arbeitslagen-umsetzung.md), [Onboarding](onboarding-implementierung.md).

Die gemeinsame Ausgangsbasis ist `07b9798`. Beim Push lag `origin/main` auf `ad63a1a` und enthielt 61 zusätzliche Commits. Diese Änderungen sind nicht Bestandteil dieses geprüften Review-Stands; vor einer späteren Übernahme nach `main` sind sie gesondert zusammenzuführen und erneut zu prüfen. Der Review-Push verändert `main` nicht und führt selbst keine produktive Datenbankmigration aus.
