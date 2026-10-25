import * as fs from 'fs';
import path from 'node:path';
import { sortTree, getMimeElement, getPromiseObject, makeTreeFromArray } from './common-functions';
import { Response as AppResponse } from '../types/response.type';
import { getDateTime } from './common-functions';
import { CopyFileData } from 'src/types/copy-file-data.type';
import { FileInfo } from 'src/types/file-info.type';
import { BrowserWindow, dialog, shell } from 'electron';
import { SelectDirectoryDialogData } from 'src/types/response-data/select-directory-dialog.data.type';
import { UUID } from 'crypto';
import { RecurseDirectoryResult } from 'src/types/recurse-directory-result.type';
import { CheckDirectoriesData } from 'src/types/response-data/check-directories.data.type';
import { FileStatuses } from '../enums/file-statuses.enum';
import { videoMediaProtocol } from '../consts/protocol.consts';
import { Readable } from 'stream';


export class FileSystemUtils {

    private constructor() {}

    static async selectDirectoryDialog(mainWindow: BrowserWindow): Promise<AppResponse<SelectDirectoryDialogData>> {
        const result = await dialog.showOpenDialog(
            mainWindow,
            {
                properties: ['openDirectory']
            }
        );

        if (result.filePaths[0]) {
            return getPromiseObject(true, { data: { path: result.filePaths[0] } })
        }
        return getPromiseObject(true, { error: 'Directory not selected.' })
    }

    static checkPath(path: string): boolean {
        return fs.existsSync(path);
    }

    static async recycleBin(path: string): Promise<AppResponse> {
        if (!this.checkPath(path)) {
            return getPromiseObject(false, { error: 'Error! File does not exist!' });
        }
        return new Promise((resolve) => {
            shell.trashItem(path).then(() => {
                resolve({ ok: true })
            });
        });
    }

    static async deleteFile(path: string): Promise<AppResponse> {
        if (!this.checkPath(path)) {
            return getPromiseObject(false, { error: 'Error! File does not exist!' });
        }
        return new Promise((resolve) => {
            fs.unlink(path, (error) => {
                if (error) {
                    resolve({ ok: false, error: error });
                }
                resolve({ ok: true });
            })
        });
    }

    static async deleteDirectory(path: string): Promise<AppResponse> {
        if (!this.checkPath(path)) {
            return new Promise((resolve) => {
                resolve({ ok: false, error: 'Error! Directory does not exist!' });
            });
        }
        return new Promise((resolve) => {
            fs.rmdir(path, (error) => {
                if (error) {
                    resolve({ ok: false, error: error });
                }
                resolve({ ok: true });
            });
        });
    }

    static async moveRenameFile(oldPathFile: string, newPathFile: string): Promise<AppResponse> {
        if (this.checkPath(newPathFile)) {
            return new Promise((resolve) => {
                resolve({ ok: false, error: 'Error! File/directory already exist!' });
            })
        }
        return new Promise((resolve) => {
            fs.rename(oldPathFile, newPathFile, (error) => {
                if (error) {
                    resolve({ ok: false, error: error });
                }
                resolve({ ok: true });
            })
        })
    }

    static async createDirectory(path: string): Promise<AppResponse> {
        if (!path.trim()) {
            return new Promise((resolve) => {
                resolve({ ok: false, error: 'Не указано наименование новой директории' });
            })
        }
        if (this.checkPath(path)) {
            return new Promise((resolve) => {
                resolve({ ok: false, error: 'Error! Directory exist!' });
            })
        }
        return new Promise((resolve) => {
            fs.mkdir(path, (error) => {
                if (error) {
                    resolve({ ok: false, error: error });
                }
                resolve({ ok: true });
            });
        });
    }

