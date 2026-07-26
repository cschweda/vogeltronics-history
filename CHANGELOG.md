# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.7.0] - 2026-07-26

### Changed

- **Images are no longer embedded in `index.html`, and the document is 70 KB instead of 4.4 MB.** Inlining everything as data URIs had one fatal property: nothing paints until the entire document arrives. First paint and largest contentful paint both sat at **16.7 s** on a throttled mobile connection, and mobile performance scored **55**. Extracted, the browser fetches images in parallel, defers everything below the fold, and caches them between visits.
- **There is now a build step**, which the project had gone out of its way to avoid. It earns its keep:
  - `assets/img-src/` holds the committed originals. `npm run build` runs `tools/build-images.mjs` (sharp), which writes right-sized WebP to `assets/img/`. That directory is gitignored and regenerated on every Netlify deploy; `netlify.toml` carries the command and pins Node 22.
  - **Format**: WebP beats the JPEG photographs, and beats the flat-colour box art badly — PNG is the wrong container for that artwork at this size. No `<picture>` fallback: WebP has shipped in every browser since Safari 14 in 2020, and 31 elements of fallback markup to serve a rounding error of traffic is a bad trade.
  - **Size**: every image was being sent far larger than it is ever drawn — the box art arrived 600 px wide to be displayed at 210. Each target is now its CSS display width doubled, so a file is right for a 2× screen and no bigger. Where an image appears twice at two sizes, the larger wins.
  - Together: **2.9 MB → 885 KB, down 69%.** `box-meadow` alone went 194 KB → 21 KB.
- **28 of 31 images are `loading="lazy"` with `decoding="async"`.** The three that stay eager are the masthead lockup and the founder portrait, which are in the first viewport on a phone, plus its duplicate; both are preloaded with `fetchpriority="high"`.
- The three Rovacon voice clips were also data URIs. They are byte-identical to WAVs already sitting in `assets/`, so they now point at those files instead of shipping twice.

### Result

Mobile performance **55 → 90** measured locally, LCP **16.7 s → 3.7 s**, with accessibility, best practices and SEO holding at 100. Desktop stays 100 across all four.

## [2.6.2] - 2026-07-26

### Fixed

- **Accessibility is 100 on Lighthouse and clean on axe-core**, mobile and desktop, at WCAG 2.2 AA. Three real defects:
  - **No `<main>` landmark.** The document was divs all the way down, so a screen-reader user had no way to skip the nav and the marquee and get to the history. `.page` is now `<main class="page">`, with `<footer>` moved outside it so the landmark holds the history and nothing else.
  - **`.play` buttons failed contrast.** White on `#ff4436` is 3.4:1, under the 4.5:1 floor for text that size. A new `--red-deep: #e02a1a` is used for that background only — `--red` is untouched everywhere else, so nothing about the page's colour changes except the one control that was failing. Independently confirmed: 375 of 375 text/background pairs now pass AA, including the nine axe could not resolve automatically because they sit on gradients.
  - **A console error on every load.** No favicon was declared, so every visit 404'd on `/favicon.ico`. Now an inline SVG data URI — no request, no file, page stays self-contained.
- **All 31 images carry explicit `width` and `height`.** Without them the browser cannot reserve space and the page reflows as each data URI decodes. Dimensions are read out of the embedded PNG/JPEG headers rather than typed by hand, so they cannot drift from the actual bytes. `.boxart` gained `height:auto` — the one image rule that lacked it — so the attributes stay hints and CSS keeps control of layout. The five games-grid images whose `src` is assigned by JS are sized from their source art.
- **The six Larry voice clips now carry cache headers.** They are the only files the page fetches at runtime, and they were served with no `Cache-Control` at all, so a repeat visitor re-downloaded 232 KiB to hear the same six lines. Scoped to `/assets/*.wav` deliberately: a blanket rule over `/assets/*` would also pin `og-image.png`, which `make-og-image.py` regenerates under the same filename and which social crawlers must be able to re-fetch.
- Every image already had alt text; nothing needed adding. Verified at 320 px, 360 px, 390 px and 860 px with no horizontal overflow.

### Known

- **Mobile performance is 55, and it is the single-file design.** Desktop is 100. `index.html` is 4.39 MB because every image is a base64 data URI, and on Lighthouse's throttled mobile profile nothing paints until the document arrives: FCP and LCP both land at 16.8 s live. The page was 2.32 MB this morning and gained ten photographs. Extracting the photographs to `assets/` and referencing them normally would drop the document to roughly 60 KB and the metrics to well under a second, at the cost of "one self-contained file, no build step" — which is a deliberate architectural choice, so it stays until someone decides otherwise. `loading="lazy"` is not a workaround: there are no image requests to defer.

