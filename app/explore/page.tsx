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
      desc: "Find exactly where a single species is most likely to be seen.",
      link: "/explore/places_for_species",
      icon: "🔭"
    },
    {
      title: "What you're likely to see",
      desc: "Choose a place and week to see the birds you’re most likely to encounter.",
      link: "/explore/species_at_place",
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
  <div key={tool.title}>
    {/* ... your icon and text ... */}
    <a href={tool.link}>
      <button className="your-button-style">Open Tool</button>
    </a>
  </div>
))}
      </div>
    </div>
  );
}