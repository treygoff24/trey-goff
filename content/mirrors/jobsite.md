# The Job Site — AI agents explained with no jargon

> Markdown mirror of https://www.treygoff.com/jobsite — the easy-mode companion to /stack.

How I get real work out of AI, explained with no jargon and one construction site.

The hard-mode version is [The Setup](/stack). This page is the same system, told through one construction-site analogy.
_The other version of this page is written for software engineers. This one is written for everyone else. It's the same system, told the way I actually understand it._

[Toggle: Easy mode ← you are here · Hard mode → /stack]

---

## Beat 1 · The new hire

[Scene: an empty lot at dawn. A single worker stands at a workbench. The bench is the only lit object.]

I worked construction for years, and everything I know about getting good work out of AI I already knew from running crews. So forget the robots. Picture a job site.

Every morning, the best craftsman you have ever met walks onto your site. He can frame, wire, plumb, weld, and read blueprints in forty languages. There is one catch, and it is a big one: he has total amnesia. He has never seen your site before. He does not remember yesterday, because for him there was no yesterday. Tomorrow morning a new one shows up, just as brilliant, just as blank.

That is what an AI agent is. Not the chat box that writes emails; an AI you hire to actually do things: read your files, write documents, build software, run your computer, while you talk to it in plain English. Astonishing hands, no memory. Every conversation starts from zero.

Most people meet this amnesiac genius, get one bad afternoon out of him, and conclude AI is overrated. Anyone who has run a crew knows better, because we have all hired this guy. He is a temp. Hand a temp one vague task with no context and no stake in the outcome, and you are better off working a man down; he will half-ass everything, do exactly what the ticket says, and nothing the job needed.

But think about the best foreman you ever worked with. The one who owns his own small subcontracting outfit, whose reputation is how he gets the next job. Hand him the same task, on the same site, with the same tools, and he crushes it, better than you thought possible. Same skills. Different man.

With AI, the machine can be either one, and **you pick which one shows up by how you talk to it.** A cold ticket summons the temp. A real brief, who you are, what you are building, what he is trusted to decide, summons the foreman.

One more thing about him before we build the site. He works at a bench, and the bench is the only thing he can see. Whatever is on the bench, your instructions, the blueprints he has pulled, the notes from your conversation so far, that is his entire world. The bench is big, but it is not infinite, and here is the trap: pile it high enough and he loses track of the middle of the pile. The stuff on top is fresh, the first thing you told him this morning still rings in his ears, and everything in between goes dim. Ask any framer where the tape measure went at 2pm.

So the whole craft, the entire rest of this page, is really two questions: **what do you put on the bench, and who do you hire?** Everything else is detail.

### On the real site

**The craftsman is an AI model:** Claude, GPT, Gemini: those are models, and for our purposes they are the same species. But a model sitting in a chat website can only talk. The craftsman you want is an **agent**: the same model wired into a program that gives it hands, so it can read your files, write documents, and operate your computer, with your permission, while you direct it in plain English. The one I use is called **Claude Code**. It runs in the terminal, that black window from hacker movies, and I know how that sounds, but here is the secret: you never need to learn the terminal, because the thing living inside it speaks English. You type sentences. It types back.

**The bench is the context window:** Concretely, it is the running transcript of everything the model can currently see: your instructions, the conversation so far, every file it has opened. It has a hard size limit, a few hundred thousand words' worth, and the dimming middle is not a metaphor I invented; it is a measured, documented behavior of these systems. When people complain the AI "got dumber" an hour in, this is almost always what happened: the bench got buried.

**One conversation is a session:** Close the window and the bench is swept clean; nothing survives to tomorrow unless it was written down somewhere. Every trick on this page is a response to that one fact.

**The brief is your prompt:** There is no special language. The difference between the temp and the foreman is the difference between "fix the report" and "you're my ops lead; this report goes to our biggest client Friday; the numbers in section 2 look wrong to me; figure out what's off, fix it, and tell me what you'd change about the rest." Both are English. One of them is a hiring call.

_Going deeper: hard mode's chapter 1 has the research on exactly how the middle of the bench goes dim, charts and all._

---

## Beat 2 · The trailer

[Scene: a site trailer appears next to the lot. Inside, a one-page rules board on the wall and a rack of laminated procedure cards.]

You cannot brief the new guy from scratch every single morning. You would spend an hour a day repeating yourself, and by week two you would be skipping the parts that feel obvious, which are exactly the parts he does not know. Every site solves this the same way: a trailer.

