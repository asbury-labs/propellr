import { describe, it, expect } from 'vitest';

declare const axe: any;
describe('axe.utils.select', () => {
  const $id = id => document.getElementById(id);
  const { Context } = axe._thisWillBeDeletedDoNotUse.base;
  const { fixtureSetup } = axe.testUtils;

  it('should return an array', () => {
    expect(Array.isArray(axe.utils.select('div', { include: [] }))).toBe(true);
  });

  describe('selector', () => {
    it('should accept a selector', () => {
      fixtureSetup('<div id="monkeys"></div>');
      const context = new Context(document, axe._tree);
      const result = axe.utils.select('#monkeys', context);
      expect(result[0].actualNode).toBe($id('monkeys'));
    });
  });

  describe('context', () => {
    it('should include', () => {
      fixtureSetup(
        '<div id="monkeys"><div id="bananas" class="bananas"></div></div>'
      );
      const context = new Context('#monkeys', axe._tree);
      const result = axe.utils.select('.bananas', context);
      expect(result[0].actualNode).toEqual($id('bananas'));
    });

    it('should exclude', () => {
      fixtureSetup(
        '<div id="monkeys"><div id="bananas" class="bananas"></div></div>'
      );
      const context = new Context(
        {
          include: [['#fixture']],
          exclude: [['#monkeys']]
        },
        axe._tree
      );
      const result = axe.utils.select('.bananas', context);
      expect(result).toHaveLength(0);
    });

    it('should pick the deepest exclude/include - exclude winning', () => {
      fixtureSetup(
        `<div id="include1">
        	<div id="exclude1">
        		<div id="include2">
        			<div id="exclude2">
        				<div class="bananas"></div>
        			</div>
        		</div>
        	</div>
        </div>`
      );
      const context = new Context(
        {
          include: [['#include1'], ['#include2']],
          exclude: [['#exclude1'], ['#exclude2']]
        },
        axe._tree
      );
      const result = axe.utils.select('.bananas', context);
      expect(result).toEqual([]);
    });

    it('should pick the deepest exclude/include - include winning', () => {
      fixtureSetup(
        `<div id="include1"> 
        	<div id="exclude1"> 
        		<div id="include2"> 
        			<div id="exclude2"> 
        				<div id="include3"> 
        					<div id="bananas" class="bananas"></div> 
        				</div> 
        			</div> 
        		</div> 
        	</div> 
        </div>`
      );
      const context = new Context(
        {
          include: [['#include3'], ['#include2'], ['#include1']],
          exclude: [['#exclude1'], ['#exclude2']]
        },
        axe._tree
      );
      const result = axe.utils.select('.bananas', context);
      expect(result[0].actualNode).toEqual($id('bananas'));
    });
  });

  it('should only contain unique elements', () => {
    fixtureSetup(
      '<div id="monkeys"><div id="bananas" class="bananas"></div></div>'
    );
    const context = new Context(
      {
        include: [['#fixture'], ['#monkeys']]
      },
      axe._tree
    );

    const result = axe.utils.select('.bananas', context);
    expect(result).toHaveLength(1);
    expect(result[0].actualNode).toBe($id('bananas'));
  });

  it('should not return duplicates on overlapping includes', () => {
    fixtureSetup(
      '<div id="zero"><div id="one"><div id="target1" class="bananas"></div></div>' +
        '<div id="two"><div id="target2" class="bananas"></div></div></div>'
    );
    const context = new Context(
      {
        include: [['#zero'], ['#one']]
      },
      axe._tree
    );

    const result = axe.utils.select('.bananas', context);
    expect(
      result.map(n => n.actualNode),
      [$id('target1'), $id('target2')]
    ).toEqual(undefined);
    expect(result.length).toBe(2);
  });

  it('should return the cached result if one exists', () => {
    fixtureSetup(
      '<div id="zero"><div id="one"><div id="target1" class="bananas"></div></div>' +
        '<div id="two"><div id="target2" class="bananas"></div></div></div>'
    );

    axe._selectCache = [
      {
        selector: '.bananas',
        result: 'fruit bat'
      }
    ];
    const context = new Context([['#zero']], axe._tree);
    const result = axe.utils.select('.bananas', context);
    expect(result).toBe('fruit bat');
  });
});
