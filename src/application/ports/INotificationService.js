/**
 * @interface INotificationService
 * Port — infrastructure implements this
 */
export class INotificationService {
  /** @param {string} message @param {'success'|'error'|'info'|'warning'} type */
  notify(message, type = 'info') { throw new Error('Not implemented: notify'); }

  /** Play a sound event */
  playSound(event) { throw new Error('Not implemented: playSound'); }
}
