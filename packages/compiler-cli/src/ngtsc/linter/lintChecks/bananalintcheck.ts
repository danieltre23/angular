import {TmplAstBoundEvent, TmplAstElement, TmplAstNode, TmplAstRecursiveVisitor} from '@angular/compiler';
import * as ts from 'typescript';

import {absoluteFromSourceFile, AbsoluteFsPath} from '../../file_system';
import {TemplateTypeChecker} from '../../typecheck/api';
import {LintContext, LintDiagnosticsImpl, TemplateLintCheck} from '../api';

export class BananaLintCheck implements TemplateLintCheck {
  identifier = 'banana-lint-check';

  category = ts.DiagnosticCategory.Warning;

  run(ctx: LintContext): void {
    const sfPath = absoluteFromSourceFile(ctx.classDeclaration.getSourceFile());

    ctx.template.forEach(
        tmplNode => {BananaVisitor.visit(
            tmplNode, ctx.templateTypeChecker, ctx.lintDiag, sfPath, ctx.classDeclaration)})
    // const regexp = new RegExp('\[[^ ]*?\]');
    // ctx.template.forEach(tmplNode => {
    //   if (tmplNode instanceof TmplAstElement) {
    //     tmplNode.outputs.forEach(output => {
    //       if (output.name.match(regexp)) {
    //         ctx.lintDiag.diagnostics.push(ctx.templateTypeChecker.makeTemplateDiagnostic(
    //             ctx.classDeclaration, sfPath, output.sourceSpan, ts.DiagnosticCategory.Warning,
    //             4, `banana in a box error should be [()] not ([])`));
    //       }
    //     })
    //   }
    // })
  }
}

class BananaVisitor extends TmplAstRecursiveVisitor {
  constructor(
      private templateTypeChecker: TemplateTypeChecker, private lintDiags: LintDiagnosticsImpl,
      private sfPath: AbsoluteFsPath, private clazz: ts.ClassDeclaration) {
    super();
  }

  visitBoundEvent(boundEvent: TmplAstBoundEvent): void {
    super.visitBoundEvent(boundEvent);
    const regexp = new RegExp('\[[^ ]*?\]');
    if (boundEvent.name.match(regexp)) {
      this.lintDiags.diagnostics.push(this.templateTypeChecker.makeTemplateDiagnostic(
          this.clazz, this.sfPath, boundEvent.sourceSpan, ts.DiagnosticCategory.Warning, 4,
          `banana in a box error should be [()] not ([])`));
    }
  }

  static visit(
      node: TmplAstNode, templateTypeChecker: TemplateTypeChecker, lintDiags: LintDiagnosticsImpl,
      sfPath: AbsoluteFsPath, clazz: ts.ClassDeclaration): void {
    node.visit(new BananaVisitor(templateTypeChecker, lintDiags, sfPath, clazz));
  }
}