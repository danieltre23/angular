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
import {ExtendedTemplateChecker, TemplateCheck, TemplateCheckFactory, TemplateContext} from '../api';

export class ExtendedTemplateCheckerImpl implements ExtendedTemplateChecker {
  private ctx: TemplateContext;
  private templateChecks: TemplateCheck<ErrorCode>[];

  constructor(
      private readonly templateTypeChecker: TemplateTypeChecker,
      private readonly typeChecker: ts.TypeChecker,
      private readonly templateCheckClasses: TemplateCheckFactory[]) {
    this.ctx = {templateTypeChecker: this.templateTypeChecker, typeChecker: this.typeChecker} as
        TemplateContext;
    this.templateChecks = templateCheckClasses.map(check => {
      return check(this.ctx);
    });
  }

  getExtendedTemplateDiagnosticsForComponent(component: ts.ClassDeclaration): TemplateDiagnostic[] {
    const template = this.templateTypeChecker.getTemplate(component);
    // Skip checks if component has no template. This can happen if the user writes a
    // `@Component()` but doesn't add the template, could happen in the language service
    // when users are in the middle of typing code.
    if (template === null) {
      return [];
    }
    const diagnostics: TemplateDiagnostic[] = [];

    for (const check of this.templateChecks) {
      diagnostics.push(...deduplicateDiagnostics(check.run(component, template)));
    }

    return diagnostics;
  }
}


// Filter out duplicated diagnostics, this is possible due to the way the compiler
// handles desugaring and produces `AST`s. Ex.
//
// ```
// <div *ngIf="true" (foo)="bar">test</div>
// ```
//
// Would result in the following AST:
//
// ```
// Template {
//   outputs: [
//    BoundEvent {
//      name: 'foo',
//      /.../
//    }
//   ],
//   children: [
//     Element {
//       outputs: [
//         BoundEvent {
//           name: 'foo',
//           /.../
//         }
//       ]
//     }
//   ],
//   /.../
// }
// ```
//
// In this case a duplicated diagnostic could be generated for the output `foo`.
// TODO(danieltrevino): handle duplicated diagnostics when they are being generated
// to avoid extra work (could be directly in the visitor).
// https://github.com/angular/angular/pull/42984#discussion_r684823926
function deduplicateDiagnostics(diagnostics: TemplateDiagnostic[]): TemplateDiagnostic[] {
  const result: TemplateDiagnostic[] = [];
  for (const newDiag of diagnostics) {
    const isDuplicateDiag = result.some(existingDiag => areDiagnosticsEqual(newDiag, existingDiag));
    if (!isDuplicateDiag) {
      result.push(newDiag);
    }
  }
  return result;
}

function areDiagnosticsEqual(first: TemplateDiagnostic, second: TemplateDiagnostic): boolean {
  return first.file?.fileName === second.file?.fileName && first.start === second.start &&
      first.length === second.length && first.code === second.code;
}
