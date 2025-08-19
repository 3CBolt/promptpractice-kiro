// Model selection component with source badges
import { ModelProvider } from '@/types';

interface ModelPickerProps {
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
  maxSelection?: number;
  availableModels?: ModelProvider[];
}

// Placeholder component - will be implemented in task 12
export default function ModelPicker({
  selectedModels,
  onSelectionChange,
  maxSelection,
  availableModels
}: ModelPickerProps) {
  return (
    <div>
      <p>ModelPicker component - to be implemented in task 12</p>
    </div>
  );
}