import { getLanguageIcon } from '@/lib/languageIcons';

interface LanguageFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const languages = [
  { value: 'javascript', icon: '🟨' },
  { value: 'typescript', icon: '🔷' },
  { value: 'python', icon: '🐍' },
  { value: 'java', icon: '☕' },
  { value: 'cpp', icon: '⚙️' },
  { value: 'csharp', icon: '🎯' },
  { value: 'go', icon: '🐹' },
  { value: 'rust', icon: '🦀' },
  { value: 'php', icon: '🐘' },
  { value: 'ruby', icon: '💎' },
  { value: 'swift', icon: '🍎' },
  { value: 'kotlin', icon: '🎮' },
  { value: 'other', icon: '📄' },
];

export default function LanguageFilter({ value, onChange }: LanguageFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white"
    >
      <option value="all">All Languages</option>
      {languages.map(lang => (
        <option key={lang.value} value={lang.value}>
          {lang.icon} {lang.value.charAt(0).toUpperCase() + lang.value.slice(1)}
        </option>
      ))}
    </select>
  );
}
