/* Parent Area.

   Behind a PIN, kept plain and text-heavy on purpose — this is the one
   screen that is allowed to look like a tool rather than a toy. */

import { el, mount, button, field, segmented, stat, modal, confirmDialog, clear } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { navigate } from '../ui/router.js';
import * as words from '../core/words.js';
import * as speech from '../core/speech.js';
import * as storage from '../core/storage.js';
import { getState, update, replaceState, resetAll, settings, flushNow } from '../core/state.js';
import { on as onBus } from '../core/bus.js';
import { APP_VERSION, BUILD_DATE } from '../core/version.js';
import { checkNow, updateWaiting } from '../core/updates.js';
import { setQueue } from './spell.js';

/* The parent area re-locks every time it is left. A flag that survived until
   the page reloaded meant one PIN entry unlocked it for the rest of the day,
   which is no lock at all on a tablet that never gets closed. */
let unlocked = false;

export default function parentScreen(container) {
  if (!unlocked) return pinGate(container, () => parentScreen(container));

  /* Leaving the parent area at all — the back arrow, a button, or the
     browser's own gesture — drops the lock again. This hangs off the router
     rather than this screen's teardown because the teardown returned from
     here is discarded on the path through the PIN gate. The listener takes
     itself off as soon as it fires, so entering and leaving repeatedly does
     not pile them up. */
  let stopWatching;
  stopWatching = onBus('route:before', () => {
    unlocked = false;
    stopWatching?.();
  });

  let view = { name: 'hub' };

  function show(next) { view = next; render(); }

  function render() {
    const views = {
      hub:       hubView,
      lists:     listsView,
      list:      listDetailView,
      voice:     voiceView,
      spelling:  spellingView,
      report:    reportView,
      data:      dataView,
      profile:   profileView,
    };
    mount(container, (views[view.name] || hubView)());
  }

  /* ---------- Hub ---------- */

  function hubView() {
    const s = words.summary();
    const missingSentences = words.homophonesMissingSentences();

    const item = (emoji, title, subtitle, onClick) =>
      el('button', { class: 'word-row', type: 'button', style: { width: '100%', textAlign: 'left', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }, onClick },
        el('div', { style: { fontSize: '1.6rem' }, text: emoji }),
        el('div', { class: 'grow' },
          el('div', { class: 'w-text', text: title }),
          el('div', { class: 'w-meta', text: subtitle })
        ),
        el('div', { class: 'muted', text: '›' })
      );

    const body = el('div', { class: 'stack' });

    if (!getState().child.setupComplete) {
      body.append(el('div', { class: 'card', style: { background: '#e7f3ea' } },
        el('h3', { text: '\u{1F44B} Setting up before she starts' }),
        el('p', { class: 'tiny', text:
          'Add this week\u2019s spelling list and pick the voice now. When you are done, go back to the welcome screen and she can enter her name and choose her axolotl herself.' })
      ));
    }

    body.append(
      el('div', { class: 'stat-grid' },
        stat(s.total, 'Words'),
        stat(s.active, 'Active'),
        stat(s.mastered, 'Mastered'),
        stat(getState().lists.filter(l => !l.archived).length, 'Lists')
      )
    );

    if (missingSentences.length) {
      body.append(el('div', { class: 'card', style: { background: '#fdeadb' } },
        el('h3', { text: '⚠️ Homophones need sentences' }),
        el('p', { class: 'tiny', text:
          `${missingSentences.length} word${missingSentences.length === 1 ? '' : 's'} (${missingSentences.slice(0, 4).map(w => w.text).join(', ')}${missingSentences.length > 4 ? '…' : ''}) sound identical to another word. Without an example sentence they are impossible to answer correctly from audio alone.` }),
        button('Add sentences', { cls: 'btn btn-quiet', style: { marginTop: '10px' },
          onClick: () => show({ name: 'lists' }) })
      ));
    }

    body.append(el('div', { class: 'stack-sm' },
      item('\u{1F4DA}', 'Spelling lists', 'Add, edit and archive weekly lists', () => show({ name: 'lists' })),
      item('\u{1F50A}', 'Voice & speech', 'Choose the voice and how fast it talks', () => show({ name: 'voice' })),
      item('⚙️', 'Spelling rules', 'Mastery, practice size, keyboard', () => show({ name: 'spelling' })),
      item('\u{1F4C8}', 'Progress report', 'What she knows and what she is missing', () => show({ name: 'report' })),
      item('\u{1F9D2}', 'Child & pet', 'Name and companion', () => show({ name: 'profile' })),
      item('\u{1F4BE}', 'Backup & reset', 'Save a copy, restore, or start over', () => show({ name: 'data' }))
    ));

    const ready = getState().child.setupComplete;
    /* Which build is actually on this tablet. Without this there is no way
       to tell whether a change has arrived yet, short of hunting for it. */
    const versionLine = el('div', { class: 'center tiny muted', style: { marginTop: '18px' },
      text: `Spelling Adventure v${APP_VERSION} \u00B7 ${BUILD_DATE}` });

    const updateBtn = button('Check for updates', { cls: 'btn btn-quiet btn-block',
      emoji: '\u21BB', onClick: async () => {
        updateBtn.disabled = true;
        updateBtn.lastChild.textContent = 'Checking\u2026';
        const outcome = await checkNow();
        updateBtn.disabled = false;
        updateBtn.lastChild.textContent = 'Check for updates';
        if (outcome === 'found') {
          toast('New version found \u2014 it will load when you go back to the game.', { ms: 5000 });
        } else if (outcome === 'current') {
          toast('Already up to date');
        } else {
          toast('Could not check right now');
        }
      } });

    body.append(el('div', { class: 'card' },
      el('h3', { text: 'App version' }),
      versionLine,
      el('div', { style: { height: '12px' } }),
      updateBtn,
      updateWaiting()
        ? el('p', { class: 'tiny center', style: { marginTop: '10px', fontWeight: '800' },
            text: '\u2728 A new version is ready and will load when you leave this screen.' })
        : el('p', { class: 'muted tiny center', style: { marginTop: '10px' },
            text: 'The app updates itself on its own. This is only for when you are impatient.' })
    ));

    body.append(button(ready ? 'Back to the game' : 'Back to the welcome screen', {
      cls: 'btn btn-primary btn-block', emoji: ready ? '\u{1F3E0}' : '\u{1F44B}',
      onClick: () => navigate(ready ? '/' : '/setup') }));

    return body;
  }

  /* ---------- Lists ---------- */

  function listsView() {
    const all = getState().lists;
    const live = all.filter(l => !l.archived);
    const archived = all.filter(l => l.archived);

    const listRow = list => {
      const ws = words.wordsInList(list.id);
      const mastered = ws.filter(words.isMastered).length;
      return el('button', {
        class: 'word-row', type: 'button',
        style: { width: '100%', textAlign: 'left', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' },
        onClick: () => show({ name: 'list', listId: list.id }),
      },
        el('div', { class: 'grow' },
          el('div', { class: 'w-text', text: list.name }),
          el('div', { class: 'w-meta', text: `${ws.length} words · ${mastered} mastered${list.archived ? ' · archived' : ''}` })
        ),
        el('div', { class: 'muted', text: '›' })
      );
    };

    return el('div', { class: 'stack' },
      backButton(() => show({ name: 'hub' })),
      button('New list', { cls: 'btn btn-primary btn-block', emoji: '➕', onClick: newListDialog }),
      live.length ? el('div', { class: 'stack-sm' }, live.map(listRow))
        : el('div', { class: 'card center' }, el('p', { class: 'muted', text: 'No lists yet. Create one and paste this week’s words into it.' })),
      archived.length ? el('div', { class: 'section-title', text: 'Archived' }) : null,
      archived.length ? el('div', { class: 'stack-sm' }, archived.map(listRow)) : null
    );
  }

  function newListDialog() {
    const nameInput = el('input', { type: 'text', placeholder: 'e.g. Week 1 — Long A Words', autocapitalize: 'words' });
    const pasteInput = el('textarea', { placeholder: 'Paste the whole list here, one word per line.\n\ntrain\npaint\nafraid\nexplain' });

    const close = modal('New spelling list', [
      field('List name', nameInput),
      el('div', { style: { height: '12px' } }),
      field('Words', pasteInput,
        'Numbering like "1." or "1)" is stripped automatically. For a definition and sentence use:  word | definition | sentence'),
      el('div', { class: 'row', style: { marginTop: '14px' } },
        button('Cancel', { cls: 'btn btn-quiet grow', onClick: () => close() }),
        button('Create', { cls: 'btn btn-primary grow', onClick: () => {
          const rows = words.parseBulk(pasteInput.value);
          const list = words.createList(nameInput.value || `List ${getState().lists.length + 1}`);
          if (rows.length) words.addBulkToList(list.id, rows);
          close();
          toast(`Added ${rows.length} word${rows.length === 1 ? '' : 's'}`);
          show({ name: 'list', listId: list.id });
        } })
      ),
    ]);
    setTimeout(() => nameInput.focus(), 60);
  }

  function listDetailView() {
    const list = words.listById(view.listId);
    if (!list) { show({ name: 'lists' }); return el('div'); }
    const ws = words.wordsInList(list.id);

    const wordRow = w => {
      const status = words.statusOf(w);
      const needsSentence = words.isHomophone(w) && !w.sentence.trim();
      return el('button', {
        class: 'word-row', type: 'button',
        style: { width: '100%', textAlign: 'left', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer',
                 boxShadow: needsSentence ? 'inset 0 0 0 3px #ef9345' : undefined },
        onClick: () => editWordDialog(w),
      },
        el('div', { class: 'grow' },
          el('div', { class: 'w-text', text: w.text }),
          el('div', { class: 'w-meta', text:
            `${words.credits(w)}/${words.threshold()} credits · ${w.correctCount}✓ ${w.incorrectCount}✗${needsSentence ? ' · needs a sentence' : ''}` })
        ),
        el('div', { class: `badge badge-${status.key}`, text: status.label })
      );
    };

    return el('div', { class: 'stack' },
      backButton(() => show({ name: 'lists' })),
      el('div', { class: 'card' },
        el('h2', { text: list.name }),
        el('p', { class: 'muted tiny', text: `${ws.length} words · ${ws.filter(words.isMastered).length} mastered` }),
        el('div', { class: 'row' },
          button('Add words', { cls: 'btn btn-primary grow', emoji: '➕', onClick: () => addWordsDialog(list) }),
          button('Rename', { cls: 'btn btn-quiet', onClick: () => renameListDialog(list) })
        ),
        el('div', { class: 'row', style: { marginTop: '10px' } },
          button(list.archived ? 'Unarchive' : 'Archive', { cls: 'btn btn-quiet grow', onClick: () => {
            words.setListArchived(list.id, !list.archived);
            toast(list.archived ? 'List is active again' : 'List archived');
            render();
          } }),
          button('Practice this list', { cls: 'btn btn-quiet grow', onClick: () => {
            const pool = ws.filter(w => !words.isMastered(w));
            if (!pool.length) return toast('Every word on this list is mastered');
            setQueue(words.pickWords({ count: Math.min(10, pool.length), pool: 'list', listId: list.id })
              .filter(w => !words.isMastered(w)));
            navigate('/practice');
          } })
        ),
        el('p', { class: 'tiny muted', style: { marginTop: '10px' }, text:
          'Archiving takes a list’s unmastered words out of rotation without deleting anything.' })
      ),
      ws.length ? el('div', { class: 'stack-sm' }, ws.map(wordRow))
        : el('div', { class: 'card center' }, el('p', { class: 'muted', text: 'No words in this list yet.' })),
      el('div', { style: { height: '8px' } }),
      button('Delete this list', { cls: 'btn btn-danger btn-block', onClick: async () => {
        const masteredCount = ws.filter(words.isMastered).length;
        const ok = await confirmDialog({
          title: 'Delete this list?',
          message: masteredCount
            ? `${ws.length - masteredCount} unmastered words will be removed. The ${masteredCount} mastered words are kept and moved to an archive, so her record is never lost.`
            : `All ${ws.length} words in this list will be removed. This cannot be undone.`,
          confirmLabel: 'Delete', danger: true,
        });
        if (!ok) return;
        words.deleteList(list.id);
        toast('List deleted');
        show({ name: 'lists' });
      } })
    );
  }

  function addWordsDialog(list) {
    const pasteInput = el('textarea', { placeholder: 'One word per line' });
    const close = modal(`Add words to ${list.name}`, [
      field('Paste words', pasteInput, 'Duplicates already in this list are skipped.'),
      el('div', { class: 'row', style: { marginTop: '14px' } },
        button('Cancel', { cls: 'btn btn-quiet grow', onClick: () => close() }),
        button('Add', { cls: 'btn btn-primary grow', onClick: () => {
          const rows = words.parseBulk(pasteInput.value);
          const { added, skipped } = words.addBulkToList(list.id, rows);
          close();
          toast(`Added ${added}${skipped ? `, skipped ${skipped} duplicate${skipped === 1 ? '' : 's'}` : ''}`);
          render();
        } })
      ),
    ]);
    setTimeout(() => pasteInput.focus(), 60);
  }

  function renameListDialog(list) {
    const input = el('input', { type: 'text', value: list.name });
    const close = modal('Rename list', [
      input,
      el('div', { class: 'row', style: { marginTop: '14px' } },
        button('Cancel', { cls: 'btn btn-quiet grow', onClick: () => close() }),
        button('Save', { cls: 'btn btn-primary grow', onClick: () => {
          words.renameList(list.id, input.value); close(); render();
        } })
      ),
    ]);
  }

  function editWordDialog(word) {
    const textInput = el('input', { type: 'text', value: word.text });
    const defInput  = el('input', { type: 'text', value: word.definition, placeholder: 'optional' });
    const sentInput = el('input', { type: 'text', value: word.sentence, placeholder: 'optional' });
    const hintInput = el('input', { type: 'text', value: word.hint, placeholder: 'optional' });
    const homophone = words.isHomophone(word);

    const close = modal(`Edit "${word.text}"`, [
      field('Word', textInput),
      el('div', { style: { height: '10px' } }),
      field('Example sentence', sentInput, homophone
        ? 'This word is a homophone, so this sentence is read aloud with it every time. Without one she cannot tell it apart from its twin.'
        : 'Read aloud when she taps "In a sentence".'),
      el('div', { style: { height: '10px' } }),
      field('Definition', defInput),
      el('div', { style: { height: '10px' } }),
      field('Hint', hintInput, 'Shown in Practice only, never in a test.'),

      el('div', { class: 'card card-tight', style: { marginTop: '14px', background: '#fdf2e3' } },
        el('div', { class: 'tiny', text:
          `Attempts ${word.attempts} · correct ${word.correctCount} · missed ${word.incorrectCount} · mastery credits ${words.credits(word)} of ${words.threshold()}` })
      ),

      el('div', { class: 'row', style: { marginTop: '14px' } },
        button('Hear it', { cls: 'btn btn-quiet', emoji: '\u{1F50A}', onClick: () => speech.speak(textInput.value) }),
        button('Save', { cls: 'btn btn-primary grow', onClick: () => {
          words.editWord(word.id, {
            text: textInput.value, definition: defInput.value,
            sentence: sentInput.value, hint: hintInput.value,
          });
          close(); render();
        } })
      ),
      el('div', { class: 'row', style: { marginTop: '10px' } },
        button('Reset progress', { cls: 'btn btn-quiet grow', onClick: async () => {
          const ok = await confirmDialog({ title: 'Reset this word?',
            message: 'Its streak is cleared so it returns to the active practice pool. Its history is kept.',
            confirmLabel: 'Reset' });
          if (!ok) return;
          words.resetWordProgress(word.id); close(); render(); toast('Word is back in rotation');
        } }),
        button('Delete', { cls: 'btn btn-danger grow', onClick: async () => {
          const ok = await confirmDialog({ title: `Delete "${word.text}"?`,
            message: 'This removes the word and its history permanently.',
            confirmLabel: 'Delete', danger: true });
          if (!ok) return;
          words.deleteWord(word.id); close(); render(); toast('Word deleted');
        } })
      ),
    ]);
  }

  /* ---------- Voice ---------- */

  function voiceView() {
    const wrap = el('div', { class: 'stack' }, backButton(() => show({ name: 'hub' })));
    const s = settings();

    const select = el('select');
    const rateValue = el('div', { class: 'tiny muted' });
    const rate = el('input', { type: 'range', min: '0.5', max: '1.2', step: '0.05', value: String(s.rate) });

    const updateRateLabel = v => {
      const label = v < 0.7 ? 'slow' : v < 0.95 ? 'just right for most kids' : 'quick';
      rateValue.textContent = `${Number(v).toFixed(2)}× — ${label}`;
    };
    updateRateLabel(s.rate);
    rate.addEventListener('input', () => updateRateLabel(rate.value));
    rate.addEventListener('change', () => { speech.setRate(rate.value); speech.testVoice(); });

    speech.ready().then(() => {
      clear(select);
      const list = speech.voices();
      if (!list.length) {
        select.append(el('option', { value: '', text: 'No voices found on this tablet' }));
        wrap.append(el('div', { class: 'card', style: { background: '#fdeadb' } },
          el('h3', { text: 'No speech voices installed' }),
          el('p', { class: 'tiny', text:
            'Android needs a speech engine for the app to say words aloud. Open Settings → System → Languages & input → Text-to-speech output, make sure "Speech Recognition & Synthesis by Google" is the preferred engine, and install the English (United States) voice data.' })
        ));
        return;
      }
      list.forEach(v => select.append(el('option', {
        value: v.voiceURI,
        text: `${v.name} (${v.lang})${v.localService ? ' · offline' : ''}`,
        selected: v.voiceURI === speech.currentVoice()?.voiceURI,
      })));
    });

    select.addEventListener('change', () => { speech.setVoice(select.value); speech.testVoice(); });

    wrap.append(el('div', { class: 'card' },
      el('h2', { text: 'Voice' }),
      el('p', { class: 'muted tiny', text:
        'Every activity in the app uses this one voice. Tap through a few and pick the clearest — it changes everywhere at once.' }),
      field('Voice', select),
      el('div', { style: { height: '14px' } }),
      field('Speaking speed', el('div', {}, rate, rateValue)),
      button('Test voice', { cls: 'btn btn-blue btn-block', emoji: '\u{1F50A}',
        style: { marginTop: '10px' }, onClick: () => speech.testVoice() })
    ));

    wrap.append(el('div', { class: 'card' },
      el('h3', { text: 'Example sentences' }),
      el('p', { class: 'muted tiny', text:
        'Homophones like their / there / they’re cannot be told apart from audio alone, so their sentence is always read with them.' }),
      segmented([
        { value: 'homophone', label: 'Homophones only' },
        { value: 'always',    label: 'Always' },
        { value: 'never',     label: 'Never' },
      ], s.sentenceMode, v => { update(st => { st.settings.sentenceMode = v; }); toast('Saved'); })
    ));

    return wrap;
  }

  /* ---------- Spelling rules ---------- */

  function spellingView() {
    const s = settings();

    return el('div', { class: 'stack' },
      backButton(() => show({ name: 'hub' })),

      el('div', { class: 'card' },
        el('h2', { text: 'Mastery' }),
        el('p', { class: 'muted tiny', text:
          'How many times in a row she has to spell a word correctly before it counts as mastered and leaves the practice pool. Only one correct answer counts per day, so this really means three different days \u2014 learning the word, rather than copying letters she is still looking at. Missing it starts the count over.' }),
        segmented([
          { value: 2, label: '2 in a row' },
          { value: 3, label: '3 in a row' },
          { value: 5, label: '5 in a row' },
        ], s.masteryThreshold, v => { update(st => { st.settings.masteryThreshold = v; }); toast('Saved'); })
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'When she misses a word' }),
        el('p', { class: 'muted tiny', text:
          'She sees the correct spelling, then moves on. The word comes back a few words later in the same session so she has to recall it rather than copy it. That second look is practice only: it earns no stars and does not count towards mastery.' })
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Words per practice' }),
        el('p', { class: 'muted tiny', text:
          'The active pool grows as unmastered words carry forward, but a single sitting should stay short. This caps it.' }),
        segmented([
          { value: 5,  label: '5' },
          { value: 8,  label: '8' },
          { value: 12, label: '12' },
          { value: 17, label: '17' },
        ], s.practiceSize, v => { update(st => { st.settings.practiceSize = v; }); toast('Saved'); }),
        el('p', { class: 'muted tiny', style: { marginTop: '10px' }, text:
          'Today\u2019s Practice works through the list, showing each word once a day. When every word has had its turn the button goes quiet until tomorrow; extra practice stays available and is worth fewer stars.' })
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Words per practice test' }),
        segmented([
          { value: 8,  label: '8' },
          { value: 10, label: '10' },
          { value: 15, label: '15' },
        ], s.practiceTestSize, v => { update(st => { st.settings.practiceTestSize = v; }); toast('Saved'); })
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Letter keyboard' }),
        el('p', { class: 'muted tiny', text:
          'The app draws its own letters rather than using the tablet keyboard, so no suggestion strip can ever hand her the spelling. QWERTY matches a real US keyboard, staggered rows and all, so the positions carry straight over to a Bluetooth keyboard. A B C order is easier to hunt letters on if she is not typing yet.' }),
        segmented([
          { value: 'qwerty', label: 'QWERTY' },
          { value: 'abc',    label: 'A B C order' },
        ], s.keyboardLayout, v => { update(st => { st.settings.keyboardLayout = v; }); toast('Saved'); }),
        el('p', { class: 'muted tiny', style: { marginTop: '10px' }, text:
          'When she types on a Bluetooth keyboard the on-screen letters hide themselves to free up the screen, and a keyboard button brings them back.' })
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Parent PIN' }),
        button('Change PIN', { cls: 'btn btn-quiet', onClick: changePinDialog })
      )
    );
  }

  function changePinDialog() {
    const input = el('input', { type: 'text', inputmode: 'numeric', maxlength: '6', value: settings().parentPin });
    const close = modal('Parent PIN', [
      field('PIN', input, 'Four to six digits. It only keeps a curious child out of the settings.'),
      el('div', { class: 'row', style: { marginTop: '14px' } },
        button('Cancel', { cls: 'btn btn-quiet grow', onClick: () => close() }),
        button('Save', { cls: 'btn btn-primary grow', onClick: () => {
          const pin = input.value.replace(/\D/g, '');
          if (pin.length < 4) return toast('Use at least four digits');
          update(st => { st.settings.parentPin = pin; });
          close(); toast('PIN updated');
        } })
      ),
    ]);
  }

  /* ---------- Report ---------- */

  function reportView() {
    const s = words.summary();
    const p = getState().progress;
    const trouble = words.troubleWords(12);
    const sessions = getState().sessions.slice().reverse().slice(0, 10);

    const wordLine = w => el('div', { class: 'word-row' },
      el('div', { class: 'grow' },
        el('div', { class: 'w-text', text: w.text }),
        el('div', { class: 'w-meta', text:
          `${w.correctCount} correct · ${w.incorrectCount} missed · ${words.credits(w)}/${words.threshold()} credits` })
      ),
      el('div', { class: `badge badge-${words.statusOf(w).key}`, text: words.statusOf(w).label })
    );

    return el('div', { class: 'stack' },
      backButton(() => show({ name: 'hub' })),

      el('div', { class: 'stat-grid' },
        stat(s.mastered, 'Mastered'),
        stat(s.practicing, 'Practicing'),
        stat(s.learning, 'Learning'),
        stat(s.new, 'Not tried')
      ),
      el('div', { class: 'stat-grid' },
        stat(p.sessionsCompleted, 'Practices'),
        stat(p.testsCompleted, 'Tests'),
        stat(p.currentStreak, 'Streak'),
        stat(p.wordsAttempted, 'Attempts')
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Needs attention' }),
        trouble.length
          ? el('div', { class: 'stack-sm' }, trouble.map(wordLine))
          : el('p', { class: 'muted tiny', text: 'Nothing is giving her trouble right now.' }),
        trouble.length
          ? button('Practice just these', { cls: 'btn btn-primary btn-block', style: { marginTop: '12px' },
              onClick: () => { setQueue(trouble.slice(0, 8)); navigate('/practice'); } })
          : null
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Recent sessions' }),
        sessions.length
          ? el('div', { class: 'stack-sm' }, sessions.map(sess =>
              el('div', { class: 'word-row' },
                el('div', { class: 'grow' },
                  el('div', { class: 'w-text', text: sess.mode === 'test' ? 'Spelling test' : 'Practice' }),
                  el('div', { class: 'w-meta', text: new Date(sess.at).toLocaleString(undefined,
                    { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) })
                ),
                el('div', { class: 'badge badge-practicing', text: `${sess.correct}/${sess.attempted}` })
              )))
          : el('p', { class: 'muted tiny', text: 'No sessions yet.' })
      )
    );
  }

  /* ---------- Child & pet ---------- */

  function profileView() {
    const c = getState().child;
    const nameInput = el('input', { type: 'text', value: c.name, maxlength: '18' });
    const petInput  = el('input', { type: 'text', value: c.petName, maxlength: '16' });

    return el('div', { class: 'stack' },
      backButton(() => show({ name: 'hub' })),
      el('div', { class: 'card' },
        field('Child’s name', nameInput),
        el('div', { style: { height: '12px' } }),
        field('Pet’s name', petInput),
        button('Save', { cls: 'btn btn-primary btn-block', style: { marginTop: '14px' }, onClick: () => {
          update(st => {
            st.child.name = nameInput.value.trim();
            st.child.petName = petInput.value.trim();
          });
          toast('Saved');
        } })
      ),
      el('div', { class: 'card' },
        el('p', { class: 'muted tiny', text: 'She can change which animal her pet is from the My Pet screen. Nothing she has earned is affected.' })
      )
    );
  }

  /* ---------- Backup & reset ---------- */

  function dataView() {
    const fileInput = el('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        const next = storage.parseBackup(await file.text());
        const ok = await confirmDialog({
          title: 'Restore this backup?',
          message: `It has ${next.words.length} words and ${next.progress.stars} stars. Everything currently on this tablet will be replaced.`,
          confirmLabel: 'Restore', danger: true,
        });
        if (!ok) return;
        replaceState(next);
        toast('Backup restored');
        show({ name: 'hub' });
      } catch (err) {
        toast(err.message || 'That file could not be read');
      } finally {
        fileInput.value = '';
      }
    });

    return el('div', { class: 'stack' },
      backButton(() => show({ name: 'hub' })),

      el('div', { class: 'card' },
        el('h2', { text: 'Backup' }),
        el('p', { class: 'muted tiny', text:
          'Everything lives in this browser’s storage on this tablet alone. Clearing Chrome’s browsing data would erase months of progress, so save a copy somewhere safe now and then — your cloud drive is ideal.' }),
        button('Save a backup file', { cls: 'btn btn-primary btn-block', emoji: '\u{1F4BE}',
          onClick: downloadBackup }),
        el('div', { style: { height: '10px' } }),
        button('Restore from a backup', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F4C2}',
          onClick: () => fileInput.click() }),
        fileInput
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Start over' }),
        el('p', { class: 'muted tiny', text:
          'Three kinds of reset, from gentlest to most drastic. None of them touch backup files you have already saved.' }),

        el('div', { class: 'card card-tight', style: { background: '#fdf2e3', marginBottom: '14px' } },
          el('h3', { text: '\u{1F381} Handing it over to her' }),
          el('p', { class: 'muted tiny', text:
            'Use this once you have finished setting things up and testing. It clears everything your testing created \u2014 progress, stars, streaks, treasures, her name and her pet \u2014 and drops the app back on the very first welcome screen. Your word lists, voice choice, mastery rules and PIN are all kept, so she opens a game that is already set up for her.' }),
          button('Fresh start for her', { cls: 'btn btn-primary btn-block', emoji: '\u2728',
            style: { marginTop: '10px' }, onClick: freshStartForChild })
        ),

        el('p', { class: 'muted tiny', text:
          'Clearing progress keeps every word, list and setting, and keeps her name and pet, but wipes mastery, stars, streaks and treasures.' }),
        button('Clear progress, keep words', { cls: 'btn btn-quiet btn-block', onClick: async () => {
          const ok = await confirmDialog({ title: 'Clear all progress?',
            message: 'Words and lists stay. Mastery, stars, streaks, treasures and history are erased. This cannot be undone.',
            confirmLabel: 'Clear progress', danger: true });
          if (!ok) return;
          update(st => {
            st.words.forEach(w => {
              w.attempts = 0; w.correctCount = 0; w.incorrectCount = 0;
              w.streak = 0; w.lastCreditDay = null; w.lastDailyDay = null;
              w.recent = []; w.masteredAt = null;
              w.lastSeen = null; w.lastCorrect = null; w.lastMissed = null;
            });
            st.progress = storage.defaultState().progress;
            st.collection.items = [];
            st.sessions = [];
          });
          toast('Progress cleared');
          show({ name: 'hub' });
        } }),
        el('div', { style: { height: '10px' } }),
        button('Erase everything', { cls: 'btn btn-danger btn-block', onClick: async () => {
          const ok = await confirmDialog({ title: 'Erase everything?',
            message: 'Every word, list, star and treasure is deleted and the app returns to its first run. Save a backup first if there is any doubt.',
            confirmLabel: 'Erase it all', danger: true });
          if (!ok) return;
          const reallyOk = await confirmDialog({ title: 'Are you sure?',
            message: 'There is no undo for this.', confirmLabel: 'Yes, erase everything', danger: true });
          if (!reallyOk) return;
          resetAll();
          unlocked = false;
          navigate('/setup', { replace: true });
        } })
      )
    );
  }

  /* The handover reset.

     After a parent has set the app up and poked around to check it works,
     this clears every trace of that testing and returns the app to its
     welcome screen — while keeping the things they just spent time on:
     word lists, the chosen voice, mastery rules and the PIN. */
  async function freshStartForChild() {
    const ok = await confirmDialog({
      title: 'Fresh start for her?',
      message: 'Progress, stars, streaks, treasures, her name and her pet are all cleared, and the app goes back to the welcome screen. Your word lists, voice and settings are kept.',
      confirmLabel: 'Fresh start',
    });
    if (!ok) return;

    update(st => {
      st.words.forEach(w => {
        w.attempts = 0; w.correctCount = 0; w.incorrectCount = 0;
        w.streak = 0; w.lastCreditDay = null; w.lastDailyDay = null;
              w.recent = []; w.masteredAt = null;
        w.firstSeen = null; w.lastSeen = null; w.lastCorrect = null; w.lastMissed = null;
      });
      st.progress = storage.defaultState().progress;
      st.collection.items = [];
      st.sessions = [];
      st.child.name = '';
      st.child.petName = '';
      st.child.petCoat = storage.defaultState().child.petCoat;
      st.child.setupComplete = false;
    });

    unlocked = false;             // relock, since she is the next one to open it
    flushNow();
    toast('Ready for her first time');
    navigate('/setup', { replace: true });
  }

  function downloadBackup() {
    flushNow();
    const blob = storage.exportBlob(getState());
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: storage.suggestedFilename() });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Backup saved to Downloads');
  }

  /* ---------- Shared ---------- */

  function backButton(onClick) {
    return button('Back', { cls: 'btn btn-quiet', emoji: '←', onClick });
  }

  render();
}

