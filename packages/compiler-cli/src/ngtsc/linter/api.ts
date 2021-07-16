import {RecursiveAstVisitor, TmplAstBoundAttribute, TmplAstBoundEvent, TmplAstBoundText, TmplAstElement, TmplAstNode, TmplAstRecursiveVisitor, TmplAstTemplate} from '@angular/compiler';

import ts = require('typescript');
import {ClassDeclaration} from '../reflection';
import {TemplateTypeChecker} from '../typecheck/api';
import {BananaLintCheck} from './lintChecks/bananalintcheck';
import {NullishLintCheck} from './lintChecks/nullishLintCheck';

export interface TemplateLintCheck {
  identifier: string;
  category: ts.DiagnosticCategory;
  run(ctx: LintContext): ts.Diagnostic[];
}

export interface LintContext {
  template: TmplAstNode[];
  templateTypeChecker: TemplateTypeChecker;
  typeChecker: ts.TypeChecker;
  clazz: ts.ClassDeclaration;
}

export function lintClass(
    clazz: ts.ClassDeclaration, templateTypeChecker: TemplateTypeChecker,
    typeChecker: ts.TypeChecker, lintChecks?: TemplateLintCheck[]): ts.Diagnostic[] {
  if (lintChecks === undefined) {
    lintChecks = [new BananaLintCheck(), new NullishLintCheck()];
  }
  const diagnostics: ts.Diagnostic[] = [];

  const template = templateTypeChecker.getTemplate(clazz);
  if (template !== null) {
    const ctx = {template, templateTypeChecker, typeChecker, clazz, config: null} as LintContext;

    lintChecks.forEach(check => {
      diagnostics.push(...check.run(ctx));
    });
  }

  return diagnostics;
}

export class LintTemplateVisitor extends TmplAstRecursiveVisitor {
  withAstVisitor: RecursiveAstVisitor|undefined;

  constructor(withAstVisitor?: RecursiveAstVisitor) {
    super();
    this.withAstVisitor = withAstVisitor;
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