<!-- From treygoff.com/stack — adapt freely. -->
---
name: midjourney
description: Midjourney image generation on V8.2 in the midjourney.com web UI. Use when the user wants to make or iterate on a Midjourney image, mentions Midjourney or MJ or an imagine prompt, names any of --stylize/--sref/--profile/--chaos/--weird/moodboards/style codes/personalization, or when a generated image is not coming out the way they described it.
---

Midjourney rewards diagnosis over rewriting. When an image misses, the cause is usually a knob, not your words — and the reflex this skill installs is to check the knobs first, every time.

**V8.2** has been the default model since 2026-07-24. It is an aesthetics, image-quality and personalization retune of V8.1 — the docs merge V8.1 and V8.2 into a single compatibility column, so the V8.1 feature surface *is* the V8.2 feature surface. V8.0 was decommissioned the same day. Version dropdown: 8.2, 8.1, 7, 6.1, 6, 5.2, 5.1, 5, 4, 3, 2, 1, niji 7–4.

## The three concepts

Every Midjourney knob trades **prompt fidelity** against **beauty**. Knowing which side a knob sits on is most of the skill.

**License** — how far the model may stray from what you said. `--stylize` grants it (0–1000, default 100). Midjourney's own words: high values "could stray from the exact details of your prompt." High license is why a specific thing you asked for keeps not appearing.

> What "stray" actually costs is larger than it sounds. On a tightly-constrained composition, raising `--stylize` does not merely restyle — it reasserts the model's own **camera, geometry and framing**, handing back the exact liberties the prompt spent rounds removing. A piece that was level and vertical at 25 came back steep and distorted at 200, twice, on matched prompts. **Once a composition is locked by many hard constraints, treat `--stylize` as a constraint-override dial and expect a usable ceiling well below the default of 100.** Do not assume a tested-good value from one image transfers to another.

**Grip** — how hard an attached style system holds the image.

> **The single most important interaction in V8.** When a `--profile` (moodboard *or* personalization profile) is attached, `--stylize` stops being only the license dial and *also* becomes the blend weight. Midjourney's Moodboards doc: "the stylize parameter controls how much of your moodboard style is applied to the image. A lower stylize value will limit the style, while a higher value will increase it." One knob, two jobs, both pushing the same way. `--sw` and `--sv` are documented as **incompatible** with moodboards — `--stylize` is the only grip control you have.
>
> Consequence worth acting on: if a project needs license and grip controlled *independently*, build the look as a style code (`--sref`, which has its own `--sw` on a separate 0–1000 scale) rather than a moodboard. A moodboard gives you one dial for two jobs; an sref gives you two dials.

**Mass** — where the prompt's words actually sit. Midjourney weights by position and by volume, not by intent. A subject described in six words loses to a style described in sixty, however clearly you meant the subject to be the point.

## Diagnosis

Find the failure class first. Each has its own ranked ladder, and the ladders do not transfer — reaching for the Dissolve ladder on an artifact problem is how sessions lose whole afternoons to rewriting.

### Dissolve — the subject vanishes into the style

The characteristic V8 failure: a beautiful field where a person should be. Ranked causes — check in this order:

1. **The subject is under-massed, or is not the grammatical subject.** Count the words. If the style outweighs the subject several times over, the model is building a style that happens to contain a subject — and if the subject sits inside a prepositional phrase belonging to another noun, it dissolves regardless of word count. A mass-and-grammar rewrite alone has been enough to restore a dissolving figure with `--stylize` left untouched at 800.
2. **High `--stylize` with a `--profile` attached.** Both meanings of the parameter fire at once, and the style wins. Compounds with (1) rather than replacing it.
3. **The prompt contains dissolution words.** "Obscured," "obfuscated," "veiled," "hidden," "blurred into," "engulfed by" — applied to your own subject, these are direct instructions to erase it. The model does not know you meant them as modesty or atmosphere. Say what should be *visible* instead.
4. **The subject was specified as small.** Small subjects dissolve first. It is far easier to make a solid figure smaller than to make a dissolved one solid — render it larger, get it right, then reframe. But subject size has a **floor and a ceiling**, and they are close together: too small and it dissolves; large enough that the model attempts facial detail it lacks the pixels for, and you get mush instead (see Resolution floor). Scale is a band to find, not a direction to push.
5. **No camera was specified.** An unstated camera is the most common silent gap in an otherwise good prompt.

