import type { Metadata } from "next";

const affiliateOffers = [
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
  {
    title: "Freedom to Choose Something Different",
    label: "Sounds True sign-up",
    description:
      "A free entry point for exploring mindful choice, inner freedom, and practical shifts in daily life.",
    href: "https://product.soundstrue.com/freedom-to-choose-something-different/sign-up/#a_aid=5eba6eb314b89&a_bid=ab9c3446",
  },
  {
    title: "Freedom to Choose Something Different",
    label: "Sounds True program",
    description:
      "A deeper program for listeners interested in awareness-based tools for changing patterns and choosing with clarity.",
    href: "https://product.soundstrue.com/freedom-to-choose-something-different/?sq=1#a_aid=5eba6eb314b89&a_bid=49940891",
  },
];

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
          A small collection of partner offers that may be helpful for Podcast library listeners. Some links are
          affiliate links, which means Podcast library may earn a commission if you choose to purchase through them.
        </p>
      </section>

      <div className="affiliate-disclosure" role="note">
        <strong>Affiliate disclosure:</strong> These are sponsored affiliate links. We only share resources that fit
        the themes of reflection, learning, and wellbeing.
      </div>

      <section className="affiliate-grid" aria-label="Affiliate offers">
        {affiliateOffers.map((offer) => (
          <article className="affiliate-card" key={`${offer.title}-${offer.label}`}>
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
      </section>
    </div>
  );
}