    static async copyFile(data: CopyFileData): Promise<AppResponse> {
        const { filePath, destination, fullFileName, destParentPath, destRootPath, fileLevel, fullCopy } = data;

        if (this.checkPath(destination)) {
            return new Promise((resolve) => {
                resolve({ ok: false, error: 'Error. This file or another file with same name already exist in destination directory.' });
            });
        }
        return new Promise((resolve) => {
            fs.copyFile(filePath, destination, (error) => {
                if (error) {
                    resolve({ ok: false, error: error });
                }
                console.log('File copy complete!');
                
                if (fullCopy) {
                    const originFileData = fs.lstatSync(filePath);
                    fs.utimes(destination, originFileData.atimeMs, originFileData.mtimeMs, () => {
                        resolve({ ok: true, data: { file: this.getFileData(fullFileName, destParentPath, fileLevel, destRootPath) } });
                    })
                } else {
                    resolve({ ok: true, data: { file: this.getFileData(fullFileName, destParentPath, fileLevel, destRootPath) } });
                }
            });
        });
    }

    static async readFile(path: string) {
        if (this.checkPath(path)) {
            return new Promise((resolve) => {
                resolve({ ok: false, error: 'Error. Passed file path incorrect. Check the file and try again.' });
            });
        }
        return new Promise((resolve) => {
            fs.readFile(path, (error, data) => {
                if (error) {
                    resolve({ ok: false, error: error });
                }
                resolve({ ok: true, data: { buffer: data } });
            });
        });
    }

    static readDirectory(path: string, checkingLevel: number, rootPath: string, parentUuid: UUID): FileInfo[] {
        return fs.readdirSync(path).map(fileName => {
            return this.getFileData(fileName, path, checkingLevel, rootPath, parentUuid);
        });
    };

    static getFileData(fullFileName: string, parentPath: string, fileLevel: number, rootPath: string, parentUuid: UUID): FileInfo {
        //const { fullFileName, parentPath, parentUuid, fileLevel, rootPath } = args;
        const filePath = `${parentPath}\\${fullFileName}`;
        const objectStats = fs.lstatSync(filePath);

        return {
            uuid: crypto.randomUUID(),
            parentUuid: parentUuid,
            name: !objectStats.isDirectory() ? fullFileName.slice(0, fullFileName.lastIndexOf('.')) : fullFileName,
            extension: !objectStats.isDirectory() ? fullFileName.split('.').pop() : undefined,
            isDirectory: objectStats.isDirectory(),
            bSize: objectStats.size,
            mbSize: Math.floor(objectStats.size / 1048576),
            path: filePath,
            parentPath: parentPath,
            fromRootPath: filePath.replace(rootPath, ""),
            level: fileLevel,
            status: undefined,
            differenceStatuses: undefined,
            lastMod: objectStats.mtimeMs,
            lastModPeopleFormat: getDateTime(new Date(objectStats.mtimeMs)),
            children: [],
            linkedWithUuid: undefined,
        };
    }

    static buildTreeFrom(path: string) {
        const rootDirectory: FileInfo = {
            uuid: crypto.randomUUID(),
            parentUuid: undefined,
            name: path,
            isDirectory: true,
            path: path,
            level: 0,
            children: [],
            linkedWithUuid: undefined,
        };

        //return this.recurseDirectoryAsArray(path, 1, [rootDirectory], path);
        return this.recurseDirectoryAsTree(rootDirectory, [], path) as RecurseDirectoryResult;
    }

    static recurseDirectoryAsArray(directoryPath: string, level: number, filesTree: FileInfo[], rootPath: string) {
        const filesInfo = this.readDirectory(directoryPath, level, rootPath, filesTree[filesTree.length - 1].uuid);

        for (let file of filesInfo) {
            filesTree.push(file);

            if (file.isDirectory) {
                this.recurseDirectoryAsArray(file.path, file.level + 1, filesTree, rootPath);
            }
        }
        return filesTree;
    };

    static recurseDirectoryAsTree(parentInstance: FileInfo, filesTree: FileInfo[], rootPath: string, parentsUuid: string[] = []): Function | RecurseDirectoryResult {
        const filesInfo = this.readDirectory(parentInstance.path, parentInstance.level, rootPath, parentInstance.uuid);
        for (let file of filesInfo) {
            file.level = parentInstance.level + 1;
            parentInstance.children.push(file);
            if (file.parentUuid && !parentsUuid.includes(file.parentUuid)) {
                parentsUuid.push(file.parentUuid);
            }
            if (file.isDirectory) {
                this.recurseDirectoryAsTree(file, filesTree, rootPath, parentsUuid);
            }
        }
        if (!parentInstance.parentUuid) filesTree.push(parentInstance);
        return { tree: filesTree, parentsUuid: parentsUuid };
    }

