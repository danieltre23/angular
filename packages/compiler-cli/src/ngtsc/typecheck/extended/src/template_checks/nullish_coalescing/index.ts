/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {TmplAstNode} from '@angular/compiler';
import {AST, Binary, PropertyRead} from '@angular/compiler/src/compiler';
import * as ts from 'typescript';

import {ErrorCode} from '../../../../../diagnostics';
import {ExpressionSymbol} from '../../../../api';
import {ExtendedTemplateDiagnostic, TemplateCheckWithVisitor, TemplateContext} from '../../../api/api';

/**
 * Ensures the two-way binding syntax is correct.
 * Parentheses should be inside the brackets "[()]".
 * Will return diagnostic information when "([])" is found.
 */
export class NullishCoalesingCheck extends TemplateCheckWithVisitor<ErrorCode.NULLISH_COALESCING> {
  code: ErrorCode.NULLISH_COALESCING = 8101;

  visitNode(ctx: TemplateContext, node: TmplAstNode|AST):
      ExtendedTemplateDiagnostic<ErrorCode.NULLISH_COALESCING>[] {
    const diagnostics: ExtendedTemplateDiagnostic<ErrorCode.NULLISH_COALESCING>[] = [];
    if (node instanceof Binary) {
      if (node.operation == '??') {
        // Get the type of the value on the left side.
        const symbol =
            ctx.templateTypeChecker.getSymbolOfNode((node.left as PropertyRead), ctx.component);
        const type = (symbol as ExpressionSymbol).tsType;
        const span =
            ctx.templateTypeChecker
                .getTemplateMappingAtShimLocation((symbol as ExpressionSymbol).shimLocation)
                ?.span!;
        if (type.getNonNullableType() === type) {
          diagnostics.push(
              ctx.templateTypeChecker.makeTemplateDiagnostic<ErrorCode.NULLISH_COALESCING>(
                  ctx.component, span, ts.DiagnosticCategory.Warning, ErrorCode.NULLISH_COALESCING,
                  `not nullable`))
        }
      }
    }
    return diagnostics;
  }
}