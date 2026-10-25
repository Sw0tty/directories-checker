import type { UUID } from "crypto";
import { FileInfo } from "./file-info.type";


export type TreeFlatData = {
    uuid: UUID;
    parentUuid: UUID | undefined;
    info: FileInfo;
    isLastChild: boolean;
}
