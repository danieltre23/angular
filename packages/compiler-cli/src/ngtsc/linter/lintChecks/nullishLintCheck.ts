import {TmplAstElement, TmplAstTemplate} from '@angular/compiler/src/compiler';
import * as ts from 'typescript';

import {absoluteFromSourceFile} from '../../file_system';
import {LintContext, TemplateLintCheck} from '../api';
import {NullishAstVisitor, NullishVisitor} from './nullishVisitor';

export class NullishLintCheck implements TemplateLintCheck {
  identifier = 'nullish-lint-check';

  category = ts.DiagnosticCategory.Warning;

  run(ctx: LintContext): ts.Diagnostic[] {
    let diagnostics: ts.Diagnostic[] = [];
    const sfPath = absoluteFromSourceFile(ctx.classDeclaration.getSourceFile());

    ctx.template.forEach(template => {
      NullishVisitor.visit(
          template, ctx.templateTypeChecker, ctx.classDeclaration, ctx.typeChecker, ctx.lintDiag,
          sfPath);
    });

    return diagnostics;
  }
}