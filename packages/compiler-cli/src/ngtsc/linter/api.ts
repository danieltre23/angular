import {TmplAstNode} from '@angular/compiler';
import {TmplAstRecursiveVisitor} from '@angular/compiler/src/compiler';
import ts = require('typescript');
import {ClassDeclaration} from '../reflection';
import {TemplateTypeChecker} from '../typecheck/api';
import {Banana2LintCheck} from './lintChecks/banana2lintcheck';
import {BananaLintCheck} from './lintChecks/bananalintcheck';
import {NullishLintCheck} from './lintChecks/nullishLintCheck';

export interface TemplateLintCheck {
  identifier: string;
  category: ts.DiagnosticCategory;
  run(ctx: LintContext): void;
}

export interface LintContext {
  template: TmplAstNode[];
  tcb: ts.Node;
  templateTypeChecker: TemplateTypeChecker;
  classDeclaration: ClassDeclaration<ts.ClassDeclaration>;
  typeChecker: ts.TypeChecker;
  lintDiag: LintDiagnosticsImpl;
  config: Record<string, unknown>|null;
}

interface LintDiagnostics {
  diagnostics: ReadonlyArray<ts.Diagnostic>;
  templateTypeChecker: TemplateTypeChecker;
  typeChecker: ts.TypeChecker;
  lintChecks: TemplateLintCheck[];

  lintClass(clazz: ts.ClassDeclaration): void;
}

export class LintDiagnosticsImpl implements LintDiagnostics {
  constructor(
      templateTypeChecker: TemplateTypeChecker, typeChecker: ts.TypeChecker,
      lintChecks?: TemplateLintCheck[]) {
    this.templateTypeChecker = templateTypeChecker;
    this.typeChecker = typeChecker;
    if (lintChecks !== undefined) {
      this.lintChecks = lintChecks;
    }
  }

  templateTypeChecker: TemplateTypeChecker;
  typeChecker: ts.TypeChecker;
  diagnostics: ts.Diagnostic[] = [];
  lintChecks: TemplateLintCheck[] =
      [new BananaLintCheck(), /*new Banana2LintCheck(),*/ new NullishLintCheck()];

  lintClass(clazz: ts.ClassDeclaration) {
    const template = this.templateTypeChecker.getTemplate(clazz);
    const tcb = this.templateTypeChecker.getTypeCheckBlock(clazz);
    if (template !== null && tcb !== null) {
      const ctx = {
        template: template,
        tcb: tcb,
        templateTypeChecker: this.templateTypeChecker,
        classDeclaration: clazz,
        typeChecker: this.typeChecker,
        lintDiag: this,
        config: null
      } as LintContext;

      this.lintChecks.forEach(check => {
        check.run(ctx);
      });
    }
  }
}

export class LintRecursiveVisitor extends TmplAstRecursiveVisitor {
  ctx: LintContext;
  constructor(ctx: LintContext) {
    super();
    this.ctx = ctx;
  }
}