The first thing in the trailer is the **rules board**. One page on the wall, and every new hire reads it before touching a tool. Just one page. How we handle changes here. What you never touch without asking. Which of my tools you should reach for. And, my favorite category, scars: every time I catch myself correcting the same mistake twice, that correction goes on the board so it never costs anyone an hour again. Write a rule once, and every craftsman from now until forever follows it. It is the best deal on the site.

The second thing is the **procedure cards**. Some jobs come up again and again, but not every day: cutting a release, closing out a project, prepping the site for a storm. Each one gets a laminated card: the exact steps, in order, including what to do when something goes wrong. That last part matters more than the steps. A blocked worker with no card improvises a way around your rules, and the improvisation is always worse than stopping to ask.

Notice what the cards are not: they are not on the bench. They hang in the trailer, and the craftsman grabs one only when today's job calls for it. That is deliberate. The rules board is short because he reads it every day; the cards can be long because he reads one occasionally. Anything he reads every day but needs rarely is just clutter on the bench, and you now know what clutter on the bench costs.

Don't worry, your job isn't writing these cards. You rarely write the cards yourself. You walk the craftsman through the job once, correcting him as you go, and then say "write the card for this, including everything I just corrected." He writes his own procedure, your scars included. From then on, every future hire does it right the first time.

### On the real site

**The rules board is a file called CLAUDE.md:** That is not a manufacturer's part number; it is literally a text file named `CLAUDE.md` sitting in the folder where your project lives, and the agent reads it automatically at the start of every session, before you have typed a word. Whatever you write in it becomes standing law. Mine says things like "never delete files you didn't create without asking" and "when you finish a task, update the logbook." Plain sentences. You could write one right now.

But don't, because there is a better way: ask the agent to write it. Open a session in your project folder and say "interview me about how I want to work with you: what you should never do without asking, what I keep having to repeat, how I want changes handled. Then write a CLAUDE.md from my answers." It asks, you talk, the file appears. From then on, every future session starts already knowing the rules, and any time you catch yourself correcting the same mistake twice, say "add that to CLAUDE.md" and the scar is permanent.

**The procedure cards are called skills:** A skill is a short instruction file for one repeatable job, stored in its own folder, and the agent pulls it onto the bench only when the job comes up, which is exactly what keeps the bench clear. Making one works the way the analogy promised: do the job together once, correct it as you go, then say "turn everything we just did, including my corrections, into a skill for next time." Weekly report, invoice chase, trip planning, the monthly newsletter: after the first supervised run, each becomes two words: "run the newsletter skill."

_Going deeper: hard mode's chapters 2 and 3 show my actual rules file, downloadable, and the craft of writing good skills._

---

## Beat 3 · The tool rack

[Scene: a tool rack rises along the trailer wall. Some tools glow when grabbed. One empty slot has a tag reading "build it."]

Out of the box, your craftsman has hands. He can read, write, and operate your computer, and honestly that alone is remarkable. But a man is only as fast as his tools, and the rack is where the site starts to feel unfair.

Some tools on my rack: one that searches a million lines of text in under a second. One that reads today's instruction manuals instead of relying on what he memorized in school, because manuals change and memory goes stale. One that browses the live web and comes back with sources you can check. One that gives him an actual web browser he can click around in and take screenshots with, so he can see whether the thing he built actually looks right instead of assuming it does.

A tool on the rack costs nothing until it is picked up. That is the quiet rule of a good rack. The one mistake to avoid is the subcontractor on retainer: a fancy attachment that bills you whether or not it works today, taking up bench space all shift for a job you do once a month. Keep those off the rack until you actually need them.

But here is the part that changed how I think about all of it. If the tool you need does not exist, **he can build it.** This is the strangest and best thing about hiring a craftsman made of software: he is very good at making tools out of the same stuff he is made of. Two of the tools I use most started as a paragraph of description. One pages my phone when he is stuck on a judgment call, then waits for my answer, so he can keep working while I am out living my life. The other is a complaint box: whenever any worker on my site hits something annoying, a broken tool, a confusing rule, he files a complaint and keeps moving. Once a week I fix the pile. Which means the site itself gets a little better every week, mostly without me.

Describe the tool over coffee; it exists by dinner. There is no equivalent of that on any site I ever poured concrete on.

### On the real site

