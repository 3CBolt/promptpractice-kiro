import { GuidesList, LabsList } from '@/components';
import { getGuides, getLabs } from '@/lib/utils';

export default function Home() {
  const guides = getGuides();
  const labs = getLabs();

  return (
    <div className="home-container">
      <header className="home-header fade-in">
        <h1 className="home-title">Prompt Practice App</h1>
        <p className="home-subtitle">
          Learn prompt engineering through interactive guides and hands-on practice labs.
        </p>
        <div className="home-stats" aria-label="App statistics">
          <div className="stat-item">
            <span className="stat-number">{guides.length}</span>
            <span className="stat-label">Learning Guides</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{labs.filter(lab => !lab.isPlaceholder).length}</span>
            <span className="stat-label">Practice Labs</span>
          </div>
        </div>
      </header>

      <main className="home-content">
        <div className="fade-in" style={{ animationDelay: '0.2s' }}>
          <GuidesList guides={guides} />
        </div>
        <div className="fade-in" style={{ animationDelay: '0.4s' }}>
          <LabsList labs={labs} />
        </div>
      </main>
    </div>
  );
}
