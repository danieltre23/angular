/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ErrorCode} from '../../diagnostics';
import {TemplateCheck} from './api/api';
import {InvalidBananaInBoxCheck} from './src/template_checks/invalid_banana_in_box';
import {NullishCoalescingNotNullableCheck} from './src/template_checks/nullish_coalescing_not_nullable';

export {ExtendedTemplateCheckerImpl} from './src/extended_template_checker';

export const allTemplateChecks: TemplateCheck<ErrorCode>[] =
    [new InvalidBananaInBoxCheck(), new NullishCoalescingNotNullableCheck()];
