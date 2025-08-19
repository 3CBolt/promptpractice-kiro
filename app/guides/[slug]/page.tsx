import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadGuide, getGuideNavigation, isValidGuideSlug } from '@/lib/guides';

interface GuidePageProps {
  params: {
    slug: string;
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = params;

  // Validate slug
  if (!isValidGuideSlug(slug)) {
    notFound();
  }

  // Load guide content
  const guide = await loadGuide(slug);
  
  if (!guide) {
    notFound();
  }

  // Get navigation data
  const navigation = getGuideNavigation(slug);

  return (
    <div className="guide-page">
      <div className="guide-container">
        {/* Header with back navigation */}
        <div className="guide-header">
          <Link href="/" className="back-link">
            ← Back to Home
          </Link>
          <h1 className="guide-title">{guide.title}</h1>
        </div>

        {/* Guide content */}
        <div className="guide-content">
          <div 
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: guide.body }}
          />
        </div>

        {/* Navigation between guides */}
        <div className="guide-navigation">
          <div className="nav-links">
            {navigation.previous && (
              <Link
                href={`/guides/${navigation.previous.slug}`}
                className="nav-link nav-previous"
              >
                <span className="nav-direction">← Previous</span>
                <span className="nav-title">{navigation.previous.title}</span>
              </Link>
            )}
            
            {navigation.next && (
              <Link
                href={`/guides/${navigation.next.slug}`}
                className="nav-link nav-next"
              >
                <span className="nav-direction">Next →</span>
                <span className="nav-title">{navigation.next.title}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate static params for all guide slugs
export async function generateStaticParams() {
  const { GUIDE_SLUGS } = await import('@/lib/guides');
  
  return GUIDE_SLUGS.map((slug) => ({
    slug