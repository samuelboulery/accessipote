import type { ScanLead } from '../types';

interface ScanLeadsProps {
  leads: ScanLead[];
}

/**
 * Les pistes d'un critère : combien d'éléments, et quelques-uns pour commencer.
 *
 * Repliées par défaut — une liste de critères manuels en porte des dizaines, et
 * l'auditeur n'ouvre que celle qu'il instruit.
 */
export default function ScanLeads({ leads }: ScanLeadsProps) {
  return (
    <ul className="space-y-1">
      {leads.map((lead, index) => (
        <li key={index}>
          <details>
            <summary className="cursor-pointer text-dense">
              {lead.count} × {lead.label}
            </summary>
            <div className="mt-2 space-y-2">
              {lead.samples.map((sample, sampleIndex) => (
                <div key={sampleIndex} className="rounded-ctrl bg-sunk p-3 text-meta">
                  <p className="break-all font-mono">{sample.url}</p>
                  {sample.selector && (
                    <p className="break-all font-mono text-ink-muted">{sample.selector}</p>
                  )}
                  {sample.snippet && (
                    <pre className="mt-1 overflow-x-auto font-mono text-ink-muted">{sample.snippet}</pre>
                  )}
                </div>
              ))}
              {lead.count > lead.samples.length && (
                <p className="text-meta text-ink-muted">
                  {lead.samples.length} montré{lead.samples.length > 1 ? 's' : ''} sur {lead.count}.
                </p>
              )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