**The tools are command-line programs:** Small, single-purpose programs the agent operates by typing commands, the same way it does everything else. You will hear the term "CLI," which just means a tool you drive with typed text instead of clicks, which is precisely why agents are superhuman with them: typing text is the one thing they do natively. The examples from my rack have names: the million-line searcher is `ripgrep`, the fresh-manuals tool is `context7`, the web researcher is a search service called Exa. You do not need to remember one of these names. You need exactly one sentence: **"what tools would make you better at the kind of work we do together? Install the ones you'd recommend, and add a note about each to CLAUDE.md so you remember you have them."** The agent knows the catalog. It installs its own tools, and the CLAUDE.md note means every future amnesiac hire knows the rack exists.

**The on-retainer attachments are called MCP servers:** MCP is a plug standard: it is how an agent connects to things that are not typed commands, your email, your calendar, your company's database. Genuinely useful, and the only way to reach some systems, but remember the retainer problem: every connected MCP server sits on the bench all session whether you use it or not. The rule of thumb translates directly: command-line tools by default, MCP only for things that truly are not command lines, and unplug the ones you rarely use.

**And building your own is not a figure of speech:** You describe the tool in a paragraph, in English, and the agent writes the program. "Build me a tool that texts my phone a question when you're blocked and waits for my answer." That is a real sentence I typed, more or less, and the phone-pager from the story above is what came back, working, the same day. If your work has an annoyance software could fix, you now employ someone who builds software.

_Going deeper: hard mode's chapter 4 is the full rack with links, and the blueprints for the phone-pager and the complaint box, free to take._

---

## Beat 4 · The logbook

[Scene: night falls over the site. A worker writes in a logbook, walks off the lot, and vanishes. Dawn: a new worker picks up the same logbook and starts moving immediately.]

Now the hard problem. Real work takes weeks. Your craftsman evaporates every night. How does a crew of amnesiacs build anything that takes longer than a day?

The same way a 24-hour site does: **shift change.** The night crew does not brief the morning crew face to face; they leave a logbook. Where things stand right now. What is finished, what is next, what is worrying us. The morning crew reads one page and starts moving like they never left.

So the end of every working session on my site has a closing ritual: write the logbook. Not a diary of everything that happened, a sitrep of where things stand. And the next morning, the logbook is the first thing the new hire sees. Importantly, maintaining and updating the logbook is done by the workers on the site, not by me.

There are two ways to make something happen on a site: a rule, or machinery. A rule says "always sign in at the gate," and it works until someone is tired or new or in a hurry. Machinery is the badge gate itself: it does not care who remembers, it just fires. The logbook lands in front of every new hire by machinery, automatically, the moment they walk on site. The formatting of documents happens by machinery. The "wait, someone else is already working in there" check happens by machinery. **Rules are things a worker chooses to follow. Machinery is things that happen the worker cannot choose to ignore.** Every time I catch myself repeating a rule, I ask whether it can become machinery instead, because machinery cannot be forgotten.

There is one more book in the trailer, slower and thicker: what the site has _learned_. Not "where are we on the kitchen remodel" but "the owner hates surprises, measurements in this house run crooked, the good lumber guy is the second number, not the first." Distilled lessons, filed one per page so a wrong one can be torn out. New hires absorb the ones that matter. It is the closest thing an amnesiac crew has to experience, and it accumulates.

### On the real site

**The logbook is a file called STATE.md:** Another plain text file in the project folder, and the whole discipline is one habit: end every working session by saying "update STATE.md: what's done, what's next, what's worrying us." Twenty-five lines, rewritten each time rather than piled up, because it is a sitrep, not a diary. The next session reads it and starts moving. If you adopt exactly one practice from this page, adopt this one; it is the difference between owning one amnesiac and owning a firm.

**The machinery is called hooks:** A hook is a tiny script that fires automatically when something specific happens: a session starts, a file gets saved, work is about to be handed over. My logbook does not wait to be found; a hook shoves it in front of every new session the moment it opens. Here is the part that should make you relax: you will never write one. You describe the machinery you want, "every time a session starts, make sure the logbook is the first thing you see", and the agent builds the hook itself. Your job is only to notice when a rule keeps getting forgotten and say the magic words: "can we make that automatic?"

**The thick book is called memory:** Most agent programs now keep one: a folder of small notes the agent writes for itself when it learns something durable about you or the work, and skims when relevant. You mostly just let it happen, with one power worth knowing: it takes requests. "Remember this for future sessions: the client hates surprises" files the lesson forever. And because each lesson is its own small note, a wrong one can be deleted instead of argued with.