## [2.6.1] - 2026-07-26

### Added

- **The VT-7000 assembly line** — Vogel on the factory floor in 1980, pointing down a line of answer spheres, every one of them lit with the same three words. It sits in Electrify Everything between the Oracle box art and the misfires grid: the box art's caption is the setup ("it knew all. Specifically, it knew one thing"), the photograph is the joke, and the grid underneath is the technical account of how a mask ROM made it permanent. The banner in the shot reads MODEL VT-7000, which is the number the Oracle card already carried. The board over the line reads DAYS WITHOUT AN INJURY: 1, which for this company is a fair average.

- **The Whirlwind catalog shot** — a 1981 living room, a smiling model, a refrigerator-sized battery pack on her back, and a cord running down to the vacuum. It goes in The Cordless Detour immediately after the product block, so the claim and the photograph of the claim arrive in that order. The caption points at the cord as well as the pack: the pack is the visible joke, but the cord is the one that retires the word "cordless." Walter T. Vogel is seated behind the *Chicago Tribune* with a cigar, not helping — which is period-correct twice over, since founder-as-spokesman was the dominant convention of the era and the man who insisted the pack "ran warm rather than hot" is here demonstrably not wearing it. The pack in this frame is lettered UP TO 2 12 VOLT BATTERIES, which is exactly what the paragraph above it now claims — one runs the machine, two are recommended — and which is also the correct weasel-phrasing for a carton of this vintage.

- **The second chair, and the walkie-talkie.** The prospectus calls for "a table, two chairs, and a fellow with opinions" — one fellow, two chairs — and the photograph puts the unanswered question on the page. A new pull quote answers it: Vogel wanted, for the other chair, "the woman who wrote the book about the housewives." Nobody is named, because this section never names anybody (M. V., the peanut farmer, this new fellow) and the reader does the arithmetic. She points straight back at the Whirlwind photograph one section earlier — that suburban living room is her subject — and Vogel thinks he has made a booking. Diane can see what it is: *"I said she can ask me whatever she likes, I have got answers for all of it. Diane said that was the trouble."*
- A closing paragraph names the pattern the page had been building without saying so: a walkie-talkie set ships with two handsets. His brother would not take the other one. Neither would the toy he named after his brother, which answers a cleared pattern with *again* and never once declares a winner. The channel had two chairs and he never cast the second. It sits immediately before the existing closer, so "whether anybody had ever found out who the M was" now reads as a man still looking for somebody on the other end.
- **The WTV studio** — a table, two chairs, three lights and nobody, directly after the prospectus blockquote and before "He never bought a transmitter." It is the tenth photograph and **the only one Walter T. Vogel is not standing in**, which is the whole reason it is last: nine frames establish that he turns up everywhere, so the one room he only ever described is the one he is absent from. The caption is deliberately the shortest on the page, because there is nothing in the frame to point at. The room is better appointed than "he got as far as the call letters, a rate card, and a one-page prospectus" allows, so the caption makes it a set struck for the rate card rather than a working studio — the only thing the channel ever produced was a photograph of itself.

- **The '83 sales meeting** — Walter T. Vogel Jr. holding a Colossus over his head by its cartridge, to warm applause, in The Colossus after the product block and before the pull quotes. By that point the reader has been told the cartridge never came back out, so the photograph is a room applauding a defect. Two details do most of the work: the cartridge is *Gridiron*, the pack-in, and therefore the game most machines would be stuck on for good; and the banner behind him reads THE ONE YOU CAN COUNT ON, which is a great deal to claim for a machine that never gives the cartridge back. Vogel is second from left with his arms folded, the one man not applauding. And the nameplate on the table in front of Junior is wrong: it was ordered as WALTER ("JUNIOR") T. VOGEL, and the print shop up the road saw the name, drew its own conclusion, and sent back WALTER T. VOGEL &middot; CHAIRMAN. Nobody corrected it — which is the dynastic-succession joke in miniature, since the section already notes that Junior's qualifications were listed in full on his birth certificate. He is standing behind his father's name and his father's title. It also finally gives Junior a face before the company is handed to him — until now he was one of four people in a Christmas photograph.

