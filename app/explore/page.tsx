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
    <div className="container" style={{ paddingTop: '40px' }}>
      <h1>Explore the Data</h1>
      
      {/* --- 26 STATES BADGE --- */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: '#ecfdf5', 
        color: '#065f46',           
        padding: '6px 16px',
        borderRadius: '9999px',
        fontSize: '0.9rem',
        fontWeight: '600',
        border: '1px solid #10b981',
        marginBottom: '20px'
      }}>
        <span style={{ marginRight: '8px' }}>✓</span>
        Now covering 26 states and counting!
      </div>
      {/* ----------------------- */}

      <p style={{ marginBottom: '30px' }}>Select a tool to begin your search.</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px' 
      }}>
        {tools.map((tool) => (
          <div key={tool.title} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{tool.icon}</div>
            
            <h2 style={{ color: '#2e4a31', margin: '0 0 10px 0' }}>{tool.title}</h2>
            
            <p style={{ color: '#666', marginBottom: '20px' }}>{tool.desc}</p>
            
            <Link href={tool.link} style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#2e4a31',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                Open Tool
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}