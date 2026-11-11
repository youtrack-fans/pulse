import alertService from '@jetbrains/ring-ui-built/components/alert-service/alert-service';

const FORBIDDEN_STATUS = 403;
const NOT_FOUND_STATUS = 404;

function hasStatus(error: unknown): error is {status: number} {
  return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number';
}

export function isNotFound(error: unknown): boolean {
  return hasStatus(error) && error.status === NOT_FOUND_STATUS;
}

function hint(error: unknown): string {
  return hasStatus(error) && error.status === FORBIDDEN_STATUS
    ? 'You do not have permission to do this.'
    : 'Please try again.';
}

export async function guarded<T>(action: string, run: () => Promise<T>): Promise<T | undefined> {
  try {
    return await run();
  } catch (error) {
    alertService.error(`Could not ${action}. ${hint(error)}`);
    return undefined;
  }
}
