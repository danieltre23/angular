import {TmplAstBoundEvent} from '@angular/compiler';
import * as ts from 'typescript';

import {LintContext, LintDiagnosticsImpl, LintTemplateVisitor, TemplateLintCheck} from '../api';

export class BananaLintCheck implements TemplateLintCheck {
  identifier = 'banana-lint-check';

  category = ts.DiagnosticCategory.Warning;

  run(ctx: LintContext): void {
    const category = this.category;

    const visitor = new class extends LintTemplateVisitor {
      visitBoundEvent(boundEvent: TmplAstBoundEvent): void {
        super.visitBoundEvent(boundEvent);
        const regexp = new RegExp('\[[^ ]*?\]');
        if (boundEvent.name.match(regexp)) {
          this.ctx.lintDiag.diagnostics.push(this.ctx.templateTypeChecker.makeTemplateDiagnostic(
              this.ctx.classDeclaration, boundEvent.sourceSpan, category, 4,
              `banana in a box error should be [()] not ([])`));
        }
      }
    }
    (ctx);

    visitor.visitAll(ctx.template);
  }
}