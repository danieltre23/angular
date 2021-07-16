import {Binary, PropertyRead, RecursiveAstVisitor} from '@angular/compiler';
import * as ts from 'typescript';

import {ExpressionSymbol} from '../../typecheck/api';
import {LintContext, LintTemplateVisitor, TemplateLintCheck} from '../api';

export class NullishLintCheck implements TemplateLintCheck {
  identifier = 'nullish-lint-check';

  category = ts.DiagnosticCategory.Warning;

  run(ctx: LintContext): ts.Diagnostic[] {
    const category = this.category;
    const diagnostics: ts.Diagnostic[] = [];

    const astVisitor = new class extends RecursiveAstVisitor {
      // Visit all binary operations in a template expression.
      visitBinary(ast: Binary, context: any): void {
        super.visitBinary(ast, context);

        // Check if this is a nullish coalescing operator.
        if (ast.operation == '??') {
          // Get the type of the value on the left side.
          const symbol =
              ctx.templateTypeChecker.getSymbolOfNode((ast.left as PropertyRead), ctx.clazz);
          const type = (symbol as ExpressionSymbol).tsType;
          // TODO: drop the span
          const span =
              ctx.templateTypeChecker
                  .getTemplateMappingAtShimLocation((symbol as ExpressionSymbol).shimLocation)
                  ?.span!;
          if (type.getNonNullableType() === type) {
            diagnostics.push(ctx.templateTypeChecker.makeTemplateDiagnostic(
                ctx.clazz, span, category, 4, `not nullable`))
          }
        }
      }
    };

    const visitor = new LintTemplateVisitor(astVisitor);

    visitor.visitAll(ctx.template);
    return diagnostics;
  }
}