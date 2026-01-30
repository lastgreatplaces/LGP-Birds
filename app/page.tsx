import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontFamily: 'sans-serif',
      backgroundColor: '#f4f7f4',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '50px', 
        borderRadius: '15px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        <h1 style={{ color: '#2e4a31', fontSize: '3rem', marginBottom: '10px' }}>🐦</h1>
        <h1 style={{ color: '#2e4a31', margin: '0' }}>Last Great Places for Birds & Birders</h1>
        <p style={{ color: '#555', fontSize: '1.2rem', marginTop: '15px' }}>
          Discover America's top places for bird conservation and bird watching. Find high-value birding places by season, bird group, or species, based on eBird's sightings data for Important Bird Areas and other noted birding destinations.
        </p>
    
        
        <div style={{ marginTop: '40px' }}>
          <Link href="/explore/groups" style={{
            backgroundColor: '#2e4a31',
            color: 'white',
            padding: '15px 30px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            transition: 'background 0.3s'
          }}>
            ENTER SEARCH TOOL
          </Link>
        </div>
      </div>
      
      <footer style={{ marginTop: '30px', color: '#888', fontSize: '0.9rem' }}>
        &copy; {new Date().getFullYear()} Last Great Places - Birding Data Project
      </footer>
    </div>
  )
}