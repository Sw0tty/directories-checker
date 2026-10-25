import { FileStatuses } from "src/enums/file-statuses.enum";
import { UUID } from "crypto";


export type FileInfo = {
    uuid: UUID;
    mimeUuid?: UUID;
    parentUuid: UUID | undefined;
    name: string;
    path: string;
    level: number;
    extension?: string;
    isDirectory: boolean;
    bSize?: number;
    mbSize?: number;
    parentPath?: string;
    fromRootPath?: string;
    status?: FileStatuses;
    differenceStatuses?: FileStatuses[];
    lastMod?: number;
    lastModPeopleFormat?: string;
    children: FileInfo[];
    linkedWithUuid: UUID | undefined;
}
