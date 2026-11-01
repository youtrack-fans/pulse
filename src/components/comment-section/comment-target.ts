export function shouldApplyTarget(target: string, appliedTarget: string | null, targetExists: boolean): boolean {
  return target !== appliedTarget && targetExists;
}
