export type CopyFileData = {
    filePath: string;
    destination: string;
    fullFileName: string;
    destParentPath: string;
    destRootPath: string;
    fileLevel: number;
    fullCopy: boolean;
}