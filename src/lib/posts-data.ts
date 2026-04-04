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
    slug: 'fire-horse-2026',
    title: 'Year of the Fire Horse 2026: Week One Already Has Me By the Throat',
    excerpt:
      "The Year of the Fire Horse started on February 17th. By the end of the first week, I'd already lived through a revenue high, the worst product failure of my career, and a perfect score in a leadership class. Three massive swings in seven days.",
    date: 'Feb 28, 2026',
    readTime: '5 min',
    category: 'High Performance Culture',
    tags: ['high-performance-culture'],
    featured: true,
    image: '/images/dave-speaking.jpg',
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
    image: '/images/speaking-podium.jpg',
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
    image: '/images/dave-workshop.jpg',
  },
  {
    slug: 'ai-avatar-digital-twin',
    title: 'Day 21/88: Your AI Avatar Is Your Digital Twin',
    excerpt:
      'AI avatar quality starts with source setup. Clean lighting, steady framing, crisp audio. Your avatar mirrors input quality. Digital twin on your best day — not just believable, magnetic.',
    date: 'Nov 6, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'branding-with-ai'],
    dayNumber: 21,
  },
  {
    slug: 'ai-video-beat-sync',
    title: 'Day 20/88: Nail Your Beat Cuts Using AI Video Beat Sync',
    excerpt:
      'AI video beat sync transforms editing into musical composition. Cut to rhythm, not seconds. Match emotion to beats. Transitions as musical bridges. Feel every transition. 2x impact.',
    date: 'Nov 5, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai'],
    dayNumber: 20,
  },
  {
    slug: 'ai-video-visual-consistency',
    title: 'Day 19/88: Your Story Deserves Harmony with AI Video Visual Consistency',
    excerpt:
      'AI video visual consistency separates amateur from cinematic. Clashing styles kill stories. Align colors, fonts, transitions. Visual harmony builds trust. Cohesion creates narrative.',
    date: 'Nov 4, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai'],
    dayNumber: 19,
  },
  {
    slug: 'plan-ai-shots-google-flow',
    title: 'Day 18/88: Before You Hit Record, Plan Your AI Shots with Google Flow',
    excerpt:
      'AI video planning eliminates chaos. Before you hit record, map six story beats, plan transitions, build visual flow. Structure over equipment. Plan flows, story shines. Save hours.',
    date: 'Nov 3, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai'],
    dayNumber: 18,
  },
  {
    slug: 'master-ai-image-quality',
    title: 'Day 17/88: Master AI Image Quality and Stop Letting Blur Kill Your Ideas',
    excerpt:
      'AI image quality defines professionalism. Blur kills ideas. Master export settings: aspect ratio, HD resolution (1920x1080+), DPI (300 print / 72 web). Sharp edges. Two clicks.',
    date: 'Oct 31, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai'],
    dayNumber: 17,
  },
  {
    slug: 'brand-visually-unmistakable',
    title: 'Day 16/88: Make Your Brand Visually Unmistakable with AI Consistency',
    excerpt:
      'AI brand consistency creates recognition. Define your visual DNA once: colors, fonts, lighting. Build your preset. Scale with AI. Recognition before the logo. System not style.',
    date: 'Oct 30, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'branding-with-ai'],
    dayNumber: 16,
  },
  {
    slug: 'ai-image-variations',
    title: 'Day 15/88: Master AI Image Variations by Remixing One Idea into Five Scroll-Stopping Visuals',
    excerpt:
      'AI image variations turn one idea into five visuals. Use modifiers for lighting, perspective, mood. Control seeds for consistency. Negative prompts keep it clean. Creative direction.',
    date: 'Oct 29, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'branding-with-ai'],
    dayNumber: 15,
  },
  {
    slug: 'automation-workflow-as-product',
    title: 'Day 14/88: Treat Your Automation Workflow Like a Product: Test, Break, and Perfect It',
    excerpt:
      "Automation workflow reliability requires testing. Don't set and forget. Run chaos tests, find weak points, add recovery systems. Test, break, perfect before it breaks you.",
    date: 'Oct 28, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 14,
  },
  {
    slug: 'ai-task-automation',
    title: 'Day 13/88: Automate Your Grind with AI Task Automation and Reclaim Hours for Real Ideas',
    excerpt:
      'AI task automation reclaims time: automate one 10-minute daily task, save 50 hours yearly. Use trigger-action logic with AI tools. Small automations compound into real productivity.',
    date: 'Oct 27, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 13,
  },
  {
    slug: 'map-workflow-ai-productivity',
    title: 'Day 12/88: Map Your Workflow to Unlock AI Productivity',
    excerpt:
      "AI workflow mapping turns chaos into productivity. Can't automate what you can't see. Map processes step-by-step, find bottlenecks, assign owners. Structure before automation.",
    date: 'Oct 24, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 12,
  },
  {
    slug: 'ai-prompt-training',
    title: 'Day 11/88: Stop Wishing AI Would Understand You and Start AI Prompt Training Instead',
    excerpt:
      'AI prompt training transforms results. Stop wishing AI understands you — train it instead. Co-create prompts, teach your thinking patterns, build shared language. Trainers win.',
    date: 'Oct 23, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 11,
  },
  {
    slug: 'viral-content-hooks',
    title: "Day 10/88: Most Creators Don't Realize Viral Content Hooks Are Won or Lost in 3 Seconds",
    excerpt:
      'Viral content hooks succeed in 3 seconds. Most creators fail because they skip the framework. Use 6 elements: clarity, action, transformation, contrast, proof, time. AI multiplies this.',
    date: 'Oct 22, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 10,
  },
  {
    slug: 'lead-with-ai',
    title: "Day 9/88: You Don't Need Permission to Lead with AI, Just the Courage to Start",
    excerpt:
      "Lead with AI without waiting for permission. That title isn't coming. Build one solution this week: automate reports, create prompts, solve pain points. AI Officers take initiative.",
    date: 'Oct 21, 2025',
    readTime: '1 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 9,
  },
  {
    slug: '15-minutes-daily-ai',
    title: 'Day 8/88: Why 15 Minutes Daily With AI Beats 3 Hours Monthly',
    excerpt:
      'Daily AI practice beats monthly cramming. 15 min daily > 3 hours monthly. Small reps compound fast. AI thinking becomes automatic. Build muscle memory, not course collection.',
    date: 'Oct 20, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai'],
    dayNumber: 8,
  },
  {
    slug: 'three-connected-ai-tools',
    title: 'Day 7/88: Three Connected AI Tools Beat Ten Disconnected Ones',
    excerpt:
      'Connected AI tools beat disconnected stacks. Stop collecting. Pick 3 you actually use, connect them through Zapier or workflows. Your image AI feeds your writer feeds your database.',
    date: 'Oct 17, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 7,
  },
  {
    slug: 'ai-automation-not-robots',
    title: "Day 6/88: AI Automation Isn't About Robots Replacing You",
    excerpt:
      "AI automation isn't about robots replacing people. It's about fixing your Tuesday afternoon. Map your weekly tasks, find the boring middle, hand it to AI. Keep strategy.",
    date: 'Oct 16, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'ai-in-business'],
    dayNumber: 6,
  },
  {
    slug: 'train-ai-to-write-like-you',
    title: 'Day 5/88: Train AI to Write Like You, Not the Other Way Around',
    excerpt:
      'Train AI to write like you by creating a voice file of your best emails, posts, and reports. Feed these examples first. Stop sounding robotic. Amplify your voice 10x.',
    date: 'Oct 15, 2025',
    readTime: '2 min',
    category: '88 Days of AI',
    tags: ['88-days-of-ai', 'branding-with-ai'],
    dayNumber: 5,
  },
];

