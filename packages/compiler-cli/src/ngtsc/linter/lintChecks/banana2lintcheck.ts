import {TmplAstElement} from '@angular/compiler';
import * as ts from 'typescript';

import {absoluteFromSourceFile} from '../../file_system';
import {LintContext, TemplateLintCheck} from '../api';

export class Banana2LintCheck implements TemplateLintCheck {
  identifier = 'banana-lint-check';

  category = ts.DiagnosticCategory.Warning;

  run(ctx: LintContext): void {
    const sfPath = absoluteFromSourceFile(ctx.classDeclaration.getSourceFile());

    const regexp = new RegExp('\[[^ ]*?\]');
    const firstNode = ctx.template ![0];
    if (firstNode instanceof TmplAstElement) {
      firstNode.outputs.forEach(output => {
        if (output.name.match(regexp)) {
          ctx.lintDiag.diagnostics.push(ctx.templateTypeChecker.makeTemplateDiagnostic(
              ctx.classDeclaration, sfPath, output.sourceSpan, ts.DiagnosticCategory.Warning, 4,
              `banana 2`));
        }
      })
    }
  }
}