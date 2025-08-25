/**
 * Server-side validation utilities that require Node.js APIs
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Sanitizes markdown content using DOMPurify (server-side only)
 */
export function sanitizeMarkdownServer(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  });
}