### Artifact — something unwanted keeps appearing

Lens flares, starbursts, bokeh circles, vignettes, watermarks, film grain: things the model adds because your scene resembles a photograph of that kind of thing.

**The diagnostic is positional stability.** Open the four images of one job. A described feature lands in roughly the same place each time; a model prior *wanders* — mid-shaft in one frame, at the capital in the next. **Wandering means prior, and priors are killed with `--no`, not with adjectives.** Reword only after the flag has failed. A specular starburst that survived nine rounds of rewriting has died to `--no lens flare, starburst, glare` in a single pass.

Then add the positive clause anyway. `--no` alone is weaker than `--no` plus a statement of what should be there instead ("its glow even along the shaft, no single bright point") — diffusion models render instructions far more reliably than they withhold them. Flag as insurance, positive clause as the fix.

### Geometry beats camera — the shot angle won't obey

When a plain-language camera instruction keeps losing, stop escalating the wording. **Look for an object in the scene whose rendered form implies the camera you don't want, and change the object.** A prompt reading "seen from far away and level with the figure" can lose repeatedly to a flaring column capital, because a visible overhang *underside* is evidence of a low camera and the model resolves the contradiction in favour of geometry. Replacing the capital with a flat slab fixes in one round what four rounds of camera phrasing could not.

Before rewriting anything, check whether the constraint wins on *some* images in the grid. If it does, the prompt is fine — it is per-seed variance, and the fix is more seeds or an object change, never new words.

### Resolution floor — a detail renders as mush at any setting

Faces below roughly forty pixels, text, hands on a distant figure, fine mechanisms. No quality adjective helps because the pixels do not exist, and the failure repeats across every variant and every `--stylize`.

**Make the absence intentional.** "His face lost in the light and featureless" (or, better still, framing the subject from behind or departing so no face is in view at all) converts the blank shape the model was going to produce anyway into a correct render. This is the same move as naming an object instead of describing geometry: stop fighting the model's constraint and hand it something it can actually execute. The alternative is upscaling first and retouching after — see Iterating.

## Writing a prompt

**Budget** is the governing idea. Attention is scarce and finite — Midjourney's own community FAQ: *"The model's attention is scarce. If a detail keeps disappearing, remove competing elements to create more 'budget' for it."* With `::` weights dead in V8, **word count is the weight**. The budget is spent on *things that must be rendered*, not on literal words: sixty words on one subject in one setting is cheap; sixty words naming nine subjects is over budget. Overrun has no error — the image just goes muddy and requested details silently vanish.

