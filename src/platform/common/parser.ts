/**
 * 代码生成 AST
 */
import { parse } from '@babel/parser';
import template from '@babel/template';
import type { Node } from '@babel/types';

export function codeToAst(codeStr) {
  try {
    const ast = parse(codeStr);
    return ast;
  } catch (e) {
    throw new Error('Error: ' + e);
  }
}
export function templateToAst(
  templateStr: string,
  templateParams?: { [placeholder: string]: Node | Node[] },
) {
  if (templateParams) {
    const buildRequire = template(templateStr);
    return buildRequire(templateParams);
  }
  return template.ast(templateStr);
}
