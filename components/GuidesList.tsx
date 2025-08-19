import Link from 'next/link';
import { Guide } from '@/types';

interface GuidesListProps {
  guides: Guide[];
}

export default function GuidesList({ guides }: GuidesListProps) {
  return (
    <section className="guides-section">
      <h2 className="section-title">📚 Learn</h2>
      <p className="section-description">
        Master the fundamentals of prompt engineering with our comprehensive guides.
      </p>
      
      <div className="guides-grid">
        {guides.map((guide) => (
          <Link 
            key={guide.id} 
            href={`/guides/${guide.id}`}
            className="guide-card"
          >
            <h3 className="guide-title">{guide.title}</h3>
            <p className="guide-preview">
              Learn about {guide.title.toLowerCase()} and how to apply these concepts effectively.
            </p>
            <span className="guide-link">Read Guide →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}