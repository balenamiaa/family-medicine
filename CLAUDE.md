# MedCram Code Style Guidelines

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **State**: React hooks (useState, useCallback, useMemo, useEffect)
- **Storage**: localStorage with typed helpers

## Code Organization

```
app/           # Next.js App Router pages
components/    # React components
  ui/          # Reusable UI primitives (exported from index.ts)
  questions/   # Question type-specific components
hooks/         # Custom React hooks
lib/           # Utility functions and business logic
types/         # TypeScript type definitions
```

## TypeScript Patterns

### Discriminated Unions for Question Types

```typescript
export type Question =
  | MCQSingleQuestion
  | MCQMultiQuestion
  | TrueFalseQuestion
  | EMQQuestion
  | ClozeQuestion;

// Type guards
export function isMCQSingle(q: Question): q is MCQSingleQuestion {
  return q.question_type === "mcq_single";
}
```

### Interface over Type for Object Shapes

```typescript
interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  isAnswered: boolean;
  onAnswer: (correct: boolean, answer: UserAnswer) => void;
}
```

### Generic Utility Functions with Type Parameters

```typescript
export function getStoredValue<T>(key: string, defaultValue: T): T {
  // ...
}
```

## React Component Patterns

### Functional Components with "use client"

All client components must have `"use client"` directive at the top.

### Hook Organization Order

1. Props destructuring
2. useState declarations
3. useMemo for derived state
4. useEffect for side effects
5. useCallback for event handlers
6. Render logic

### Memoization

- Use `useMemo` for expensive computations
- Use `useCallback` for functions passed to children or used in dependencies

```typescript
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

const handleClick = useCallback(() => {
  setCount(c => c + 1);
}, []);
```

### Component Exports

UI components are exported from `components/ui/index.ts`:

```typescript
export { ThemeToggle } from "./ThemeToggle";
export { ProgressRing } from "./ProgressRing";
```

## Styling Patterns

### CSS Variables for Theming

Use semantic CSS variables defined in `globals.css`:

```typescript
className="bg-[var(--bg-primary)] text-[var(--text-accent)]"
```

### Available Semantic Variables

- Backgrounds: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--bg-accent`, `--bg-accent-subtle`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-inverse`, `--text-accent`
- Borders: `--border-default`, `--border-subtle`, `--border-accent`
- States: `--success-*`, `--error-*`, `--warning-*` (bg, border, text variants)

### cn() Utility for Class Merging

```typescript
import { cn } from "@/lib/utils";

className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "primary" && "variant-classes"
)}
```

### Component Class Patterns

```typescript
// Button variants
<button className={cn(
  "btn", // base
  variant === "primary" && "btn-primary",
  variant === "ghost" && "btn-ghost"
)} />

// Card
<div className="card p-5">
```

## State Management

### localStorage Persistence

Use typed helpers from `lib/utils.ts`:

```typescript
const value = getStoredValue<T>(key, defaultValue);
setStoredValue(key, newValue);
```

### Custom Hooks for Complex State

```typescript
export function useQuiz(options: UseQuizOptions): UseQuizReturn {
  // Encapsulate quiz logic
}
```

## File Naming

- Components: PascalCase (`QuestionCard.tsx`)
- Hooks: camelCase with `use` prefix (`useQuiz.ts`)
- Utils/Libs: camelCase (`utils.ts`, `spacedRepetition.ts`)
- Types: camelCase (`questions.ts`)

## Import Organization

1. React/Next imports
2. Third-party libraries
3. Internal components (`@/components/*`)
4. Internal hooks (`@/hooks/*`)
5. Internal libs (`@/lib/*`)
6. Types (`@/types`)
7. Data/constants

## Error Handling

- Use try-catch for localStorage operations
- Provide sensible defaults
- Fail silently for non-critical features (sounds, analytics)

## Accessibility

- Use semantic HTML elements
- Include `aria-label` for icon buttons
- Support keyboard navigation
- Maintain focus management

## Performance

- Lazy load heavy components
- Memoize expensive computations
- Debounce search inputs
- Use `key` prop properly for lists