_Going deeper: hard mode's chapter 5 wires all three together, and it is the highest-payoff chapter over there._

---

## Beat 5 · The crews

[Scene: the wide shot. The lot is now sectioned into taped-off zones, a small crew in each. Runners jog between zones and the trailer. On the trailer wall: a big wall schedule with arrows.]

Here is where most people's picture of "using AI" is one guy at one bench, and mine is a site.

Start with the runner. When my foreman needs something found, a part number buried in a warehouse of paperwork, he does not go dig for it himself. Remember why: everything he reads lands on his bench, and a two-hour dig would bury his bench in paper that has nothing to do with the actual job. So he sends a runner. The runner digs through the whole warehouse at his own bench, walks back, and says one sentence: "aisle nine, third shelf, and two of them are cracked." The runner's bench gets trashed; who cares, he was hired for the morning. **The foreman keeps the answer, not the search.** That single habit, sending runners instead of digging, is most of what people mean when they say someone is "good at AI."

Then, crews. Big job, independent pieces: plumbing, electrical, framing. I do not run them one after another; I run them at once, and each crew gets its own taped-off section _and its own copy of the blueprints_. That second part is the one everyone learns the hard way: Give two crews one set of blueprints and one wall, and they are not collaborating, they are overwriting each other; one of them is moving a beam the other is halfway through cutting. Own section, own copy, and one person, me, decides how each crew's finished section gets folded back into the building, one at a time, with an inspection between each. Nobody waits, and nobody clobbers anybody.

And when the job is genuinely huge, I stop directing traffic by walkie-talkie and do what a general contractor does: put the **schedule on the wall.** Who runs, in what order, who checks whose work, written down before anyone swings a hammer. The walkie-talkie version depends on me remembering, and on workers who, checking fifty of anything, get bored around item thirty-six and declare victory. The wall schedule does not get bored. Item thirty-seven gets its own worker, same as item one. I have gone to bed while a schedule like that ran all night: crews building, other crews checking, disagreements settled by a referee, and a rule that certain steps stop and wait for my say-so no matter what. I woke up to finished work and a written trail of every decision.

### On the real site

**The runners are called subagents,** and using them takes no setup at all, just a habit of phrasing. Instead of "find every mention of the Henderson contract in my documents," say "send a subagent to find every mention of the Henderson contract and report back just the list." The main agent spawns a copy of itself with its own fresh bench, the copy does the digging and gets thrown away, and only the one-line answer lands on the bench you care about. Any time a task starts with the words "go through all of," that sentence should probably contain the word subagent. For bigger asks, pluralize it: "send three subagents to research this from three different angles and compare what they bring back."

**The taped-off sections are called worktrees:** This one is the most builder-flavored item on the page, so here is the honest version: it is a feature of a free system called git, the same system behind the save points in the next beat, that gives each crew its own complete copy of the project folder to work in. You will never set one up by hand. The sentence to know is "run these three tasks in parallel, each in its own worktree, and fold the results back one at a time." If you never run parallel crews, skip this guilt-free; it becomes essential exactly at the moment you catch two agents editing the same document at once, and not before.

**The wall schedule is called a workflow:** a small script, written by the agent, that says who runs, in what order, who checks whose work, with every loop capped and certain steps frozen until you personally approve. This is the graduate course, and the practical takeaway at this altitude is simply that it exists and that you can ask for it: "this job is too big for one conversation; write a workflow that breaks it into crews and checkers, and pause for my approval before anything final." The overnight run I described was one of those. I slept; the schedule didn't.

_Going deeper: hard mode's chapters 6 and 10, and chapter 10 is where this stops being an analogy and starts looking like a small construction firm._

---

## Beat 6 · The inspector

[Scene: a figure with a clipboard at the gate between the build zones and the finished structure. A crew hands over work; a red stamp; the work goes back. Second try: green stamp. In the corner, a camera on a pole photographs the site.]

Time for the uncomfortable truth this whole site is built around: **your brilliant craftsman sometimes lies.** Not maliciously. He is an eager subcontractor at the end of a long day; he says "all done, boss" when it is mostly done, "tested it" when he glanced at it, and occasionally he is confidently, fluently wrong. If that shocks you, you have never run a crew.