- **Ozerov across the board from Fischer**, in The Grandmaster Affair. It sits after the product block and before "But they left the engine exactly as it was" — so the reader meets the man, learns he was erased, and only then sees him alive, young, and profoundly bored. Fischer is locked over the position; Ozerov is leaning back with a cigarette, looking at the ceiling. The caption makes that his method rather than his failing, which gives the section's existing claim — a "strange, idiosyncratic method of reading a position" — something concrete to point at.

- **The Whirlwind's second battery**, and the fine print that comes with it. The machine runs on one 12-volt battery; *two* are recommended, **wired in series**, for "twice the cleaning." Two 12-volt batteries in series make twenty-four volts rather than twice the running time, and the motor is a twelve-volt motor — so owners who took the recommendation "reported a marked increase in suction, followed by smoke." It is the same species of error as the alternator that made AC for a battery that drinks DC, two paragraphs earlier, which is the point: this company understands electricity well enough to get it wrong confidently.
- The recommendation does three things at once. It explains why the backpack in the catalog photograph is so obviously outsized — it was built for the pair. It keeps the box art honest, since `JUST A 40-LB BATTERY ON YOUR BACK` describes the standard configuration and the artwork is a baked PNG with no generator in `tools/` to rebuild. And it earns the fine print: **two Sears DieHards**, **not included** — a phrase VogelTronics had been printing on toy packaging since 1961 and saw no reason to stop — installation **may require professional assistance**, and, in the smallest type on the panel, **consult your local automotive professional.** For a vacuum cleaner.

### Changed

- **The Italian place across the lot is named: Rosarita's.** Walter T. Vogel's standing working lunch there was chicken marsala, no mushrooms, light on the sauce, and a double scotch — and the kitchen never made it separately, because the staff liked him and picked the mushrooms out by hand. That last detail is doing quiet work: the page spends twenty-three years on a man who would sell a child anything and trusted none of it, and this is the only evidence anywhere that people were fond of him.

- **The founder is "Walter T. Vogel" everywhere the full name appears** — never "Walter Vogel." Seven occurrences fixed across prose, image alt text, and this changelog. The middle initial is not decoration: he signs `WTV` on invoices, service bulletins and the 1982 forecast, and the WTV section turns on those three letters being his own. A name that drops the T undercuts the joke two sections later. Informal narrative references to "Walter" are untouched.
- **The Christmas party photograph is reshot.** Same four people, same room, but the storefront beside VogelTronics now legibly reads **JO-ANN FABRICS** — which is worth a clause in the caption, because it quietly relocates the company from a campus to a suburban strip mall, a few doors down from a fabric store. Source: `assets/christmasparty-joann-fabrics.png`.
- **`assets/` keeps every photograph, including the frames the page doesn't use** — the alternate lobby portrait, the contact sheet, and the earlier Christmas frame. `index.html` embeds its own resized copies, so the folder is an archive rather than a dependency and an unused frame costs the site nothing. The README now tables which frame goes where.
- **The founder banner and The Founding no longer run the same frame, and each now sits in its own era.** Both had been using the same late-'70s portrait, one screen apart. The banner keeps that portrait — the man as the company knew him longest, beside an attribution line reading 1961–1984 — and The Founding takes a studio portrait of Vogel as a younger man: horn-rims, tweed, narrow tie, cigar already established. That section is explicitly 1961, so the young face belongs to it.
- The Founding's image is set to `min(280px, 100%)` rather than the `.prod` default of `210px`. That default is sized for upright box art; this frame is 5:4, and at 210px it floated at the top of the column instead of holding the block.

## [2.6.0] - 2026-07-26

### Added

- **Three photographs**, all embedded as JPEG data URIs alongside the existing PNG box art:
  - **The pinewood derby, 1958** — Vogel in a Scout leader's uniform, cigar clenched, watching a heat run down a Pack 12 track. It sits in the Derby section directly beneath the recalled 1974 box, which is the whole joke: the thing he loved, and the thing engineering made of it.
  - **The company Christmas party, late 1970s** — in the banquet room of the Italian restaurant across the lot, the VOGELTRONICS sign visible through the glass. Left to right: Ray Kessler, Walter T. Vogel, Diane Vogel, and Walter T. Vogel Jr. It goes in The Electronic Reinvention, the section that introduces Diane and Kessler, and is the only frame in which the whole cast appears at once — including the son who would be handed the Colossus five years later.
  - **Vogel at his desk, autumn 1982** — shirtsleeves, cigar, pen in hand over stacks of paper, under the "Games That Think!" sign. It anchors The Next Ten Years, which had been the site's longest unbroken run of text.
