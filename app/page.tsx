import Link from 'next/link';

export default function HomePage() {
  const cards = [
    {
      title: "Best places for bird groups",
      desc: "Pick groups like Shorebirds or Waders and a time window to get ranked places.",
      link: "/explore/places_for_groups",
      icon: "🦆"
    },
    {
      title: "Best places for a species",
      desc: "Find where a single species is most likely—without clicking hotspot by hotspot.",
      link: "/explore/places_for_species", // We will build this later
      icon: "🔭"
    },
    {
      title: "What you’re likely to see",
      desc: "Choose a place and week to see which birds you’re most likely to encounter.",
      link: "/explore/species_at_places", // done
      icon: "📍"
    }
  ];

  return (
    <div className="container">
      <header style={{ marginTop: '50px', marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.8rem' }}>Last Great Places for Birds & Birders</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '800px', margin: '20px auto', color: '#444' }}>
          Find high-value birding places by season, bird group, or species—using Important Bird Areas 
          and other proven birding destinations, summarized from eBird checklist patterns.
        </p>
      </header>

      {/* Explore Cards Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginTop: '40px'
      }}>
        {cards.map((card) => (
          <div key={card.title} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>{card.icon}</div>
            <h2 style={{ fontSize: '1.4rem' }}>{card.title}</h2>
            <p style={{ flexGrow: 1 }}>{card.desc}</p>
            <Link href={card.link} className="btn" style={{ marginTop: '20px', width: 'fit-content' }}>
              {card.link.includes('groups') ? 'Launch Tool' : 'Coming Soon'}
            </Link>
          </div>
        ))}
      </div>

      {/* Coverage Strip (Fine Print) */}
      <div style={{ 
        marginTop: '60px', 
        padding: '20px', 
        borderTop: '1px solid var(--border-light)', 
        textAlign: 'center',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        <p>
          <strong>Coverage:</strong> Currently includes 15 states in the Southeast and Mid-Atlantic; 
          other states are being added weekly. Places include Audubon Important Bird Areas plus 
          additional recommended birding destinations.
        </p>
      </div>
    </div>
  );
}