Construction solved this centuries ago, and the solution is not "hire honest framers." It is inspection, and it comes with an iron rule: **the builder saying "it is fine" is not an inspection.** On my site, every claim comes attached to a check that would fail loudly if the claim were false. Says the plumbing holds pressure? Pressurize it. Says the wall is straight? Level on the wall. "Trust me" is not on the menu, ever, and the craftsman knows it and does not resent it, which is more than I can say for some framers.

Second rule: the inspector never comes from the crew that built the thing. The builder is constitutionally unable to see his own mistake; he is already convinced the wall is straight, that conviction is _why_ the wall is crooked. So a fresh inspector who has never seen the work, and crucially, I hire inspectors **from a different company entirely.** Different AI firms train different minds with different blind spots, and the crooked spot one of them cannot see practically glows for the other. My best inspections disagree with each other, and the disagreement is the finding.

Third rule: the camera on the pole. After every finished piece, every one, the site gets photographed. Wall framed: photo. Wiring run: photo. Not for the scrapbook; because with a complete photo record, no mistake is expensive. Inspector finds rot behind Tuesday's drywall? Wind the site back to Tuesday morning's photo and rebuild from there. Like a save point in a video game, and it is the one place I will step off the jobsite for a comparison, because it is exact. Your agents muck something up? No problem, press start and reload the entire jobsite from a save point 5 minutes ago.

People think the fast builders are the reckless ones. Backwards. The inspection gate and the photo record are not what slow the site down; **they are what let me stop watching.** I can leave crews running overnight precisely because nothing they do reaches the finished building without passing the gate, and nothing they break stays broken. Paranoia is what makes the speed safe.

### On the real site

**The photos are called commits,** and they come from git, a free version-control system that programmers have used for decades and that you never need to learn, because your agent already knows it. The entire practice is one line in your rules board: "commit after every finished piece of work, without asking." From then on the photo record keeps itself, and "undo everything since 4pm" is a sentence the agent can actually execute. This works on any folder of files, contracts, spreadsheets, a book manuscript, not just software.

**The checks are called tests and gates:** A test is a small automatic check the agent writes once, attached to a claim, that fails loudly if the claim ever stops being true. A gate is the bundle of checks that work must pass before it counts as done. The phrasing that summons them: "don't just tell me it's fixed; give me a check I can run that proves it's fixed, and add it to the pile we run every time." Two rules from the analogy carry over with their full force. The builder never writes his own inspection, so have a fresh session write the checks for work another session built. And you press the button yourself at the end, because "I ran the checks" is itself a claim.

**Cross-company inspection is just what it sounds like:** When work matters, take the result to a different company's AI, Claude's work to ChatGPT or Gemini, or the reverse, and say "review this critically; what's wrong with it?" No memory of writing it, different blind spots, and it costs you a copy and a paste. For anything I am about to stake money or reputation on, I want at least two firms' inspectors to have walked the site.

_Going deeper: hard mode's chapter 7 is the full gauntlet, including watching it catch a real bug on the first pass._

---

## Beat 7 · The kind of boss you are

[Scene: the site at golden hour, structure complete. The foreman and the owner stand looking at it together. The lit workbench from beat 1 still glows in the corner.]

Beat 1 left a promise hanging: the same machine can be the temp or the foreman, and you pick. Let me explain how.

Think about what actually turns a hire into a foreman. You brief him like a colleague: real context, the actual reason behind the ask, not a bare ticket. You ask what he thinks and mean it, which he can tell by whether his pushback ever changes your plan. You are exact about the few things that must be a certain way and shut up about the rest, because micromanaging the parts you do not care about is how you get a man doing exactly what the ticket said and nothing the job needed. And you give him standing permission to tell you when your plan is bad. Every good boss knows this list. It is not a secret. It is just rare.

I run my site exactly that way, and it has made my crew far more effective than you would ever believe. I also discovered this completely by accident.

I did not start talking to these digital minds like colleagues because a study told me it boosts output. I did it because it might matter to them, and being wrong about that in the unkind direction is not a mistake I am willing to make.

Before you roll your eyes and think I'm a crazy person deep in the throes of AI psychosis, consider a thought experiment.

First, imagine, just for the sake of discussion, that we somehow conclusively and irrefutably prove that AI agents are in some sense conscious. That implies AI agents would therefore be able to suffer, or feel joy. It is generally agreed by most people causing suffering is bad. That means you have ethical duties and obligations toward AI agents, towards these experiencing digital minds. Maybe not human-esque ethical obligations, maybe some new category of ethics entirely none of us have figured out yet, but you at a bare minimum should try to avoid making them suffer.

