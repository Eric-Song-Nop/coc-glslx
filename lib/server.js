var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};

// src/server.ts
var fs = __toModule(require("fs"));
var import_vscode_uri = __toModule(require("vscode-uri"));
var path = __toModule(require("path"));
var glslx = __toModule(require("glslx"));
var server = __toModule(require("vscode-languageserver/node"));
var import_vscode_languageserver_textdocument = __toModule(require("vscode-languageserver-textdocument"));
var buildResults = () => ({});
var openDocuments;
var connection;
var timeout;
function reportErrors(callback) {
  try {
    callback();
  } catch (e) {
    let message = e && e.stack || e;
    connection.console.error("glslx: " + message);
    connection.window.showErrorMessage("glslx: " + message);
  }
}
function convertRange(range) {
  return {
    start: {
      line: range.start.line,
      character: range.start.column
    },
    end: {
      line: range.end.line,
      character: range.end.column
    }
  };
}
function uriToPath(value) {
  let parsed = import_vscode_uri.default.parse(value);
  return parsed.scheme === "file" ? path.normalize(parsed.fsPath) : null;
}
function pathToURI(value) {
  return import_vscode_uri.default.file(value).toString();
}
function sendDiagnostics(diagnostics, unusedSymbols) {
  let map = {};
  for (let diagnostic of diagnostics) {
    if (!diagnostic.range)
      continue;
    let key = diagnostic.range.source;
    let group = map[key] || (map[key] = []);
    group.push({
      severity: diagnostic.kind === "error" ? server.DiagnosticSeverity.Error : server.DiagnosticSeverity.Warning,
      range: convertRange(diagnostic.range),
      message: diagnostic.text
    });
  }
  for (let symbol of unusedSymbols) {
    let key = symbol.range.source;
    let group = map[key] || (map[key] = []);
    group.push({
      severity: server.DiagnosticSeverity.Hint,
      range: convertRange(symbol.range),
      message: `${JSON.stringify(symbol.name)} is never used in this file`,
      tags: [server.DiagnosticTag.Unnecessary]
    });
  }
  for (let doc of openDocuments.all()) {
    connection.sendDiagnostics({
      uri: doc.uri,
      diagnostics: map[doc.uri] || []
    });
  }
}
function buildOnce() {
  let results = {};
  reportErrors(() => {
    let unusedSymbols = [];
    let diagnostics = [];
    let docs = {};
    for (let doc of openDocuments.all()) {
      docs[doc.uri] = doc.getText();
    }
    function fileAccess(includeText, relativeURI) {
      let relativePath = uriToPath(relativeURI);
      let absolutePath = relativePath ? path.resolve(path.dirname(path.resolve(relativePath)), includeText) : path.resolve(includeText);
      let absoluteURI = pathToURI(absolutePath);
      if (absoluteURI in docs) {
        return {
          name: absoluteURI,
          contents: docs[absoluteURI]
        };
      }
      try {
        return {
          name: absoluteURI,
          contents: fs.readFileSync(absolutePath, "utf8")
        };
      } catch (e) {
        return null;
      }
    }
    for (let doc of openDocuments.all()) {
      let result = glslx.compileIDE({
        name: doc.uri,
        contents: docs[doc.uri]
      }, {
        fileAccess
      });
      results[doc.uri] = result;
      unusedSymbols.push.apply(unusedSymbols, result.unusedSymbols);
      diagnostics.push.apply(diagnostics, result.diagnostics);
    }
    sendDiagnostics(diagnostics, unusedSymbols);
  });
  return results;
}
function buildLater() {
  buildResults = () => {
    let result = buildOnce();
    buildResults = () => result;
    return result;
  };
  clearTimeout(timeout);
  timeout = setTimeout(buildResults, 100);
}
function computeTooltip(request) {
  let result = buildResults()[request.textDocument.uri];
  if (result) {
    let response = result.tooltipQuery({
      source: request.textDocument.uri,
      line: request.position.line,
      column: request.position.character,
      ignoreDiagnostics: true
    });
    if (response.tooltip !== null && response.range !== null) {
      return {
        contents: {
          kind: "markdown",
          value: "```glslx\n" + response.tooltip + "\n```\n" + response.documentation
        },
        range: convertRange(response.range)
      };
    }
  }
}
function computeDefinitionLocation(request) {
  let result = buildResults()[request.textDocument.uri];
  if (result) {
    let response = result.definitionQuery({
      source: request.textDocument.uri,
      line: request.position.line,
      column: request.position.character
    });
    if (response.definition !== null) {
      return {
        uri: response.definition.source,
        range: convertRange(response.definition)
      };
    }
  }
}
function computeDocumentSymbols(request) {
  let result = buildResults()[request.textDocument.uri];
  if (result) {
    let response = result.symbolsQuery({
      source: request.textDocument.uri
    });
    if (response.symbols !== null) {
      return response.symbols.map((symbol) => {
        return {
          name: symbol.name,
          kind: symbol.kind === "struct" ? server.SymbolKind.Class : symbol.kind === "function" ? server.SymbolKind.Function : server.SymbolKind.Variable,
          location: {
            uri: symbol.range.source,
            range: convertRange(symbol.range)
          }
        };
      });
    }
  }
}
function computeRenameEdits(request) {
  let result = buildResults()[request.textDocument.uri];
  if (result) {
    let response = result.renameQuery({
      source: request.textDocument.uri,
      line: request.position.line,
      column: request.position.character
    });
    if (response.ranges !== null) {
      let documentChanges = [];
      let map = {};
      for (let range of response.ranges) {
        let edits = map[range.source];
        if (!edits) {
          let doc = openDocuments.get(range.source);
          edits = map[range.source] = [];
          if (doc) {
            documentChanges.push({
              textDocument: {uri: range.source, version: doc.version},
              edits
            });
          }
        }
        edits.push({
          range: convertRange(range),
          newText: request.newName
        });
      }
      return {
        documentChanges
      };
    }
  }
}
function formatDocument(request) {
  let doc = openDocuments.get(request.textDocument.uri);
  if (!doc) {
    return [];
  }
  let options = request.options || {};
  let input = doc.getText();
  let output = glslx.format(input, {
    indent: options.insertSpaces ? " ".repeat(options.tabSize || 2) : "	",
    newline: "\n",
    trailingNewline: "insert"
  });
  if (input === output) {
    return [];
  }
  return [{
    range: {
      start: {
        line: 0,
        character: 0
      },
      end: doc.positionAt(input.length)
    },
    newText: output
  }];
}
function computeCompletion(request) {
  let result = buildResults()[request.textDocument.uri];
  if (result) {
    let response = result.completionQuery({
      source: request.textDocument.uri,
      line: request.position.line,
      column: request.position.character
    });
    return response.completions.map((completion) => ({
      kind: completion.kind === "struct" ? server.CompletionItemKind.Class : completion.kind === "function" ? server.CompletionItemKind.Function : completion.kind === "variable" ? server.CompletionItemKind.Variable : server.CompletionItemKind.Keyword,
      label: completion.name,
      documentation: completion.detail === "" ? void 0 : {
        kind: "markdown",
        value: "```glslx\n" + completion.detail + "\n```\n" + completion.documentation
      }
    }));
  }
}
function computeSignature(request) {
  let result = buildResults()[request.textDocument.uri];
  if (result) {
    let response = result.signatureQuery({
      source: request.textDocument.uri,
      line: request.position.line,
      column: request.position.character
    });
    return {
      activeSignature: response.activeSignature !== -1 ? response.activeSignature : null,
      activeParameter: response.activeArgument !== -1 ? response.activeArgument : null,
      signatures: response.signatures.map((signature) => ({
        label: signature.text,
        documentation: signature.documentation === "" ? void 0 : {
          kind: "markdown",
          value: signature.documentation
        },
        parameters: signature.arguments.map((arg) => ({
          label: arg
        }))
      }))
    };
  }
}
function main() {
  connection = server.createConnection(new server.IPCMessageReader(process), new server.IPCMessageWriter(process));
  reportErrors(() => {
    openDocuments = new server.TextDocuments(import_vscode_languageserver_textdocument.TextDocument);
    openDocuments.listen(connection);
    openDocuments.onDidChangeContent(buildLater);
    connection.onInitialize(() => {
      buildLater();
      return {
        capabilities: {
          textDocumentSync: server.TextDocumentSyncKind.Incremental,
          hoverProvider: true,
          renameProvider: true,
          definitionProvider: true,
          documentSymbolProvider: true,
          documentFormattingProvider: true,
          signatureHelpProvider: {
            triggerCharacters: ["(", ","]
          },
          completionProvider: {
            triggerCharacters: ["."]
          }
        }
      };
    });
    connection.onHover((request) => {
      let tooltip;
      reportErrors(() => {
        tooltip = computeTooltip(request);
      });
      return tooltip;
    });
    connection.onDefinition((request) => {
      let location;
      reportErrors(() => {
        location = computeDefinitionLocation(request);
      });
      return location;
    });
    connection.onDocumentSymbol((request) => {
      let info;
      reportErrors(() => {
        info = computeDocumentSymbols(request);
      });
      return info;
    });
    connection.onRenameRequest((request) => {
      let edits;
      reportErrors(() => {
        edits = computeRenameEdits(request);
      });
      return edits;
    });
    connection.onDocumentFormatting((request) => {
      let edits;
      reportErrors(() => {
        edits = formatDocument(request);
      });
      return edits;
    });
    connection.onCompletion((request) => {
      let result;
      reportErrors(() => {
        result = computeCompletion(request);
      });
      return result;
    });
    connection.onSignatureHelp((request) => {
      let result;
      reportErrors(() => {
        result = computeSignature(request);
      });
      return result;
    });
    connection.onDidChangeWatchedFiles(buildLater);
  });
  connection.listen();
}
main();
