import { Response } from "src/types/response.type";
import { CopyFileData } from "src/types/copy-file-data.type";
import { CheckDirectoriesData } from "src/types/response-data/check-directories.data.type";


export interface IDirCheckerAPI {
    checkDirectories: (firstDirectoryPath: string, secondDirectoryPath: string, asArray: boolean, resultAsTree?: boolean) => Promise<Response<CheckDirectoriesData>>;
    openExplorer: (path: string) => Promise<Response>;
    copyFile: (args: CopyFileData) => Promise<Response>;
    moveRenameFile: (oldPathFile: string, newPathFile: string) => Promise<Response>;
    copyFoldersTree: (oldPathFile: string, newPathFile: string) => Promise<Response>;
    createDirectory: (path?: string) => Promise<Response>;
    deleteFile: (path: string) => Promise<Response>;
    deleteDirectory: (path: string) => Promise<Response>;
    recycleBin: (path: string) => Promise<Response>;
    buildTreeFrom: (path: string) => Promise<Response<any>>;
    selectDirectoryDialog: () => Promise<Response>;
    readFile: (path: string) => Promise<Response>;
}
