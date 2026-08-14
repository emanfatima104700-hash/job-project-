export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div className="brand footer-brand">
            Hire<span>Orbit</span>
          </div>
          <p>The professional marketplace for talent and opportunity.</p>
        </div>
        <div className="footer-meta">
          <p>© {new Date().getFullYear()} HireOrbit</p>
          <p>Built for modern hiring teams</p>
        </div>
      </div>
    </footer>
  );
}
