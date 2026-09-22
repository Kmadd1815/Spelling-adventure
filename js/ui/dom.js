/* Minimal DOM helpers. Screens build their markup with these rather than
   with innerHTML, so text from word lists can never be mistaken for markup. */

import { on } from '../core/bus.js';

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;

    if (key === 'class')      node.className = value;
    else if (key === 'text')  node.textContent = value;
    else if (key === 'html')  node.innerHTML = value;      // only for our own SVG
    else if (key === 'style' && typeof value === 'object') applyStyle(node, value);
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    }
    else if (value === true)  node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }

  appendAll(node, children);
  return node;
}

/* Custom properties (--fx-dx and friends) are invisible to Object.assign on
   a style object, so they need setProperty. */
function applyStyle(node, styles) {
  for (const [prop, value] of Object.entries(styles)) {
    if (value === null || value === undefined) continue;
    if (prop.startsWith('--')) node.style.setProperty(prop, String(value));
    else node.style[prop] = value;
  }
}

function appendAll(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function mount(node, ...children) {
  clear(node);
  appendAll(node, children);
  return node;
}

/** Big friendly button. */
export function button(label, { onClick, cls = 'btn', emoji, ...rest } = {}) {
  return el('button', { class: cls, type: 'button', onClick, ...rest },
    emoji ? el('span', { class: 'emoji', text: emoji }) : null,
    label
  );
}

export function card(...children) {
  return el('div', { class: 'card' }, children);
}

export function sectionTitle(text) {
  return el('div', { class: 'section-title', text });
}

export function stat(number, label) {
  return el('div', { class: 'stat' },
    el('div', { class: 'n', text: String(number) }),
    el('div', { class: 'l', text: label })
  );
}

export function bar(pct, { gold = false } = {}) {
  return el('div', { class: gold ? 'bar gold' : 'bar' },
    el('i', { style: { width: `${Math.round(Math.min(1, Math.max(0, pct)) * 100)}%` } })
  );
}

export function field(labelText, control, hintText) {
  return el('div', { class: 'field' },
    el('label', { text: labelText }),
    control,
    hintText ? el('div', { class: 'hint', text: hintText }) : null
  );
}

/** A segmented control. options: [{value, label}] */
export function segmented(options, value, onPick) {
  const wrap = el('div', { class: 'seg' });
  options.forEach(opt => {
    const b = el('button', {
      type: 'button',
      text: opt.label,
      'aria-pressed': String(opt.value === value),
      onClick: () => {
        wrap.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        onPick(opt.value);
      },
    });
    wrap.append(b);
  });
  return wrap;
}

/** Modal dialog. Returns a close() function. */
export function modal(titleText, bodyNodes, { dismissable = true } = {}) {
  const back = el('div', { class: 'modal-back' });
  const box = el('div', { class: 'modal' },
    titleText ? el('h2', { text: titleText }) : null,
    bodyNodes
  );
  back.append(box);
  if (dismissable) {
    back.addEventListener('click', e => { if (e.target === back) close(); });
  }
  document.body.append(back);

  /* A modal is appended to <body>, not to #screen, so the router clearing
     the screen does not touch it. Left alone it would hang over whatever
     came next and swallow every tap — which is exactly what happened when
     the axolotl turned up with a discovery and she pressed Back instead of
     closing it. */
  const offRoute = on('route:before', () => close());

  function close() {
    offRoute();
    back.remove();
  }
  return close;
}

export function confirmDialog({ title, message, confirmLabel = 'Yes', cancelLabel = 'Cancel', danger = false }) {
  return new Promise(resolve => {
    const close = modal(title, [
      el('p', { text: message }),
      el('div', { class: 'row', style: { marginTop: '14px' } },
        button(cancelLabel, { cls: 'btn btn-quiet grow', onClick: () => { close(); resolve(false); } }),
        button(confirmLabel, { cls: danger ? 'btn btn-danger grow' : 'btn btn-primary grow',
          onClick: () => { close(); resolve(true); } })
      ),
    ], { dismissable: false });
  });
}
