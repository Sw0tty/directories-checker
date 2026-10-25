import type { UUID } from "crypto";
import type { FileInfo } from "./file-info.type";
import type { TreeFlatData } from "./tree-flat-data.type";


export type TreeState = {
    data: FileInfo[] | undefined;
    flatData: TreeFlatData[] | undefined;
    rolledItems: UUID[];
    count: number;
    selectedItem: FileInfo | undefined;
    selectedItemIsDragged: boolean;
    searchByDirectories: boolean;
    matchesItemsUuids: UUID[];
    inputTimeoutId: NodeJS.Timeout | undefined;
    foundItemsUuids: UUID[];
}

export type TreeStateTemplate =  {
    data?: FileInfo[] | undefined;
    flatData?: TreeFlatData[] | undefined;
    rolledItems?: UUID[];
    count?: number;
    selectedItem?: FileInfo | undefined;
    selectedItemIsDragged?: boolean;
    searchByDirectories?: boolean;
    matchesItemsUuids?: UUID[];
    inputTimeoutId?: NodeJS.Timeout | undefined;
    foundItemsUuids?: UUID[];
}
