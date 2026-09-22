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
import * as events from '../core/events.js';
import { monthName, whenText } from './event.js';
import * as discovery from '../core/discovery.js';
import * as safety from '../core/safety.js';
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

    const backup = safety.backupStatus();
    if (backup.due) {
      body.append(el('div', { class: 'card card-warn' },
        el('h3', { text: '\u{1F4BE} Save a copy of her progress' }),
        el('p', { class: 'tiny', text: safety.backupMessage(backup) }),
        el('div', { class: 'row', style: { marginTop: '12px' } },
          button('Save a copy now', { cls: 'btn btn-primary grow', emoji: '\u{1F4BE}',
            onClick: () => saveBackup().then(() => show({ name: 'hub' })) }),
          button('Later', { cls: 'btn btn-quiet', onClick: () => {
            safety.snoozeReminder();
            show({ name: 'hub' });
          } })
        )
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
          'How many times in a row she has to spell a word correctly before it counts as mastered and leaves the practice pool. Missing it starts the count over.' }),
        segmented([
          { value: 2, label: '2 in a row' },
          { value: 3, label: '3 in a row' },
          { value: 5, label: '5 in a row' },
        ], s.masteryThreshold, v => { update(st => { st.settings.masteryThreshold = v; }); toast('Saved'); })
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'What counts as "in a row"' }),
        el('p', { class: 'muted tiny', text:
          'Every correct answer counts, so three in a row can happen in one sitting. She is never shown a word before she spells it, so there is nothing on screen to copy \u2014 but a word spelled right three times in ten minutes is a weaker claim than one spelled right on three separate days.' }),
        segmented([
          { value: false, label: 'Every time' },
          { value: true,  label: 'Once a day' },
        ], !!s.oneCreditPerDay, v => { update(st => { st.settings.oneCreditPerDay = v; }); toast('Saved'); }),
        el('p', { class: 'muted tiny', style: { marginTop: '10px' }, text:
          'Once a day is the stronger test and much the slower one: three in a row becomes three different days, whatever else she does in between. Either way, the second look at a word she has just missed never counts.' })
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

      eventsCard(),

      el('div', { class: 'card' },
        el('h3', { text: 'Mini-games' }),
        el('p', { class: 'muted tiny', text:
          'Six games that use her own spelling words. They pay far less than practice does \u2014 the first go at each game every day earns most, a repeat earns a token, and all six together are capped at 25 stars a day \u2014 so the shop still runs on spelling. Crossword and Tic Tac Toe ask her to spell a whole word from memory and can add to a mastery streak; no game can ever break one.' }),
        segmented([
          { value: false, label: 'Always open' },
          { value: true,  label: 'After practice' },
        ], !!s.gamesAfterDaily, v => { update(st => { st.settings.gamesAfterDaily = v; }); toast('Saved'); })
      ),

      el('div', { class: 'card' },
        el('h3', { text: 'Parent PIN' }),
        button('Change PIN', { cls: 'btn btn-quiet', onClick: changePinDialog })
      )
    );
  }

  /* Events and discoveries, so a grown-up can see what is coming and check
     an event works before the day it opens. */
  function eventsCard() {
    const live = events.liveEvent();
    const soon = events.upcoming().slice(0, 6);
    const found = discovery.POOL.length - discovery.stillOutThere().length;

    return el('div', { class: 'card' },
      el('h3', { text: 'Events and surprises' }),
      el('p', { class: 'muted tiny', text:
        'Holiday events run on the tablet\u2019s own clock and sit on top of the season. What she earns in one is hers permanently \u2014 an event ending only stops new things being earned. Event items are never sold in the shop.' }),

      live
        ? el('div', { class: 'ev-row' },
            el('div', { class: 'grow' },
              el('b', { text: `${live.emoji} ${live.name}` }),
              el('div', { class: 'tiny muted', text: `Running now \u00B7 ${events.daysLeft(live)} days left` })),
            button('Open', { cls: 'btn btn-quiet', onClick: () => navigate('/event') }))
        : el('div', { class: 'tiny muted', text: 'No event running right now.' }),

      soon.length ? el('div', { class: 'section-title', text: 'Coming up' }) : null,
      ...soon.map(e => el('div', { class: 'ev-row' },
        el('div', { class: 'grow' },
          el('b', { text: `${e.emoji} ${e.name}` }),
          el('div', { class: 'tiny muted', text: whenText(e) })),
        button('Preview', { cls: 'btn btn-quiet',
          onClick: () => navigate(`/event?preview=${e.id}`) })
      )),

      el('p', { class: 'muted tiny', style: { marginTop: '10px' }, text:
        `A preview plays the real thing but banks nothing \u2014 no stars, no progress, no items \u2014 so the event is still new on the day.` }),

      el('div', { class: 'section-title', text: 'Her birthday' }),
      el('p', { class: 'muted tiny', text:
        'Birthday Week runs three days either side of this date, every year. It is the only event that comes back \u2014 the collectibles are hers from the first one, and after that there is still a party and a present of stars each year.' }),
      birthdayPicker(),

      el('div', { class: 'section-title', text: 'Pet discoveries' }),
      el('p', { class: 'muted tiny', text:
        `After a spelling session the axolotl sometimes turns up with something it found. At most one a day, never required for anything, and each one can only be found once. ${found} of ${discovery.POOL.length} found so far.` })
    );
  }

  /* A birthday belongs to the child, not to the calendar, so it is a
     setting rather than a date baked into the event list. */
  function birthdayPicker() {
    const current = settings().birthday || events.DEFAULT_BIRTHDAY;
    const [mm, dd] = current.split('-');

    const month = el('select', { class: 'sel' });
    for (let m = 1; m <= 12; m++) {
      month.append(el('option', { value: String(m).padStart(2, '0'),
        text: monthName(m), selected: String(m).padStart(2, '0') === mm }));
    }
    const day = el('select', { class: 'sel' });
    for (let d = 1; d <= 31; d++) {
      day.append(el('option', { value: String(d).padStart(2, '0'),
        text: String(d), selected: String(d).padStart(2, '0') === dd }));
    }

    const note = el('div', { class: 'tiny muted' });
    const paint = () => {
      const [from, to] = events.windowOf(events.byId('birthday'));
      note.textContent = `Birthday Week: ${monthName(from[0])} ${from[1]} \u2013 ${monthName(to[0])} ${to[1]}`;
    };
    const save = () => {
      update(st => { st.settings.birthday = `${month.value}-${day.value}`; });
      paint();
      toast('Saved');
    };
    month.addEventListener('change', save);
    day.addEventListener('change', save);
    paint();

    return el('div', { class: 'stack-sm' },
      el('div', { class: 'row row-tight' }, month, day),
      note
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

      backupCard(fileInput),

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

  /* The backup card, which is really a small status report: when a copy was
     last taken, what has happened since, and whether Chrome has agreed not
     to reclaim the storage. */
  function backupCard(fileInput) {
    const status = safety.backupStatus();
    const since = safety.masteredSinceBackup();

    const readable = bytes => bytes == null ? null
      : bytes > 900000 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

    const health = el('div', { class: 'tiny muted', text: 'Checking storage\u2026' });
    safety.persistenceState().then(persist => {
      // Her progress, not the whole app: the offline cache dwarfs it and
      // quoting that number would suggest the backup is far bigger than it is.
      const size = readable(safety.saveSize());
      health.textContent = [
        size ? `Her progress is about ${size} of data.` : null,
        persist === 'granted'
          ? 'Chrome has agreed not to clear this app\u2019s storage on its own.'
          : persist === 'not granted'
            ? 'Chrome has not promised to keep this app\u2019s storage, which makes a saved copy matter more.'
            : null,
      ].filter(Boolean).join(' ');
    });

    return el('div', { class: status.due ? 'card card-warn' : 'card' },
      el('h2', { text: 'Backup' }),
      el('p', { class: 'muted tiny', text:
        'Everything lives in this browser\u2019s storage on this tablet alone. Clearing Chrome\u2019s browsing data, or losing the tablet, would take months of progress with it. A saved copy is the only thing that survives that \u2014 keep it in your cloud drive.' }),

      el('div', { class: 'card card-tight', style: { marginBottom: '14px' } },
        el('div', { class: 'tiny', style: { fontWeight: '800' }, text: safety.reassurance() }),
        el('div', { class: 'tiny muted', text: (() => {
          const ever = safety.lastBackup() !== null;
          if (!ever) return since > 0
            ? `${since} word${since === 1 ? '' : 's'} mastered so far, none of it saved anywhere else.`
            : 'Nothing mastered yet.';
          return since > 0
            ? `${since} word${since === 1 ? '' : 's'} mastered since then.`
            : 'Nothing new mastered since then.';
        })() }),
        health
      ),

      button('Save a copy', { cls: 'btn btn-primary btn-block', emoji: '\u{1F4BE}',
        onClick: () => saveBackup().then(() => show({ name: 'data' })) }),
      el('p', { class: 'tiny muted center', style: { margin: '8px 0 14px' }, text:
        'Sends it to your share sheet where the tablet offers one, so it can go straight to Drive.' }),

      button('Restore from a copy', { cls: 'btn btn-quiet btn-block', emoji: '\u{1F4C2}',
        onClick: () => fileInput.click() }),
      fileInput
    );
  }

  /* Prefer the share sheet: on a tablet, "save to Drive" is one tap from
     there, whereas a download lands in a folder she then has to go and
     find. Falls back to a plain download wherever sharing files is not
     offered. */
  async function saveBackup() {
    flushNow();                       // include anything still queued
    const blob = storage.exportBlob(getState());
    const name = storage.suggestedFilename();

    try {
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Spelling Adventure backup' });
        safety.noteBackupSaved();
        toast('Copy saved', { gold: true });
        return true;
      }
    } catch (err) {
      // Changing her mind at the share sheet is not a failure, and must not
      // be recorded as a backup.
      if (err?.name === 'AbortError') return false;
    }

    downloadBackup(blob, name);
    safety.noteBackupSaved();
    return true;
  }

  function downloadBackup(blob = storage.exportBlob(getState()),
                          name = storage.suggestedFilename()) {
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Copy saved to Downloads', { gold: true });
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
