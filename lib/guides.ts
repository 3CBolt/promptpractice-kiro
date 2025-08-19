import { readFile } from 'fs/promises';
import { join } from 'path';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { Guide } from '@/types';

// Available guide slugs in order
export const GUIDE_SLUGS = [
  'fundamentals',
  'chain-of-thought', 
  'chaining',
  'system-prompts',
  'prompt-injection'
];

/**
 * Load a single guide from filesystem
 */
export async function loadGuide(slug: string): Promise<Guide | null> {
  try {
    const filePath = join(process.cwd(), 'docs', 'guides', `${slug}.md`);
    const content = await readFile(filePath, 'utf-8');
    
    // Extract title from first heading or use slug as fallback
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : formatSlugToTitle(slug);
    
    // Parse markdown to HTML
    const rawHtml = await marked(content);
    
    // Sanitize HTML with DOMPurify
    const body = DOMPurify.sanitize(rawHtml);
    
    return {
      id: slug,
      title,
      body,
    };
  } catch (error) {
    console.error(`Failed to load guide: ${slug}`, error);
    return null;
  }
}

/**
 * Load all available guides
 */
export async function loadAllGuides(): Promise<Guide[]> {
  const guides: Guide[] = [];
  
  for (const slug of GUIDE_SLUGS) {
    const guide = await loadGuide(slug);
    if (guide) {
      guides.push(guide);
    }
  }
  
  return guides;
}

/**
 * Get navigation data for a specific guide
 */
export function getGuideNavigation(currentSlug: string) {
  const currentIndex = GUIDE_SLUGS.indexOf(currentSlug);
  
  return {
    previous: currentIndex > 0 ? {
      slug: GUIDE_SLUGS[currentIndex - 1],
      title: formatSlugToTitle(GUIDE_SLUGS[currentIndex - 1])
    } : null,
    next: currentIndex < GUIDE_SLUGS.length - 1 ? {
      slug: GUIDE_SLUGS[currentIndex + 1], 
      title: formatSlugToTitle(GUIDE_SLUGS[currentIndex + 1])
    } : null
  };
}

/**
 * Format a slug into a readable title
 */
function formatSlugToTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Validate if a slug is a valid guide
 */
export function isValidGuideSlug(slug: string): boolean {
  return GUIDE_SLUGS.includes(slug);
}