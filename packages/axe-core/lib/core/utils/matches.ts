import cssParser from './css-parser';

export default function matches(vNode: unknown, selector: string): boolean {
  const expressions = convertSelector(selector);
  return expressions.some((expression: unknown) =>
    matchesExpression(vNode as Record<string, unknown>, expression as unknown[])
  );
}

function matchesTag(
  vNode: Record<string, unknown>,
  exp: Record<string, unknown>
): boolean {
  return (
    (vNode.props as Record<string, unknown>).nodeType === 1 &&
    (exp.tag === '*' ||
      (vNode.props as Record<string, unknown>).nodeName === exp.tag)
  );
}

function matchesClasses(
  vNode: Record<string, unknown>,
  exp: Record<string, unknown>
): boolean {
  return (
    !exp.classes ||
    (exp.classes as Array<{ value: string }>).every(cl =>
      (vNode as { hasClass: (v: string) => boolean }).hasClass(cl.value)
    )
  );
}

function matchesAttributes(
  vNode: Record<string, unknown>,
  exp: Record<string, unknown>
): boolean {
  return (
    !exp.attributes ||
    (
      exp.attributes as Array<{ key: string; test: (v: string) => boolean }>
    ).every(att => {
      const nodeAtt = (vNode as { attr: (k: string) => string | null }).attr(
        att.key
      );
      return nodeAtt !== null && att.test(nodeAtt);
    })
  );
}

function matchesId(
  vNode: Record<string, unknown>,
  exp: Record<string, unknown>
): boolean {
  return !exp.id || (vNode.props as Record<string, unknown>).id === exp.id;
}

function matchesPseudos(
  target: Record<string, unknown>,
  exp: Record<string, unknown>
): boolean {
  if (
    !exp.pseudos ||
    (exp.pseudos as Array<{ name: string; expressions: unknown[] }>).every(
      pseudo => {
        if (pseudo.name === 'not') {
          return !pseudo.expressions.some((expression: unknown) => {
            return matchesExpression(target, expression as unknown[]);
          });
        } else if (pseudo.name === 'is') {
          return pseudo.expressions.some((expression: unknown) => {
            return matchesExpression(target, expression as unknown[]);
          });
        }
        throw new Error(
          'the pseudo selector ' + pseudo.name + ' has not yet been implemented'
        );
      }
    )
  ) {
    return true;
  }
  return false;
}

function matchExpression(
  vNode: Record<string, unknown>,
  expression: Record<string, unknown>
): boolean {
  return (
    matchesTag(vNode, expression) &&
    matchesClasses(vNode, expression) &&
    matchesAttributes(vNode, expression) &&
    matchesId(vNode, expression) &&
    matchesPseudos(vNode, expression)
  );
}

