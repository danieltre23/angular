/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';

import {absoluteFrom, AbsoluteFsPath, getSourceFileOrError} from '../../file_system';
import {runInEachFileSystem} from '../../file_system/testing';
import {lintClass} from '../../linter/api';
import {BananaLintCheck} from '../../linter/lintChecks/bananalintcheck';
import {TsCreateProgramDriver, UpdateMode} from '../../program_driver';
import {sfExtensionData, ShimReferenceTagger} from '../../shims';
import {expectCompleteReuse, makeProgram} from '../../testing';
import {OptimizeFor} from '../api';

import {getClass, setup} from './test_utils';

runInEachFileSystem.native(() => {
  describe('template type-checking program', () => {
    fit('lint prototipe unit', () => {
      const fileName = absoluteFrom('/main.ts');
      const dirFile = absoluteFrom('/dir.ts');
      const {program, templateTypeChecker, programStrategy} = setup([
        {
          fileName,
          templates: {
            'TestCmp': '<div ([input])="var1"> </div>',
          },
          source: 'export class TestCmp { var1: string = "text" }',
          declarations: [{
            name: 'TestDir',
            selector: '[dir]',
            file: dirFile,
            type: 'directive',
            inputs: {input: 'input'},
          }]
        },
        {
          fileName: dirFile,
          source: `
          import {Input, Output, EventEmitter} from '@angular/compiler';
          export class TestDir { @Input input: string; @Output inputChange = new EventEmitter<string>(); }
        `,
          templates: {},
        }
      ]);
      const sf = getSourceFileOrError(program, fileName);
      const clazz = getClass(sf, 'TestCmp');
      const diags =
          lintClass(clazz, templateTypeChecker, program.getTypeChecker(), [new BananaLintCheck()]);
      expect(diags.length).toBe(1);
      expect(diags[0].category).toBe(ts.DiagnosticCategory.Warning);
      expect(diags[0].messageText).toBe('Banana in a box error should be [()] not ([])');
    });

    it('should not be created if no components need to be checked', () => {
      const fileName = absoluteFrom('/main.ts');
      const {program, templateTypeChecker, programStrategy} = setup([{
        fileName,
        templates: {},
        source: `export class NotACmp {}`,
      }]);
      const sf = getSourceFileOrError(program, fileName);

      templateTypeChecker.getDiagnosticsForFile(sf, OptimizeFor.WholeProgram);
      // expect() here would create a really long error message, so this is checked manually.
      if (programStrategy.getProgram() !== program) {
        fail('Template type-checking created a new ts.Program even though it had no changes.');
      }
    });

    it('should have complete reuse if no structural changes are made to shims', () => {
      const {program, host, options, typecheckPath} = makeSingleFileProgramWithTypecheckShim();
      const programStrategy = new TsCreateProgramDriver(program, host, options, ['ngtypecheck']);

      // Update /main.ngtypecheck.ts without changing its shape. Verify that the old program was
      // reused completely.
      programStrategy.updateFiles(
          new Map([[typecheckPath, 'export const VERSION = 2;']]), UpdateMode.Complete);

      expectCompleteReuse(programStrategy.getProgram());
    });

    it('should have complete reuse if no structural changes are made to input files', () => {
      const {program, host, options, mainPath} = makeSingleFileProgramWithTypecheckShim();
      const programStrategy = new TsCreateProgramDriver(program, host, options, ['ngtypecheck']);

      // Update /main.ts without changing its shape. Verify that the old program was reused
      // completely.
      programStrategy.updateFiles(
          new Map([[mainPath, 'export const STILL_NOT_A_COMPONENT = true;']]), UpdateMode.Complete);

      expectCompleteReuse(programStrategy.getProgram());
    });
  });
});

function makeSingleFileProgramWithTypecheckShim(): {
  program: ts.Program,
  host: ts.CompilerHost,
  options: ts.CompilerOptions,
  mainPath: AbsoluteFsPath,
  typecheckPath: AbsoluteFsPath,
} {
  const mainPath = absoluteFrom('/main.ts');
  const typecheckPath = absoluteFrom('/main.ngtypecheck.ts');
  const {program, host, options} = makeProgram([
    {
      name: mainPath,
      contents: 'export const NOT_A_COMPONENT = true;',
    },
    {
      name: typecheckPath,
      contents: 'export const VERSION = 1;',
    }
  ]);

  const sf = getSourceFileOrError(program, mainPath);
  const typecheckSf = getSourceFileOrError(program, typecheckPath);

  // To ensure this test is validating the correct behavior, the initial conditions of the
  // input program must be such that:
  //
  // 1) /main.ts was previously tagged with a reference to its ngtypecheck shim.
  // 2) /main.ngtypecheck.ts is marked as a shim itself.

  // Condition 1:
  const tagger = new ShimReferenceTagger(['ngtypecheck']);
  tagger.tag(sf);
  tagger.finalize();

  // Condition 2:
  sfExtensionData(typecheckSf).fileShim = {
    extension: 'ngtypecheck',
    generatedFrom: mainPath,
  };

  return {program, host, options, mainPath, typecheckPath};
}
