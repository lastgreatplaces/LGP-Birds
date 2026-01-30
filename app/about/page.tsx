import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Hero Section */}
      <header style={{ marginTop: '40px', marginBottom: '40px' }}>
        <h1>About the Project</h1>
        <p style={{ fontSize: '1.2rem', color: '#2e4a31', fontWeight: '500' }}>
          Bridging the gap between conservation data and the birding experience.
        </p>
      </header>

      <section style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>
        <p>
          Birdwatching is one of America’s fastest-growing outdoor pastimes, supported by incredible 
          field guides and citizen science.
        </p>

        <h2 style={{ marginTop: '30px' }}>The Foundation</h2>
        <p>
          Organizations like <strong>Audubon</strong> have identified over 2,500 Important Bird Areas (IBAs) 
          based on international conservation criteria. Meanwhile, <strong>eBird</strong> provides a 
          vast cornucopia of data through its "Hotspot" maps and bar charts.
        </p>
        
        <blockquote style={{ 
          borderLeft: '4px solid var(--lgp-green)', 
          paddingLeft: '20px', 
          margin: '30px 0', 
          fontStyle: 'italic',
          color: '#555' 
        }}>
          "Yet no guide exists for the best places to find birds — searchable by bird groups, species, 
          states, and time of year."
        </blockquote>

        <h2 style={{ marginTop: '30px' }}>Our Mission</h2>
        <p>
          <strong>Last Great Places for Birds & Birders</strong> has taken this rich data, compiled it 
          into an easily searchable database, and applied it to the IBAs and other noted birding areas. 
          It serves as a companion to <em>America’s Last Great Places</em> for conserving natural diversity. 
          Studies show that protecting these habitats contributes substantially to conservation of other species and ecosystems.
        </p>

        <h2 style={{ marginTop: '30px' }}>The Developer</h2>
        <p>
          The platform was developed by <strong>Greg Low</strong> at Applied Conservation. Greg is a 
          long-time conservation practitioner and a self-described "enthusiastic but incompetent 
          birdwatcher." Now semi-retired, he initially developed this tool to help find great birding 
          spots while migrating seasonally across the U.S. in his campervan.
        </p>
      </section>

      <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <Link href="/explore" className="btn">
          Explore the Data
        </Link>
      </footer>
    </div>
  );
}