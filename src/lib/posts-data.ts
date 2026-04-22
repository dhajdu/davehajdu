export type Block = { tag: string; text?: string; images?: string[]; caption?: string };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  featured?: boolean;
  image?: string;
  dayNumber?: number;
};

export const POSTS: Post[] = [
  {
    slug: 'the-room-was-crying',
    title: 'The Room Was Crying',
    excerpt:
      'A Vietnamese film premiere, a father, two daughters, and the leadership lesson every founder needs about consistency.',
    date: 'Apr 22, 2026',
    readTime: '4 min',
    category: 'High Performance Culture',
    tags: ['high-performance-culture', 'doing-business-in-vietnam'],
    image: '/images/the-room-was-crying.webp',
  },
  {
    slug: 'claude-routines-changed-everything',
    title: 'Claude Routines Changed Everything: A Letter to My Friends',
    excerpt:
      'Claude Routines replaces Zapier, Make, and N8N inside the AI layer. The speed is not creating leverage. It is exposing who did the prep work. What founders should do this week.',
    date: 'Apr 15, 2026',
    readTime: '4 min',
    category: 'AI In Business',
    tags: ['ai-in-business', 'high-performance-culture'],
    featured: true,
    image: '/images/claude-routines-get-to-work.webp',
  },
  {
    slug: 'supabase-for-non-technical-founders',
    title: 'Supabase for Non-Technical Founders: How I Shipped a Real Database in an Hour',
    excerpt:
      'Supabase for non-technical founders, explained like a friend would. I shipped a real database-backed contact form on my site in one hour. Here is how.',
    date: 'Apr 8, 2026',
    readTime: '5 min',
    category: 'AI In Business',
    tags: ['ai-in-business', 'high-performance-culture'],
    image: '/images/supabase-in-one-hour.webp',
  },
  {
    slug: 'leading-humans-and-ai',
    title: 'Leading Humans and AI: The 50/50 Era of Leadership',
    excerpt:
      'Leading humans and AI is the new job for founders. Before you buy another tool, build the foundation. A letter on workflow design, data, and real AI ROI.',
    date: 'Apr 7, 2026',
    readTime: '6 min',
    category: 'High Performance Culture',
    tags: ['high-performance-culture', 'ai-in-business'],
    image: '/images/the-other-50.webp',
  },
  {
    slug: 'fire-horse-2026',
    title: 'Year of the Fire Horse 2026: Week One Already Has Me By the Throat',
    excerpt:
      "The Year of the Fire Horse started on February 17th. By the end of the first week, I'd already lived through a revenue high, the worst product failure of my career, and a perfect score in a leadership class. Three massive swings in seven days.",
    date: 'Feb 28, 2026',
    readTime: '5 min',
    category: 'High Performance Culture',
    tags: ['high-performance-culture'],
    image: '/images/dave-keynote.webp',
  },
  {
    slug: 'entrepreneurial-learnings',
    title: "18 Entrepreneurial Learnings from a Founder Who Built Businesses in the World's Toughest Markets",
    excerpt:
      'I learned so much about the 50% of leadership that we all know matters — the human side. The relationships. The hard-won wisdom that only comes from building something real in difficult places.',
    date: 'Feb 2, 2026',
    readTime: '6 min',
    category: 'High Performance Culture',
    tags: ['high-performance-culture', 'doing-business-in-vietnam'],
    image: '/images/speaking-podium.webp',
  },
  {
    slug: 'ai-officer-mindset',
    title: 'AI Officer Mindset: From Learning to Results in 12 Hours',
    excerpt:
      'Ms. Trang from Pasteur Street Brewing Company attended our AI After Dark workshop. Less than 12 hours later, she had already built her digital twin and put it to work. Here is what that tells us about the gap between learning and doing.',
    date: 'Oct 17, 2025',
    readTime: '4 min',
    category: 'AI In Business',
    tags: ['ai-in-business'],
    image: '/images/dave-workshop.webp',
  },
];

