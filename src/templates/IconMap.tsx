import { icons } from 'lucide-react';

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function DynamicIcon({ name, size = 18, className }: DynamicIconProps) {
  const Icon = icons[toPascalCase(name) as keyof typeof icons];
  return Icon ? <Icon size={size} className={className} /> : null;
}