    static buildTreesAsTree(firstDirectoryPath: string, secondDirectoryPath: string): Promise<AppResponse<CheckDirectoriesData>> {
        if (firstDirectoryPath === '' || secondDirectoryPath === '') {
          return getPromiseObject(false, { error: 'Необходимо выбрать оба пути для сравнения директорий.' });
        }
        if (!FileSystemUtils.checkPath(firstDirectoryPath) || !FileSystemUtils.checkPath(secondDirectoryPath)) {
          return getPromiseObject(false, { error: 'Проверьте правильность указания пути и повторите попытку.' });
        }

        const firstRootFolder: FileInfo = {
            uuid: crypto.randomUUID(),
            parentUuid: undefined,
            name: firstDirectoryPath,
            isDirectory: true,
            path: firstDirectoryPath,
            level: 0,
            children: [],
            linkedWithUuid: undefined,
        };
        const secondRootFolder: FileInfo = {
            uuid: crypto.randomUUID(),
            parentUuid: undefined,
            name: secondDirectoryPath,
            isDirectory: true,
            path: secondDirectoryPath,
            level: 0,
            children: [],
            linkedWithUuid: undefined,
        };

        const firstTree = this.recurseDirectoryAsTree(firstRootFolder, [], firstDirectoryPath) as RecurseDirectoryResult;
        const secondTree = this.recurseDirectoryAsTree(secondRootFolder, [], secondDirectoryPath) as RecurseDirectoryResult;

        // firstTree.tree.map((firstTreeFile: FileInfo) => {
        //     const secondTreeFile = secondTree.find((el: FileInfo) => el.level == firstTreeFile.level && el.fromRootPath == firstTreeFile.fromRootPath);

        //     if (secondTreeFile) {
        //         const differenceStatuses = [];
        //         if (!secondTreeFile.isDirectory && secondTreeFile.bSize != firstTreeFile.bSize) {
        //             differenceStatuses.push(3);
        //         }
        //         if (!secondTreeFile.isDirectory && secondTreeFile.lastMod != firstTreeFile.lastMod) {
        //             differenceStatuses.push(5);
        //         }

        //         const status = (!secondTreeFile.isDirectory && secondTreeFile.bSize != firstTreeFile.bSize) ? 3 : (!secondTreeFile.isDirectory && secondTreeFile.lastMod != firstTreeFile.lastMod) ? 5 : 2;
        //         secondTreeFile.status = status;
        //         secondTreeFile.differenceStatuses = differenceStatuses.length > 0 ? differenceStatuses : undefined;
        //         firstTreeFile.status = status;
        //         firstTreeFile.differenceStatuses = differenceStatuses.length > 0 ? differenceStatuses : undefined;
                
        //         firstTreeFile.linkedWith = secondTreeFile.uuid;
        //         secondTreeFile.linkedWith = firstTreeFile.uuid;
        //     } else {
        //         firstTreeFile.status = 1;
        //         secondTree.push(getMimeElement(firstTreeFile, firstDirectoryPath, secondDirectoryPath));
        //     }
        // });

        return new Promise<AppResponse<CheckDirectoriesData>>((resolve) => {
            resolve({
                ok: true,
                data: {
                    firstTree: {
                        tree: firstTree.tree,
                        // parentsUuid: firstTree.parentsUuid,
                        itemsCount: firstTree.tree.length
                    },
                    secondTree: {
                        tree: secondTree.tree,
                        // parentsUuid: secondTree.parentsUuid,
                        itemsCount: secondTree.tree.length
                    }
                }
            })
        });
    }

