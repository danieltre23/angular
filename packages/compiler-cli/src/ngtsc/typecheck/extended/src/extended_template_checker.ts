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
import {ExtendedTemplateChecker, TemplateCheck, TemplateContext} from '../api';

export class ExtendedTemplateCheckerImpl implements ExtendedTemplateChecker {
  constructor(
      private readonly templateTypeChecker: TemplateTypeChecker,
      private readonly typeChecker: ts.TypeChecker,
      private readonly templateChecks: TemplateCheck<ErrorCode>[]) {}

  getExtendedTemplateDiagnosticsForComponent(component: ts.ClassDeclaration): TemplateDiagnostic[] {
    const template = this.templateTypeChecker.getTemplate(component);
    // Skip checks if component has no template. This can happen if the user writes a
    // `@Component()` but doesn't add the template, could happen in the language service
    // when users are in the middle of typing code.
    if (template === null) {
      return [];
    }
    const diagnostics: TemplateDiagnostic[] = [];

    const ctx = {
      templateTypeChecker: this.templateTypeChecker,
      typeChecker: this.typeChecker,
      component
    } as TemplateContext;

    for (const check of this.templateChecks) {
      diagnostics.push(...check.run(ctx, template));
    }

    return diagnostics;
  }
}
