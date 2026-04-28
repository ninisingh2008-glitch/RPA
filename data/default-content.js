const pages = {
  home: {
    title: "Official Home of Rajasthan Pickleball",
    hero: {
      eyebrow: "Affiliated with the Indian Pickleball Association · Recognised by the Ministry of Youth Affairs and Sports",
      title: "Rajasthan's home of pickleball.",
      tagline: "Building Rajasthan's grassroots-to-championship pathway for India's fastest-emerging sport.",
      description:
        "The official state association affiliated with the Indian Pickleball Association, which is recognised by the Ministry of Youth Affairs and Sports, and governs rankings, tournaments, and player development across India.",
      actions: [
        { label: "Explore Tournaments", href: "tournaments.html" },
        { label: "Become a Member", href: "membership.html", secondary: true }
      ],
      stats: [
        { value: "33", label: "District Bodies", href: "districts.html" },
        { value: "800+", label: "Registered Players", href: "membership.html" },
        { value: "12", label: "Annual RPA Events", href: "calendar.html" },
        { value: "20+", label: "Affiliated Clubs & Academies", href: "membership.html" }
      ]
    },
    instagram: {
      handle: "@rajasthanpickleballassociation",
      href: "https://www.instagram.com/rajasthanpickleballassociation/",
      highlights: [
        { title: "Tournament Reels", body: "Match-day clips, podium moments, and court-side energy from RPA events." },
        { title: "District Spotlights", body: "Updates from Jaipur, Udaipur, Jodhpur, Kota, Ajmer, Bikaner and emerging districts." },
        { title: "Player Pathway", body: "Trials, training camps, junior sessions, and selection announcements." }
      ]
    },
    about: {
      kicker: "About RPA",
      title: "The official body guiding pickleball growth across Rajasthan.",
      body:
        "Rajasthan Pickleball Association creates structure around a sport that is growing quickly. From district activation and tournament standards to public communication and Team Rajasthan representation, RPA is building the state's official pickleball system."
    },
    features: [
      {
        title: "Governance & Recognition",
        body: "Clear state-level communication, official standards, and trusted representation for the sport in Rajasthan.",
        icon: "shield"
      },
      {
        title: "Tournaments & Trials",
        body: "District opens, state championships, and transparent selection windows feeding the Team Rajasthan pathway.",
        icon: "trophy"
      },
      {
        title: "District Development",
        body: "Support for local organisers, venues, and communities helping pickleball grow beyond a few major cities.",
        icon: "people"
      },
      {
        title: "Infrastructure & Partnerships",
        body: "Venue partnerships, district readiness, and ecosystem support that help the sport scale responsibly.",
        icon: "arena"
      },
      {
        title: "Affiliated Clubs & Academies",
        body: "A growing network of recognised clubs and academies supporting coaching, access, and player development.",
        icon: "clinics"
      }
    ],
    quickLinks: {
      kicker: "Quick Actions",
      title: "Go directly to the part of the ecosystem you need.",
      items: [
        {
          title: "About RPA Snapshot",
          body: "Explore the mission, leadership, district network, and role of the association.",
          href: "about.html",
          cta: "Open About",
          featured: false
        },
        {
          title: "Upcoming Tournaments",
          body: "See current events, host cities, registration details, and the competition pathway.",
          href: "tournaments.html",
          cta: "View Tournaments",
          featured: true,
          bullets: [
            "Upcoming tournaments and host cities",
            "Selection trials and eligibility notes",
            "Registration details and event support"
          ]
        },
        {
          title: "Membership Benefits",
          body: "See membership plans, community benefits, and how players, families and clubs can join the network.",
          href: "membership.html",
          cta: "Open Membership",
          featured: false
        }
      ]
    },
    calendarIntro: {
      kicker: "Calendar",
      title: "Current tournaments, major dates, and selection windows.",
      body: "The public calendar should feel clear and official before a player ever needs to send a message."
    },
    newsIntro: {
      kicker: "Latest News & Updates",
      title: "From the courts, communities, and competition pathway of Rajasthan."
    },
    cta: {
      title: "Ready to stay connected to Rajasthan pickleball?",
      body:
        "Follow tournaments, official updates, state team announcements, and contact routes through one cleaner platform."
    },
    footerBlurb:
      "Official home for tournaments, Team Rajasthan, district development, and public communication across the state."
  },
  about: {
    title: "About RPA",
    hero: {
      eyebrow: "About RPA",
      title: "The state body for pickleball in Rajasthan.",
      description:
        "RPA oversees communication, event structure, district coordination, and the state pathway for players and organisers.",
      actions: [
        { label: "View Tournaments", href: "tournaments.html" },
        { label: "Contact RPA", href: "contact.html", secondary: true }
      ],
      tags: ["Who we are", "Mission", "Recognition", "Leadership"]
    },
    sections: [
      {
        layout: "story",
        kicker: "Who We Are",
        title: "A clear and credible state platform.",
        body:
          "Rajasthan Pickleball Association supports official events, public communication, district development, and the player pathway across the state."
      },
      {
        layout: "cards",
        kicker: "Our Mission",
        title: "What RPA is building.",
        items: [
          { title: "Our Mission", body: "Grow participation with more confidence, better access, and stronger event quality.", meta: "Purpose" },
          { title: "Our Vision", body: "Make Rajasthan one of the most organised and visible pickleball ecosystems in India.", meta: "Direction" },
          { title: "Our Role in Rajasthan", body: "Connect districts, organisers, athletes, families, venues, and the official state pathway.", meta: "Function" }
        ]
      },
      {
        layout: "cards",
        kicker: "Affiliation & Recognition",
        title: "Trusted structure matters.",
        items: [
          { title: "Affiliation & Recognition", body: "RPA is built to operate with formal standards, transparent updates, and credible representation.", meta: "Governance" },
          { title: "What We Do", body: "Run communication, support official competition, coordinate selection systems, and organise state-level information.", meta: "Operations" },
          { title: "Why Pickleball in Rajasthan", body: "The sport fits the state well: social, adaptable, and capable of fast district expansion.", meta: "Growth Case" }
        ]
      },
      {
        layout: "people",
        kicker: "Leadership / Office Bearers",
        title: "Key people behind the association.",
        items: [
          { name: "Rajveer Sharma", role: "President", city: "Jaipur", highlight: "Leads the association's state roadmap, partnerships, and public representation.", image: "assets/logo.jpeg" },
          { name: "Nandini Rathore", role: "General Secretary", city: "Udaipur", highlight: "Oversees communication, records, and operational coordination across the association.", image: "assets/logo.jpeg" },
          { name: "Kunal Mehta", role: "Tournament Director", city: "Jodhpur", highlight: "Manages tournament standards, calendars, and event delivery with host cities.", image: "assets/logo.jpeg" },
          { name: "District Convenor Network", role: "Regional support", city: "Across Rajasthan", highlight: "Connects district activity back to the state platform and helps grow local participation.", image: "assets/logo.jpeg" }
        ]
      },
      {
        layout: "cards",
        kicker: "District Network",
        title: "District growth is the foundation.",
        items: [
          { title: "Local activation", body: "District leads surface players, venues, organisers, and local demand.", meta: "Community" },
          { title: "Event support", body: "Host cities and district organisers make regular competition possible.", meta: "Operations" },
          { title: "State coordination", body: "The state body turns local momentum into a visible, connected system.", meta: "Structure" }
        ]
      },
      {
        layout: "timeline",
        kicker: "Our Journey",
        title: "A short journey so far.",
        items: [
          { year: "Foundation", body: "Define the official state presence, communication channels, and initial operating structure." },
          { year: "District build-out", body: "Grow local contact points, host city relationships, and on-ground leadership." },
          { year: "Competition maturity", body: "Standardise event quality, improve tournament visibility, and clarify athlete pathways." },
          { year: "State representation", body: "Strengthen the route from district activity to Team Rajasthan and national exposure." }
        ]
      },
      {
        layout: "cta",
        kicker: "CTA Section",
        title: "Connect with RPA.",
        body: "Reach out for official enquiries, district coordination, partnerships, or organisation details.",
        actions: [{ label: "Contact Us", href: "contact.html" }]
      }
    ]
  },
  tournaments: {
    title: "Tournaments",
    hero: {
      eyebrow: "Tournaments",
      title: "Official events across Rajasthan.",
      description:
        "Find upcoming tournaments, state events, trial dates, and the key details players usually need before registering.",
      actions: [
        { label: "View Upcoming Events", href: "#page-root" },
        { label: "Ask a Tournament Question", href: "contact.html", secondary: true }
      ],
      tags: ["Upcoming events", "Trials", "Rules", "Results"]
    },
    sections: [
      {
        layout: "cards",
        kicker: "Upcoming Tournaments",
        title: "Current events.",
        source: "tournaments"
      },
      {
        layout: "cards",
        kicker: "State Championships",
        title: "Major events in the calendar.",
        items: [
          { title: "State Championships", body: "Major state events that raise standards and visibility.", meta: "Premier" },
          { title: "District Tournaments", body: "The local calendar that keeps competition active across Rajasthan.", meta: "Regional" },
          { title: "Selection Trials", body: "Transparent trial windows that help shape Team Rajasthan.", meta: "Pathway" }
        ]
      },
      {
        layout: "list",
        kicker: "Tournament Calendar",
        title: "Key calendar points.",
        items: [
          "Monthly or rolling district activity windows",
          "State championship timing and host-city rotation",
          "Selection trial blocks before national representation windows",
          "Registration, briefing, and results deadlines"
        ]
      },
      {
        layout: "cards",
        kicker: "Tournament Categories",
        title: "Formats and logistics.",
        items: [
          { title: "Tournament Categories", body: "Singles, doubles, mixed doubles, age-based and development brackets.", meta: "Formats" },
          { title: "Venues & Host Cities", body: "Clear host information helps players plan travel and logistics earlier.", meta: "Locations" },
          { title: "Registration Information", body: "Entry windows, fees, contacts, and required details should all sit together.", meta: "Registration" }
        ]
      },
      {
        layout: "cards",
        kicker: "Rules & Eligibility",
        title: "Rules and results.",
        items: [
          { title: "Rules & Eligibility", body: "Participation criteria and event rules for every official tournament.", meta: "Guidelines" },
          { title: "Results & Past Events", body: "Archive the most recent outcomes so the page also functions as a public record.", meta: "Archive" },
          { title: "FAQs", body: "Answer common player questions before they turn into repeated WhatsApp follow-ups.", meta: "Support" }
        ]
      },
      {
        layout: "cta",
        kicker: "CTA: Register / Learn More",
        title: "Need help with an event?",
        body: "Use the official enquiry channel for registration, categories, logistics, and player questions.",
        actions: [{ label: "Contact Tournament Desk", href: "contact.html" }]
      }
    ]
  },
  membership: {
    title: "Membership",
    hero: {
      eyebrow: "Join The Community",
      title: "Membership with Rajasthan Pickleball Association",
      description:
        "Join a growing community of players, coaches, and supporters committed to growing pickleball across the state.",
      actions: [
        { label: "Become a Member", href: "auth.html#signup" },
        { label: "View Benefits", href: "#membership-benefits", secondary: true }
      ]
    },
    sections: [
      {
        layout: "cards",
        kicker: "Why Join RPA?",
        title: "Membership benefits designed for a growing state community.",
        items: [
          { title: "Event Access", body: "Priority entry to tournaments and exclusive events.", meta: "Access" },
          { title: "Community", body: "Be part of a vibrant and supportive pickleball community.", meta: "Network" },
          { title: "Development", body: "Access coaching, training camps and development programs.", meta: "Growth" },
          { title: "Recognition", body: "Official membership with pathway to state and national representation.", meta: "Pathway" }
        ]
      },
      {
        layout: "cards",
        kicker: "Membership Categories",
        title: "Choose the membership tier that fits your role.",
        items: [
          { title: "Player Membership", body: "Eligible for tournaments, training camps, membership certificate and discounts on events.", meta: "Rs1,000 / year" },
          { title: "Community Membership", body: "Be part of RPA community, access updates and invites to community programs.", meta: "Rs500 / year" },
          { title: "Institutional / Club Membership", body: "For schools, clubs and academies to organise events together and gain recognition.", meta: "Rs5,000 / year" }
        ]
      },
      {
        layout: "timeline",
        kicker: "How It Works",
        title: "A simple process from application to participation.",
        items: [
          { year: "1", body: "Apply: fill the membership form online." },
          { year: "2", body: "Get approved: the team will review your application." },
          { year: "3", body: "Start participating: enjoy benefits and become part of the community." }
        ]
      },
      {
        layout: "faq",
        kicker: "FAQs",
        title: "Membership questions people usually ask first.",
        items: [
          { question: "Who can become a member?", answer: "Players, parents, supporters, clubs, schools and community organisers can all join the RPA network." },
          { question: "Does membership help with tournaments?", answer: "Yes. Membership helps players stay connected to tournament opportunities, updates and community activity." },
          { question: "Can institutions join too?", answer: "Yes. Clubs, academies and schools can join through the institutional membership category." }
        ]
      },
      {
        layout: "cta",
        kicker: "Membership CTA",
        title: "Join Rajasthan's fastest-growing pickleball community.",
        body: "Together we grow stronger events, better pathways, and more connected districts.",
        actions: [{ label: "Become a Member", href: "auth.html#signup" }]
      }
    ],
    footerBlurb:
      "Official home for membership, tournaments, district growth, and public communication across Rajasthan."
  },
  districts: {
    title: "Districts",
    hero: {
      eyebrow: "Statewide Network",
      title: "Pickleball Across Rajasthan",
      description:
        "From cities to small towns, pickleball is growing everywhere. Explore our district network and be part of the movement.",
      actions: [
        { label: "Explore Districts", href: "#district-network" },
        { label: "Partner With Us", href: "contact.html", secondary: true }
      ],
      stats: [
        { value: "33+", label: "Active districts" },
        { value: "70+", label: "Training centres" },
        { value: "5000+", label: "Active players" },
        { value: "150+", label: "Coaches" }
      ]
    },
    sections: [
      {
        layout: "cards",
        kicker: "District Network",
        title: "Growing district by district.",
        items: [
          { title: "Jaipur", body: "High-energy community play, coaching, and regular competition windows.", meta: "Active" },
          { title: "Udaipur", body: "Lakeside city momentum with events, camps, and rising participation.", meta: "Active" },
          { title: "Jodhpur", body: "Strong district engagement and tournament-hosting potential.", meta: "Active" },
          { title: "Kota", body: "Youth participation and structured local play continuing to expand.", meta: "Active" },
          { title: "Ajmer", body: "Community-first district growth with grassroots activation.", meta: "Emerging" },
          { title: "Bikaner", body: "New host city activity helping widen the Rajasthan network.", meta: "Emerging" }
        ]
      }
    ],
    footerBlurb:
      "Official home for district growth, active communities, and state-wide pickleball expansion across Rajasthan."
  },
  "state-team": {
    title: "Team Rajasthan",
    hero: {
      eyebrow: "Team Rajasthan",
      title: "The state squad and selection pathway.",
      description:
        "Follow the team, understand the selection process, and stay updated on trials, support staff, and national representation.",
      actions: [
        { label: "View Squad", href: "#page-root" },
        { label: "Ask About Trials", href: "contact.html", secondary: true }
      ],
      tags: ["Selection process", "Eligibility", "Current squad", "Nationals"]
    },
    sections: [
      {
        layout: "story",
        kicker: "About the State Team",
        title: "The official state squad.",
        body:
          "Team Rajasthan brings together the state's leading players through a pathway built on trials, performance, and readiness."
      },
      {
        layout: "cards",
        kicker: "Selection Process",
        title: "How selection works.",
        items: [
          { title: "Selection Process", body: "Trials, performance review, rankings, and committee judgment all sit within the same pathway.", meta: "Process" },
          { title: "Eligibility Criteria", body: "State requirements, category rules, and readiness expectations should be easy to understand.", meta: "Eligibility" },
          { title: "Trials & Selection Dates", body: "Publish key dates early enough for athletes and families to plan confidently.", meta: "Dates" }
        ]
      },
      {
        layout: "people",
        kicker: "Current Squad",
        title: "Current squad.",
        source: "team"
      },
      {
        layout: "people",
        kicker: "Coaches & Support Staff",
        title: "Coaches and staff.",
        items: [
          { name: "Arjun Sethi", role: "Head Coach", city: "Jaipur", highlight: "Leads match preparation, camp planning, and competitive readiness for the squad.", image: "assets/logo.jpeg" },
          { name: "Priya Chouhan", role: "Team Manager", city: "Udaipur", highlight: "Coordinates logistics, schedules, and team communication around camps and events.", image: "assets/logo.jpeg" },
          { name: "Performance Support Unit", role: "Support Staff", city: "Rajasthan", highlight: "Handles admin support, player services, and off-court coordination for the team.", image: "assets/logo.jpeg" }
        ]
      },
      {
        layout: "cards",
        kicker: "Representation at Nationals",
        title: "Where the pathway leads.",
        items: [
          { title: "Representation at Nationals", body: "Formal state representation on bigger competitive stages.", meta: "Exposure" },
          { title: "Team Achievements", body: "Podiums, rankings, standout performances, and notable milestones.", meta: "Results" },
          { title: "Gallery", body: "Photos and visual proof from camps, trials, and major events.", meta: "Media" }
        ]
      },
      {
        layout: "faq",
        kicker: "FAQs",
        title: "Common questions.",
        items: [
          { question: "How are trials announced?", answer: "Trials should be published through the official tournament and news channels with dates, location, and category notes." },
          { question: "Do rankings matter for selection?", answer: "Yes, but rankings should sit alongside trials, recent performances, and selection criteria." },
          { question: "Can families ask for pathway details?", answer: "Yes. The state team enquiry route should be the single official contact point." }
        ]
      },
      {
        layout: "cta",
        kicker: "CTA Section",
        title: "Stay ready for trials.",
        body: "Stay ready for trial announcements, eligibility notes, and official team updates.",
        actions: [{ label: "Contact Team Office", href: "contact.html" }]
      }
    ]
  },
  media: {
    title: "Media",
    hero: {
      eyebrow: "Media & Gallery",
      title: "Photos, updates and stories from across Rajasthan.",
      description:
        "Explore event galleries, official updates, growth stories and community moments from Rajasthan pickleball.",
      actions: [
        { label: "Browse Gallery", href: "#media-gallery" },
        { label: "Contact Media Desk", href: "contact.html", secondary: true }
      ],
      tags: ["Gallery", "Announcements", "Event reports", "Growth updates"]
    },
    sections: [
      {
        layout: "gallery",
        kicker: "Image Gallery",
        title: "Photos and visual highlights.",
        source: "news"
      },
      {
        layout: "cards",
        kicker: "Latest Updates",
        title: "Announcements and reports.",
        items: [
          { title: "Tournament Reports", body: "Short reports can turn every event into a public record and a growth signal.", meta: "Events" },
          { title: "Community Stories", body: "Player, district and community stories keep the sport visible beyond the event calendar.", meta: "Community" },
          { title: "District / Growth Updates", body: "Share what is changing in new cities, districts, and local ecosystems.", meta: "Expansion" }
        ]
      },
      {
        layout: "cards",
        kicker: "Partnerships & Collaborations",
        title: "Partners and press.",
        items: [
          { title: "Partnerships & Collaborations", body: "Show the organisations helping pickleball grow responsibly in Rajasthan.", meta: "Partners" },
          { title: "Press Coverage", body: "Keep a record of media mentions and coverage moments.", meta: "Press" },
          { title: "Featured Stories", body: "Longer stories can spotlight athletes, hosts, organisers, or district growth.", meta: "Feature" }
        ]
      },
      {
        layout: "cta",
        kicker: "CTA: Follow / Get in Touch",
        title: "Need an official update?",
        body: "Use the media and contact channels for announcements, press queries, and official clarifications.",
        actions: [{ label: "Get In Touch", href: "contact.html" }]
      }
    ]
  },
  news: {
    title: "Media",
    hero: {
      eyebrow: "Media & Gallery",
      title: "Photos, updates and stories from across Rajasthan.",
      description:
        "Explore event galleries, official updates, growth stories and community moments from Rajasthan pickleball.",
      actions: [
        { label: "Browse Gallery", href: "#media-gallery" },
        { label: "Contact Media Desk", href: "contact.html", secondary: true }
      ],
      tags: ["Gallery", "Announcements", "Event reports", "Growth updates"]
    },
    sections: [
      {
        layout: "gallery",
        kicker: "Image Gallery",
        title: "Photos and visual highlights.",
        source: "news"
      }
    ]
  },
  contact: {
    title: "Contact Us",
    hero: {
      eyebrow: "Contact Us",
      title: "Get in touch with the right team.",
      description:
        "Use the right contact route for tournaments, team enquiries, media, partnerships, and general association questions.",
      actions: [
        { label: "General Enquiry", href: "mailto:connect@rajasthanpickleball.com" },
        { label: "Member Access", href: "auth.html", secondary: true }
      ],
      tags: ["General", "Tournament", "State team", "Partnerships"]
    },
    sections: [
      {
        layout: "cards",
        kicker: "General Enquiries",
        title: "Choose an enquiry type.",
        items: [
          { title: "General Enquiries", body: "Questions about the association, public information, or basic guidance.", meta: "General" },
          { title: "Tournament Enquiries", body: "Registration, scheduling, categories, venue details, and event support.", meta: "Events" },
          { title: "State Team Enquiries", body: "Trials, selection questions, and athlete pathway information.", meta: "Team" },
          { title: "Media Enquiries", body: "Press, interviews, statements, coverage, and official comment.", meta: "Media" },
          { title: "Partnership Enquiries", body: "Sponsors, venue partners, district growth support, and collaboration ideas.", meta: "Partnerships" }
        ]
      },
      {
        layout: "cards",
        kicker: "Office / Base Location",
        title: "Contact details.",
        items: [
          { title: "Office / Base Location", body: "Jaipur, Rajasthan, India", meta: "Base" },
          { title: "Social Media Links", body: "Instagram: @rajasthanpickleballassociation. Event reels, district highlights, player pathway updates, and official announcements are published through RPA channels.", meta: "Channels" },
          { title: "Contact Form", body: "Use the contact form for routed replies on tournaments, media, team matters, and partnerships.", meta: "Form" }
        ]
      },
      {
        layout: "faq",
        kicker: "FAQs",
        title: "Short answers to common questions.",
        items: [
          { question: "Where should tournament registration issues go?", answer: "Use the tournament enquiry route so the operations team can respond directly." },
          { question: "How should team-related questions be sent?", answer: "Use the state team route and mention the category, trial date, or athlete context when possible." },
          { question: "Can partners reach out directly?", answer: "Yes. Partnership enquiries should go through the dedicated partnership contact path." }
        ]
      }
    ]
  }
};

