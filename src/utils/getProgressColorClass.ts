/**
 * Détermine la couleur Tailwind en fonction du taux de conformité RGAA
 * < 50% : rouge (non-conforme)
 * 50-80% : jaune (partiellement conforme)
 * >= 80% : vert (conforme)
 */
export function getProgressColorClass(value: number): string {
  if (value < 50) {
    return 'bg-red-500';
  }
  if (value < 80) {
    return 'bg-yellow-500';
  }
  return 'bg-green-500';
}
