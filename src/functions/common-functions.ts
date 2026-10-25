import { FileStatuses } from "../enums/file-statuses.enum";
import { FileInfo } from "src/types/file-info.type";
import { Response } from "src/types/response.type";


export function getDateTime(jsDate: Date): string {
    return `${jsDate.getDate() > 9 ? jsDate.getDate() : `0${jsDate.getDate()}`}.${(jsDate.getMonth() + 1) > 9 ? (jsDate.getMonth() + 1) : `0${jsDate.getMonth() + 1}`}.${jsDate.getFullYear()} ${jsDate.getHours()}:${jsDate.getMinutes() > 9 ? jsDate.getMinutes() : `0${jsDate.getMinutes()}`}.${jsDate.getMilliseconds()}`;
}

export const sortTree = (tree: FileInfo[], fileRootPath: string, sortedArray: FileInfo[]) => {
    const filtered = tree.filter(el => el.parentPath === fileRootPath);
    const sorted = filtered.sort((a, b) => {
        if ((a.isDirectory && !b.isDirectory) || ((a.isDirectory && b.isDirectory || !a.isDirectory && !b.isDirectory) && a.name > b.name)) {
            return -1;
        } else if ((b.isDirectory && !a.isDirectory) || ((a.isDirectory && b.isDirectory || !a.isDirectory && !b.isDirectory) && a.name < b.name)) {
            return 1;
        }
        return 0;
    })

    for (let file of sorted) {
        sortedArray.push(file);
        if (file.isDirectory) {
            sortTree(tree, file.path, sortedArray);
        }
    }
    return sortedArray;
}

export const getMimeElement = (file: FileInfo, parentFile: FileInfo, firstRootPath: string, secondRootPath: string): FileInfo => {
    return {
        uuid: crypto.randomUUID(),
        parentUuid: parentFile.uuid,
		name: file.name,
		extension: file.extension,
		isDirectory: file.isDirectory,
		path: file.path.replace(firstRootPath, secondRootPath),
		parentPath: file.parentPath?.replace(firstRootPath, secondRootPath),
		level: file.level,
		status: FileStatuses.MimeElement,
        children: [],
        linkedWithUuid: undefined,
	};
}

export function getPromiseObject(isOk: boolean, args: { error?: string, data?: any }): Promise<Response> {
    const { error, data } = args;
    return new Promise<Response>((resolve) => {
        resolve({
            ok: isOk,
            error: error,
            data: data
        });
    });
}

export function makeTreeFromArray(treeAsArray: FileInfo[], parent: FileInfo, filesTree: FileInfo[]) {
    for (let file of treeAsArray.filter(el => el.parentUuid === parent.uuid)) {
        parent.children.push(file);
        if (file.isDirectory) {
            makeTreeFromArray(treeAsArray, file, filesTree);
        }
    }
    if (!parent.parentUuid) filesTree.push(parent);
    return filesTree;
}

export function getElementOrThrowError(id: string) {
    const element = document.getElementById(id);

    if (element) {
        return element;
    }
    const errorMessage = `Element with id: '${id}' not found`;
    document.body.innerHTML = errorMessage;
    throw Error(errorMessage);
}