- **Make the subject the grammatical subject.** The strongest lever in the whole skill, demonstrated on matched seeds: *"a duck standing in a field"* focuses the duck; *"a field with a duck standing in it"* turns the duck into landscape. Same words, different picture. A subject that is the object of a preposition inside a sentence about something else will dissolve regardless of word count. Short sentences, each owning its subject slot.
- **Prepositions assign causal role.** "Past him," "around him," "above him" make the subject an object in someone else's scene. "From him," "out of his chest," "into him" make the subject the cause. Check these when a subject renders but sits inert.
- **Concrete over intensified.** A noun phrase with strong priors ("Greco-Roman statuary brought to living flesh") beats stacked adjectives. Intensity modifiers are demonstrated *not* to work — "very," "extremely," "insanely detailed" buy nothing. Emphasis is bought with specificity and mass, never with adverbs.
- **Name the object; do not describe its geometry.** The highest-yield trade in the craft. "Solomonic column" beats twenty words specifying a spiral-twisted tapering shaft; "mandorla" beats a paragraph about a glowing almond of light. Described geometry loses to a named object nearly every time — the model has a learned silhouette for a named thing and only a bag of adjectives for a described one. When a shape keeps coming out wrong, stop refining the description and go find its name. One caveat: a *proper noun for a specific famous artwork* drags its whole context along (display case, damage, lighting), while a *category noun* (e.g. "a Greek bronze athlete" rather than naming one specific statue) usually gets you the attribute without the baggage — check the cheap generic phrasing before reaching for a named masterpiece.
- **State the camera in plain language — and state framing separately from camera position.** "Looking up at," "looking down at," "looking straight at" outperform jargon. The two are silently bundled otherwise: cropping a tall object's base makes the model infer a *close, low* camera and splay the perspective, because that is the only way most photographs of that crop were taken. Say both facts ("the shaft continues past the bottom edge of the frame" *and* "seen from far away and level with the figure") or you get the one you did not ask for. Numeric camera settings — focal length, f-stop, ISO, camera model — are demonstrated to do essentially nothing; describe the optical *result* ("bokeh," "grainy footage") instead. Use `photo of`, never "photorealistic," which names art made to look like a photo.
- **Stay under 1024 characters.** Past that the Prompt Shortener rewrites your prompt. It shows you what it did, but it optimizes for fitting, not for intent. Do your own cutting.
- **Parameters go last**, after the prose, no punctuation before them.
- **Trim description, never constraints.** Under the 1024 ceiling the cut always comes out of adjectives and restatement — never out of a clause carrying composition, scale, camera, palette or negative space. Verify length with a script before delivering, not by eye; appending a single `--no` flag has pushed prompts over the limit more than once. Diff any rewrite against the version before it — editing for one axis silently drops words that were load-bearing on another (a fixed subject size, a colour, a material, a light-burst shape have all been lost this way in a single session). Note in a hand-off which words got cut and why.
- **Positive first, `--no` as cleanup.** It works in V8.1 and V8.2 (it was absent only in the V8.0 alpha, which is why current-looking pages say otherwise). It has one fixed strength, so target with phrases rather than words — `--no pine trees growing on the shore` beats `--no pines`. **Around bodies, avoid garment words in `--no` entirely:** moderation reads every word independently, so `--no modern clothing` (or `--no robe, gown`) parses as "no modern" plus "no clothing" (or "no robe" + "no gown") — an undressing instruction — and stacking that with a word like "nude" elsewhere in the prompt is the shape that trips the moderation filter. Describe the clothing (or bare anatomy) you *do* want, positively, instead.

### Colour, negative space, and composition are also subjects

These follow the exact same grammatical-mass rule as the primary subject, and it is easy to violate by reflex while rewriting for some other reason:

- **A colour named only inside an adjective list will not render.** "Gold and vermilion against deep cobalt" tends to render as gold-and-navy — vermilion needs an object to belong to. Fix: assign the colour to a thing that has it ("the streets glow molten vermilion far below").
- **You do not get emptiness by asking for less — you get it by describing the emptiness.** "Vast still emptiness fills the rest of the frame. The edges and corners of the picture are pure unbroken black" as its own sentence works; a stray adjective does not. Watch for self-inflicted coverage instructions elsewhere in the prompt ("fills the whole picture," "bursting outward to the edges") that argue against the negative space you're asking for.
- **Position and centering instructions need their own sentence**, and work far better as a *measurable relationship against the frame* than as a positional adjective. "Centered" fails more than it succeeds; "equal empty space above, below, left and right of him" or "a tiny distant silhouette, no larger than a fingernail against the whole frame" works. Stack several far-band synonyms rather than using one — synonym stacking is the V8 substitute for `::` weighting, and one descriptor alone tends not to be enough. Measure against the canvas, not against another object in the scene — object-to-object ratios ("twenty times his height") are unreliable; frame-relative claims are not.
- **Restate the key constraint at the very end of the prompt.** The end of a prompt is where drift lives, and a one-sentence restatement there ("he is the smallest and brightest thing in the image," "the rings stay perfect circles, never tangled") recovers a constraint that upstream wording lost.
- **Grounding verbs import an entire environment.** A subject that "stands," "sits," "rests," "leans," or "kneels" needs a surface, and once a surface exists everything else in the frame tends to rest on it too — this can silently defeat an "alone in open space" instruction elsewhere in the same prompt. For a subject that should float in a void, use *floats, adrift, hangs, suspended* instead, and add `--no ground, floor, horizon` — the ground plane and an unwanted crop are frequently one defect wearing two faces, since a floor forces a camera low enough to see it, which means close.
- **A support object sets the scale of everything near it.** Giving a colossal object something small to rest on (a plinth, a pedestal) will drag its apparent scale down to match the support. For genuinely huge subjects, let things float rather than introducing a support.
- **Bare plurals render as a tangle; a count with a stated relationship renders as geometry.** "Engraved rings" produces an unbounded snarl; "seven concentric engraved rings, each a perfect circle, nested one inside the next and tilted at different angles" produces a readable object. Ask for precision explicitly ("a precision instrument of polished brass, cut into the metal") — machined is a look, and looks have to be named.
- **Describe a finished position, not an action, when placement keeps failing.** An action verb implies a path, and the model tends to render the path's midpoint rather than the endpoint. State where the subject *already is* ("has already stepped clear of the sphere and stands far apart from it"), not how it got there.
- **Count your object classes.** A prompt asking for many distinct things at once (a figure, rings, planets, a starfield boundary, a void, rays of light) is an inventory, not a composition, and scattered results are the honest render of an inventory. Cutting to two or three does more than any wording change; restore stripped elements one at a time so each is individually attributable.
- **When something new is added, an existing precise element can collapse.** Precision geometry (fine nested rings, exact symmetry) is the most expensive thing in a prompt and the first to degrade when anything unrelated competes for attention. If a stable element breaks the moment you add something new, you are at the prompt's attention ceiling — a restatement can rescue the old element but tends to cost the new one; the fix is to decide which you actually want, or switch to process prompting (below).
- **A single strong-prior noun beats a paragraph describing the same idea, and costs almost nothing against a saturated budget.** "A faint golden aureole surrounds him" (real radiance) can succeed where "long straight rays of light pass out of his body" (a paragraph of geometry) renders as literal wires and wrecks a neighbouring precise object.

