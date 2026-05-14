import { ArrowLeft, Building2, MapPin, Sprout } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
  onNewGame: () => void;
}

const features = [
  {
    icon: Building2,
    title: 'Grow With Intent',
    body: 'Place homes, workplaces, restaurants, and roads where they make sense instead of filling every tile.',
  },
  {
    icon: MapPin,
    title: 'Connect The Region',
    body: 'Link neighborhoods back to the regional marker to attract residents and keep the city useful.',
  },
  {
    icon: Sprout,
    title: 'Keep It Light',
    body: 'Save locally, experiment quickly, and watch the simulation tick along without heavy setup.',
  },
];

export function AboutPage({ onBack, onNewGame }: AboutPageProps) {
  return (
    <main className="about-shell">
      <section className="about-page" aria-labelledby="about-title">
        <button type="button" className="back-button" onClick={onBack}>
          <ArrowLeft size={18} />
          Menu
        </button>
        <div className="about-hero">
          <p className="eyebrow">About the game</p>
          <h1 id="about-title">Build a city that actually connects.</h1>
          <p>
            Simple City Builder is a small 3D browser strategy game about making practical civic choices:
            roads, homes, jobs, food, and the fragile budget that keeps everything moving.
          </p>
        </div>
        <div className="about-feature-grid" aria-label="Game highlights">
          {features.map(({ icon: Icon, title, body }) => (
            <article key={title}>
              <Icon size={24} />
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="about-actions">
          <button type="button" onClick={onNewGame}>Start Building</button>
        </div>
      </section>
    </main>
  );
}
