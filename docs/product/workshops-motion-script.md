# Workshops page: motion graphic script

**Goal:** one 60-second film that sits at the top of `/book-keynote` (the Workshops page) and sells a learning chair on booking. It should prove three things fast: members actually build, the rooms love it, and it has happened at scale.

**Formats:** 16:9 master (page hero, autoplay muted, loops) plus a 9:16 cut for LinkedIn and Instagram. Captions burned in, because the page plays muted.

**Look:** site tokens only. Navy `#04102D` ground, Mint `#6FF2C1` for numbers and emphasis, Blue `#287BE8` for labels, White type, Inter Black for headlines. Kinetic type over real footage. No stock, no AI-generated people.

**Sound:** one driving track that drops out at 0:38 for the member voices, back in for the close.

## Script

| Time | Picture | On-screen text | Audio |
|---|---|---|---|
| 0:00–0:04 | Black. A cursor blinks, types a prompt. Cut to a wide of the Melbourne room, 60 laptops open. | "Most AI talks end with a slide." | Track starts, low. |
| 0:04–0:08 | Hard cut: a member's phone showing their own live site. | "Mine end with **your business, live.**" | Hit on the cut. |
| 0:08–0:14 | Fast montage: hands on keyboards, an engineer leaning in, a screen going from error to green. | "Half a day to two days. Your venue. Your members." | |
| 0:14–0:24 | The big numbers count up in Mint on Navy, one per beat. | **1,028** attendees · **14** events · **NPS 79** · **4.4/5** more confident leading AI | Beat per number. |
| 0:24–0:32 | Split screen of three rooms: Melbourne, Saigon, Work Healthy Australia. Each gets a label and its number. | Melbourne · **25 live sites in two days** · NPS **88** / Saigon · **16 builders** / Work Healthy Australia · **flew home with the system** | |
| 0:32–0:38 | Screen grabs scroll past: real sites members shipped (GAM Super Fan Program, Hero Club Hanoi, Melbourne CRMs). | "Built in the room. Still running." | Track builds. |
| 0:38–0:50 | Three member soundbites, vertical frames sliding in. Andrew Le: "One of the best EO events of the year, and I mean it." Fiona White: "I came from a point where I'm embarrassingly awful with AI." Then a cut to her live site. Huy or Tracy to close the trio. | Name and room under each. | Track drops. Member audio only. |
| 0:50–0:56 | Dave on stage, then sitting next to a member at a laptop. | "Bring your chapter. **I bring the engineers.**" | Track returns. |
| 0:56–1:00 | End card on Navy. | "Book an AI workshop" · davehajdu.com/workshops | Final hit. |

## Footage list (all exists, from the Infinite Leverage repo and Blob storage)

- Melbourne room wide and group photos: `infinite-leverage/public/images/melbourne-2026-recap/`
- Andrew Le and Fiona White clips: Vercel Blob `video/founder-andrew.mp4`, `video/founder-fiona.mp4`
- Tracy and Huy: YouTube `8mIWhaKYsjU`, `-x8gGeH_FnU`
- James Murray film: YouTube `9g6bhTIJeKA`
- Saigon cohort and team photos: `infinite-leverage/public/images/saigon-recap/`
- Ignite room b-roll and Dave on stage (cleared for public use 2026-10-28)
- Live site screenshots: the Best build award captures from the Melbourne recap

## Open decisions

1. **Build it as code or in an editor?** Recommendation: Remotion in the Infinite Leverage repo, since the numbers and site screenshots already live there and the film can re-render when the track record changes.
2. **Ignite attendees on camera:** named attendees still need their own yes before they appear.
3. **Voiceover:** the script runs on type and member voices. Add Dave's voice only if the muted autoplay test feels thin.
