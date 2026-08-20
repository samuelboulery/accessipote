import type { LucideIcon } from 'lucide-react';
import type { RichTextBlock } from '../types';
import { parseMarkdownLinks } from '../utils/parseMarkdown';
import { parseInlineCode } from '../utils/parseInlineCode';

interface CriteriaNoticeProps {
  title: string;
  icon: LucideIcon;
  blocks: RichTextBlock[];
  onGlossaryClick: (slug: string) => void;
}

/**
 * Rend un bloc de texte du RGAA — cas particuliers, note technique — attaché à
 * un critère. Le référentiel y écrit ce que le critère exclut : sans lui,
 * l'auditeur tranche sans connaître le périmètre.
 */
export default function CriteriaNotice({
  title,
  icon: Icon,
  blocks,
  onGlossaryClick,
}: CriteriaNoticeProps) {
  if (blocks.length === 0) return null;

  // Liens de glossaire et code inline sont présents dans ces textes comme dans
  // les questions de test : même couple de parseurs, même rendu.
  const renderText = (text: string) =>
    parseMarkdownLinks(text, { onGlossaryClick }).map((part, index) =>
      typeof part === 'string' ? <span key={index}>{parseInlineCode(part)}</span> : part,
    );

  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-meta font-semibold uppercase tracking-[0.08em] text-ink-muted">
        <Icon size={14} aria-hidden="true" />
        {title}
      </h2>

      <div className="flex flex-col gap-2 rounded-card border-1 border-border bg-surface p-4 text-body">
        {blocks.map((block, index) =>
          typeof block === 'string' ? (
            <p key={index}>{renderText(block)}</p>
          ) : (
            <ul key={index} className="flex list-disc flex-col gap-1 pl-5">
              {block.ul.map((item, itemIndex) => (
                // Le RGAA écrit ses entrées de liste avec leur tiret : le garder
                // afficherait deux marqueurs.
                <li key={itemIndex}>{renderText(item.replace(/^[-–—]\s*/, ''))}</li>
              ))}
            </ul>
          ),
        )}
      </div>
    </section>
  );
}
