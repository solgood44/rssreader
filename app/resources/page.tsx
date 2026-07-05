import type { Metadata } from "next";

const affiliateSections = [
  {
    id: "mindfulness",
    title: "Mindfulness and meditation",
    intro: "Courses and practices for building awareness, steadiness, and everyday presence.",
    offers: [
      {
        title: "Mindfulness Meditation Teacher Certification Program",
        label: "Sounds True training",
        description:
          "A comprehensive mindfulness teacher training path for listeners ready to deepen their practice and share it.",
        href: "https://product.soundstrue.com/mmft/#a_aid=5eba6eb314b89&a_bid=bcf674e6",
      },
      {
        title: "Mindfulness-Based Stress Reduction",
        label: "Sounds True sign-up",
        description:
          "A practical introduction to mindfulness-based tools for stress, resilience, and nervous system support.",
        href: "https://content.soundstrue.com/mbsr-sign-up#a_aid=5eba6eb314b89&a_bid=ada5206f",
      },
      {
        title: "Body and Mind Are One",
        label: "Sounds True program",
        description:
          "Teachings and practices for reconnecting body, mind, and awareness in a grounded way.",
        href: "https://product.soundstrue.com/body-and-mind-are-one?sq=1#a_aid=5eba6eb314b89&a_bid=9018ff0d",
      },
    ],
  },
  {
    id: "healing",
    title: "Healing and emotional resilience",
    intro: "Resources for sensitive listeners, trauma recovery, and compassionate self-understanding.",
    offers: [
      {
        title: "The Empath's Survival Guide",
        label: "Sounds True course",
        description:
          "Guidance for sensitive listeners who want grounded practices for emotional balance, boundaries, and self-care.",
        href: "https://product.soundstrue.com/empath-survival-guide/?sq=1#a_aid=5eba6eb314b89&a_bid=55a49f04",
      },
      {
        title: "Trauma and the Embodied Brain",
        label: "Sounds True training",
        description:
          "A body-aware approach to understanding trauma, healing, and nervous system support with Bonnie Badenoch.",
        href: "http://product.soundstrue.com/trauma-and-the-embodied-brain-badenoch/?sq=1#a_aid=5eba6eb314b89&a_bid=c86e7f70",
      },
    ],
  },
  {
    id: "purpose",
    title: "Purpose and life direction",
    intro: "Offerings for navigating change, uncertainty, and the next meaningful step.",
    offers: [
      {
        title: "Freedom to Choose Something Different",
        label: "Sounds True program",
        description:
          "A program for listeners interested in awareness-based tools for changing patterns and choosing with clarity.",
        href: "https://product.soundstrue.com/freedom-to-choose-something-different/?sq=1#a_aid=5eba6eb314b89&a_bid=49940891",
      },
      {
        title: "Embracing the Unknown",
        label: "Sounds True program",
        description:
          "Support for meeting uncertainty with courage, curiosity, and practical inner resources.",
        href: "https://product.soundstrue.com/embracing-the-unknown/?sq=1#a_aid=5eba6eb314b89&a_bid=bbd73215",
      },
      {
        title: "Your True Calling",
        label: "Sounds True free video",
        description:
          "A free video resource for exploring purpose, calling, and the work that feels most true.",
        href: "https://product.soundstrue.com/your-true-calling/free-video/#a_aid=5eba6eb314b89&a_bid=e2fcc0c7",
      },
    ],
  },
];

const offerCount = affiliateSections.reduce((count, section) => count + section.offers.length, 0);

export const metadata: Metadata = {
  title: "Resources",
  description: "Affiliate resources and recommended offers for Podcast library listeners.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Resources | Podcast library",
    description: "Affiliate resources and recommended offers for Podcast library listeners.",
    url: "/resources",
  },
};

export default function ResourcesPage() {
  return (
    <div className="resources-page">
      <section className="hero resources-hero">
        <p className="resources-eyebrow">Recommended resources</p>
        <h1 className="hero__title">Resources for mindful listening and personal growth</h1>
        <p className="hero__lede">
          A curated collection of {offerCount} partner offers that may be helpful for Podcast library listeners. Some
          links are affiliate links, which means Podcast library may earn a commission if you choose to purchase through
          them.
        </p>
        <nav className="resources-jump" aria-label="Resource topics">
          {affiliateSections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="resources-jump__link">
              {section.title}
            </a>
          ))}
        </nav>
      </section>

      <div className="affiliate-disclosure" role="note">
        <strong>Affiliate disclosure:</strong> These are sponsored affiliate links. We only share resources that fit
        the themes of reflection, learning, and wellbeing.
      </div>

      {affiliateSections.map((section) => (
        <section
          className="affiliate-section"
          id={section.id}
          key={section.id}
          aria-labelledby={`${section.id}-heading`}
        >
          <div className="affiliate-section__head">
            <h2 className="section-title" id={`${section.id}-heading`}>
              {section.title}
            </h2>
            <p className="section-sub">{section.intro}</p>
          </div>
          <div className="affiliate-grid">
            {section.offers.map((offer) => (
              <article className="affiliate-card" key={offer.title}>
                <a
                  href={offer.href}
                  className="affiliate-card__link"
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                >
                  <span className="affiliate-card__banner" aria-hidden>
                    <span className="affiliate-card__brand">Sounds True</span>
                    <span className="affiliate-card__spark">Resource</span>
                  </span>
                  <span className="affiliate-card__body">
                    <span className="affiliate-card__label">{offer.label}</span>
                    <span className="affiliate-card__title">{offer.title}</span>
                    <span className="affiliate-card__description">{offer.description}</span>
                    <span className="affiliate-card__cta">View offer</span>
                  </span>
                </a>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
