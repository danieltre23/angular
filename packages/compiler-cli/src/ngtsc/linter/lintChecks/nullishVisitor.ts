/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AST, Binary, RecursiveAstVisitor, TmplAstBoundAttribute, TmplAstBoundEvent, TmplAstBoundText, TmplAstContent, TmplAstElement, TmplAstIcu, TmplAstNode, TmplAstRecursiveVisitor, TmplAstReference, TmplAstTemplate, TmplAstText, TmplAstTextAttribute, TmplAstVariable} from '@angular/compiler';
import {PropertyRead} from '@angular/compiler/src/compiler';
import {visitAll} from '@angular/compiler/src/render3/r3_ast';

import ts = require('typescript');
import {AbsoluteFsPath} from '../../file_system';
import {TemplateTypeChecker, ExpressionSymbol} from '../../typecheck/api';
import {LintDiagnosticsImpl} from '../api';

export class NullishAstVisitor extends RecursiveAstVisitor {
  constructor(
      private templateTypeChecker: TemplateTypeChecker, private clazz: ts.ClassDeclaration,
      private typeChecker: ts.TypeChecker, private lintDiags: LintDiagnosticsImpl,
      private sfPath: AbsoluteFsPath) {
    super();
  }

  visitBinary(ast: Binary, context: any): void {
    super.visitBinary(ast, context);

    const symbol = this.templateTypeChecker.getSymbolOfNode((ast.left as PropertyRead), this.clazz);
    const type = (symbol as ExpressionSymbol).tsType;
    const span = this.templateTypeChecker
                     .getTemplateMappingAtShimLocation((symbol as ExpressionSymbol).shimLocation)
                     ?.span!;
    if (this.typeChecker.getNonNullableType(type) === type) {
      this.lintDiags.diagnostics.push(this.templateTypeChecker.makeTemplateDiagnostic(
          this.clazz, this.sfPath, span, ts.DiagnosticCategory.Warning, 4, `not nullable`))
    }
  }

  static visit(
      ast: AST, templateTypeChecker: TemplateTypeChecker, clazz: ts.ClassDeclaration,
      typeChecker: ts.TypeChecker, lintDiags: LintDiagnosticsImpl, sfPath: AbsoluteFsPath): void {
    ast.visit(new NullishAstVisitor(templateTypeChecker, clazz, typeChecker, lintDiags, sfPath));
  }
}

export class NullishVisitor extends TmplAstRecursiveVisitor {
  constructor(
      private templateTypeChecker: TemplateTypeChecker, private clazz: ts.ClassDeclaration,
      private typeChecker: ts.TypeChecker, private lintDiags: LintDiagnosticsImpl,
      private sfPath: AbsoluteFsPath) {
    super();
  }

  visitBoundText(boundText: TmplAstBoundText): void {
    super.visitBoundText(boundText);
    NullishAstVisitor.visit(
        boundText.value, this.templateTypeChecker, this.clazz, this.typeChecker, this.lintDiags,
        this.sfPath);
  }

  visitBoundAttribute(boundAttribute: TmplAstBoundAttribute): void {
    super.visitBoundAttribute(boundAttribute);
    NullishAstVisitor.visit(
        boundAttribute.value, this.templateTypeChecker, this.clazz, this.typeChecker,
        this.lintDiags, this.sfPath);
  }

  visitBoundEvent(boundEvent: TmplAstBoundEvent): void {
    super.visitBoundEvent(boundEvent);
    NullishAstVisitor.visit(
        boundEvent.handler, this.templateTypeChecker, this.clazz, this.typeChecker, this.lintDiags,
        this.sfPath);
  }

  static visit(
      node: TmplAstNode, templateTypeChecker: TemplateTypeChecker, clazz: ts.ClassDeclaration,
      typeChecker: ts.TypeChecker, lintDiags: LintDiagnosticsImpl, sfPath: AbsoluteFsPath): void {
    node.visit(new NullishVisitor(templateTypeChecker, clazz, typeChecker, lintDiags, sfPath));
  }
}