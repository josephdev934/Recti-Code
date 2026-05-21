export function getLanguageIcon(language: string): string {
  const icons: Record<string, string> = {
    javascript: '🟨',
    typescript: '🔷',
    python: '🐍',
    java: '☕',
    cpp: '⚙️',
    csharp: '🎯',
    go: '🐹',
    rust: '🦀',
    php: '🐘',
    ruby: '💎',
    swift: '🍎',
    kotlin: '🎮',
    html: '🌐',
    css: '🎨',
    sql: '🗄️',
    shell: '💻',
    bash: '🖥️',
    json: '📋',
    xml: '📄',
    markdown: '📝',
    yaml: '📊',
    dockerfile: '🐳',
    other: '📄',
  };

  return icons[language.toLowerCase()] || icons.other;
}

export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    javascript: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    typescript: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    python: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    java: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cpp: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    csharp: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    go: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    rust: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    php: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    ruby: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    swift: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    kotlin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    html: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    css: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    sql: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    shell: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    bash: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    json: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    xml: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    markdown: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    yaml: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    dockerfile: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return colors[language.toLowerCase()] || colors.other;
}
