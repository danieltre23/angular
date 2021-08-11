/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';
import {ErrorCode} from '../../src/ngtsc/diagnostics';
import {runInEachFileSystem} from '../../src/ngtsc/file_system/testing';
import {getSourceCodeForDiagnostic, loadStandardTestFiles} from '../../src/ngtsc/testing';

import {NgtscTestEnvironment} from './env';

const testFiles = loadStandardTestFiles({fakeCore: true, fakeCommon: true});

runInEachFileSystem(() => {
  describe('ngtsc extended template checks', () => {
    let env!: NgtscTestEnvironment;

    beforeEach(() => {
      env = NgtscTestEnvironment.setup(testFiles);
      env.tsconfig({extendedTemplateDiagnostics: true});
    });

    it('should produce invalid banana in box warning', () => {
      env.write('test.ts', `
              import {Component} from '@angular/core';
              @Component({
                selector: 'test',
                template: '<div ([foo])="bar"></div>',
              })
              class TestCmp { 
                bar: string = "text"; 
              }
            `);

      const diags = env.driveDiagnostics();
      expect(diags.length).toBe(1);
      expect(diags[0].category).toBe(ts.DiagnosticCategory.Warning);
      expect(diags[0].code).toBe(ErrorCode.INVALID_BANANA_IN_BOX);
      expect(getSourceCodeForDiagnostic(diags[0])).toBe('([foo])="bar"');
    });

    fit('should produce invalid banana in box warning with external html file', () => {
      env.write('test.ts', `
              import {Component} from '@angular/core';
              @Component({
                selector: 'test',
                templateUrl: './test.html',
              })
              class TestCmp { 
                bar: string = "text"; 
              }
            `);

      env.write('test.html', `
              <div ([foo])="bar"></div>
            `);

      const diags = env.driveDiagnostics();
      expect(diags.length).toBe(1);
      expect(diags[0].category).toBe(ts.DiagnosticCategory.Warning);
      expect(diags[0].code).toBe(ErrorCode.INVALID_BANANA_IN_BOX);
      expect(getSourceCodeForDiagnostic(diags[0])).toBe('([foo])="bar"');
    });
  });
});
