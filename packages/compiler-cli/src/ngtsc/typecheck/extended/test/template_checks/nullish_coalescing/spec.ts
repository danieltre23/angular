/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';
import {ErrorCode} from '../../../../../diagnostics';
import {absoluteFrom, getSourceFileOrError} from '../../../../../file_system';
import {runInEachFileSystem} from '../../../../../file_system/testing';
import {getSourceCodeForDiagnostic} from '../../../../../testing';
import {getClass, setup} from '../../../../testing';
import {getExtendedTemplateDiagnosticsForComponent} from '../../../src/template_checker';
import {NullishCoalesingCheck} from '../../../src/template_checks/nullish_coalescing';

runInEachFileSystem(() => {
  describe('TemplateChecks', () => {
    it('should produce nullish coalescing warning', () => {
      const fileName = absoluteFrom('/main.ts');
      const {program, templateTypeChecker} = setup([{
        fileName,
        templates: {
          'TestCmp': '<div (input)="var1 ?? null"> </div>',
        },
        source: 'export class TestCmp { var1: string = "text"; }'
      }]);
      const sf = getSourceFileOrError(program, fileName);
      const component = getClass(sf, 'TestCmp');
      const diags = getExtendedTemplateDiagnosticsForComponent(
          component, templateTypeChecker, program.getTypeChecker(), [new NullishCoalesingCheck()]);
      expect(diags.length).toBe(1);
      expect(diags[0].category).toBe(ts.DiagnosticCategory.Warning);
      expect(diags[0].code).toBe(ErrorCode.NULLISH_COALESCING);
      expect(getSourceCodeForDiagnostic(diags[0])).toBe('var1');
    });
  });
});
