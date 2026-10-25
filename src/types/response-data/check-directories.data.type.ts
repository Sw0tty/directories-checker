import { FileInfo } from "../file-info.type";

export type CheckDirectoriesData = {
    firstTree: CheckDirectoriesTreeData;
    secondTree: CheckDirectoriesTreeData
};

export type CheckDirectoriesTreeData = {
    tree: FileInfo[];
    // parentsUuid: string[];
    itemsCount: number;
};
