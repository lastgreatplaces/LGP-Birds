import Link from 'next/link';

export default function ExploreHub() {
  const tools = [
    {
      title: "Bird Groups",
      desc: "Ranked places for seeing bird groups like Shorebirds or Raptors.",
      link: "/explore/groups",
      icon: "🦆"
    },
    {
      title: "Specific Species",
      desc: "Find exactly where a single species is most likely to be seen.",
      link: "/explore/species",
      icon: "🔭"
    },
    {
      title: "What you're likely to see",
      desc: "Choose a place and week to see the birds you’re most likely to encounter.",
      link: "/explore/spot",
      icon: "📍"
    }
  ];

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <h1>Explore the Data</h1>
      <p style={{ marginBottom: '30px' }}>Select a tool to begin your search.</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px' 
      }}>
        {tools.map((tool) => (
          <div key={tool.title} className="card">
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{tool.icon}</div>
            <h2>{tool.title}</h2>
            <p>{tool.desc}</p>
            <Link href={tool.link} className="btn" style={{ marginTop: '15px' }}>
              {tool.link === '/explore/groups' ? 'Open Tool' : 'Coming Soon'}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}