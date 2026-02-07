import Link from 'next/link';

export default function HomePage() {
  const cards = [
    {
      title: "Bird Groups › Places",
      desc: "Best places and weeks to see specific bird groups like Shorebirds.",
      link: "/explore/places_for_groups",
      icon: "🦆"
    },
    {
      title: "Specific Species › Places",
      desc: "Best places and weeks to see specific bird species like Sandhill Cranes.",
      link: "/explore/places_for_species",
      icon: "📍"
    },
    {
      title: "Place › Likely Sightings",
      desc: "What birds you are most likely to encounter at a selected place and date range.",
      link: "/explore/species_at_places",
      icon: "🔭"
    }
  ];

  return (
    <div className="container" style={{ padding: '16px', backgroundColor: '#f2f2f7', minHeight: '100vh' }}>
      
      {/* Hero Section - Compressed for iPhone */}
      <header style={{ paddingTop: '20px', paddingBottom: '20px', textAlign: 'left' }}>
        <h1 style={{ 
          fontSize: '2.2rem', 
          fontWeight: '800', 
          color: 'var(--primary-green)', 
          lineHeight: '1.1',
          marginBottom: '10px'
        }}>
          Last Great Places for Birds & Birders
        </h1>
        
        {/* Data Badge & Labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          <div style={{ 
            display: 'inline-block', 
            border: '1.5px solid #a8c6a4', 
            color: 'var(--primary-green)', 
            padding: '4px 12px', 
            borderRadius: '8px', 
            fontSize: '14px', 
            fontWeight: '700',
            width: 'fit-content'
          }}>
            Now covering 26 states
          </div>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
            eBird Data • Audubon IBAs • Systematic Rankings
          </div>
        </div>

        <p style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '10px' }}>
          Data-driven tools to find birds and places.
        </p>
      </header>

      {/* Tool Cards - Apple Health Style */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px' 
      }}>
        {cards.map((card) => (
          <Link 
            key={card.title} 
            href={card.link} 
            className="tool-card" 
            style={{ 
              display: 'block',
              textDecoration: 'none',
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              color: 'inherit',
              transition: 'transform 0.1s ease'
            }}
          >
            {/* Action Line (Top Row) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', width: '32px', textAlign: 'center' }}>{card.icon}</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-green)' }}>
                  {card.title}
                </span>
              </div>
              <span style={{ color: '#c4c4c6', fontSize: '20px' }}>›</span>
            </div>
            
            {/* Context Line (Bottom Row) */}
            <div style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginLeft: '44px', 
              lineHeight: '1.4' 
            }}>
              {card.desc}
            </div>
          </Link>
        ))}
      </div>

      {/* Coverage Strip (Fine Print) */}
      <footer style={{ 
        marginTop: '40px', 
        padding: '20px 0', 
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#888',
        lineHeight: '1.5'
      }}>
        <p style={{ margin: 0 }}>
          Data derived from compiled eBird checklists and Audubon Important Bird Areas. 
          Additional states added weekly.
        </p>
        <p style={{ marginTop: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
          DATA DRIVEN BIRDING • 2026
        </p>
      </footer>

      {/* CSS for Tap Feedback */}
      <style jsx>{`
        .tool-card:active {
          transform: scale(0.97);
          background-color: #f9f9f9 !important;
        }
      `}</style>
    </div>
  );
}