    static buildTreesAsArray(firstDirectoryPath: string, secondDirectoryPath: string, resultAsTree: boolean = false): Promise<AppResponse> {
        if (firstDirectoryPath === '' || secondDirectoryPath === '') {
          return getPromiseObject(false, { error: 'Необходимо выбрать оба пути для сравнения директорий.' });
        }
        if (!FileSystemUtils.checkPath(firstDirectoryPath) || !FileSystemUtils.checkPath(secondDirectoryPath)) {
          return getPromiseObject(false, { error: 'Проверьте правильность указания пути и повторите попытку.' });
        }

        const firstRootFolder: FileInfo = {
            uuid: crypto.randomUUID(),
            parentUuid: undefined,
            name: firstDirectoryPath,
            isDirectory: true,
            path: firstDirectoryPath,
            level: 0,
            children: [],
            linkedWithUuid: undefined,
        };
        const secondRootFolder: FileInfo = {
            uuid: crypto.randomUUID(),
            parentUuid: undefined,
            name: secondDirectoryPath,
            isDirectory: true,
            path: secondDirectoryPath,
            level: 0,
            children: [],
            linkedWithUuid: undefined,
        };

        const firstTree = this.recurseDirectoryAsArray(firstDirectoryPath, 1, [firstRootFolder], firstDirectoryPath);
        const secondTree = this.recurseDirectoryAsArray(secondDirectoryPath, 1, [secondRootFolder], secondDirectoryPath);

        firstTree.map((file: FileInfo) => {
            const checkingElement = secondTree.find((el: FileInfo) => el.level == file.level && el.fromRootPath == file.fromRootPath);

            if (checkingElement) {
                const differenceStatuses: FileStatuses[] = [];
                if (!checkingElement.isDirectory && checkingElement.bSize != file.bSize) {
                    differenceStatuses.push(FileStatuses.SizeDifference);
                }
                if (!checkingElement.isDirectory && checkingElement.lastMod != file.lastMod) {
                    differenceStatuses.push(FileStatuses.LastModDifference);
                }

                const status = (!checkingElement.isDirectory && checkingElement.bSize != file.bSize) ?
                                FileStatuses.SizeDifference :
                                (!checkingElement.isDirectory && checkingElement.lastMod != file.lastMod) ?
                                FileStatuses.LastModDifference :
                                FileStatuses.ExistInBothTrees;
                checkingElement.status = status;
                checkingElement.differenceStatuses = differenceStatuses.length > 0 ? differenceStatuses : undefined;
                file.status = status;
                file.differenceStatuses = differenceStatuses.length > 0 ? differenceStatuses : undefined;
                
                file.linkedWithUuid = checkingElement.uuid;
                checkingElement.linkedWithUuid = file.uuid;
            } else {
                file.status = FileStatuses.NotExist;
                const fileParent = firstTree.find((el: FileInfo) => el.uuid === file.parentUuid)!;
                const mimeParent = secondTree.find((el: FileInfo) => el.level == fileParent.level && el.name == fileParent.name)!;
                const mimeElement = getMimeElement(file, mimeParent, firstDirectoryPath, secondDirectoryPath);
                secondTree.push(mimeElement);
                file.linkedWithUuid = mimeElement.uuid;
                mimeElement.linkedWithUuid = file.uuid;
            }
        });
        
        secondTree.filter(el => !el.status).map(file => {
            const fileParent = secondTree.find((el: FileInfo) => el.uuid === file.parentUuid)!;
            const mimeParent = firstTree.find((el: FileInfo) => el.level == fileParent.level && el.name == fileParent.name)!;
            const mimeElement = getMimeElement(file, mimeParent, secondDirectoryPath, firstDirectoryPath);
            firstTree.push(mimeElement);
            file.linkedWithUuid = mimeElement.uuid;
            mimeElement.linkedWithUuid = file.uuid;
            file.status = FileStatuses.NotExist;
        });

        const firstTreeRoot = firstTree.find((el: FileInfo) => !el.parentPath);
        const secondTreeRoot = secondTree.find((el: FileInfo) => !el.parentPath);
        if (!firstTreeRoot || !secondTreeRoot) {
            return getPromiseObject(false, { error: 'При построении не найден корневой элемент.' });
        }
        const sortedFirstTree = sortTree(firstTree, firstDirectoryPath, [firstTreeRoot]);
        const sortedSecondTree = sortTree(secondTree, secondDirectoryPath, [secondTreeRoot]);

        return new Promise<AppResponse<CheckDirectoriesData>>((resolve) => {
            resolve({
                ok: true,
                data: {
                    firstTree: {
                        tree: resultAsTree ? makeTreeFromArray(sortedFirstTree, firstTreeRoot, []) : sortedFirstTree,
                        itemsCount: sortedFirstTree.filter(el => el.status !== FileStatuses.MimeElement).length,
                    },
                    secondTree: {
                        tree: resultAsTree ? makeTreeFromArray(sortedSecondTree, secondTreeRoot, []) : sortedSecondTree,
                        itemsCount: sortedSecondTree.filter(el => el.status !== FileStatuses.MimeElement).length,
                    }
                }
            })
        });
    }

