/**
 * The browser's side of the signed-in hint (see SIGNED_IN_HINT in session.ts).
 * Forms that sign someone in or out without leaving the page call
 * `authChanged()`, so the header updates at once rather than on the next
 * navigation.
 */

export const AUTH_CHANGED = 'sh-auth';

export function signedInHint(): boolean {
  return /(?:^|;\s*)sh_in=1(?:;|$)/.test(document.cookie);
}

export function authChanged(): void {
  window.dispatchEvent(new Event(AUTH_CHANGED));
}

/** Runs before the page paints (see the locale layout), so a member never sees Log In flash first. */
export const HINT_SCRIPT =
  "try{if(/(?:^|;\\s*)sh_in=1(?:;|$)/.test(document.cookie))document.documentElement.setAttribute('data-auth','in')}catch(e){}";
