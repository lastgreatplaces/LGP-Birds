import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav" style={{ 
          borderBottom: '1px solid var(--border-light)',
          background: 'rgba(255,255,255,0.95)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="container" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}>
            <Link href="/" style={{ 
              fontWeight: '700', 
              color: 'var(--lgp-green)', 
              textDecoration: 'none',
              fontSize: '1.1rem'
            }}>
              🦅 LGP Birds
            </Link>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <Link href="/explore" className="nav-link" style={{ textDecoration: 'none', color: '#444', fontSize: '0.9rem' }}>Explore</Link>
               <Link href="/places" className="nav-link" style={{ textDecoration: 'none', color: '#444', fontSize: '0.9rem' }}>Places</Link>
              <Link href="/about" className="nav-link" style={{ textDecoration: 'none', color: '#444', fontSize: '0.9rem' }}>About</Link>
              <Link href="/methods" className="nav-link" style={{ textDecoration: 'none', color: '#444', fontSize: '0.9rem' }}>Methods</Link>
            </div>
          </div>
        </nav>
        
        <main>{children}</main>
        
        <footer className="container" style={{ 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '1px solid var(--border-light)',
          fontSize: '0.8rem',
          color: '#888',
          textAlign: 'center',
          paddingBottom: '40px'
        }}>
          © {new Date().getFullYear()} Last Great Places for Birds & Birders
        </footer>
      </body>
    </html>
  );
}