// Structured body content keyed by slug
export const BLOCKS_BY_SLUG: Record<string, Block[]> = {
  'the-room-was-crying': [
    { tag: 'p', text: "The end credits rolled on Anh Hung and strangers around me were wiping their faces. My friend Tim Bui, the director, had described the film to me as \"heartfelt.\" That word was too small for what had just happened in the room." },

    { tag: 'h2', text: 'A father. Two daughters.' },
    { tag: 'p', text: "The premise is simple. A father trying to do right by his family. Two daughters - one who believes in him, one who doesn't. No cape. No rescue mission. No breakthrough moment. Just an everyday hero story told with enough craft that a room full of Vietnamese strangers wept together on a Monday night." },

    { tag: 'h2', text: "The thing I couldn't stop thinking about" },
    { tag: 'p', text: 'I watched it as a leadership advisor, whether I wanted to or not.' },
    { tag: 'p', text: "Because here's what landed: the father in the film isn't heroic because of a single scene. He's heroic because of a thousand small ones the camera mostly doesn't show." },
    { tag: 'p', text: "The youngest daughter saw the reps. The way he showed up every day, whether anyone was watching or not. The careful, unglamorous work of a man trying. The oldest daughter saw the failures - the times he missed, the moments he came up short, the promises that arrived late. Same father. Different lens. Both, in their own way, real." },
    { tag: 'p', text: "That's the math your team is doing on you right now." },

    { tag: 'h2', text: 'The founder trap in Vietnam' },
    { tag: 'p', text: "If you're running a company here, you're probably chasing the launch. The next round. The market expansion. The breakthrough that'll finally justify the last eighteen months of pushing." },
    { tag: 'p', text: 'And your team is watching something else entirely.' },
    { tag: 'p', text: "They're watching whether the Monday call happens when you're travelling. Whether the investor update goes out on the first of the month or the twelfth. Whether the 1-1 you promised your ops lead actually happens, or gets eaten again by a customer emergency. Whether the commitment you made in December still holds in April when things got hard." },
    { tag: 'p', text: "You think of those as the boring stuff between the highlights. They are the highlights. Your team just doesn't applaud them." },

    { tag: 'h2', text: 'Consistency is the craft' },
    { tag: 'p', text: "The founders I work with who have the most loyal teams aren't the most charismatic. They aren't the most brilliant strategists. They aren't even the most successful, measured from the outside." },
    { tag: 'p', text: "They're the most consistent." },
    { tag: 'p', text: "They show up the same way on the bad days as the good ones. They keep the small promises. The 9 AM stand-up happens. The Friday wrap email goes out. The quarterly offsite hits the calendar six months in advance and doesn't move when a deal threatens to slip." },
    { tag: 'blockquote', text: 'None of this is glamorous. None of it makes a highlight reel. But over a year, over three years, it becomes the story your team tells about you. And the story your team tells about you is your leadership, whether you meant it to be or not.' },
    { tag: 'p', text: "Every team has believers and doubters. The film got this right. You don't convert the doubters with a single heroic moment. You convert them slowly, over months, by doing what you said you'd do when no one was keeping score." },

    { tag: 'h2', text: 'What to do with this' },
    { tag: 'p', text: "Pick one thing. One cadence. One commitment you'll deliver every week, regardless of mood, energy, travel schedule, or what's on fire." },
    { tag: 'p', text: 'It could be:' },
    { tag: 'li', text: "A Friday written update to your leadership team. Three bullets: what worked, what didn't, what's next." },
    { tag: 'li', text: 'A standing 1-1 with each direct report that never gets cancelled, only rescheduled.' },
    { tag: 'li', text: 'A monthly all-hands where you tell the team the truth about the numbers.' },
    { tag: 'p', text: "Pick the one you can actually sustain for twelve months. Not the most ambitious. The most sustainable. The one you'll still be doing next April when you're tired and the market is ugly." },
    { tag: 'p', text: "That's your hero work. That's what the believers will point to three years from now when someone asks them why they stayed. And it's what the doubters eventually can't argue with." },
    { tag: 'blockquote', text: "Don't measure your leadership in moments of brilliance. Measure it in months of consistency." },

    { tag: 'h2', text: 'Go see Anh Hung' },
    { tag: 'p', text: "This is a personal blog, so I'll say it plainly: if you're in Vietnam this weekend and you're looking for something to do, go watch Anh Hung. Tim Bui made something real. The lead actor is phenomenal. The story earns every tear in that room." },
    {
      tag: 'gallery',
      caption: 'From the premiere.',
      images: [
        '/images/the-room-was-crying-1.webp',
        '/images/the-room-was-crying-2.webp',
        '/images/the-room-was-crying-3.webp',
        '/images/the-room-was-crying-4.webp',
      ],
    },
    { tag: 'p', text: "And the rest of us got a leadership lesson we didn't pay for." },
  ],
  'claude-routines-changed-everything': [
    { tag: 'p', text: "It's 5:30 AM. My phone lights up. Claude just shipped Routines." },
    { tag: 'p', text: "I sat up in bed. Then I got out of bed. I'm writing this to you before coffee because I can't sit on it." },
    { tag: 'p', text: "Yesterday I was euphoric. Lark CLI dropped and I burned four hours I didn't have wiring up notifications from every website I own, pulling my meeting notes out automatically, getting my calendar to behave. I was in the class I was teaching saying \"this is the moment, this changes how we work.\"" },
    { tag: 'p', text: "That was yesterday." },
    { tag: 'p', text: "This morning Routines landed and Lark CLI is already a footnote in my own brain." },
    { tag: 'p', text: "That is the pace now. A \"game changer\" has a 24-hour shelf life." },

    { tag: 'h2', text: 'What Claude Routines actually is' },
    { tag: 'p', text: 'Native automation inside the AI layer. Schedules, webhooks, API calls, all stitched together where the reasoning lives. Claude Routines does the job that Zapier, Make, and N8N have been doing for a decade, now happening one layer down, next to the model. Connectors are early. They won\'t be for long.' },
    { tag: 'p', text: "That's all you need from me on the product. The real story is not Routines." },

    { tag: 'h2', text: 'The real story: speed is exposing us' },
    { tag: 'p', text: 'The speed of AI is not creating leverage from nothing. It is amplifying whatever clarity you already had.' },
    { tag: 'p', text: 'If you documented your processes last year, you are about to pull away. Hard. You already know what your business does, how a ticket moves, how a lead becomes a client, what happens on day one, day seven, day thirty. You can hand that to a Routine this week and it will just run.' },
    { tag: 'p', text: "If you didn't, you are about to feel it." },
    { tag: 'blockquote', text: 'Here is the honest test. If you cannot write down how your business actually runs on one page, you do not have a business. You have a job that happens to employ you.' },
    { tag: 'p', text: 'And that job is about to get extremely expensive to hold onto, because the founders around you are turning their pages into routines while you are still trying to remember what you do on Wednesdays.' },
    { tag: 'p', text: 'This is what the speed is exposing. Not who has the best AI strategy. Who did the boring prep work.' },

    { tag: 'h2', text: 'What to do, two reads' },
    { tag: 'h3', text: 'If you are a founder reading this on your phone between meetings' },
    { tag: 'p', text: 'Stop treating AI as a side experiment that lives on your Friday afternoons. You need an actual AI program. And you need a person who owns it. Not a consultant on retainer, not "we all pitch in," not you at 11 PM. A dedicated human whose job title has AI in it, whose week is organized around this, whose only question on Monday morning is what did we automate last week and what are we automating next.' },
    { tag: 'p', text: 'If nobody owns it, nothing compounds. And if nothing compounds, you lose.' },
    { tag: 'h3', text: 'If you are in transition, in between roles, or job-hunting right now' },
    { tag: 'p', text: 'Spend eight hours a day on this. Everything you\'ve got. Treat it like the most important job you will ever take, because it is. Ninety days of full-time immersion and your value multiplies eight times against your peers. That is not hype. That is math. Most of your peers are still arguing in Slack about whether to use AI. You are going to be the person who already shipped something.' },
    { tag: 'p', text: 'This window does not stay open. It is open right now.' },

    { tag: 'h2', text: 'Close' },
    { tag: 'p', text: "I'm publishing this before I finish reading the Routines docs. That is intentional. If I wait until I have the polished take, the next thing will have already shipped." },
    { tag: 'p', text: 'So get out of bed. Open the docs. Build one small thing today.' },
    { tag: 'p', text: 'And if you are a founder and you already know you need a real AI engineer inside your company, one who works for you and sits inside mine so they have a team around them, DM me. I am not trying to sell you. I am trying to save you. There is a version of the next 12 months where you look up and realize you waited too long. I would rather we have the conversation now.' },
    { tag: 'blockquote', text: 'The people who move this week own next year.' },
    { tag: 'p', text: 'Dave.' },
    { tag: 'p', text: 'P.S. I\'m writing a follow-up this weekend: "The native AI layer is eating automation." I\'ll go deeper on what that means for your stack, your team, and your P&L. Stay close.' },
  ],
  'supabase-for-non-technical-founders': [
    { tag: 'p', text: 'Hey Buddy,' },
    { tag: 'p', text: "Most of you reading this are tech-forward founders. You read a lot, you're sharp, and you're comfortable using AI, but you've never actually built anything technical. That used to be a wall. It is not a wall anymore. Yesterday I sat down to learn Supabase for non-technical founders alongside my own site, and one hour later three different contact forms on davehajdu.com were quietly saving every inquiry to a real database. No backend service. No monthly form-tool subscription. No engineer on retainer. If I can do it in one hour, you can too. Here is exactly what happened." },

    { tag: 'h2', text: 'The Problem In One Sentence' },
    { tag: 'p', text: 'My contact form was a beautiful dead end. People filled it out, hit submit, and the data went exactly nowhere. A database is just a spreadsheet that never breaks, can be searched in a second, and that other software is allowed to talk to. I needed one of those, and I had been putting it off for months because it sounded like a project.' },

    { tag: 'h2', text: 'Why Supabase, In Founder Language' },
    { tag: 'p', text: 'Supabase is a free service that gives you a database without making you set up a server. You sign up, click two buttons, and you have a place to store stuff. That is the whole pitch. No babysitting, no monthly form-tool tax, no vendor that owns your data and rents it back to you. It is built on Postgres, which is the same boring, bulletproof technology the most serious companies in the world run on. Boring is good. Boring means it still works in five years.' },

    { tag: 'h2', text: 'Lesson One: Claude Is Not Always Right, And That Is Fine' },
    { tag: 'p', text: "Halfway through the build, Claude (the AI I was pairing with) gave me instructions using the old names for Supabase keys. Supabase had recently renamed them. The old name 'anon' became 'publishable.' The old name 'service_role' became 'secret.' Claude's training data had not caught up. I only noticed because I happened to look at the Supabase dashboard with my own eyes and the words on the screen did not match the words in the instructions." },
    { tag: 'p', text: 'Here is the lesson, and I want you to write this one down. AI is the best junior teammate you have ever had, but you still have to look at the work. Trust, then verify. Always. This is exactly why you read, why you ask questions, why you stay curious about what the screen actually says. The AI is fast. You are the editor. The day you stop being the editor is the day the AI starts shipping mistakes in your name.' },

    { tag: 'h2', text: 'Lesson Two: A Human Architect Is Worth Their Weight' },
    { tag: 'p', text: 'When I asked Claude to design the place where my form data would live, it proposed three separate tables. One for general inquiries. One for keynote inquiries. One for consultation inquiries. That is the developer instinct. Separate things into separate boxes. It is not wrong. It is just not what I wanted.' },
    { tag: 'p', text: "I told Claude no. I want one table, with a column that tags each row by type. Claude flipped the design without complaint, and it was the right call. Why? Because in six months, when I want to ask the simple question 'how many people reached out this month?' I now look in one place instead of three. One query, one answer, one click." },
    { tag: 'p', text: "Here is the lesson. In the one-person founder era, an experienced human architect, someone who has built things before, is the most valuable advisor you can buy for an hour. Claude can build you anything. Claude cannot tell you which version of 'anything' you will regret in six months. A human who has been bitten before can. Pay for that hour. It is the cheapest insurance in the building." },

    { tag: 'h2', text: 'Normalization, Explained At The Kitchen Table' },
    { tag: 'p', text: 'The fancy word for what I just described is normalization. It sounds like a word your accountant uses to make you feel small. It is not. Here is the kitchen-table version.' },
    { tag: 'p', text: 'Imagine you run a small shop and you keep three notebooks. One for walk-ins. One for catering inquiries. One for wholesale leads. Every Monday morning you have to flip through three notebooks to count how many leads you got last week. Annoying. Slow. Easy to lose count.' },
    { tag: 'p', text: "Now imagine one notebook with a column that says 'type: walk-in, catering, or wholesale.' Same exact information. One place. One count. One search. That is normalization. That is why I have one table called leads with a column called inquiry_type, instead of three separate tables. Boring word. Obvious idea. Huge payoff later when you start asking real questions of your own data." },

    { tag: 'h2', text: 'The Whole System, Drawn On A Napkin' },
    { tag: 'p', text: 'Here is the architecture. Read it slowly. It is small on purpose.' },
    { tag: 'p', text: 'Three forms on my site (general, keynote, consultation). One little doorway in my code that checks the form is real. One table called leads in Supabase. One pipe. Three taps. One bucket. That is the whole system. You could draw it on a napkin in fifteen seconds, and that is the point. The best systems are the ones you can hold in your head.' },

    { tag: 'h2', text: 'Why I Do Not Trust The Form (And You Should Not Either)' },
    { tag: 'p', text: 'One more piece, and then we are done. Between the form on my site and the table in Supabase, I added a tiny doorway. The doorway has one rule: only let these specific pieces of information through. Throw everything else away. Name? Allowed. Email? Allowed. A weird hidden field that some bot tried to sneak in? Dropped at the door.' },
    { tag: 'p', text: 'Why bother? Because the internet is full of mischief, and the cheapest, dumbest, most effective protection you can build is a list of what you allow, instead of a list of what you block. The bouncer does not need to know every troublemaker by name. The bouncer just needs the guest list.' },

    { tag: 'h2', text: 'What I Did Not Build (And Why That Is The Point)' },
    { tag: 'p', text: 'I want you to notice what is missing from this story. No login system. No fancy admin dashboard. No email automation. No paid tools. I bought zero new subscriptions. I added zero new monthly bills. The whole stack: Supabase (free), Vercel (already had it), Claude Code (already had it). Total time: one hour.' },
    { tag: 'p', text: 'The skill in this era is not building more. It is deciding what not to build. Every feature you do not build is a future bug you do not have to fix, a future invoice you do not have to pay, and an hour you get back to spend on the thing only you can do.' },

    { tag: 'h2', text: 'What Is Next, So You Can Copy The Path' },
    { tag: 'p', text: "Two small things on my list, and I am sharing them so you can see what 'finished enough' actually looks like." },
    { tag: 'li', text: 'A small notification that pings my sales channel the moment a new lead lands, so I respond same-day, every day. Speed of response is the single highest-leverage habit in sales, and now I have the plumbing to honor it.' },
    { tag: 'li', text: 'Better security hygiene on my keys, which is a topic for another letter when I am ready to teach it cleanly.' },
    { tag: 'p', text: 'That is it. I am resisting the urge to keep building. Ship. Watch what people actually do. Build the next thing only when reality tells you to.' },

    { tag: 'h2', text: 'The Takeaway' },
    { tag: 'p', text: 'You do not need a developer to start. You need one hour, one Supabase account, Claude as your pair, and the willingness to look at the work with your own eyes. The wall is not a wall anymore. It is a doorway, and you are already standing in front of it. Walk through.' },
    { tag: 'p', text: 'If you want me to walk you through this on a screen-share, the consultation page on this site is the place to start. Bring your site, bring your form, bring your questions. We will get you shipping in an hour, the same way I did.' },
    { tag: 'p', text: 'Your friend,' },
    { tag: 'p', text: 'Dave' },
  ],
  'leading-humans-and-ai': [
    { tag: 'p', text: 'Hey Buddy,' },
    { tag: 'p', text: 'I want you to do something counterintuitive this week. Stop spending money on AI. Stop buying new tools. Stop collecting prompt packs. Close the tabs.' },
    { tag: 'p', text: 'Because the real job in 2026 is not finding a better chatbot. The real job is leading humans and AI, at the same time, inside the same company, with the same clarity you used to reserve for your team. That is the shift nobody is preparing you for, and it is the shift I cannot stop thinking about.' },
    { tag: 'p', text: "Welcome to the 50/50 era of leadership. For your entire career, leadership meant leading humans. That was the whole job. Now, half of what you lead is still human, and the other half is AI. Agents, workflows, systems that make decisions, tools that take actions. If you're a founder or an operator in 2026 and you're not thinking about it this way, you're leading with one hand tied behind your back." },
    { tag: 'h2', text: 'The Three Foundational Skills Nobody Is Teaching' },
    { tag: 'p', text: 'The skills that make you good at the AI half are not the skills everyone is out there teaching. Nobody gets ahead in this era by memorizing better prompts. The people who are going to pull away are the ones who quietly got good at three things.' },
    { tag: 'p', text: 'Workflow design. Can you actually break a job down into steps clean enough that a mix of humans and AI can run it? Data organization. Is your information structured well enough that an AI can do something useful with it, or is it a swamp of PDFs and Slack threads? Clear decision logic and instructions. Can you write down what good looks like, what the edge cases are, when to escalate, and when to ship?' },
    { tag: 'p', text: "That's the job now. That's the foundation. Everything else is decoration on top of it. And if you skip it, no amount of tool-buying will save you. You'll just have a more expensive version of the same mess." },
    { tag: 'h2', text: 'How I Stopped Paying for AI and Started Getting Paid' },
    { tag: 'p', text: 'Once you do have that foundation, something really interesting starts happening. You stop paying for AI and AI starts paying you. Let me give you a live example from my own life, because this is the part that made me want to write to you.' },
    { tag: 'p', text: "I pay $200 a month for Claude. For a long time, that felt expensive. I'd catch myself squinting at the bill and wondering if I really needed the max tier. Then two things happened in the same month." },
    { tag: 'h3', text: 'I Killed My CMS' },
    { tag: 'p', text: 'I used to believe running a website required a database, a fancy editor, drag-and-drop builders, plugins stacked on plugins, and after all of that, the output still looked subpar. So I changed the mental model. Claude is the CMS. I write posts and pages the way a developer ships code, and each page can have its own layout because there is no template cage.' },
    { tag: 'p', text: "Important caveat: the reason this works is that I also hired a UX designer to build me a real design system and component library first. Garbage foundation, garbage output. Great foundation, and suddenly Claude ships work that looks like a studio did it. This is the workflow design and clear instructions thing I was just talking about, in the wild." },
    { tag: 'h3', text: 'I Started Moving Websites' },
    { tag: 'p', text: 'Between me, my companies, and a few friends, I run about 15 sites. That was roughly $500 a month bleeding out in subscriptions. Today I moved davehajdu.com off Wix. I moved the AI Officer Institute site off Framer. Edge8 is next, coming off Wix. Each move only takes me a few hours of actual work, and honestly most of those hours are spent cataloguing the content, because platforms like Wix and Framer are not exactly thrilled when you try to take your content with you. Once it is out, it is out, and the site is mine forever.' },
    { tag: 'p', text: "So the math on that $200 Claude bill? It already saves me $300 a month in hard subscription costs, the design quality went up, I own the stack, and I ship faster. That's not a productivity story. That's a P&L story. That's personal ROI." },
    { tag: 'p', text: 'And this is the part I want you to sit with. None of that was possible because I found a better prompt. It was possible because I spent the time learning to design workflows, organize my assets, and write clear instructions. The tool was never the unlock. The foundation was.' },
    { tag: 'h2', text: 'The Infinite Leverage Blueprint' },
    { tag: 'p', text: "One last thing, because it ties all of this together. I'm running my first Founders Retreat soon. Three days, two nights, a small group, and the whole thing is built around what I'm calling the Infinite Leverage Blueprint. The North Star is the single-person company. Not because everyone should be one, but because the moment you point yourself in that direction, you're forced to ask the only question that matters right now. What should AI do, and what should humans do? That question reshapes your org chart, your P&L, and your calendar in about a week." },
    { tag: 'p', text: "So don't hear any of this as AI is firing everyone. It isn't. Your job as a founder has always been to remove low performers and replace them with higher ones. What's new is that the higher performer isn't always a human anymore. Sometimes it's a person. Sometimes it's a better process powered by AI. You pick based on the work, not the ideology." },
    { tag: 'h2', text: 'Before You Buy One More Tool' },
    { tag: 'p', text: "Please, before you buy one more tool, sit down and ask yourself whether you've actually built the foundation to use the tools you already have. If the answer is no, that's where your next month goes. I promise you the ROI is waiting on the other side of it." },
    { tag: 'p', text: "Leading humans and AI is not a future job. It is the job, right now, today. Start with the foundation. Everything else follows." },
    { tag: 'p', text: "I'll be here when you're ready to compare notes." },
    { tag: 'p', text: 'Your friend,' },
    { tag: 'p', text: 'Dave' },
  ],
  'fire-horse-2026': [
    { tag: 'p', text: "The Year of the Fire Horse 2026 started on February 17th. By the end of the first week, I'd already lived through a revenue high that made my chest tight, the single worst product failure in my career as a founder, and a perfect score in a leadership class on communicating with impact." },
    { tag: 'p', text: 'Three massive swings in seven days. And apparently, that\'s exactly how this year is supposed to go.' },
    { tag: 'p', text: "I didn't learn this from a trending article. My father, known as the Firepig, is a Chinese astrologer. I grew up in this world and ran his astrology business for a stretch. We're relaunching some of his books and products this year, which means I'm not just watching the Fire Horse from the sidelines. I'm building inside it." },
    { tag: 'p', text: "That background gave me something most business operators don't have: a framework for reading the energy of a year before it arrives. And this year? I could feel the heat coming long before February 17th." },
  ],
  'entrepreneurial-learnings': [
    { tag: 'p', text: 'I learned so much about the 50% of leadership that we all know matters-the human side. The relationships. The hard-won wisdom that only comes from building something real in difficult places.' },
    { tag: 'p', text: 'Paul Chu, Founder and Managing Director of RedWolf Airsoft, shared his entrepreneurial journey during a fireside chat. Paul\'s been building businesses since 1998, when he founded what became the world\'s leading global distributor of Airsoft hobby products.' },
    { tag: 'p', text: "Before that, he was a Principal at Boston Consulting Group and a Manager at Accenture. He's also an EO member since 2004, a former Hong Kong Chapter President, and currently an Adjunct Professor at City University of Hong Kong's Academy of Innovation." },
    { tag: 'p', text: 'He had one slide up the entire time-a list of eighteen "Entrepreneurial Learnings"-and spent the next hour bringing each one to life with stories I won\'t forget.' },
  ],
  'ai-officer-mindset': [
    { tag: 'p', text: "Most people think transformation takes months. But the AI Officer Mindset doesn't require years of training. It requires clarity, focus, and the right framework." },
  ],
};