const escapeRegExp = (() => {
  const from = /(?=[-[\]{}()*+?.\\^$|,#\s])/g;
  const to = '\\';
  return (string: string): string => {
    return string.replace(from, to);
  };
})();

const reUnescape = /\\/g;
function convertAttributes(
  atts: Array<Record<string, unknown>> | undefined
): Array<Record<string, unknown>> | undefined {
  if (!atts) {
    return;
  }
  return atts.map(att => {
    const attributeKey = (att.name as string).replace(reUnescape, '');
    const attributeValue = ((att.value as string) || '').replace(
      reUnescape,
      ''
    );
    let test: ((value: string | null) => boolean) | undefined,
      regexp: RegExp | undefined;

    switch (att.operator) {
      case '^=':
        regexp = new RegExp('^' + escapeRegExp(attributeValue));
        break;
      case '$=':
        regexp = new RegExp(escapeRegExp(attributeValue) + '$');
        break;
      case '~=':
        regexp = new RegExp(
          '(^|\\s)' + escapeRegExp(attributeValue) + '(\\s|$)'
        );
        break;
      case '|=':
        regexp = new RegExp('^' + escapeRegExp(attributeValue) + '(-|$)');
        break;
      case '=':
        test = (value: string | null) => attributeValue === value;
        break;
      case '*=':
        test = (value: string | null) =>
          !!value && value.includes(attributeValue);
        break;
      case '!=':
        test = (value: string | null) => attributeValue !== value;
        break;
      default:
        test = (value: string | null) => value !== null;
    }

    if (attributeValue === '' && /^[*$^]=$/.test(att.operator as string)) {
      test = () => false;
    }

    if (!test) {
      test = (value: string | null) => !!value && regexp!.test(value);
    }
    return {
      key: attributeKey,
      value: attributeValue,
      type: typeof att.value === 'undefined' ? 'attrExist' : 'attrValue',
      test: test
    };
  });
}

function convertClasses(
  classes: string[] | undefined
): Array<{ value: string; regexp: RegExp }> | undefined {
  if (!classes) {
    return;
  }
  return classes.map(className => {
    className = className.replace(reUnescape, '');
    return {
      value: className,
      regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
    };
  });
}

function convertPseudos(
  pseudos: Array<Record<string, unknown>> | undefined
): Array<Record<string, unknown>> | undefined {
  if (!pseudos) {
    return;
  }
  return pseudos.map(p => {
    let expressions: unknown;

    if (['is', 'not'].includes(p.name as string)) {
      expressions = p.value;
      expressions = (expressions as Record<string, unknown>).selectors
        ? (expressions as Record<string, unknown>).selectors
        : [expressions];
      expressions = convertExpressions(
        expressions as Array<Record<string, unknown>>
      );
    }
    return {
      name: p.name,
      expressions: expressions,
      value: p.value
    };
  });
}

function convertExpressions(
  expressions: Array<Record<string, unknown>>
): Array<Array<Record<string, unknown>>> {
  return expressions.map(exp => {
    const newExp: Array<Record<string, unknown>> = [];
    let rule = exp.rule as Record<string, unknown> | undefined;
    while (rule) {
      newExp.push({
        tag: rule.tagName ? (rule.tagName as string).toLowerCase() : '*',
        combinator: rule.nestingOperator ? rule.nestingOperator : ' ',
        id: rule.id,
        attributes: convertAttributes(
          rule.attrs as Array<Record<string, unknown>> | undefined
        ),
        classes: convertClasses(rule.classNames as string[] | undefined),
        pseudos: convertPseudos(
          rule.pseudos as Array<Record<string, unknown>> | undefined
        )
      });
      rule = rule.rule as Record<string, unknown> | undefined;
    }
    return newExp;
  });
}

export function convertSelector(
  selector: string
): Array<Array<Record<string, unknown>>> {
  const expressions = cssParser.parse(selector) as unknown as Record<
    string,
    unknown
  >;
  const exprArr = (expressions as Record<string, unknown>).selectors
    ? ((expressions as Record<string, unknown>).selectors as Array<
        Record<string, unknown>
      >)
    : [expressions];
  return convertExpressions(exprArr);
}

function optimizedMatchesExpression(
  vNode: Record<string, unknown> | null,
  expressions: unknown[] | Record<string, unknown>,
  index: number,
  matchAnyParent?: boolean
): boolean {
  if (!vNode) {
    return false;
  }

  const isArray = Array.isArray(expressions);
  const expression = (
    isArray
      ? (expressions as Array<Record<string, unknown>>)[index]
      : (expressions as Record<string, unknown>)
  )!;
  let machedExpression = matchExpression(
    vNode as Record<string, unknown>,
    expression
  );

  while (
    !machedExpression &&
    matchAnyParent &&
    (vNode as Record<string, unknown>).parent
  ) {
    vNode = (vNode as Record<string, unknown>).parent as Record<
      string,
      unknown
    >;
    machedExpression = matchExpression(
      vNode as Record<string, unknown>,
      expression
    );
  }

  if (index > 0) {
    if ([' ', '>'].includes(expression.combinator as string) === false) {
      throw new Error(
        'axe.utils.matchesExpression does not support the combinator: ' +
          expression.combinator
      );
    }

    machedExpression =
      machedExpression &&
      optimizedMatchesExpression(
        (vNode as Record<string, unknown>).parent as Record<
          string,
          unknown
        > | null,
        expressions,
        index - 1,
        expression.combinator === ' '
      );
  }

  return machedExpression;
}

export function matchesExpression(
  vNode: Record<string, unknown>,
  expressions: unknown[] | Record<string, unknown>,
  matchAnyParent?: boolean
): boolean {
  return optimizedMatchesExpression(
    vNode,
    expressions,
    (expressions as unknown[]).length - 1,
    matchAnyParent
  );
}