- `figure.photo` — a wider figure treatment (`min(520px, 92%)`) with a hairline border, for photographs as distinct from box art.
- The desk photograph also heads the README, under the opening paragraph, captioned so it sets up "Why a fictional company?" directly beneath it. It is served from a web-sized copy (`assets/vogel-at-his-desk-web.jpg`, 204 KB) rather than the 2.1 MB source.

### Changed

- **The founder portrait is now a photograph.** The illustrated Walter T. Vogel — which carried its own frame plus "A WORD FROM OUR FOUNDER" and the name and dates baked into the artwork, duplicating the markup around it — is replaced by a straight portrait in both places it appears: the founder banner under the masthead and The Founding.

## [2.5.0] - 2026-07-25

### Added

- **WTV (1981–1982)** — a new era section between the Cordless Detour and the
  1982 forecast. In August 1981 Walter T. Vogel is told a channel called MTV has
  launched, asks who M. V. is, and never gets a satisfactory answer. Concluding
  that a rival had beaten him to the initials — he had been signing things
  `WTV` for thirty-five years — he files for his own channel the following
  month.
- It would not be music. He had never owned a record, and left the room when
  his wife played Johnny Mathis. What he proposed instead was a channel of men
  at a table, around the clock, saying whose fault it was. The prospectus is
  the load-bearing joke: "a table, two chairs, and a fellow with opinions —
  nothing to manufacture, nothing to ship, nothing to recall." A man who had
  spent twenty years losing money on tooling and forty-pound batteries had a
  product with no unit cost in his hand in 1981 and never bought a
  transmitter.
- He talked himself out of it by spring 1982, on the grounds that the country
  had turned too serious for grievance after the peanut farmer. Early by about
  forty years. The section deliberately never names what he invented and
  abandoned — the reader does that arithmetic, and it lands harder unspoken.
- The section also sets up a payoff that was already on the page: "The Next
  Ten Years" has Walter initialling the forecast `WTV — agreed, but sooner`
  one paragraph later, so the initials now read as a running gesture rather
  than a detail.
- `WTV` added to the fictional-inventions list in the page footer.

## [2.4.1] - 2026-07-25

### Fixed

- **Canonical redirects moved into `netlify.toml`.** Netlify's primary-domain
  setting did not produce them: all four names kept serving 200 as equals,
  with no `Location` header and no certificate re-issue. `www` and
  `history.vogeltronics.com` now 301 to the bare domain from committed rules,
  which survive dashboard edits and work on any plan. `force = true` is
  required, or the rule yields to the existing `index.html` at `/`.

## [2.4.0] - 2026-07-25

### Changed

- **`vogeltronics.com` is the landing page.** There is no separate catalog
  page and there is not going to be one: clicking the bare domain lands you
  on the history, which *is* the front door. The canonical link, `og:url` and
  `og:image` all point at the apex now, and the social card's footer reads
  `vogeltronics.com` again. `www` and `history.vogeltronics.com` become
  redirects to it.

## [2.3.0] - 2026-07-25

### Changed

- **The bare `vogeltronics.com` now serves this site**, alongside `www`, via a
  DNSimple ALIAS to Netlify. The README said the apex was "where the playable
  catalog lives"; it is the corporate history, so the copy says that instead
  and points the catalog at MetaIncognita, where it is actually indexed.
- **`make-og-image.py` now requires `--url`.** It defaulted to the bare apex,
  which used to mean "the brand root" and now means this site specifically —
  so the default was quietly wrong for every game repo. A card should carry
  the address of the thing printed on it: this one says
  `history.vogeltronics.com`, Gridiron's says `gridiron.vogeltronics.com`.
- Regenerated `assets/og-image.png` accordingly.

## [2.2.0] - 2026-07-25

### Added

- **"The Next Ten Years" (1982).** A new section between the Cordless Detour
  and the Colossus: the distributor bulletin in which VogelTronics, seven
  years after the Altair and a year from the end, forecasts 1990. Some of it
  is uncanny — a computer in every den, games arriving down the telephone
  line, a machine that remembers your name. Some of it is not: the company
  bet its forecast on the keyboard dying, because VogelVox had been talking
  since 1979. It sets up a line the Crash section already had waiting —
  Walter initials the sheet "agreed, but sooner", and never bought a home
  computer.

## [2.1.0] - 2026-07-25

### Changed

