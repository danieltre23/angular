import {Binary, PropertyRead} from '@angular/compiler/src/compiler';
import * as ts from 'typescript';

import {ExpressionSymbol} from '../../typecheck/api';
import {LintAstVisitor, LintContext, LintDiagnosticsImpl, LintTemplateVisitor, TemplateLintCheck} from '../api';

export class NullishLintCheck implements TemplateLintCheck {
  identifier = 'nullish-lint-check';

  category = ts.DiagnosticCategory.Warning;

  run(ctx: LintContext): void {
    const category = this.category;

    const astVisitor = new class extends LintAstVisitor {
      visitBinary(ast: Binary, context: any): void {
        super.visitBinary(ast, context);

        const symbol = this.ctx.templateTypeChecker.getSymbolOfNode(
            (ast.left as PropertyRead), this.ctx.classDeclaration);
        const type = (symbol as ExpressionSymbol).tsType;
        const span =
            this.ctx.templateTypeChecker
                .getTemplateMappingAtShimLocation((symbol as ExpressionSymbol).shimLocation)
                ?.span!;
        if (type.getNonNullableType() === type) {
          this.ctx.lintDiag.diagnostics.push(this.ctx.templateTypeChecker.makeTemplateDiagnostic(
              this.ctx.classDeclaration, span, category, 4, `not nullable`))
        }
      }
    }
    (ctx);

    const visitor = new LintTemplateVisitor(ctx, astVisitor);

    visitor.visitAll(ctx.template)
  }
}