import * as path from 'path';
import { ServerOptions, LanguageClientOptions, LanguageClient, window, ExtensionContext, TransportKind, workspace } from 'coc.nvim'


export function activate(context: ExtensionContext) {

  let serverModule = path.join(__dirname, 'server.js');
  let serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc },
  };

  let clientOptions: LanguageClientOptions = {
    documentSelector: ['glslx'],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/*.glslx'),
    },
  };

  let server = new LanguageClient('GLSLX', serverOptions, clientOptions);
  context.subscriptions.push(server.start());
}
