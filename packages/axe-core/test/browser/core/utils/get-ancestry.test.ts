import { describe, it, expect, afterEach } from 'vitest';

declare const axe: any;
describe('axe.utils.getAncestry', () => {
  const fixture = document.getElementById('fixture');

  afterEach(() => {
    fixture.innerHTML = '';
  });

  it('should generate an ancestry selector', () => {
    fixture.innerHTML = '<div>1</div> <p>2</p> <p>3</p>';

    const sel1 = axe.utils.getAncestry(fixture.children[0]);
    expect(sel1).toBe('html > body > div:nth-child(1) > div:nth-child(1)');
    expect(document.querySelector(sel1)).not.toBeNull();

    const sel2 = axe.utils.getAncestry(fixture.children[1]);
    expect(sel2).toBe('html > body > div:nth-child(1) > p:nth-child(2)');
    expect(document.querySelector(sel1)).not.toBeNull();

    const sel3 = axe.utils.getAncestry(fixture.children[2]);
    expect(sel3).toBe('html > body > div:nth-child(1) > p:nth-child(3)');
    expect(document.querySelector(sel1)).not.toBeNull();
  });

  it('should not throw when there is no parent', () => {
    const node = document.createElement('section');
    expect(() => axe.utils.getAncestry(node)).not.toThrow();
  });

  it('generates selectors of nested shadow trees', () => {
    const node = document.createElement('section');
    fixture.appendChild(node);

    const shadowRoot1 = node.attachShadow({ mode: 'open' });
    shadowRoot1.innerHTML = '<div><article><slot /></article</div>';

    const shadowRoot2 = shadowRoot1
      .querySelector('article')
      .attachShadow({ mode: 'open' });
    shadowRoot2.innerHTML = '<h1>Hello world</h1>';

    const target = shadowRoot2.querySelector('h1');
    const sel = axe.utils.getAncestry(target);
    expect(sel).toEqual([
      'html > body > div:nth-child(1) > section',
      'div > article',
      'h1'
    ]);
  });

  it('generates selectors of siblings in shadow tree', () => {
    const node = document.createElement('section');
    fixture.appendChild(node);

    const shadowRoot = node.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = '<div>1</div> <div>2</div>';

    const sel1 = axe.utils.getAncestry(shadowRoot.children[0]);
    expect(sel1).toEqual([
      'html > body > div:nth-child(1) > section',
      'div:nth-child(1)'
    ]);

    const sel2 = axe.utils.getAncestry(shadowRoot.children[1]);
    expect(sel2).toEqual([
      'html > body > div:nth-child(1) > section',
      'div:nth-child(2)'
    ]);
  });
});