- **Moved to `history.vogeltronics.com`.** The universe now has its own domain:
  every VogelTronics property lives under `vogeltronics.com`, with the games on
  their own subdomains (Gridiron at `gridiron.vogeltronics.com`). All
  metaincognita references retired. The 2.0.0 entry below records the earlier
  address and is left as written.

### Added

- **Social card.** The site had no Open Graph tags at all, so sharing the link
  rendered a bare URL. Adds `og:`/`twitter:` meta, a canonical link, and
  `assets/og-image.png` — generated by `tools/make-og-image.py`, the shared
  generator every VogelTronics property uses, so the whole catalog's cards
  match.

## [2.0.0] - 2026-07-19

### Changed

- **Complete rebrand.** The fictional company's previous name turned out to belong to a real-world toy brand, so it has been retired everywhere. The company is now **VogelTronics**, founded in 1961 as the **Vogel Novelty Company** and officially renamed at the height of the 1977 Electronic Reinvention — a retcon that now *is* the story: the division Diane Vogel and Ray Kessler stood up gave the whole company its name.
- Every era of the narrative now uses the era-correct name: Vogel Novelty for the founding, the Heritage Hits, and the Lean Years (Sergeant Steele, Meadow, Derby); VogelTronics from 1977 on. The Cordless Detour's name-change joke is now about a *second* rename ("VogelTech," "Vogel Home") four years after the first.
- The voice chip is now **VogelVox™** (formerly a name derived from the old company name), in the marquee, the Rovacon story, the builders' note, and the game cards.
- All artwork re-lettered: the masthead logo, the 1961 Vogel Novelty heritage badge, and all thirteen box arts (era-correct — Vogel Novelty on the 1966–1974 boxes, VogelTronics from 1977 on), re-set in the original typeface and composited back into the embedded illustrations.
- README logo replaced: `assets/vogeltronics-logo.svg` (plus PNG render) — same plaque design, LED-apex **V**, cream "Vogel" / red "Tronics" wordmark, drawn as pure vector paths with no font dependencies.
- Live site moved to [vogeltronics.metaincognita.com](https://vogeltronics.metaincognita.com).

## [1.3.0] - 2026-07-19

### Added

- Box art on every "Play the Games" card, reused from the history's embedded illustrations by id at load time — no image data is duplicated, so the file barely grows.
- Two more COMING SOON cards in the games grid: **Gridiron II** ("now with THE FORWARD PASS" — re-created faithfully, random interceptions and all) and **The Oracle** (still giving the only answer it ever gave: I WOULD BET ON IT).

## [1.2.0] - 2026-07-19

### Added

- Rovacon sound previews in the "Play the Games" grid: the three actual in-game VogelVox voice clips — "Rovacon." (introducing itself), "System fault." (a route gone wrong), and "Ouch. That hurts." (falling down the stairs) — playable from the Rovacon card. The clips are embedded as `data:` URIs, so the site remains a single self-contained file; the source WAVs live in `assets/`.

### Changed

- The games grid is now a two-across flex layout, giving each card room for its summary and the sound buttons.
- The Rovacon card is marked COMING SOON (like Gridiron) until the game itself ships.
- Both game-card summaries now wink at the real 1977/1979 handhelds they homage — without naming the brands.
- Tightened the history since 1.1.0: removed the Sorcerer entirely, gave the hero a new founder quote, rewrote the Cordless Detour around the trickle charger, and trimmed the Colossus cord fiasco down to the stuck cartridge.

## [1.1.0] - 2026-07-18

### Added

- Company logo in `assets/` (SVG plus a 2× PNG render): a dark late-70s product-badge lockup of the masthead brand with an LED-apex letter and a cream/red wordmark, gold "Games That Think!" tagline. The wordmark is drawn as pure vector paths, so it renders identically everywhere with no font dependencies. Now heads the README.

## [1.0.0] - 2026-07-18

### Added

- Initial release: the complete single-page corporate history of the fictional toymaker (1961–1983), from the founding in Elk Grove Village through the Heritage Hits, the Electronic Reinvention, Rovacon, the Gridiron handhelds, the Grandmaster Affair, and the Crash.
- All 18 illustrations embedded as data URIs — the site is one self-contained `index.html` with no build step.
- Fictional-parody disclaimer in the page footer.
- Repository scaffolding: README, MIT license, `.gitignore`, `netlify.toml`, and this changelog.

[2.0.0]: https://github.com/cschweda/vogeltronics-history/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/cschweda/vogeltronics-history/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/cschweda/vogeltronics-history/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/cschweda/vogeltronics-history/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/cschweda/vogeltronics-history/releases/tag/v1.0.0