    // TODO
    static recurseRmDir(path: string) {
        // const rootFolder = {
        //     name: path,
        //     isDirectory: true,
        //     path: path,
        //     level: 0
        // };

        // const tree = recurseDirectoryAsArray(path, 1, [rootFolder], path);

        const tree = this.buildTreeFrom(path);

        const recurseDelete = (tree) => {
            tree.forEach(treeEl => {
                if (treeEl.isDirectory) {
                    const childs = tree.filter(el => el.parentPath === treeEl.path);
                    if (childs.length > 0) {
                        recurseDelete(childs);
                    }
                    this.deleteDir(treeEl.path);
                } else {
                    this.deleteFile(treeEl.path);
                }
            });
        }

        recurseDelete(tree);
    }

    // TODO
    static copyFoldersTree(oldPathFile: string, newPathFile: string) {
        if (this.checkPath(newPathFile)) {
            console.log("Error! Folder exist!");
            return { error: "Error! Folder exist!" };
        }
        //fs.cpSync(oldPathFile, newPathFile, { recursive: true });
        console.log('Complete!');
        return;
    }

    static resolveProtocolPath(url: string, protocol: string) {
        let filePath = decodeURIComponent(url.replace(`${protocol}://`, ''));
        
        if (process.platform === 'win32' && /^[a-zA-Z]\//.test(filePath)) {
            filePath = filePath[0] + ':/' + filePath.slice(2);
        }
        return path.resolve(filePath);;
    }

    static streamVideoFile(request: Request) {
        try {
            const absolutePath = this.resolveProtocolPath(request.url, videoMediaProtocol);
    
            // Проверяем, существует ли файл физически
            if (!fs.existsSync(absolutePath)) {
                return new Response('File Not Found', { status: 404 });
            }
    
            // 2. Получаем размер файла (размер обязателен для Range requests)
            const stat = fs.statSync(absolutePath);
            const fileSize = stat.size;
    
            // 3. Читаем заголовок Range от тега <video>
            const rangeHeader = request.headers.get('range');
    
            // Устанавливаем правильный MIME-тип для видео (можно сделать динамическим)
            const contentType = 'video/mp4'; 
    
            if (rangeHeader) {
                // Извлекаем байты из заголовка вида "bytes=12345-" или "bytes=12345-67890"
                const parts = rangeHeader.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
        
                // Создаем стрим только для запрошенного кусочка файла
                const fileStream = fs.createReadStream(absolutePath, { start, end });
        
                // Возвращаем правильный 206 Partial Content статус и заголовки диапазона
                return new Response(Readable.toWeb(fileStream) as any, {
                    status: 206,
                    statusText: 'Partial Content',
                    headers: {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunksize.toString(),
                        // 'Content-Type': contentType,
                    }
                });
            } else {
                // Если Range запроса нет (самый первый запуск видео), отдаем файл стандартно со статусом 200
                const fileStream = fs.createReadStream(absolutePath);
                
                return new Response(Readable.toWeb(fileStream) as any, {
                    status: 200,
                    headers: {
                        'Accept-Ranges': 'bytes',
                        'Content-Length': fileSize.toString(),
                        // 'Content-Type': contentType,
                    }
                });
            }
        } catch (error) {
            console.error(`Custom stream error of ${videoMediaProtocol}://:`, error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }
}
