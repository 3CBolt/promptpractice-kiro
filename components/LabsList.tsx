import Link from 'next/link';
import { Lab } from '@/types';

interface LabsListProps {
  labs: Lab[];
}

export default function LabsList({ labs }: LabsListProps) {
  return (
    <section className="labs-section">
      <h2 className="section-title">🧪 Practice</h2>
      <p className="section-description">
        Apply what you've learned with hands-on practice in our interactive labs.
      </p>
      
      <div className="labs-grid">
        {labs.map((lab) => (
          <Link 
            key={lab.id} 
            href={`/labs/${lab.id}`}
            className={`lab-card ${lab.isPlaceholder ? 'placeholder' : ''}`}
          >
            <div className="lab-header">
              <h3 className="lab-title">{lab.title}</h3>
              {lab.isPlaceholder && (
                <span className="placeholder-badge">Stretch – Placeholder</span>
              )}
            </div>
            <p className="lab-instructions">{lab.instructions}</p>
            <div className="lab-meta">
              <span className="lab-type">{lab.type}</span>
              <span className="lab-link">
                {lab.isPlaceholder ? 'Preview →' : 'Start Lab →'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}