const tournaments = [
  {
    id: "tour-1",
    name: "RPA Rajasthan State Open",
    category: "State Championship",
    date: "2026-06-14",
    city: "Jaipur",
    venue: "Sawai Mansingh Indoor Stadium",
    description: "Flagship state competition featuring singles, doubles, and mixed doubles categories.",
    status: "Open",
    registrationLink: "contact.html"
  },
  {
    id: "tour-2",
    name: "Road to Nationals Trials",
    category: "Selection Trials",
    date: "2026-07-08",
    city: "Udaipur",
    venue: "City Sports Complex",
    description: "State pathway trials focused on athlete selection, ranking review, and national readiness.",
    status: "Upcoming",
    registrationLink: "contact.html"
  },
  {
    id: "tour-3",
    name: "District Circuit Weekend",
    category: "District Tournament",
    date: "2026-05-28",
    city: "Jodhpur",
    venue: "Regional Sports Arena",
    description: "A district competition weekend designed to keep the circuit active and visible.",
    status: "Open",
    registrationLink: "contact.html"
  }
];

const team = [
  {
    id: "team-1",
    name: "Aarav Singh",
    role: "Open Division",
    city: "Jaipur",
    highlight: "National qualifier and consistent state podium finisher.",
    image: "assets/logo.jpeg"
  },
  {
    id: "team-2",
    name: "Meera Rathore",
    role: "Women's Division",
    city: "Udaipur",
    highlight: "Known for high-level doubles play and strong trial performances.",
    image: "assets/logo.jpeg"
  },
  {
    id: "team-3",
    name: "Dev Malhotra",
    role: "Mixed Doubles",
    city: "Kota",
    highlight: "Emerging athlete with strong consistency across district and state formats.",
    image: "assets/logo.jpeg"
  }
];

