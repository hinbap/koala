interface Request {
  identifier?: string;
  content: { data?: Record<string, unknown> };
}

/** Preserve unchanged timers, especially the repeating backup countdown. */
export async function reconcileNotifications<T extends Request>(
  existing: (Request & { identifier: string })[],
  desired: T[],
  cancel: (id: string) => Promise<void>,
  schedule: (request: T) => Promise<unknown>,
) {
  for (const old of existing.filter(n => n.identifier.startsWith('koala.'))) {
    const replacement = desired.find(n => n.identifier === old.identifier);
    if (!replacement || replacement.content.data?.signature !== old.content.data?.signature) await cancel(old.identifier);
  }
  for (const request of desired) {
    const old = existing.find(n => n.identifier === request.identifier);
    if (!old || old.content.data?.signature !== request.content.data?.signature) await schedule(request);
  }
}
