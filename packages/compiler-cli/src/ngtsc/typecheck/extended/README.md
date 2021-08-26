# The Extended Template Diagnostics Engine

The `extended` package provides the infrastructure to run `TemplateCheck`s and generate extended template diagnostics. This package provides an API to author `TemplateCheck`s and provides a helper class to make the authoring process easier. The `ExtendedTemplateChecker` and individual `TemplateCheck`s are exposed to other packages and the responsability to run the checks is delegated to the compiler. The compiler creates an `ExtendedTemplateChecker` with the checks it wants to run and requests diagnostics for component when needed, if the `_extendedTemplateDiagnostics` flag is on.

## Implementing a Template Check

The `TemplateCheck` API consists of an `ErrorCode` and the `run` function which returns `NgTemplateDiagnostic` (branded `TemplateDiagnostics`). 

To implement a `TemplateCheck` a new `ErrorCode` should be created and assigned to the check, and the `run` function should be implemented. The `run` function would recieve the component, the array of template nodes and the `TemplateContext`, which consists of the `TemplateTypeChecker` and the `ts.TypeChecker`. The author of the check would need to implement a `Visitor` and generate diagnostics if the conditions for that check are met. The `TemplateTypeChecker` provides the `makeTemplateDiagnostic` function to generate the `NgTemplateDiagnostic`s.

### Using TemplateCheckWithVisitor

The `TemplateCheckWithVisitor` abstract class implements a `Visitor` so that each check doesn't have to, it implements the `run` function and calls `visitNode` for every node it finds. The author of the `TemplateCheck` should extend the `TemplateCheckWithVisitor` class and override the `code` property and `visitNode` function to generate and return the diagnostics found. 

### Integrating with the Compiler

The `NgCompiler` is in charge of deciding which checks to run, so after implementing the `TemplateCheck`, the author should also add the logic of whether or not to run the check in the [compiler](../../core/src/compiler.ts).