const news = [
  {
    id: "news-1",
    title: "State Open registrations announced",
    category: "Latest Announcements",
    date: "2026-05-01",
    summary: "Registration windows and host venue details are now open for the next state event.",
    link: "tournaments.html",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&fm=jpg&q=80&w=1200"
  },
  {
    id: "news-2",
    title: "District expansion reaches new host cities",
    category: "District / Growth Updates",
    date: "2026-04-18",
    summary: "RPA is extending event readiness and district coordination across more cities in Rajasthan.",
    link: "districts.html",
    image: "https://images.unsplash.com/photo-1496372412473-e8548ffd82bc?auto=format&fit=crop&fm=jpg&q=80&w=1200"
  },
  {
    id: "news-3",
    title: "Community showcase and image gallery published",
    category: "Media Update",
    date: "2026-04-08",
    summary: "Latest event visuals, district activity photos and feature stories are now available in the media gallery.",
    link: "gallery.html",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&fm=jpg&q=80&w=1200"
  }
];

const partners = [
  {
    id: "partner-1",
    name: "Venue Support Network",
    type: "Supporter",
    description: "Indoor and multi-sport spaces helping official tournament hosting across the state.",
    url: "contact.html"
  },
  {
    id: "partner-2",
    name: "Community Growth Partners",
    type: "Partner",
    description: "Grassroots supporters helping district-level activation and event visibility.",
    url: "contact.html"
  },
  {
    id: "partner-3",
    name: "Education Outreach Circle",
    type: "Supporter",
    description: "Schools and youth networks introducing the sport to newer player groups.",
    url: "contact.html"
  }
];