## Iconographic vocabulary for radiance around a figure

`aureole` (glow, whole body), `nimbus` (glow, head only), `glory` (glow, general), `mandorla` — note `mandorla` is strictly an *almond-shaped outline/frame*, not light; if you want luminance use `aureole`, `nimbus`, or `glory` instead. `sunburst` for a burst rather than a halo. Precise, deep priors; each replaces a paragraph of description — but pick the one whose art-historical meaning actually matches what you want (shape vs. glow).

## Iterating

**Change one variable per run — and use permutations to guarantee it.** `--stylize {50, 150, 400}` expands one submission into three jobs. This is both the cheapest sweep and the only version that cannot be silently defeated by the settings drawer. Permutations need Fast, not Relax; limits are 4/10/40 jobs by plan.

**Read the chips after every submit.** The parameter chips under the prompt in the feed are what the job *actually* ran with. Flags absent from the prompt text are filled from the settings drawer, so a prompt can run at values you never chose — this has caused entire sweeps to silently run at stale drawer settings. Diagnose from the chips, never from the text you think you pasted, and never from memory of what the drawer holds.

**Judge the grid, not the average.** *"Having just 1 or 2 usable images in a batch actually indicates you have a well-crafted prompt."* One or two keepers out of four is success — do not re-prompt away a batch that produced a great frame.

**Ablate a style system before rewriting the prompt.** If the complaint is "too busy / too chaotic / full of artifacts" and a moodboard or profile is attached, run the identical prompt with `--p` (or `--sref`) removed, nothing else changed. Still wrong means the prompt is the cause; suddenly clean means the style system is. Verify the ablation actually worked by checking the returned job's parameter chips for no `profile` value — deleting the flag from the prompt text does not by itself prove it, since the Personalize toggle can auto-inject a default. The mirror test for characterizing any board you intend to reuse: attach it to a trivial prompt ("a single point of light in a dark room") — whatever appears that you did not ask for is the board's personality.

**`--stylize` low or zero is sometimes a hard requirement, not a range to tune.** For a scene whose whole structure is "object entire, floating in a void," there may be no compromise setting — richer detail at a slightly higher stylize is not purchasable at any price if it costs the framing. When composition or negative-space instructions keep losing, sweep stylize toward 0 before writing more words.

**Tweak, then rewrite, then retouch.** Two or three failed tweak rounds on the same stubborn detail means the attention balance is wrong, not the wording — rewrite from scratch to rebalance. But past roughly ninety percent, stop generating altogether: every re-prompt is a fresh gamble on everything already correct, and the remaining defects are retouch problems. Switch to the editor.

**Upscale before Vary Region, never after.** Inpainting a thirty-pixel head yields thirty new bad pixels; upscale first and the model has something it can resolve. And for the final upscale of a heavily-constrained composition, **Upscale (Subtle) over Creative** — Creative re-runs the model's own judgment across an image whose composition you spent the whole session forcing, and hands back exactly the liberties you removed. Same reason `--stylize` stays low on such pieces.

