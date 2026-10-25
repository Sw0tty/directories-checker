import { app, BrowserWindow, ipcMain, shell, protocol, net } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { FileSystemUtils } from './functions/backend';
import { imageMediaProtocol, videoMediaProtocol } from './consts/protocol.consts';
import { schemes } from './consts/protocol.consts';


protocol.registerSchemesAsPrivileged(schemes);

if (started) {
  app.quit();
}

const createWindow = () => {
	const mainWindow = new BrowserWindow({
			width: 1000,
			height: 700,
			webPreferences: {
				preload: path.join(__dirname, 'preload.js'),
        		nodeIntegration: false,
            webSecurity: true,
			},
	});

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {

  protocol.handle(videoMediaProtocol, async (request) => {
    return FileSystemUtils.streamVideoFile(request);
  });

  protocol.handle(imageMediaProtocol, (request) => {
    return net.fetch(`file://${FileSystemUtils.resolveProtocolPath(request.url, imageMediaProtocol)}`);
  });

  ipcMain.handle('delete-file', (_: any, args: { path: string }) => {
    const { path } = args;
    return FileSystemUtils.deleteFile(path);
  });

  ipcMain.handle('delete-directory', (_, args: { path: string }) => {
    const { path } = args;
    return FileSystemUtils.deleteDirectory(path);
  });

  ipcMain.handle('create-directory', (_, args: { path: string }) => {
    const { path } = args;
    return FileSystemUtils.createDirectory(path.trim());
  });

  ipcMain.handle('move-rename-file', (_, args: { oldPathFile: string, newPathFile: string }) => {
    const { oldPathFile, newPathFile } = args;
    return FileSystemUtils.moveRenameFile(oldPathFile, newPathFile);
  });

  ipcMain.handle('open-explorer', (_, args: { path: string }) => {
    const { path } = args;
    shell.openPath(path);
  });

  ipcMain.handle('recycle-bin', (_, args) => {
    const { path } = args;
    return FileSystemUtils.recycleBin(path);
  });

  ipcMain.handle('select-directory-dialog', (event) => {
    return FileSystemUtils.selectDirectoryDialog(BrowserWindow.fromWebContents(event.sender) as BrowserWindow);
  });

  ipcMain.handle('check-directories', (_, args) => {
    const { firstDirectoryPath, secondDirectoryPath, asArray, resultAsTree } = args;
    if (asArray) {
      return FileSystemUtils.buildTreesAsArray(firstDirectoryPath, secondDirectoryPath, resultAsTree);
    }
    return FileSystemUtils.buildTreesAsTree(firstDirectoryPath, secondDirectoryPath);
  });

  ipcMain.handle('copy-file', (_, args) => {
    return FileSystemUtils.copyFile(args);
  });

  ipcMain.handle('read-file', (_, args: { path: string }) => {
    const { path } = args;
    return FileSystemUtils.readFile(path);
  })

  ipcMain.handle('build-tree-from', (_, args) => {
    const { path } = args;
    return FileSystemUtils.buildTreeFrom(path);
  });

  ipcMain.handle('copy-folders-tree', (_, args) => {
    const { oldPathFile, newPathFile } = args;
    return FileSystemUtils.copyFoldersTree(oldPathFile, newPathFile);
  });

  createWindow();
});
