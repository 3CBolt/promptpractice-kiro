import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadGuide, getGuideNavigation, isValidGuideSlug } from '@/lib/guides';
import '../../../styles/guide-layout.css';

interface GuidePageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

export default async function GuidePage({ params, searchParams }: GuidePageProps) {
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

  // Process guide content with enhanced Markdown features
  const processedContent = processGuideContent(guide.body, slug);
  
  // Generate table of contents from headings
  const tableOfContents = generateTableOfContents(processedContent);

  return (
    <div className="guide-page">
      <div className="guide-container">
        {/* Skip link for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white p-2 rounded border">
          Skip to main content
        </a>

        {/* Header with back navigation */}
        <header className="guide-header">
          <Link href="/" className="back-link">
            ← Back to Home
          </Link>
          <h1 className="guide-title">{guide.title}</h1>
        </header>

        {/* Table of Contents */}
        {tableOfContents.length > 0 && (
          <nav className="guide-toc" aria-label="Table of contents">
            <h3>Contents</h3>
            <ul>
              {tableOfContents.map((item, index) => (
                <li key={index}>
                  <a href={`#${item.id}`} style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}>
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Guide content */}
        <main id="main-content" className="guide-content">
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </main>

        {/* Practice CTAs */}
        <section className="practice-ctas">
          <h3>Ready to Practice?</h3>
          <p>
            Apply what you've learned with hands-on practice. Your lab will be pre-filled with examples from this guide.
          </p>
          <div className="cta-grid">
            <Link
              href={`/labs/practice-basics?from=guide&guide=${slug}&concept=${getGuideConcept(slug)}&title=${encodeURIComponent(guide.title)}`}
              className="cta-card"
            >
              <div className="cta-content">
                <span className="cta-icon">🧪</span>
                <div className="cta-text">
                  <h4>Practice Lab</h4>
                  <p>Test your prompts with real models</p>
                  <p className="cta-highlight">
                    ✨ Includes starter prompts from this guide
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href={`/labs/compare-basics?from=guide&guide=${slug}&concept=${getGuideConcept(slug)}&title=${encodeURIComponent(guide.title)}`}
              className="cta-card"
            >
              <div className="cta-content">
                <span className="cta-icon">⚖️</span>
                <div className="cta-text">
                  <h4>Compare Lab</h4>
                  <p>Compare responses across models</p>
                  <p className="cta-highlight">
                    ⚡ See how different models handle the same concept
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Navigation between guides */}
        <nav className="guide-navigation" aria-label="Guide navigation">
          <div className="nav-links">
            {navigation.previous ? (
              <Link
                href={`/guides/${navigation.previous.slug}`}
                className="nav-link nav-previous"
              >
                <span className="nav-direction">← Previous</span>
                <span className="nav-title">{navigation.previous.title}</span>
              </Link>
            ) : (
              <div></div>
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
        </nav>
      </div>
    </div>
  );
}

/**
 * Process guide content for contextual lab links
 */
function processGuideContent(content: string, slug: string): string {
  // Replace practice lab links with contextual ones
  let processed = content.replace(
    /\[Practice Lab\]\(\/labs\/practice-basics\)/g,
    `[Practice Lab](/labs/practice-basics?from=guide&guide=${slug}&concept=${getGuideConcept(slug)}&cta=inline)`
  );
  
  // Replace compare lab links with contextual ones
  processed = processed.replace(
    /\[Compare Lab\]\(\/labs\/compare-basics\)/g,
    `[Compare Lab](/labs/compare-basics?from=guide&guide=${slug}&concept=${getGuideConcept(slug)}&cta=inline)`
  );
  
  // Enhance "Try this in a Lab" sections with specific prompts
  processed = processed.replace(
    /Ready to practice\? Head to our \[Practice Lab\]\([^)]+\) and try these starter prompts:/g,
    `Ready to practice? Head to our [Practice Lab](/labs/practice-basics?from=guide&guide=${slug}&concept=${getGuideConcept(slug)}&cta=tryit) where these examples will be available as starter prompts:`
  );

  return processed;
}

/**
 * Generate table of contents from processed content
 */
function generateTableOfContents(content: string): Array<{ id: string; text: string; level: number }> {
  const headingRegex = /<h([2-4])[^>]*id="([^"]+)"[^>]*>([^<]+)<a[^>]*>[^<]*<\/a><\/h[2-4]>/g;
  const toc: Array<{ id: string; text: string; level: number }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1]);
    const id = match[2];
    const text = match[3].trim();
    
    // Only include h2, h3, and h4 in TOC
    if (level >= 2 && level <= 4) {
      toc.push({ id, text, level });
    }
  }

  return toc;
}

/**
 * Get the main concept for a guide (used for context passing)
 */
function getGuideConcept(slug: string): string {
  const concepts: Record<string, string> = {
    'fundamentals': 'clarity-and-specificity',
    'chain-of-thought': 'step-by-step-reasoning',
    'chaining': 'multi-step-prompts',
    'system-prompts': 'role-setting',
    'prompt-injection': 'security-awareness'
  };
  
  return concepts[slug] || 'general';
}

/**
 * Get example prompts for a specific guide
 */
function getGuideExamplePrompts(slug: string): string[] {
  const examples: Record<string, string[]> = {
    'fundamentals': [
      'Explain the water cycle in simple terms for a 10-year-old, using an analogy they can relate to.',
      'Give me a simple recipe for chocolate chip cookies that takes less than 30 minutes and uses ingredients I can find at any grocery store.',
      'I\'m planning a 3-day weekend trip to a city I\'ve never visited. Create a balanced itinerary that includes cultural attractions, local food experiences, and outdoor activities. Assume a moderate budget and that I enjoy both history and nature.'
    ],
    'chain-of-thought': [
      'What\'s 15% of 240? Let\'s think step by step.',
      'I want to start a small online business selling handmade jewelry. Walk me through the key steps I need to take, explaining the reasoning behind each step.',
      'My houseplant\'s leaves are turning yellow and dropping. Help me diagnose the problem by thinking through the possible causes step by step, starting with the most common issues.'
    ],
    'system-prompts': [
      'You are a patient and encouraging elementary school teacher. Explain why leaves change color in the fall, using simple language and examples that kids would understand.',
      'You are a cybersecurity consultant advising a small business owner. Explain the top 3 security risks they should be aware of and provide practical, budget-friendly solutions for each.',
      'You are an experienced creative director at a top advertising agency. A client wants to launch a sustainable fashion brand targeting Gen Z. Develop a creative brief that includes brand positioning, key messages, and campaign concepts.'
    ]
  };
  
  return examples[slug] || [];
}

// Generate static params for all guide slugs
export async function generateStaticParams() {
  const { GUIDE_SLUGS } = await import('@/lib/guides');

  return GUIDE_SLUGS.map((slug) => ({
    slug,
  }));
}