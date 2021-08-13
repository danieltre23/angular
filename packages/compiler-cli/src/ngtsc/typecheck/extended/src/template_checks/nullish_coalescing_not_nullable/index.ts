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
import {ExtendedTemplateDiagnostic, TemplateCheckWithVisitor, TemplateContext} from '../../../api';

/**
 * Ensures the left side of a nullish coalescing operation is nullable.
 * Returns diagnostics for the cases where the operator is useless.
 */
export class NullishCoalescingNotNullableCheck extends
    TemplateCheckWithVisitor<ErrorCode.NULLISH_COALESCING_NOT_NULLABLE> {
  override code: ErrorCode.NULLISH_COALESCING_NOT_NULLABLE = 8101;

  override visitNode(ctx: TemplateContext, node: TmplAstNode|AST):
      ExtendedTemplateDiagnostic<ErrorCode.NULLISH_COALESCING_NOT_NULLABLE>[] {
    const diagnostics: ExtendedTemplateDiagnostic<ErrorCode.NULLISH_COALESCING_NOT_NULLABLE>[] = [];
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
        // If the left type is equivalent to its non-nullable self, then the operator is useless
        // and can be removed.
        if (type.getNonNullableType() === type) {
          diagnostics.push(ctx.templateTypeChecker.makeTemplateDiagnostic<
                           ErrorCode.NULLISH_COALESCING_NOT_NULLABLE>(
              ctx.component, span, ts.DiagnosticCategory.Warning,
              ErrorCode.NULLISH_COALESCING_NOT_NULLABLE,
              `The left side of this nullish coalescing operation is not nullable, therefore the '??' operator can be safely removed.`));
        }
      }
    }
    return diagnostics;
  }
}