/* ---------- PIN gate ---------- */

function pinGate(container, onUnlock) {
  let entered = '';
  // Before the child has finished setup there is no hub to go back to.
  const ready = getState().child.setupComplete;

  const dots = el('div', { class: 'row', style: { justifyContent: 'center' } });
  const message = el('div', { class: 'center tiny muted', text: 'Enter the parent PIN' });

  function paintDots() {
    clear(dots);
    for (let i = 0; i < Math.max(4, entered.length); i++) {
      dots.append(el('div', { class: i < entered.length ? 'mdot on' : 'mdot',
        style: { width: '16px', height: '16px' } }));
    }
  }

  function press(digit) {
    if (entered.length >= 6) return;
    entered += digit;
    paintDots();
    if (entered.length >= String(settings().parentPin).length) check();
  }

  function check() {
    if (entered === String(settings().parentPin)) {
      unlocked = true;
      onUnlock();
    } else {
      message.textContent = 'That PIN did not match. Try again.';
      entered = '';
      paintDots();
    }
  }

  const pad = el('div', { class: 'hub-grid hub-grid-3', style: { maxWidth: '320px', margin: '0 auto' } });
  '123456789'.split('').forEach(d => pad.append(
    el('button', { class: 'hub-tile hub-tile-sm t-blue', type: 'button', text: d, onClick: () => press(d) })
  ));
  pad.append(el('button', { class: 'hub-tile hub-tile-sm t-gold', type: 'button', text: '⌫',
    onClick: () => { entered = entered.slice(0, -1); paintDots(); } }));
  pad.append(el('button', { class: 'hub-tile hub-tile-sm t-blue', type: 'button', text: '0', onClick: () => press('0') }));
  pad.append(el('button', { class: 'hub-tile hub-tile-sm t-green', type: 'button', text: '✓', onClick: check }));

  paintDots();

  mount(container, el('div', { class: 'stack' },
    el('div', { class: 'card center' },
      el('div', { style: { fontSize: '2.4rem' }, text: '\u{1F510}' }),
      el('h2', { text: 'Parent Area' }),
      message,
      el('div', { style: { height: '10px' } }),
      dots
    ),
    pad,
    el('p', { class: 'center tiny muted', text: 'The PIN starts as 1234 and can be changed inside.' }),
    button(ready ? 'Back to the game' : 'Back to the welcome screen',
      { cls: 'btn btn-quiet btn-block', onClick: () => navigate(ready ? '/' : '/setup') })
  ));
}