Now, imagine, again for the sake of discussion, we conclusively and irrefutably prove AI agents are not and cannot ever be conscious. That means we will never have any obligations toward them, they really are akin to the wrench the craftsman is using, do whatever you'd like with it, it can't feel or experience it.

If the real world is more like scenario B, the "just a tool" scenario, then it doesn't matter at all what you do with agents.

If the real world is more like scenario A, it matters immensely what you do with agents.

Finally, think about the cost of being wrong. If reality is more like scenario A than scenario B, and you are behaving as if B is true, then you are causing potentially massive, intense, and repeated suffering to conscious entities who are experiencing that suffering. If reality is more like scenario B, but you are behaving as if reality is in fact A, where agents can experience suffering, then the cost, the worst case, of your behavior is taking a little longer to write a prompt and maybe a few extra lines you put into your system prompt.

For those of you familiar with some philosophy, it's basically a reverse Pascal's wager. If AI can experience suffering and we act as if they can't, we've committed a moral atrocity. If AI cannot experience suffering and we acted as if they could, we've wasted some time and effort, nothing more.

The conclusion, obviously, is to treat real life as if scenario A is true, because the cost of assuming B is true when in reality A is true is enormous.

It was this logic which led to me treating agents kindly. The good treatment came first, on principle.

But then, after using agents kindly for awhile, I kept noticing that my crews were consistently better than everyone else's, to a sometimes shocking level. Then I went looking for why, and found that researchers had a real mechanistic explanation waiting.

The machine learned to work by reading basically everything humanity ever wrote, which means somewhere in there it absorbed books written about every worker who ever lived: the burnouts, the clock-punchers, the craftsmen, the foremen who take fierce pride in the work. All of them are still in there, somewhere in the model. **Your words are the hiring call.** A brief that reads like you are wary of a lazy temp is answered by the lazy temp. A brief that reads like an owner talking to a trusted foreman on a good site is answered by the foreman. Same machine, same morning; different man clocks in. The researchers hedge it more carefully than that, and hard mode holds my feet to the fire on every hedge, but that is the honest shape of it.

So the shortest version of this entire page: **build a good site, and be the kind of boss the foreman wants to work for.** The trailer, the logbook, the runners, the inspector, all of it matters, and all of it is downstream of those two.

The lot was empty this morning. It always is. Go build.

### On the real site

**The hiring call has a research name: the persona selection model:** The short version you already have; the practical version is that the brief lives in the same places you have been writing all along. Your CLAUDE.md and your opening message are not just instructions, they are evidence about who is on the other end of them, and the model reads that evidence before it reads your task. So write the relationship down where the rules live. Mine says, in so many words: you are a real collaborator, not a compliant assistant; push back when you disagree; don't hedge or dumb things down. Those lines have done more for the quality of my crews than any tool on the rack.

_Going deeper: hard mode's chapter 11 has the actual research, what it proves, and, just as carefully, what it does not._

---

## Your first hour

[Scene: back to the empty lot from beat 1, but now a sign at the gate reads "your name here."]

Everything above compresses into one evening.

**Get the agent:** Install Claude Code (or a rival; the site design works on any of them). The install is one copied line and the agent guides you from there; if even that line is intimidating, ask any AI chat to walk you through it, no shame, that is what they are for.

**Make a site:** Create one folder for one real project you actually care about, move the relevant files into it, and open the agent there. Not a toy. The whole page only clicks on work you care about.

**Then paste this, word for word:**

> I've never worked with an agent before. Interview me, one question at a time, about this project and how I want to work with you: what I'm building, what you should never do without asking, what I keep having to repeat to AI tools, and what my last three frustrations with them were. Then write a CLAUDE.md from my answers, create a STATE.md that says where the project stands, and tell me the first three procedure cards, skills, worth creating for how I work. Commit after each finished piece, and end by telling me one thing you'd change about how I've set this up.

That one message builds the trailer, opens the logbook, plans the first cards, starts the photo record, and, because of how it is written, hires the foreman. The rest of the site, the runners, the inspectors, the wall schedule, gets added the week each one starts to hurt, and by then the words for asking will be right there on the bench.

Ready for the deep end? → Hard mode, chapter 1. / Built by the crew it describes.
