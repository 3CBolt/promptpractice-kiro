import Link from 'next/link';
import { Guide } from '@/types';
import { tokens } from '@/styles/tokens';

interface GuidesListProps {
  guides: Guide[];
}

export default function GuidesList({ guides }: GuidesListProps) {
  return (
    <section style={{
      backgroundColor: tokens.colors.background.primary,
      borderRadius: tokens.borderRadius.xl,
      padding: tokens.spacing[8],
      boxShadow: tokens.boxShadow.sm,
    }}>
      <h2 style={{
        fontSize: tokens.typography.fontSize['2xl'],
        fontWeight: tokens.typography.fontWeight.semibold,
        color: tokens.colors.text.primary,
        marginBottom: tokens.spacing[2],
      }}>📚 Learn</h2>
      <p style={{
        color: tokens.colors.text.secondary,
        marginBottom: tokens.spacing[8],
        fontSize: tokens.typography.fontSize.base,
        lineHeight: tokens.typography.lineHeight.relaxed,
      }}>
        Master the fundamentals of prompt engineering with our comprehensive guides.
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: tokens.spacing[6],
      }}>
        {guides.map((guide) => (
          <Link 
            key={guide.id} 
            href={`/guides/${guide.id}`}
            style={{
              display: 'block',
              padding: tokens.spacing[6],
              backgroundColor: tokens.colors.background.secondary,
              border: `1px solid ${tokens.colors.border.light}`,
              borderRadius: tokens.borderRadius.lg,
              textDecoration: 'none',
              color: 'inherit',
              transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = tokens.colors.primary[400];
              e.currentTarget.style.boxShadow = `0 8px 25px ${tokens.colors.primary[200]}40`;
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = tokens.colors.border.light;
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
              e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
            }}
            onBlur={(e) => e.currentTarget.style.outline = 'none'}
          >
            <h3 style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.text.primary,
              marginBottom: tokens.spacing[3],
            }}>{guide.title}</h3>
            <p style={{
              color: tokens.colors.text.secondary,
              marginBottom: tokens.spacing[4],
              lineHeight: tokens.typography.lineHeight.relaxed,
              fontSize: tokens.typography.fontSize.sm,
            }}>
              Learn about {guide.title.toLowerCase()} and how to apply these concepts effectively.
            </p>
            <span style={{
              color: tokens.colors.primary[600],
              fontWeight: tokens.typography.fontWeight.medium,
              fontSize: tokens.typography.fontSize.sm,
            }}>Read Guide →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}