import { contextBridge, ipcRenderer } from "electron";
import type { IDirCheckerAPI } from "./interfaces/dir-checker-api.interface";


export const api: IDirCheckerAPI = {
	checkDirectories: (firstDirectoryPath, secondDirectoryPath, asArray, resultAsTree) => ipcRenderer.invoke('check-directories', { firstDirectoryPath, secondDirectoryPath, asArray, resultAsTree }),
	openExplorer: (path) => ipcRenderer.invoke('open-explorer', { path }),
	copyFile: (args) => ipcRenderer.invoke('copy-file', args),
	moveRenameFile: (oldPathFile, newPathFile) => ipcRenderer.invoke('move-rename-file', { oldPathFile, newPathFile }),
	copyFoldersTree: (oldPathFile, newPathFile) => ipcRenderer.invoke('copy-folders-tree', { oldPathFile, newPathFile }),
	createDirectory: (path) => ipcRenderer.invoke('create-directory', { path }),
	deleteFile: (path) => ipcRenderer.invoke('delete-file', { path }),
	deleteDirectory: (path) => ipcRenderer.invoke('delete-directory', { path }),
	recycleBin: (path) => ipcRenderer.invoke('recycle-bin', { path }),
	buildTreeFrom: (path) => ipcRenderer.invoke('build-tree-from', { path }),
	selectDirectoryDialog: () => ipcRenderer.invoke('select-directory-dialog'),
	readFile: (path) => ipcRenderer.invoke('read-file', { path }),
}

contextBridge.exposeInMainWorld('api', api);
