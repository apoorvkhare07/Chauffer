export function isExpiredGuestSearch(current) {
  return current?.state === 'ready'
    && !current.text
    && /guest preview has expired/i.test(current.reply ?? '');
}
