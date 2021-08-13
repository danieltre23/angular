/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';
import {ErrorCode} from '../../../diagnostics';
import {TemplateDiagnostic, TemplateTypeChecker} from '../../api';
import {TemplateCheck, TemplateContext} from '../api/api';

/**
 * Run all `TemplateChecks` for a component and return the generated `ts.Diagnostic`s.
 * @param component the `@Component()` class from which the template is obtained
 * @param templateTypeChecker interface to get information about template nodes
 * @param typeChecker program's type checker
 * @param templateChecks specific checks to be run
 * @returns generated `ts.Diagnostic[]`
 */
export function getExtendedTemplateDiagnosticsForComponent(
    component: ts.ClassDeclaration, templateTypeChecker: TemplateTypeChecker,
    typeChecker: ts.TypeChecker, templateChecks: TemplateCheck<ErrorCode>[]): TemplateDiagnostic[] {
  const template = templateTypeChecker.getTemplate(component);
  // Skip checks if component has no template. This can happen if the user writes a
  // `@Component()` but doesn't add the template, could happen in the language service
  // when users are in the middle of typing code.
  if (template === null) {
    return [];
  }
  const diagnostics: TemplateDiagnostic[] = [];

  const ctx = {templateTypeChecker, typeChecker, component} as TemplateContext;

  for (const check of templateChecks) {
    diagnostics.push(...check.run(ctx, template));
  }

  return diagnostics;
}