**Outpainting (Zoom Out, Pan, dragging the canvas edge) re-runs the prompt on the new territory, not just the old subject.** Leave your subject's description in the prompt during an outpaint and the model will paint additional copies of it into the new border. Strip the subject from the prompt for any outpaint step and describe only what belongs in the new space. Use Custom Zoom (often hidden under "More Options") rather than the plain 1.5x/2x buttons, which reuse the prompt silently. Sparse, low-detail content is the most forgiving thing to ask for across an outpaint seam.

**Seeds are a same-session control only.** Documented as "99% identical," degrading across sessions, and explicitly unable to carry style. For consistency that survives to tomorrow, use `--sref` or a profile, not a seed.

**Inspect at full size.** Every generation is permalinked at `midjourney.com/jobs/<job-id>?index=0..3`, showing the image large plus the exact prompt and every parameter chip.

**A finishing pipeline for resolutions beyond what Midjourney can natively deliver.** `--hd` caps at 2048px on the long edge and disqualifies the image from further in-app upscaling; `--sd` (1024px) keeps Upscale available. For a target larger than either, run standard, Upscale (Subtle) in-app, then finish with an external upscaler suited to synthetic/rendered imagery (e.g. a Topaz-style model with a "CGI" preset and face enhancement explicitly disabled, since default face enhancement will invent a face into a deliberately featureless one) — then downsample (never upsample) to your exact target resolution.

Vocabulary tables, the troublesome-token list, the reroll/vary/remix/edit decision table, and process prompting are collected in the Craft Reference section below.

## Handing prompts to a human who runs them

This skill is usually used in a loop: you write, they paste and run, you both look. That loop has its own failure modes, and they are silent ones.

- **One new numbered file per round** (`piece-round-NN.txt`), never a single file overwritten in place. Re-opening a file the user already has open shows them their **stale editor buffer** — right file on disk, wrong text on screen, and they run the previous round without either of you knowing.
- **Verify every prompt's character count with a script**, in the same step that writes the file.
- **Grep for non-ASCII before handing over.** A stray CJK character from a slipped keystroke will silently steer a whole batch.
- **Give your prediction before they look**, name the variant you expect to win, and when it loses, say so plainly. The wrong prediction is the most informative thing in the round; burying it costs the next round's diagnosis.
- **Use the job permalinks to identify which prompt made which image** rather than asking the user to match by eye — the feed's DOM order does not reliably match the visual order. Walk up from each `a[href*="/jobs/"]` to the ancestor containing the prompt text and match on a distinctive phrase from the variant.
- **Verify every prompt in a batch, not just the first.** A silently dropped submission in a multi-prompt batch can go unnoticed for a whole session. Confirm per-prompt: the textarea emptied AND a phrase unique to that prompt shows up in the feed. If the feed appears frozen (no new jobs after a submission that should have produced one), reload the page fresh before concluding the submission failed — a long-lived tab can go stale and stop live-updating.

## Traps

- `--oref` (Omni Reference) **silently forces the entire job into V7**, so you lose V8.2 outright. Biggest gotcha in the parameter set.
- `--exp` above ~25 "overwhelms `--stylize` and `--p`" — it will fight any personalization work.
- Multi-prompts and `::` weights are **dead** in V7 and V8.
- `--quality`, `--turbo`, `--cref`/`--cw` are all unsupported in V8.
- The Editor runs on V6.1, so inpainting or outpainting an HD image **downscales it to SD**.
- Entering a folder routes all subsequent output there and **persists across navigation** until you click the X.
- Advice to "crank `--stylize` to 1000" is from the V8.0 alpha and is now actively harmful. Default is 100.
- `midjourney.com/jobs/<id>` image URLs 403 to direct fetch/curl and are CORS-blocked in-page — use the job page's "Download Image" button (or a screenshot of the permalink) to actually get pixels out, not a raw fetch of the CDN URL.

## Web UI mechanics

**Layout.** Sidebar: Explore / Create / Edit / Organize, then Aesthetics: Personalize / Moodboards / Style Creator, then Community: Tasks. The imagine bar has an image icon and settings gear inside it; Folders, Personalization, Draft Mode, Conversational Mode, and Search sit beside it. The settings drawer maps sliders to flags: Stylization = `--stylize`, Weirdness = `--weird`, Variety = `--chaos`, plus Model Version, Standard/Raw, Speed, Video Resolution/Batch Size. `Cmd+Enter` submits and leaves the prompt in the bar; plain Enter clears it. Settings are account state, not browser-local — read, act, restore if you toggle something for a one-off.