// Structured body content keyed by slug
export const BLOCKS_BY_SLUG: Record<string, Block[]> = {
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
  'ai-avatar-digital-twin': [
    { tag: 'p', text: 'Your avatar is your digital twin. It represents you in virtual meetings, content, and client interactions. So, why treat it like an afterthought? Great avatars start with great setup, clean lighting, steady framing, and crisp sound. When your recording feels human, your avatar feels real.' },
    { tag: 'p', text: 'AI avatars are redefining how professionals show up online. Whether you\'re delivering a presentation, training your team, or creating content, your digital twin carries your tone, your style, and your energy. The difference between "good" and "wow" often comes down to your source video setup. Think of it like a headshot session, the better your capture, the more lifelike your AI output.' },
    { tag: 'h4', text: 'Learning Breakdown' },
    { tag: 'li', text: 'Your Avatar Mirrors the Source — Every pixel of your avatar depends on your input. Poor lighting or muffled sound instantly breaks immersion. A clear, well-lit recording gives AI the texture, tone, and expression it needs.' },
  ],
  'ai-video-beat-sync': [
    { tag: 'p', text: "Ever notice how the best edits feel like music? That's because they are. When visuals match rhythm, they don't just entertain, they move people. Beat syncing turns editing into a full-body experience. Your audience doesn't just watch, they feel every transition." },
    { tag: 'p', text: "Music drives emotion. A single beat drop can shift energy, tension, or joy. Yet, many creators forget that timing is storytelling. Google Flow helps automate this alignment, syncing visuals and sound into perfect rhythm. This isn't just about trimming clips, it's about composing with visuals." },
    { tag: 'p', text: "When your cuts, transitions, and motion align with beats, you transform a video from random moments into a cinematic story. That's how modern creators hold attention in a scroll-fast world." },
    { tag: 'h3', text: 'Learning Breakdown' },
    { tag: 'li', text: 'Emotion Lives in Rhythm — Every beat carries emotion. Match your cuts to that emotion and the audience stays connected.' },
  ],
  'ai-video-visual-consistency': [
    { tag: 'p', text: 'The moment your visuals align, your story stops looking accidental and starts feeling cinematic.' },
    { tag: 'p', text: "Most creators think storytelling ends when they hit record, but visual consistency is the secret ingredient that makes everything look intentional. When colors, fonts, and transitions clash, even the best story feels unpolished. The human brain catches visual mismatches before it even processes the message. That is why strong brands always look cohesive, their visuals speak one language." },
    { tag: 'p', text: 'With Google Flow, you can lock in that consistency once and let the system handle the rest. Feed it your colors, typography, and logo preferences, and Flow will maintain your visual identity across every project.' },
    { tag: 'h3', text: 'Learning Breakdown' },
    { tag: 'li', text: 'AI Video Visual Consistency Builds Trust — Repetition creates recognition.' },
  ],
  'plan-ai-shots-google-flow': [
    { tag: 'p', text: "Before you hit record, plan your shots. The secret to a good video is not the camera, it is structure. Google Flow turns storyboards into cinematic magic by helping you map every beat before you film." },
    { tag: 'p', text: "Most creators waste hours fixing things in post-production that could have been solved in five minutes of pre-planning. Whether you are shooting a product demo, a tutorial, or a campaign video, the key is clarity before the camera rolls. Storyboarding gives your brain a visual script — a plan you can follow instead of chase." },
    { tag: 'h4', text: 'Learning Breakdown' },
    { tag: 'li', text: 'Great stories start with clear beats — Every video has rhythm. Break your story into beats — the moments where something shifts or matters.' },
  ],
  'master-ai-image-quality': [
    { tag: 'p', text: 'A great idea deserves to look as good as it feels.' },
    { tag: 'p', text: 'But too often, your visual brilliance gets lost in the fog. Blurry exports, wrong aspect ratios, or low-resolution settings quietly destroy the professional feel of your work. The fix is simple: master your export settings once, and your visuals instantly level up.' },
    { tag: 'h3', text: 'Why Visual Clarity Matters' },
    { tag: 'p', text: 'In the AI era, design speed has skyrocketed. But speed means nothing without precision. Every pixel tells your audience something about your standards. A blurry post whispers "unfinished." A crisp image says "I care."' },
    { tag: 'p', text: 'When your work looks sharp, people trust your brand more and stay longer.' },
  ],
  'brand-visually-unmistakable': [
    { tag: 'p', text: 'By tomorrow, your brand can look unmistakable. Every pixel, every post, perfectly you. The secret? Consistency. When your colors, lighting, and framing stay locked, your brand becomes instantly recognizable, even before people see your name.' },
    { tag: 'p', text: "AI has made it easier than ever to create, but harder to stay consistent. Every new image model or design trend tempts you to switch styles. Yet what makes a brand powerful isn't endless variation, it's repetition with intention. Think of Apple's product photos, Nike's minimal black backgrounds, or Starbucks' warm tones. Their visual style doesn't change because it tells you exactly who they are." },
    { tag: 'p', text: 'In the AI era, brand identity is a prompt, not a coincidence.' },
    { tag: 'li', text: 'Consistency Creates Trust' },
  ],
  'ai-image-variations': [
    { tag: 'p', text: 'Creativity does not move in straight lines anymore. With AI, you can turn one spark into five scroll-stopping visuals in minutes. You do not need to be a designer or spend hours polishing. You just need the right prompt tweaks.' },
    { tag: 'p', text: 'In the past, visual design meant spending hours experimenting with color, lighting, and layout. Now, AI image generators let you explore entire visual worlds with a few words. But the real skill is not just generating random images, it is remixing one idea intelligently. That is how you sharpen your visual instinct and learn to direct AI like a creative partner.' },
    { tag: 'h4', text: 'Learning Breakdown' },
    { tag: 'li', text: 'One Idea Can Be Infinite — A single concept, like "a futuristic city at sunset," can branch into countless looks.' },
  ],
  'automation-workflow-as-product': [
    { tag: 'p', text: "You wouldn't launch a product without testing it. So why trust your workflow blindly? The truth is, every automation or process will fail eventually. The difference between chaos and control is how you prepare for that failure." },
    { tag: 'p', text: "Most people think automation means \"set it and forget it.\" But in reality, even the best setups can break under small changes like a renamed file, a new API limit, or an expired login. If your workflow depends on fragile links, one small change can ripple through your system. That's why the smartest AI operators test their workflows like engineers test products." },
    { tag: 'h4', text: 'Learning Breakdown' },
    { tag: 'li', text: 'Every workflow has weak points — Your workflow is only as strong as its weakest link.' },
  ],
  'ai-task-automation': [
    { tag: 'p', text: "Imagine getting back one full workday every week without working longer. That's what small automations can do. Within a single day, you can connect simple actions that handle your routine work while you focus on the creative stuff." },
    { tag: 'p', text: "Automation isn't just for engineers anymore. It's for anyone tired of repeating the same manual tasks. Whether you're renaming files, moving data between tools, or sending daily reminders, those are all opportunities to save time through automation. AI tools and no-code platforms make this easier than ever." },
    { tag: 'h3', text: 'Learning Breakdown' },
    { tag: 'li', text: 'Every Repetitive Task Is a Signal' },
  ],
  'map-workflow-ai-productivity': [
    { tag: 'p', text: "Most of your day slips away doing things you never planned. You jump from one task to another, reacting instead of leading. The truth is, you can't automate chaos. The first step to using AI effectively is to make your work visible. When you map your workflow, you finally see where your time truly goes." },
    { tag: 'p', text: "AI can't fix what you can't see. Many professionals rush to \"automate with AI,\" but without understanding their process, the automation adds confusion instead of clarity. Workflow mapping is the missing link between busy work and smart automation." },
    { tag: 'p', text: "Every role has repeatable processes such as onboarding, reporting, or responding to clients. Once you visualize these steps, you'll find bottlenecks, handoff gaps, and repetitive tasks that AI can instantly optimize." },
    { tag: 'h3', text: 'Learning Breakdown' },
    { tag: 'li', text: "Mapping Makes Your Work AI-Ready" },
  ],
  'ai-prompt-training': [
    { tag: 'h3', text: 'The Myth of AI That Understands You' },
    { tag: 'p', text: "Most people hope AI will just get them. But AI is not emotional. It is mathematical. It does not read your feelings; it maps your patterns. The clearer you are, the better it mirrors you." },
    { tag: 'p', text: "We often talk about AI like it is a mind-reading assistant. \"It should know what I mean.\" But AI only knows what you show it. The people who get extraordinary results are not lucky. They are trainers, not wishers. They teach the model how to think with them, step by step." },
    { tag: 'h3', text: 'From Hoping to Training: Building a Clearer Mindset' },
    { tag: 'p', text: "Great AI results come from clarity, not magic. The moment you stop hoping AI will interpret your intent and start training it to think with you, everything changes." },
  ],
  'viral-content-hooks': [
    { tag: 'p', text: "You have three seconds. That's it." },
    { tag: 'p', text: "In the time it takes someone to blink twice, they have already decided whether to keep scrolling or stay with you. And the truth? Most creators lose in those first three seconds, not because their content is bad, but because their hook is weak." },
    { tag: 'p', text: "Every post, video, or idea lives or dies by its opening. In the attention economy, the hook is your handshake, your first impression, your make-or-break moment." },
    { tag: 'p', text: "Yet, most creators treat it like an afterthought. They spend hours on editing, captions, and visuals but skip the one thing that actually stops the scroll." },
    { tag: 'p', text: "As an AI Officer, your role is not just to create content. It is to engineer attention using data, frameworks, and systems that consistently work." },
  ],
  'lead-with-ai': [
    { tag: 'p', text: "You don't need permission to lead with AI, you just need the courage to start." },
    { tag: 'p', text: "Look around your office. Everyone's waiting for someone else to figure out AI. IT says it's not their job. Management's too busy. HR's overwhelmed." },
    { tag: 'p', text: "Meanwhile, you could be the one actually doing something." },
    { tag: 'p', text: "Build that AI workflow for your team's weekly reports. Create that prompt library everyone keeps asking for. Set up that simple automation that saves two hours." },
    { tag: 'p', text: "You don't need a fancy title or executive blessing. You need initiative and a laptop. The AI Officer role isn't granted; it's taken." },
  ],
  '15-minutes-daily-ai': [
    { tag: 'p', text: "Mastery isn't luck. It's rhythm. While everyone else binges AI tutorials on weekends, you're building muscle memory daily." },
    { tag: 'p', text: "The truth about getting good with AI? It's not about that weekend workshop or that 10-hour course you'll never finish. It's about small, daily reps." },
    { tag: 'p', text: "Five minutes refining a prompt. Ten minutes teaching AI your writing style. Two minutes testing a new workflow. These tiny moves compound faster than you think." },
    { tag: 'p', text: "The person who uses AI for fifteen minutes daily destroys the person who crams for three hours monthly. Why? Because AI thinking becomes automatic. You stop overthinking prompts. You instinctively know what works. Your brain develops patterns." },
  ],
  'three-connected-ai-tools': [
    { tag: 'p', text: "Stop collecting AI tools. Start connecting them." },
    { tag: 'p', text: "Your stack looks impressive until you realize nothing talks to each other." },
    { tag: 'p', text: "Here's the trap everyone falls into: New AI tool drops, you sign up. Another one launches, you grab that too. Now you've got ChatGPT for writing, Midjourney for images, Claude for analysis, and fifteen others gathering digital dust." },
    { tag: 'p', text: "But they're all islands. You're copying and pasting between tabs like it's 1999." },
    { tag: 'p', text: "Smart money isn't on more tools. It's on making the ones you have actually work together. Pick three that solve real problems. Connect them through Zapier, Make, or even simple workflows. Now your image generator feeds your writer which updates your database. That's power." },
  ],
  'ai-automation-not-robots': [
    { tag: 'p', text: "Automation isn't about robots replacing people. It's about designing your flow." },
    { tag: 'p', text: "Stop dreaming of robot armies. Start fixing your Tuesday afternoon." },
    { tag: 'p', text: "Everyone thinks automation means some fancy system doing everything. Wrong. Real automation is you identifying the repetitive junk in your workflow and letting AI eat it for breakfast." },
    { tag: 'p', text: "Take client reports. You still set strategy, you still present findings. But that middle part? Formatting data, writing summaries, creating charts? That's AI food." },
    { tag: 'p', text: "Map out your process. Find the mundane middle steps. Hand those off. Keep the thinking and relationship parts. You just bought back three hours." },
  ],
  'train-ai-to-write-like-you': [
    { tag: 'p', text: "Your voice is your superpower. Don't lose it to generic AI tone." },
    { tag: 'p', text: "That robotic \"I hope this email finds you well\" nonsense? Nobody wants that." },
    { tag: 'p', text: "Here's what smart operators know: AI defaults to vanilla because you haven't taught it your flavor. But feed it your best writing samples first? Game changer." },
    { tag: 'p', text: "Show it your emails that actually got responses. Your posts that sparked conversations. Your reports that made people care. Tell it \"write like these examples\" before any request." },
    { tag: 'p', text: "Suddenly your AI stops sounding like a corporate bot and starts sounding like you on your best day. Same ideas, your voice, ten times faster." },
  ],
};