const galleryEvents = [
  {
    id: "gallery-1",
    slug: "jaipur-open-gallery",
    title: "Jaipur Open Gallery",
    category: "Tournament",
    date: "2026-05-01",
    location: "Jaipur",
    summary: "Match action, podium moments, and community highlights from the Jaipur Open.",
    coverImage: "assets/Tournaments Main Image.png",
    status: "Published"
  },
  {
    id: "gallery-2",
    slug: "district-clinic-highlights",
    title: "District Clinic Highlights",
    category: "Community",
    date: "2026-04-18",
    location: "Rajasthan",
    summary: "Training, coaching, and participation moments from district development sessions.",
    coverImage: "assets/Districts Main Image.png",
    status: "Published"
  },
  {
    id: "gallery-3",
    slug: "state-event-visuals",
    title: "State Event Visuals",
    category: "Media",
    date: "2026-04-08",
    location: "Rajasthan",
    summary: "A visual record of recent official state activity and community moments.",
    coverImage: "assets/Contact Main Image.png",
    status: "Published"
  }
];

const galleryImages = [
  {
    id: "gallery-img-1",
    eventId: "gallery-1",
    url: "assets/Tournaments Main Image.png",
    alt: "Players competing at a sports event",
    caption: "Opening matches in Jaipur.",
    sortOrder: 1
  },
  {
    id: "gallery-img-2",
    eventId: "gallery-1",
    url: "assets/Index Main Image.png",
    alt: "Athletes on court",
    caption: "Doubles action from the event.",
    sortOrder: 2
  },
  {
    id: "gallery-img-3",
    eventId: "gallery-2",
    url: "assets/Districts Main Image.png",
    alt: "Community sports session",
    caption: "District training session.",
    sortOrder: 1
  },
  {
    id: "gallery-img-4",
    eventId: "gallery-3",
    url: "assets/Contact Main Image.png",
    alt: "Rajasthan event setting",
    caption: "State event atmosphere.",
    sortOrder: 1
  }
];

const users = [
  {
    id: "user-rpa-admin",
    username: "rpaadmin",
    fullName: "RPA Admin",
    role: "admin",
    email: "admin@rajasthanpickleball.org",
    status: "Active",
    passwordHash: "1e1f9cb0a9149cc0:edfd872c20585d7d32e9cf145942c4379c0b4c947d7b8a77a4360e4769eec98b"
  }
];

const defaultContent = {
  pages,
  tournaments,
  team,
  news,
  partners,
  galleryEvents,
  galleryImages,
  users
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = defaultContent;
}

if (typeof window !== "undefined") {
  window.RPA_DEFAULTS = defaultContent;
}
