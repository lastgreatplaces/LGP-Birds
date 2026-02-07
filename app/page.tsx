"use client";

import Link from 'next/link';

export default function HomePage() {
  const cards = [
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
      desc: "What birds you are most likely to encounter at a selected place & date range.",
      link: "/explore/species_at_places",
      icon: "🔭"
    }
  ];

  return (
    <div className="container" style={{ padding: '0 16px 16px 16px', backgroundColor: '#f2f2f7', minHeight: '100vh' }}>
      
      {/* Header section - Zero top buffer */}
      <header style={{ paddingTop: '0px', paddingBottom: '10px', textAlign: 'left' }}>
        <h1 style={{ 
          fontSize: '2.2rem', 
          fontWeight: '800', 
          color: '#2d4a27', 
          lineHeight: '1.1',
          margin: '0 0 12px 0' 
        }}>
          Last Great Places for Birds & Birders
        </h1>
        
        {/* Badge Row */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            display: 'inline-block', 
            backgroundColor: 'rgba(45, 74, 39, 0.1)',
            border: '1.5px solid #2d4a27', 
            color: '#2d4a27', 
            padding: '4px 12px', 
            borderRadius: '8px', 
            fontSize: '14px', 
            fontWeight: '700'
          }}>
            Now covering 26 states
          </div>
        </div>

        {/* Combined Single Subhead - Reduced Buffer */}
        <p style={{ 
          fontSize: '15px', 
          fontWeight: '600', 
          color: '#1a1a1a', 
          margin: '0 0 15px 0',
          lineHeight: '1.3'
        }}>
          eBird Data • IBAs & Birding Places • Rankings • Data-driven tools
        </p>
      </header>

      {/* Tool Cards - Forced Left Alignment */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              transition: 'transform 0.1s ease',
              textAlign: 'left' // Explicit container align
            }}
          >
            {/* Action Line */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, textAlign: 'left' }}>
                <span style={{ fontSize: '24px', width: '32px', textAlign: 'center' }}>{card.icon}</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#2d4a27', textAlign: 'left' }}>
                  {card.title}
                </span>
              </div>
              <span style={{ color: '#c4c4c6', fontSize: '20px' }}>›</span>
            </div>
            
            {/* Description - Left Aligned */}
            <div style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginLeft: '44px', 
              lineHeight: '1.4',
              textAlign: 'left' 
            }}>
              {card.desc}
            </div>
          </Link>
        ))}
      </div>

      {/* Footer - Restored to Centered */}
      <footer style={{ 
        marginTop: '40px', 
        padding: '20px 0', 
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#777',
        lineHeight: '1.5',
        borderTop: '1px solid #e5e5ea'
      }}>
        <p style={{ margin: '0 0 12px 0', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
          Data derived from compiled eBird checklists. Places from Audubon IBAs and National Geographic. Additional states added weekly.
        </p>
        <p style={{ fontWeight: 'bold', letterSpacing: '1px', color: '#999', fontSize: '0.75rem' }}>
          DATA DRIVEN BIRDING • 2026
        </p>
      </footer>

      <style jsx>{`
        /* Aggressive Left-Align for Top Nav/Logo */
        :global(nav), :global(header), :global(.nav-container), :global(.logo-wrapper) {
          justify-content: flex-start !important;
          align-items: flex-start !important;
          text-align: left !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
        }

        .tool-card:active {
          transform: scale(0.97);
          background-color: #f9f9f9 !important;
        }
      `}</style>
    </div>
  );
}