**Image references are positional, not typed.** You don't type `--sref` — you drag an image into a labeled drop zone: **Image Prompt** (content/composition/colour, `--iw`), **Style Reference** (look only, `--sref`/`--sw`), **Omni Reference** (identity, `--oref`/`--ow`, forces V7). Describe what you want to *see*, never how to modify the reference — not "the look of this image but a dog," instead "detailed portrait of a dog."

**The three style systems:** a style code (`--sref <code>`, from Style Explorer or minted in Style Creator, independent `--sw`), a moodboard (`--p <mID>`, your curated image set, strength via `--stylize` only), a personalization profile (`--p <pID>`, learned from images you select, strength via `--stylize` only). Moodboards and profiles auto-convert to `--p <code>` on submit — record the resolved code, not the ID, for reproducibility, since editing a moodboard mints a new code.

**Style Creator** mints your own `--sref` codes by having you click sample style images from a grid; it learns from what you pick and skip. Always add `--draft` to the seed prompt (previews cost GPU and always run V7). Rounds 5–10 stabilize, 10–15 add detail, past 15 is marginal. Sessions cannot be reopened once ended. Codes stack rather than merge — starting from an already-styled prompt layers a second code on the first.

**Editing.** Two editors: a light in-place editor (Undo/Redo, Move/Resize, Paint, Smart Select) and the full Edit page (adds Suggest Prompt, custom aspect ratio, Layers, Retexture, Export). The Editor runs on V6.1 even for V8.2 sources, so inpainting/outpainting an HD image downscales it to SD. Smart Select does nothing until applied with "Erase Selection"/"Erase Background" — a lingering green highlight means the mask isn't applied yet, the most common silent failure in the Editor. Editor output does not appear on Create/Organize unless you upscale it.

**Organizing.** Filters combine as OR within a section, AND across sections. Like is the primary keep gesture; Trash only hides (trashed creations remain reachable by job ID or URL, and individual creations cannot be truly deleted). Only Stealth mode (paid tiers) is real privacy — setting a private image as a profile picture or similar publishes every other image in the same grid, so use an upscaled single image to avoid that. Folder mode is sticky: entering a folder routes all subsequent output there until you click the X.

## Craft reference

**Troublesome tokens — remove these first when an image looks off.** These do not merely fail; they *degrade* the image, pulling in UI screenshots, stock ads, thumbnails, and compressed junk that carried those labels in training:

- Resolution talismans: 4K, 6K, 8K, 16K, HD, HDR, ultra HD, 1080p, dpi, ppi, retina display, crystal clear
- Render engine names used as quality dials: octane render, unreal engine, v-ray, lumion, renderman, cycles, ray tracing, path tracing, global illumination (fine as an actual style choice, not as a "make it better" button)
- Intensity stacking: ultra detailed, insanely detailed, extreme detail, hyper detailed, hyper realistic
- Platform tokens: trending on ArtStation, ArtStation, DeviantArt, Behance, Pinterest
- Quality talismans: masterpiece, award-winning, best quality, highest quality, perfect composition
- Camera specs used as quality dials: DSLR, mirrorless, 50mm, 85mm, f/1.8, f/2.8
- Lighting jargon: studio lighting, cinematic lighting, professional lighting, volumetric lighting
- Weak intensifiers: extra, ultra, super, hyper, insanely, extremely, quite, rather, somewhat

**Phrases that punch above their weight:**

| Pattern | Effect |
|---|---|
| Reordering the grammatical subject | Changes what the image is *about*. Strongest lever available. |
| `photographed by [a named publication]` | Inherits that publication's framing and camera angles |
| `directed by [a named director]` | Inherits cinematic framing conventions |
| Named film stock — Kodak Portra 400, Fujifilm Velvia 50, Ilford HP5 | Real measurable colour and grain shift |
| Iconic camera — Polaroid, Instax | Distinct look; *generic* camera models do nothing |
| `photo of` | Best photorealism starter; beats every "-realistic" variant |
| `bokeh` / `blurry background` / `grainy footage` | Describing the optical result works where f-stops do not |
| `"TEXT IN DOUBLE QUOTES"` | Only way to render text; single quotes fail |
| Positional prepositions — left, right, centre, foreground, background | Reliable placement control |
| `close-up` / `aerial view` / `drone footage` | Three shot terms strong enough to be reliable |
| `looking up at` / `looking down at` / `looking straight at` | Beats "view" and "angle," which have other meanings |
| Synonym stacking — dozing, slumbering, snoozing | The V8 substitute for `::` weighting |
| Decade tokens — 1920s, 1970s, 1990s | Distinct output per decade |
| Craft mediums — cyanotype, risograph, ukiyo-e, cut paper, block print | Physical-process names beat render-engine names |
| Specific counts — three cats | Officially recommended over bare plurals |

