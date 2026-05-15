import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '../lib/utils';

interface MarkdownProps {
  children: string;
  className?: string;
}

export default function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("prose prose-neutral max-w-none prose-sm sm:prose-base", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Use spans for better inline rendering in cards
          p: ({ children }) => <p className="leading-relaxed whitespace-pre-wrap">{children}</p>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
