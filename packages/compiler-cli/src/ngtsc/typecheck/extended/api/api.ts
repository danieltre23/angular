/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AST, RecursiveAstVisitor, TmplAstBoundAttribute, TmplAstBoundEvent, TmplAstBoundText, TmplAstContent, TmplAstElement, TmplAstIcu, TmplAstNode, TmplAstRecursiveVisitor, TmplAstReference, TmplAstTemplate, TmplAstText, TmplAstTextAttribute, TmplAstVariable} from '@angular/compiler';
import {ASTWithSource} from '@angular/compiler/src/compiler';
import * as ts from 'typescript';

import {ErrorCode} from '../../../diagnostics';
import {TemplateDiagnostic, TemplateTypeChecker} from '../../api';

/**
 * A `ts.Diangostic` with a specific error code.
 */
// TODO: merge `ExtendedTemplateDiagnostic` and `TemplateDiagnostic`
export type ExtendedTemplateDiagnostic<T extends ErrorCode> = TemplateDiagnostic&{code: T};

/**
 * A Template Check receives information about the template it's checking and returns
 * information about the diagnostics to be generated.
 */
export interface TemplateCheck<T extends ErrorCode> {
  /** Unique template check code, used for configuration and searching the error. */
  code: T;

  /** Runs check and returns information about the diagnostics to be generated. */
  run(ctx: TemplateContext, template: TmplAstNode[]): ExtendedTemplateDiagnostic<T>[];
}

/**
 * The TemplateContext provided to a Template Check to get diagnostic information.
 */
export interface TemplateContext {
  /** Interface that provides information about template nodes. */
  templateTypeChecker: TemplateTypeChecker;

  /**
   * TypeScript interface that provides type information about symbols that appear
   * in the template (it is not to query types outside the Angular component).
   */
  typeChecker: ts.TypeChecker;

  /** The `@Component()` class from which the template was obtained. */
  component: ts.ClassDeclaration;
}

/**
 * This abstract class provides a base implementation for the run method.
 */
export abstract class TemplateCheckWithVisitor<T extends ErrorCode> implements TemplateCheck<T> {
  abstract code: T;

  /**
   * Base implementation for run function, visits all nodes in template and calls
   * `visitNode()` for each one.
   */
  run(ctx: TemplateContext, template: TmplAstNode[]): ExtendedTemplateDiagnostic<T>[] {
    const visitor = new CompleteVisitor<T>(ctx, this);
    return visitor.getDiagnostics(template);
  }

  /**
   * Visit a TmplAstNode or AST node of the template. Authors should override this
   * method to implement the check and return diagnostics.
   */
  abstract visitNode(ctx: TemplateContext, node: TmplAstNode|AST): ExtendedTemplateDiagnostic<T>[];
}

class CompleteVisitor<T extends ErrorCode> extends RecursiveAstVisitor implements
    TmplAstRecursiveVisitor {
  diagnostics: ExtendedTemplateDiagnostic<T>[] = [];

  constructor(readonly ctx: TemplateContext, readonly check: TemplateCheckWithVisitor<T>) {
    super();
  }

  override visit(node: AST|TmplAstNode, context?: any) {
    this.diagnostics.push(...this.check.visitNode(this.ctx, node));
    node.visit(this);
  }

  visitAllNodes(nodes: TmplAstNode[]) {
    for (const node of nodes) {
      this.visit(node);
    }
  }

  visitAst(ast: AST) {
    if (ast instanceof ASTWithSource) {
      ast = ast.ast;
    }
    this.visit(ast);
  }

  visitElement(element: TmplAstElement) {
    this.visitAllNodes(element.attributes);
    this.visitAllNodes(element.inputs);
    this.visitAllNodes(element.outputs);
    this.visitAllNodes(element.references);
    this.visitAllNodes(element.children);
  }

  visitTemplate(template: TmplAstTemplate) {
    this.visitAllNodes(template.attributes);
    if (template.tagName === 'ng-template') {
      this.visitAllNodes(template.inputs);
      this.visitAllNodes(template.outputs);
      this.visitAllNodes(template.templateAttrs);
    }
    this.visitAllNodes(template.variables);
    this.visitAllNodes(template.references);
    this.visitAllNodes(template.children);
  }
  visitContent(content: TmplAstContent): void {}
  visitVariable(variable: TmplAstVariable): void {}
  visitReference(reference: TmplAstReference): void {}
  visitTextAttribute(attribute: TmplAstTextAttribute): void {}
  visitBoundAttribute(attribute: TmplAstBoundAttribute): void {
    this.visitAst(attribute.value);
  }
  visitBoundEvent(attribute: TmplAstBoundEvent): void {
    this.visitAst(attribute.handler);
  }
  visitText(text: TmplAstText): void {}
  visitBoundText(text: TmplAstBoundText): void {
    this.visitAst(text.value);
  }
  visitIcu(icu: TmplAstIcu): void {}

  getDiagnostics(template: TmplAstNode[]): ExtendedTemplateDiagnostic<T>[] {
    this.diagnostics = [];
    this.visitAllNodes(template);
    return this.diagnostics;
  }
}
