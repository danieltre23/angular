import {TmplAstBoundEvent} from '@angular/compiler';
import * as ts from 'typescript';

import {LintContext, LintTemplateVisitor, TemplateLintCheck} from '../api';

export class BananaLintCheck implements TemplateLintCheck {
  identifier = 'banana-lint-check';

  category = ts.DiagnosticCategory.Warning;

  run(ctx: LintContext): ts.Diagnostic[] {
    const category = this.category;
    const diagnostics: ts.Diagnostic[] = [];

    const visitor = new class extends LintTemplateVisitor {
      visitBoundEvent(boundEvent: TmplAstBoundEvent): void {
        super.visitBoundEvent(boundEvent);
        const regexp = new RegExp('\[[^ ]*?\]');
        if (boundEvent.name.match(regexp)) {
          diagnostics.push(ctx.templateTypeChecker.makeTemplateDiagnostic(
              ctx.clazz, boundEvent.sourceSpan, category, 4,
              `Banana in a box error should be [()] not ([])`));
        }
      }
    };

    visitor.visitAll(ctx.template);
    return diagnostics;
  }
}