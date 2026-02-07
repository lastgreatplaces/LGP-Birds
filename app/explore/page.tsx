"use client";

import Link from 'next/link';

export default function ExploreHub() {
  const tools = [
    {
      title: "Bird Groups › Places",
      desc: "Best places & weeks to see specific bird groups like Shorebirds.",
      link: "/explore/places_for_groups",
      icon: "🦆"
    },
    {
      title: "Specific Species › Places",
      desc: "Best places & weeks to see specific bird species like Sandhill Cranes.",
      link: "/explore/places_for_species",
      icon: "📍"
    },
    {
      title: "Place › Likely Sightings",
      desc: "What birds you're most likely to encounter at a selected place & date range.",
      link: "/explore/species_at_places",
      icon: "🔭"
    }
  ];

  return (
    <div className="container" style={{ paddingTop: '10px', paddingLeft: '15px', paddingRight: '15px' }}>
      
      {/* --- HEADER SECTION --- */}
      <h1 style={{ marginBottom: '5px', fontSize: '1.8rem' }}>Explore the Data</h1>
      
      <div style={{
        display: 'inline-block',
        backgroundColor: '#ecfdf5', 
        color: '#065f46',           
        padding: '2px 10px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '600',
        border: '1px solid #10b981',
        marginBottom: '10px',
        whiteSpace: 'nowrap'
      }}>
        Now covering 26 states
      </div>

      <p style={{ 
        marginBottom: '20px', 
        color: '#1a1a1a', 
        fontSize: '1rem', 
        fontWeight: '400' 
      }}>
        Tools to find birds & places
      </p>
      
      {/* --- IPHONE-FRIENDLY CLICKABLE CARDS --- */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        maxWidth: '600px'
      }}>
        {tools.map((tool) => (
          <Link 
            key={tool.title} 
            href={tool.link} 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div 
              className="tool-card"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                padding: '12px',
                border: '1px solid #eaeaea',
                borderRadius: '12px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                cursor: 'pointer'
              }}
            >
              
              {/* Top Row: Icon, Title (Slightly smaller), and Chevron */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '2px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.3rem', width: '24px', textAlign: 'center' }}>
                    {tool.icon}
                  </span>
                  <h2 style={{ 
                    color: '#2e4a31', 
                    margin: 0, 
                    fontSize: '1.05rem', 
                    fontWeight: '700',
                    letterSpacing: '-0.2px',
                    whiteSpace: 'nowrap'
                  }}>
                    {tool.title}
                  </h2>
                </div>
                <span style={{ color: '#c4c4c6', fontSize: '1.1rem', fontWeight: '300' }}>
                  ›
                </span>
              </div>
              
              {/* Bottom Row: Description (Aligned left with icon) */}
              <p style={{ 
                color: '#666', 
                margin: '0', 
                fontSize: '0.9rem', 
                lineHeight: '1.3',
                fontWeight: '400'
              }}>
                {tool.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* --- FOOTER --- */}
      <footer style={{ 
        marginTop: '30px', 
        padding: '15px 0', 
        borderTop: '1px solid #eee', 
        textAlign: 'center', 
        color: '#999', 
        fontSize: '0.75rem'
      }}>
        © 2026 LAST GREAT PLACES FOR BIRDS & BIRDERS
      </footer>
    </div>
  );
}