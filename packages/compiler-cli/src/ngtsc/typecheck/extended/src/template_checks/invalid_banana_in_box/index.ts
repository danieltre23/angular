/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {TmplAstBoundEvent, TmplAstNode} from '@angular/compiler';
import {AST} from '@angular/compiler/src/compiler';
import * as ts from 'typescript';

import {ErrorCode} from '../../../../../diagnostics';
import {ExtendedTemplateDiagnostic, TemplateCheckWithVisitor, TemplateContext} from '../../../api/api';

/**
 * Ensures the two-way binding syntax is correct.
 * Parentheses should be inside the brackets "[()]".
 * Will return diagnostic information when "([])" is found.
 */
export class InvalidBananaInBoxCheck extends
    TemplateCheckWithVisitor<ErrorCode.INVALID_BANANA_IN_BOX> {
  code: ErrorCode.INVALID_BANANA_IN_BOX = 8101;

  visitNode(ctx: TemplateContext, node: TmplAstNode|AST):
      ExtendedTemplateDiagnostic<ErrorCode.INVALID_BANANA_IN_BOX>[] {
    const diagnostics: ExtendedTemplateDiagnostic<ErrorCode.INVALID_BANANA_IN_BOX>[] = [];
    if (node instanceof TmplAstBoundEvent) {
      const name = node.name;
      if (name.startsWith('[') && name.endsWith(']')) {
        const boundSyntax = node.sourceSpan.toString();
        const expectedBoundSyntax = boundSyntax.replace(`(${name})`, `[(${name.slice(1, -1)})]`);
        diagnostics.push(ctx.templateTypeChecker.makeTemplateDiagnostic<
                         ErrorCode.INVALID_BANANA_IN_BOX>(
            ctx.component, node.sourceSpan, ts.DiagnosticCategory.Warning,
            ErrorCode.INVALID_BANANA_IN_BOX,
            `In the two-way binding syntax the parentheses should be inside the brackets, ex. '${
                expectedBoundSyntax}'. 
                Find more at https://angular.io/guide/two-way-binding`));
      }
    }
    return diagnostics;
  }
}
