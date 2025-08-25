import Link from 'next/link';
import { Lab } from '@/types';
import { tokens } from '@/styles/tokens';

interface LabsListProps {
  labs: Lab[];
}

export default function LabsList({ labs }: LabsListProps) {
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
      }}>🧪 Practice</h2>
      <p style={{
        color: tokens.colors.text.secondary,
        marginBottom: tokens.spacing[8],
        fontSize: tokens.typography.fontSize.base,
        lineHeight: tokens.typography.lineHeight.relaxed,
      }}>
        Apply what you've learned with hands-on practice in our interactive labs.
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: tokens.spacing[6],
      }}>
        {labs.map((lab) => (
          <Link 
            key={lab.id} 
            href={`/labs/${lab.id}`}
            style={{
              display: 'block',
              padding: tokens.spacing[6],
              backgroundColor: tokens.colors.background.secondary,
              border: `1px solid ${lab.isPlaceholder ? tokens.colors.warning[200] : tokens.colors.border.light}`,
              borderStyle: lab.isPlaceholder ? 'dashed' : 'solid',
              borderRadius: tokens.borderRadius.lg,
              textDecoration: 'none',
              color: 'inherit',
              transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.inOut}`,
              position: 'relative',
              overflow: 'hidden',
              opacity: lab.isPlaceholder ? 0.8 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = lab.isPlaceholder ? tokens.colors.warning[400] : tokens.colors.success[400];
              e.currentTarget.style.boxShadow = lab.isPlaceholder 
                ? `0 8px 25px ${tokens.colors.warning[200]}40`
                : `0 8px 25px ${tokens.colors.success[200]}40`;
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = lab.isPlaceholder ? tokens.colors.warning[200] : tokens.colors.border.light;
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `${tokens.focus.ring.width} ${tokens.focus.ring.style} ${tokens.focus.ring.color}`;
              e.currentTarget.style.outlineOffset = tokens.focus.ring.offset;
            }}
            onBlur={(e) => e.currentTarget.style.outline = 'none'}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: tokens.spacing[3],
              flexWrap: 'wrap',
              gap: tokens.spacing[2],
            }}>
              <h3 style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: tokens.colors.text.primary,
                margin: 0,
              }}>{lab.title}</h3>
              {lab.isPlaceholder && (
                <span style={{
                  backgroundColor: tokens.colors.warning[400],
                  color: tokens.colors.warning[900],
                  padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                  borderRadius: tokens.borderRadius.base,
                  fontSize: tokens.typography.fontSize.xs,
                  fontWeight: tokens.typography.fontWeight.medium,
                }}>Stretch – Placeholder</span>
              )}
            </div>
            <p style={{
              color: tokens.colors.text.secondary,
              marginBottom: tokens.spacing[4],
              lineHeight: tokens.typography.lineHeight.relaxed,
              fontSize: tokens.typography.fontSize.sm,
            }}>{lab.instructions}</p>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{
                backgroundColor: tokens.colors.neutral[200],
                color: tokens.colors.neutral[700],
                padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                borderRadius: tokens.borderRadius.base,
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.medium,
                textTransform: 'capitalize',
              }}>{lab.type}</span>
              <span style={{
                color: lab.isPlaceholder ? tokens.colors.warning[600] : tokens.colors.success[600],
                fontWeight: tokens.typography.fontWeight.medium,
                fontSize: tokens.typography.fontSize.sm,
              }}>
                {lab.isPlaceholder ? 'Preview →' : 'Start Lab →'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}