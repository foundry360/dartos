let cancelScheduledSync: (() => void) | null = null;

export function registerActiveMatchCloudSyncCancel(cancel: () => void) {
  cancelScheduledSync = cancel;
}

export function cancelActiveMatchCloudSync() {
  cancelScheduledSync?.();
}