**Shot distance vocabulary:** far — in the distance, distant perspective, on the horizon, aerial perspective, drone footage. Middle — full-shot, full-body portrait, full-length shot. Close — eye-level perspective, close-up, macro-shot. No shot term is a composition lock. Midjourney's default is subject dead-centre; to move a subject off-centre, name something else first and let the layout rearrange around it.

**Rescuing a detail that keeps disappearing, in reliability order:** (1) cut from what is already working, to free budget for the part that isn't; (2) grow the failing element with more clauses on it; (3) synonym-stack or restate grammatically; (4) `--s 50–75`, at a cost in beauty; (5) widen `--ar` — sometimes there is literally no room.

**Fighting the default depth of field:** Midjourney defaults to a sharp subject against a blurred background. A sharp background takes two moves together: describe the background in real detail *and* `--no background blur, bokeh`.

**Iteration decision table:**

| Situation | Move |
|---|---|
| Composition wrong, or you want a different take | Reroll |
| Image good, want small changes, same prompt | Vary (Subtle) |
| Concept good, want bolder alternatives | Vary (Strong) |
| Want to change the prompt while keeping the image's DNA | Remix |
| One region wrong, rest is right | Vary Region / Erase (inpaint) |
| Crop wrong, need more canvas | Pan, Zoom Out, or Editor |
| It's right, want it bigger | Upscale — Subtle (no change) or Creative (adds detail) |

Remix constraints: only aspect ratio, `--no`, `--stop`, and `--tile` apply during Remix; other parameters are ignored. Changing `--ar` in Remix *stretches* the image rather than extending canvas — use Pan, Zoom Out, or the Editor to reframe.

**Direct vs. process prompting.** Direct: one prompt carries everything — strong at a single focal point and consistent mood, weak at multiple focal points and precise composition. Process: a sequence of disposable prompts, each pushing the canvas one step (prompt the empty setting, then Vary Region for the subject, then Vary Region for the crowd). No single prompt is responsible for the final image. Strong at composition and multiple focal points, weak at consistency across steps. *"The prompt is the chisel, not the sculpture."* For an exact spatial relationship, or a small element that keeps dissolving, process prompting is the professional default — it just doesn't produce a shareable one-liner, so it's underused.

**Style locking with `--sref`:** `--sref random` resolves to a real code on submission — roll for a look, then keep it. Once a code is in the prompt, reroll and variations preserve it; that's the actual style-lock mechanism. Exception: `--sref random` with permutations, `--repeat`, or Draft gives each image a *different* code — useful for a style survey, then lock the winner's code afterward. Keep the text prompt simple and free of style words once an sref is live — they conflict with the reference. Never instruct *about* the reference ("the look of this image but a dog"); instead describe the content directly ("detailed portrait of a dog"). Prompt carries content, sref carries style.

**Suggested loop:** explore short and seedless → survey style with `--sref random` → lock the winning code → grab the seed off the best candidate → permute one axis with seed and sref held → rewrite from scratch if two or three tweak rounds stall → fix locally with Vary Region, Pan, or the Editor rather than rerolling a good image → upscale.

## Parameter reference — V8.2

Syntax: parameters go at the very end of the prompt, one space before the dashes, no punctuation, no space between the two dashes.

**Core generation**

