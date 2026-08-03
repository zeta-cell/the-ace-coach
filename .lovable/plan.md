# Assessment-First Onboarding Flow

Der Coach bewertet den Spieler, **bevor** dieser einen Account hat, und verschickt einen fertigen Bericht-Link. Der Spieler setzt nur noch ein Passwort.

## Der Flow

```text
COACH (in der App)
  1. Players -> "NEW PLAYER"
     Name, E-Mail, Telefon (optional), Clubs (1-4, Freitext)
  2. Direkt weiter zum Assessment
     8 Shots, Overall Level, Notes / Strengths / Focus / Next Goals
  3. "Bericht fertig" -> Link kopieren
     Coach schickt ihn selbst per WhatsApp / SMS / Mail

SPIELER (Link geoeffnet)
  4. Teaser-Seite: "Dein Assessment von <Coach> ist fertig"
     Overall Level + Datum + Coach sichtbar, Details noch verdeckt
  5. Nur Passwort setzen (E-Mail vorbefuellt, aenderbar)
     -> sofort eingeloggt, keine Bestaetigungsmail
  6. Landet direkt auf dem vollen Bericht:
     Radar, Shot Confidence, Coach-Notizen, Development
  7. Profil vervollstaendigen: Foto, Lieblingsschlaeger, Ziele, Clubs
```

Der Spieler ist ab Schritt 5 automatisch mit dem Coach verknuepft — kein manuelles Zuordnen mehr.

## Was gebaut wird

### 1. Prospect-Assessment (Bewertung vor dem Account)
- Der Invite bekommt Telefon-Nummer und Club-Liste dazu.
- Ein Assessment kann an einen Invite gehaengt werden, statt an einen bestehenden Spieler. Beim Passwort-Setzen wird es automatisch auf den neuen Account uebertragen — inklusive Shot-Werte im Profil.
- Bereits registrierte Spieler werden weiterhin wie bisher direkt bewertet.

### 2. Coach-UI: "NEW PLAYER" Wizard
Ein durchgehender Ablauf auf der Players-Seite:
- Schritt 1: Kontaktdaten + Clubs
- Schritt 2: das bestehende Assessment-Formular (8 Shots, Level, 4 Textfelder)
- Schritt 3: Erfolgsseite mit grossem Kopier-Button für den Link und einer WhatsApp-Vorlage
- Offene (noch nicht eingeloeste) Invites erscheinen als eigene Liste "Wartet auf Anmeldung" mit Link-kopieren und Assessment-bearbeiten.

### 3. Invite-Seite: Teaser statt leerem Formular
- Ueberschrift mit Coach-Name und Foto, Datum der Bewertung, Overall Level, Sportart.
- Die 8 Einzelwerte und Coach-Notizen bleiben verdeckt (unscharfe Vorschau) mit "Passwort setzen, um den vollen Bericht zu sehen".
- Formular: Name (vorbefuellt), E-Mail (vorbefuellt, aenderbar), Passwort. Google / Apple bleiben als Alternative.
- Nach dem Setzen: sofort eingeloggt, direkte Weiterleitung auf das Assessment, kein Onboarding-Zwang.

### 4. Clubs im Profil (1-4, Freitext)
- Neue Club-Liste im Spielerprofil: Name + Ort pro Eintrag, bis zu 4.
- Der Coach kann sie beim Anlegen und spaeter in der Spieler-Detailansicht pflegen.
- Der Spieler kann sie selbst bearbeiten (Profil bearbeiten).
- Die alten Einzelfelder Club-Name / Club-Ort werden in die Liste uebernommen.

### 5. Profil nach dem Signup
Sichtbar und editierbar direkt nach dem ersten Login: Profilfoto, Name, E-Mail, Telefon, Lieblingsschlaeger, Ziele, Clubs. Verbundene Geraete und Rewards bleiben wie gehabt "Coming Soon".

## Technische Details

- **Migration**
  - `coach_invites`: `+ phone text`, `+ clubs jsonb` (Liste aus `{name, city}`).
  - `player_assessments`: `player_id` wird nullable, `+ invite_id uuid references coach_invites(id) on delete cascade`; Check: genau eins von beiden gesetzt.
  - `player_profiles`: `+ clubs jsonb default '[]'` (Freitext-Liste), Backfill aus `club_name` / `club_location`.
  - RLS: Coach darf Assessments mit `invite_id` schreiben/lesen, wenn der Invite ihm gehoert. Anonyme Leserechte werden **nicht** vergeben — der Teaser läuft über eine `SECURITY DEFINER`-Funktion.
  - `get_coach_invite(_token)` wird erweitert: gibt zusaetzlich `assessment_date`, `sport`, `overall_level`, `level_system`, `has_assessment` zurueck — keine Einzelwerte, keine Notizen.
  - `claim_coach_invite(_token)` uebernimmt zusaetzlich: `player_assessments` mit diesem `invite_id` bekommen `player_id = auth.uid()`, `player_profiles` wird mit den Shot-Werten und `shot_data_source = 'coach'` sowie den Clubs/Telefon aus dem Invite befuellt.
- **Auth**: `auto_confirm_email` wird aktiviert, damit das Passwort-Setzen sofort einloggt. Passwort-Reset per Mail funktioniert weiterhin.
- **Frontend**
  - Neu: `src/pages/portal/NewPlayerAssessment.tsx` (Wizard, volle Seite), `src/components/portal/ClubListEditor.tsx`.
  - Angepasst: `CoachPlayers.tsx` (Button + Liste offener Invites), `AssessmentDrawer.tsx` (akzeptiert `inviteId` statt `playerId`), `CoachInvite.tsx` (Teaser + Passwort-Setzen), `PlayerProfileEdit.tsx` (Club-Liste, Telefon), `lib/coachInvite.ts` (neue Felder), `PlayerProfile.tsx` (Clubs anzeigen).
  - Validierung mit zod: E-Mail-Format, Namenslaenge, Passwort min. 8 Zeichen, max. 4 Clubs.
