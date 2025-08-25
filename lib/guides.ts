import { readFile } from 'fs/promises';
import { join } from 'path';
import { marked } from 'marked';
import { Guide } from '../types';
import { sanitizeMarkdownServer } from './serverValidation';

// Available guide slugs in order
export const GUIDE_SLUGS = [
  'fundamentals',
  'chain-of-thought', 
  'chaining',
  'system-prompts',
  'prompt-injection'
];

// Configure marked for enhanced Markdown processing
marked.setOptions({
  gfm: true,
  breaks: false,
});

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
    
    // Pre-process content for enhanced features
    const preprocessedContent = preprocessMarkdown(content);
    
    // Parse markdown to HTML
    const rawHtml = await marked(preprocessedContent);
    
    // Post-process HTML for enhanced features
    const processedHtml = postProcessHtml(rawHtml);
    
    // Sanitize HTML with our server-side sanitization
    const body = sanitizeMarkdownServer(processedHtml);
    
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
 * Pre-process Markdown content for enhanced features
 */
function preprocessMarkdown(content: string): string {
  let processed = content;

  // Convert tip callouts to custom HTML
  processed = processed.replace(
    /💡\s*\*\*Tip:\*\*\s*([^\n]+(?:\n(?![\n#💡📝⚠️])[^\n]*)*)/g,
    '<div class="tip-callout"><span class="tip-label">Tip:</span>\n\n$1\n\n</div>'
  );

  // Convert example callouts to custom HTML
  processed = processed.replace(
    /📝\s*\*\*Example[^:]*:\*\*\s*([^\n]+(?:\n(?![\n#💡📝⚠️])[^\n]*)*)/g,
    '<div class="example-callout"><span class="example-label">Example:</span>\n\n$1\n\n</div>'
  );

  // Convert warning callouts to custom HTML
  processed = processed.replace(
    /⚠️\s*\*\*Warning:\*\*\s*([^\n]+(?:\n(?![\n#💡📝⚠️])[^\n]*)*)/g,
    '<div class="warning-callout"><span class="warning-label">Warning:</span>\n\n$1\n\n</div>'
  );

  return processed;
}

/**
 * Post-process HTML for enhanced features
 */
function postProcessHtml(html: string): string {
  let processed = html;

  // Add anchor links to headings (h2-h4)
  processed = processed.replace(
    /<h([2-4])([^>]*)>([^<]+)<\/h[2-4]>/g,
    (match, level, attributes, text) => {
      const id = generateHeadingId(text);
      const existingId = attributes.match(/id="([^"]+)"/);
      const idAttr = existingId ? existingId[0] : `id="${id}"`;
      const cleanAttributes = attributes.replace(/id="[^"]*"/, '').trim();
      const finalAttributes = cleanAttributes ? ` ${cleanAttributes} ${idAttr}` : ` ${idAttr}`;
      
      return `<h${level}${finalAttributes}>${text}<a href="#${id}" class="anchor-link" aria-label="Link to ${text}">#</a></h${level}>`;
    }
  );

  // Enhance external links with accessibility attributes
  processed = processed.replace(
    /<a href="(https?:\/\/[^"]+)"([^>]*)>([^<]+)<\/a>/g,
    (match, href, attributes, text) => {
      const isExternal = !href.includes(process.env.NEXT_PUBLIC_SITE_URL || 'localhost');
      if (isExternal) {
        const hasTarget = attributes.includes('target=');
        const hasRel = attributes.includes('rel=');
        const targetAttr = hasTarget ? '' : ' target="_blank"';
        const relAttr = hasRel ? '' : ' rel="noopener noreferrer"';
        return `<a href="${href}"${attributes}${targetAttr}${relAttr}>${text}</a>`;
      }
      return match;
    }
  );

  return processed;
}

/**
 * Generate a URL-safe ID from heading text
 */
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();
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