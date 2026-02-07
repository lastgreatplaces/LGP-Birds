"use client";

import Link from 'next/link';

export default function ExploreHub() {
  const tools = [
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
    <div className="container" style={{ paddingTop: '40px', paddingLeft: '15px', paddingRight: '15px' }}>
      
      {/* --- HEADER SECTION --- */}
      <h1 style={{ marginBottom: '10px' }}>Explore the Data</h1>
      
      <div style={{
        display: 'inline-block',
        backgroundColor: '#ecfdf5', 
        color: '#065f46',           
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: '600',
        border: '1px solid #10b981',
        marginBottom: '15px',
        whiteSpace: 'nowrap'
      }}>
        Now covering 26 states
      </div>

      <p style={{ 
        marginBottom: '30px', 
        color: '#1a1a1a', 
        fontSize: '1.1rem', 
        fontWeight: '400' 
      }}>
        Data-driven tools to find birds and places.
      </p>
      
      {/* --- IPHONE-FRIENDLY CLICKABLE CARDS --- */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
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
                padding: '16px',
                border: '1px solid #eaeaea',
                borderRadius: '14px',
                backgroundColor: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer'
              }}
            >
              
              {/* Top Row: Icon, Title, and Chevron */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.5rem', width: '32px', textAlign: 'center' }}>
                    {tool.icon}
                  </span>
                  <h2 style={{ 
                    color: '#2e4a31', 
                    margin: 0, 
                    fontSize: '1.15rem', 
                    fontWeight: '700',
                    letterSpacing: '-0.3px'
                  }}>
                    {tool.title}
                  </h2>
                </div>
                <span style={{ color: '#c4c4c6', fontSize: '1.2rem', fontWeight: '300' }}>
                  ›
                </span>
              </div>
              
              {/* Bottom Row: Description */}
              <p style={{ 
                color: '#666', 
                margin: '0 0 0 44px', 
                fontSize: '0.95rem', 
                lineHeight: '1.4',
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
        marginTop: '60px', 
        padding: '20px 0', 
        borderTop: '1px solid #eee', 
        textAlign: 'center', 
        color: '#999', 
        fontSize: '0.8rem',
        letterSpacing: '0.5px'
      }}>
        © 2026 LAST GREAT PLACES FOR BIRDS & BIRDERS
      </footer>
    </div>
  );
}