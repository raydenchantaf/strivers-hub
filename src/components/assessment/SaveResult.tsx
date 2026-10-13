'use client';

import { useLang } from '@/components/LangProvider';

/**
 * One quiet line under the result, for anyone who waved the prompt away and
 * changed their mind.
 *
 * It used to be a panel: a heading, a paragraph, a solid button and an
 * "already have an account?" link - sitting directly above the result's own
 * solid button, which sat above the retake link. Four things to press within
 * one screen, two of them wearing the same gradient, and nothing to tell the
 * eye which one the page actually wanted. The offer has already been made in
 * full, in the dialog, thirty seconds earlier; repeating it at that weight
 * was arguing rather than offering.
 *
 * It also carried its own copy of the registration form. That is gone - this
 * reopens the dialog instead. One form, two doors.
 *
 * The "already have an account?" link went with it, and deserved to: it led
 * to sign-in, and signing in does not attach this result to the account. It
 * promised something that did not happen.
 */
export function SaveResult({ onOpen }: { onOpen: () => void }) {
  const { t } = useLang();
  return (
    <p className="keep">
      {t('keep.line')}{' '}
      <button className="keep-go" type="button" onClick={onOpen}>
        {t('keep.open')}
      </button>
    </p>
  );
}
