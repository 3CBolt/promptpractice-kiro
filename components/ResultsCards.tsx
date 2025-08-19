// Results display component for single and side-by-side layouts
import { ModelResult, Evaluation } from '@/types';

interface ResultsCardsProps {
  results: ModelResult[];
  evaluations?: Evaluation['perModelResults'];
  layout: 'single' | 'side-by-side';
}

// Placeholder component - will be implemented in task 12
export default function ResultsCards({
  results,
  evaluations,
  layout
}: ResultsCardsProps) {
  return (
    <div>
      <p>ResultsCards component - to be implemented in task 12</p>
    </div>
  );
}