| Flag | Short | Values | Default |
|---|---|---|---|
| `--version` | `--v` | version number | 8.2 |
| `--aspect` | `--ar` | `W:H`, integers only | 1:1 — max 14:1, 4:1 max for HD |
| `--stylize` | `--s` | 0–1000 | 100 |
| `--chaos` | `--c` | 0–100 | 0 |
| `--weird` | `--w` | 0–3000 | 0 |
| `--seed` | — | 0–4294967295 | random — "99% identical," not bit-exact |
| `--no` | — | comma-separated | — |
| `--raw` | — | boolean | off |
| `--tile` | — | boolean | off |
| `--repeat` | `--r` | 2–40 by plan | — Fast only, stripped from the saved prompt |
| `--exp` | — | 0–100 | 0 — combinable with `--stylize`, above ~25–50 overwhelms `--stylize`/`--p` |
| `--quality` | `--q` | — | unsupported in V8 |
| `--stop` | — | 10–100 | legacy, V6 and earlier |

`--ar` takes no decimals — write `--ar 139:100`, not `1.39:1`. Fractions reduce (`--ar 1920:1080` becomes `16:9`). Extreme ratios are documented as "experimental and may produce unpredictable results."

**Style and reference**

| Flag | Values | Default |
|---|---|---|
| `--sref` | image URL(s), style code(s), or `random` | — |
| `--sw` | 0–1000 | 100 — for `--sref` only, incompatible with moodboards |
| `--profile` / `--p` | bare, or profile/moodboard ID, or code | — |
| `--iw` | 0–3 (niji 7: 0–2) | 1 |
| `--oref` | one image URL | — forces the job into V7 |
| `--ow` | 1–1000 | 100 — V7 only |
| `--cref` / `--cw` | — | unsupported, V6/niji 6 only |

`--profile` and `--p` are the same parameter. A moodboard is `--p mID`, a profile is `--p pID`, and both auto-convert to `--p <code>` on submit — there is no `--moodboard` flag, and for reproducibility you should record the resolved code, not the ID (editing a moodboard mints a new code). Strength control for both is `--stylize`, on the shared 0–1000 scale; `--sw` and `--sv` are documented as incompatible with moodboards, which is the constraint that makes moodboards feel like a wall. `--oref` costs 2× GPU and is incompatible with Fast Mode, Draft Mode, Conversational Mode, `--q 4`, Vary Region, Pan, and Zoom Out; keep `--ow` under 400 unless stylize is very high.

**Modes and routing**

`--fast` / `--relax` for the GPU pool. `--hd` / `--sd` — 2048px at 1.3 GPU-min or 1024px at 0.8; SD has been the default since 2026-04-30. `--stealth` / `--public` for visibility (paid tiers). `--draft` for draft mode (24 images at 512×512 for 0.4 GPU-min, web only, promoted via Vary or Remix — support for it in V8.2 is a live documentation conflict, worth one empirical test rather than an assertion either way). `--turbo` is not supported in V8.

**Video.** Video accepts only video flags — `--motion low|high`, `--raw`, `--loop`, `--end`, `--bs` (1/2/4, default 4). All image parameters on the source are stripped. Videos are 5 seconds, extendable in 4-second steps to 21 seconds. Style Reference, Image Prompt, and Omni Reference are all incompatible with video.

**Dead and legacy.** Removed outright: `--width`/`--height` (note `--w` now means weird), `--vibe`, `--upanime`, `--hq`, `--newclip`, `--nostretch`, `--old`, `--upbeta`. Parses on old versions, useless on V8: `--style <code>`, `--test`, `--testp`, `--creative`, `--sameseed`, `--uplight`, `--stop`. Dropped at V7 and still absent: `--cref`/`--cw`, `--quality`, `--turbo`, and multi-prompting with `::` plus prompt weights. `--no` survives as a first-class flag despite originally being sugar for `::-0.5`.

Not parameters despite looking like it: permutation braces `{a, b, c}` and text-in-image double quotes are prompt *syntax*, not flags. Permutations work on parameters too (`--ar {1:1, 2:3}`), cap at 4/10/40 by plan, do not run in Relax, do not nest, and need a backslash to escape a literal comma.

**Interaction traps, condensed:** `--oref` silently downgrades the whole job to V7. `--exp` above 25–50 overwhelms `--stylize` and `--p`. Moodboards reject `--sw` and `--sv` — `--stylize` is the only strength knob. `--no` is tokenized word-by-word by moderation, so a garment phrase in `--no` next to a nudity-adjacent word can trip the filter. Image-only prompts with no text ignore `--stylize` and `--weird`. `--tile` output should not be upscaled (it breaks the seam). HD plus any inpainting or outpainting silently downscales to SD. `--repeat` vanishes from the saved prompt.
