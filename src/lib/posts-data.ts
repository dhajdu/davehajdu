export type Block = { tag: string; text: string };

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
    slug: 'supabase-for-non-technical-founders',
    title: 'Supabase for Non-Technical Founders: How I Shipped a Real Database in an Hour',
    excerpt:
      'Supabase for non-technical founders, explained like a friend would. I shipped a real database-backed contact form on my site in one hour. Here is how.',
    date: 'Apr 8, 2026',
    readTime: '5 min',
    category: 'AI In Business',
    tags: ['ai-in-business', 'high-performance-culture'],
    featured: true,
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
