import { NodeName, SelectedOption } from './types';

export const ZERO_SPACE = '\u200B';

enum JsonType {
  Row = 'Row',
  Tag = 'Tag',
  ZeroSpace = 'ZeroSpace',
  Br = 'Br',
  Text = 'Text',
}

export function dom2Json(doms: NodeList) {
  const jsonObj = Array.from(doms).map((dom) => {
    const children = Array.from(dom.childNodes)
      .map((child) => {
        if (child.nodeName === NodeName.TEXT && ![ZERO_SPACE, ''].includes(child.textContent)) {
          const text = child.textContent?.replace(ZERO_SPACE, '');
          return {
            type: JsonType.Text,
            text: text,
          };
        }
        if (child.nodeName === NodeName.A) {
          const dataset = child.dataset;
          return {
            type: JsonType.Tag,
            node: {
              label: dataset.label,
              value: dataset.value,
            },
          };
        }
        if (child.nodeName === NodeName.BR) {
          return {
            type: JsonType.Br,
          };
        }
      })
      .filter((item) => item !== undefined);
    return children;
  });
  return jsonObj;
}

export function json2Dom(json) {
  const fregment = new DocumentFragment();
  json.forEach((row) => {
    const div = document.createElement(NodeName.DIV);
    row.forEach((child) => {
      if (child.type === JsonType.Text && child.text !== ZERO_SPACE) {
        const node = document.createTextNode(child.text);
        div.appendChild(node);
      } else if (child.type === JsonType.Tag) {
        const fregmentTag = new DocumentFragment();
        const node = createTag(child.node);
        const zeroSpace = createZeroSpace();
        fregmentTag.appendChild(node);
        fregmentTag.appendChild(zeroSpace);
        div.appendChild(fregmentTag);
      } else if (child.type === JsonType.Br) {
        const node = document.createElement(NodeName.BR);
        div.appendChild(node);
      }
    });
    fregment.appendChild(div);
  });
  return fregment;
}

export function createTag({ label, value }: SelectedOption) {
  const outerEl = document.createElement(NodeName.A);
  const innerEl = document.createElement(NodeName.SPAN);
  outerEl.dataset.value = value;
  outerEl.dataset.label = label;
  outerEl.contentEditable = 'false';
  outerEl.style.cursor = 'pointer';
  outerEl.style.paddingRight = '2px';

  innerEl.dataset.id = value;
  innerEl.contentEditable = 'false';
  innerEl.style.color = 'blue';
  innerEl.innerText = `@${label}`;
  outerEl.appendChild(innerEl);
  return outerEl;
}

export function createDivWithBr() {
  const divEl = document.createElement('DIV');
  const brEl = document.createElement(NodeName.BR);
  divEl.appendChild(brEl);
  return divEl;
}

export function createZeroSpace() {
  return document.createTextNode(ZERO_SPACE);
}
