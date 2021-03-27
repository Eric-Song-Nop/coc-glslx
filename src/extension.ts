import * as path from 'path';
import * as coc from 'coc.nvim';
import client from 'coc.nvim'

export function activate(context: coc.ExtensionContext) {
  let serverModule = path.join(__dirname, 'server.js');

  let serverOptions: client.ServerOptions = {
    run: { module: serverModule, transport: client.TransportKind.ipc },
    debug: { module: serverModule, transport: client.TransportKind.ipc },
  };

  let clientOptions: client.LanguageClientOptions = {
    documentSelector: ['glslx'],
    synchronize: {
      fileEvents: coc.workspace.createFileSystemWatcher('**/*.glslx'),
    },
  };

  let server = new client.LanguageClient('GLSLX', serverOptions, clientOptions);
  context.subscriptions.push(server.start());
}
