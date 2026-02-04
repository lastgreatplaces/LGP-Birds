import Link from 'next/link';

export default function ExploreHub() {
  const tools = [
    {
      title: "Bird Groups",
      desc: "Ranked places for seeing bird groups like Shorebirds or Raptors.",
      link: "/explore/places_for_groups",
      icon: "🦆"
    },
    {
      title: "Specific Species",
      desc: "Find where & when a single species is most likely to be seen.",
      link: "/explore/places_for_species",
      icon: "📍"
    },
    {
      title: "What you're likely to see",
      desc: "Choose a place and week to see what birds you’re most likely to encounter.",
      link: "/explore/species_at_places",
      icon: "🔭"
    }
  ];

  return (
    <div className="container" style={{ paddingTop: '40px', paddingLeft: '15px', paddingRight: '15px' }}>
      <h1 style={{ marginBottom: '10px' }}>Explore the Data</h1>
      
      {/* --- COMPACT 1-LINE COVERAGE BADGE --- */}
      <div style={{
        display: 'inline-block',
        backgroundColor: '#ecfdf5', 
        color: '#065f46',           
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: '600',
        border: '1px solid #10b981',
        marginBottom: '20px',
        whiteSpace: 'nowrap'
      }}>
        Now covering 26 states
      </div>
      {/* -------------------------------------- */}

      <p style={{ marginBottom: '30px', color: '#444' }}>Select a tool to begin your search.</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px' 
      }}>
        {tools.map((tool) => (
          <div key={tool.title} className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start',
            padding: '20px',
            border: '1px solid #eaeaea',
            borderRadius: '12px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{tool.icon}</div>
            
            <h2 style={{ color: '#2e4a31', margin: '0 0 10px 0', fontSize: '1.5rem' }}>{tool.title}</h2>
            
            <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>{tool.desc}</p>
            
            <Link href={tool.link} style={{ width: '100%', textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#2e4a31',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%' // Makes button easier to tap on mobile
              }}>
                Open Tool
              </button>
            </Link>
          </div>
        ))}
      </div>

      <footer style={{ marginTop: '50px', padding: '20px 0', borderTop: '1px solid #eee', textAlign: 'center', color: '#999', fontSize: '0.8rem' }}>
        © 2026 Last Great Places for Birds & Birders
      </footer>
    </div>
  );
}