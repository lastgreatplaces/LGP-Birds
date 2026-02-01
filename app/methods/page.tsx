import Link from 'next/link';

export default function MethodsPage() {
  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <header style={{ marginTop: '40px', marginBottom: '40px' }}>
        <h1>Methodology & Data</h1>
        <p style={{ fontSize: '1.2rem', color: '#2e4a31', fontWeight: '500' }}>
          How we transform raw citizen science data into actionable birding information.
        </p>
      </header>

      <section style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>
        <p>
          Last Great Places for Birds & Birders summarizes seasonal birding patterns using 
          publicly available <strong>eBird checklist data</strong>, anchored to a curated set 
          of important bird areas and birding destinations.
        </p>

        <h2 style={{ marginTop: '30px' }}>Site Selection</h2>
        <p>
          Places are drawn primarily from <strong>Audubon Important Bird Areas (IBAs)</strong>, 
          supplemented by recommended birding sites from National Geographic and other sources. For more information on IBAs see <a href="https://www.audubon.org/important-bird-areas" target="_blank" rel="noopener">
          Audubon Important Bird Areas
          </a>
        </p>

        <h2 style={{ marginTop: '30px' }}>eBird Data</h2>
        <p>
          eBird histogram data (i.e. bar charts) are directly provided for most IBAs; for other places, eBird data are used from the most populated hotspot. <a href="https://ebird.org/explore" target="_blank" rel="noopener">
          eBird Explore
          </a> 
        </p>

        <h2 style={{ marginTop: '30px' }}>Sightings Normalization</h2>
        <p>
          Rather than reporting raw sighting counts, the site focuses on <strong>relative likelihood</strong>—how 
          consistently species or bird groups are reported at a place during a given time window. To reduce the influence of incidental or one-off sightings, eBird data are filtered to emphasize recurring patterns. Species are included only when they are reported across multiple weeks, supported by a minimum number of checklists, and observed alongside other species at a place. <a href="https://ebird.org/explore" target="_blank" rel="noopener">
          eBird Explore
          </a> 
        </p>

        <h2 style={{ marginTop: '30px' }}>Temporal Design</h2>
        <p>
          Seasonality is handled using a <strong>week-based model</strong> aligned with eBird’s 
          standard reporting bins. This data is presented in a month-friendly interface designed 
          for intuitive trip planning. 
        </p>
        <p style={{ fontSize: '0.95rem', color: '#666', fontStyle: 'italic' }}>
          Note: Rankings reflect observed patterns in the data and are intended to help birders compare 
          places efficiently, not to predict exact outcomes. Results are influenced by reporting density; 
          less visited places and seasons may be underrepresented.
        </p>

        <h2 style={{ marginTop: '30px' }}>The Technical Stack</h2>
        <div style={{ 
          background: '#f0f4f0', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #ddd' 
        }}>
          <ul style={{ listStyle: 'disc', marginLeft: '20px', display: 'grid', gap: '10px' }}>
            <li><strong>Data Source:</strong> eBird histogram data for IBAs and notable hotspots.</li>
            <li><strong>Database:</strong> Compiled in <strong>Postgres</strong> with custom SQL queries for data normalization.</li>
            <li><strong>GIS:</strong> <strong>QGIS</strong> served as the primary platform for spatial analysis and mapping coordination.</li>
            <li><strong>Web Infrastructure:</strong> Data exported to <strong>Supabase</strong> for high-performance public access.</li>
          </ul>
        </div>
      </section>

      <footer style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link href="/explore" className="btn">Start Exploring</Link>
          <Link href="/" style={{ alignSelf: 'center', color: '#2e4a31', textDecoration: 'none' }}>Back to Home</Link>
        </div>
      </footer>
    </div>
  );
}