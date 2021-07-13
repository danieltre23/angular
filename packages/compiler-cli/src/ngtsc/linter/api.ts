import {TmplAstNode} from '@angular/compiler';
import {RecursiveAstVisitor, TmplAstBoundAttribute, TmplAstBoundEvent, TmplAstBoundText, TmplAstElement, TmplAstRecursiveVisitor, TmplAstTemplate} from '@angular/compiler/src/compiler';

import ts = require('typescript');
import {ClassDeclaration} from '../reflection';
import {TemplateTypeChecker} from '../typecheck/api';
import {BananaLintCheck} from './lintChecks/bananalintcheck';
import {NullishLintCheck} from './lintChecks/nullishLintCheck';

export interface TemplateLintCheck {
  identifier: string;
  category: ts.DiagnosticCategory;
  run(ctx: LintContext): void;
}

export interface LintContext {
  template: TmplAstNode[];
  templateTypeChecker: TemplateTypeChecker;
  classDeclaration: ClassDeclaration<ts.ClassDeclaration>;
  lintDiag: LintDiagnosticsImpl;
  config: Record<string, unknown>|null;
}

interface LintDiagnostics {
  diagnostics: ReadonlyArray<ts.Diagnostic>;
  templateTypeChecker: TemplateTypeChecker;
  lintChecks: TemplateLintCheck[];

  lintClass(clazz: ts.ClassDeclaration): void;
}

export class LintDiagnosticsImpl implements LintDiagnostics {
  constructor(templateTypeChecker: TemplateTypeChecker, lintChecks?: TemplateLintCheck[]) {
    this.templateTypeChecker = templateTypeChecker;
    if (lintChecks !== undefined) {
      this.lintChecks = lintChecks;
    }
  }

  templateTypeChecker: TemplateTypeChecker;
  diagnostics: ts.Diagnostic[] = [];
  lintChecks: TemplateLintCheck[] = [new BananaLintCheck(), new NullishLintCheck()];

  lintClass(clazz: ts.ClassDeclaration) {
    const template = this.templateTypeChecker.getTemplate(clazz);
    if (template !== null) {
      const ctx = {
        template: template,
        templateTypeChecker: this.templateTypeChecker,
        classDeclaration: clazz,
        lintDiag: this,
        config: null
      } as LintContext;

      this.lintChecks.forEach(check => {
        check.run(ctx);
      });
    }
  }
}

export class LintAstVisitor extends RecursiveAstVisitor {
  ctx: LintContext;

  constructor(ctx: LintContext) {
    super();
    this.ctx = ctx;
  }
}

export class LintTemplateVisitor extends TmplAstRecursiveVisitor {
  ctx: LintContext;
  withAstVisitor: LintAstVisitor|undefined;

  constructor(ctx: LintContext, withAstVisitor?: LintAstVisitor) {
    super();
    this.ctx = ctx;
    this.withAstVisitor = withAstVisitor
  }

  visit(node: TmplAstNode) {
    node.visit(this);
  }

  visitAll(nodes: TmplAstNode[]) {
    nodes.forEach(node => this.visit(node));
  }

  visitElement(element: TmplAstElement) {
    this.visitAll(element.references);
    this.visitAll(element.inputs);
    this.visitAll(element.attributes);
    this.visitAll(element.children);
    this.visitAll(element.outputs);
  }

  visitTemplate(template: TmplAstTemplate) {
    this.visitAll(template.variables);
    this.visitAll(template.attributes);
    this.visitAll(template.templateAttrs);
    this.visitAll(template.children);
    this.visitAll(template.references);
  }

  visitBoundText(boundText: TmplAstBoundText): void {
    if (this.withAstVisitor !== undefined) {
      this.withAstVisitor.visit(boundText.value);
    }
  }

  visitBoundAttribute(boundAttribute: TmplAstBoundAttribute): void {
    if (this.withAstVisitor !== undefined) {
      this.withAstVisitor.visit(boundAttribute.value);
    }
  }

  visitBoundEvent(boundEvent: TmplAstBoundEvent): void {
    if (this.withAstVisitor !== undefined) {
      this.withAstVisitor.visit(boundEvent.handler);
    }
  }
}