import { TreeState } from "src/types/tree-state.type";
import { ElementsIds } from "src/enums/elements-ids.enum";
import { TreeId } from "src/types/tree-id.type";
import { BuildSettings } from "src/types/build-settings.type";


export interface IAppState {
    trees: {
        [ElementsIds.firstTree]: TreeState | undefined,
        [ElementsIds.secondTree]: TreeState | undefined,
    },
    careOnTree: TreeId | undefined;
    itemIsDragged: boolean;
    mouseIsPressed: boolean;
    onTreeDragStarts: TreeId | undefined;
    buildSettings: BuildSettings;
}
