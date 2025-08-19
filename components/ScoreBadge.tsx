// Score display component with breakdown tooltips
interface ScoreBadgeProps {
  score: number;
  breakdown: { clarity: number; completeness: number };
  notes?: string;
}

// Placeholder component - will be implemented in task 12
export default function ScoreBadge({
  score,
  breakdown,
  notes
}: ScoreBadgeProps) {
  return (
    <div>
      <p>ScoreBadge component - to be implemented in task 12</p>
    </div>
  );
}