import type { UUID } from "crypto";
import type { IAppState } from '../interfaces/app-state.interface';
import { ElementsIds } from "src/enums/elements-ids.enum";
import type { FileInfo } from "src/types/file-info.type";
import type { CheckDirectoriesData } from "src/types/response-data/check-directories.data.type";
import type { TreeId } from "src/types/tree-id.type";
import { FileStatuses } from "../enums/file-statuses.enum";
import { TreeState, TreeStateTemplate } from "src/types/tree-state.type";
import { TreeFlatData } from "src/types/tree-flat-data.type";


export class AppStateManager {

    private _state: IAppState = {
        trees: {
            [ElementsIds.firstTree]: this.getTreeStateTemplate({}),
            [ElementsIds.secondTree]: this.getTreeStateTemplate({}),
        },
        buildSettings: {
            excludeEquals: false,
            addMimes: false,
        },
        careOnTree: undefined,
        itemIsDragged: false,
        mouseIsPressed: false,
        onTreeDragStarts: undefined,
    };

    private getTreeStateTemplate(args: TreeStateTemplate): TreeState {
        return {
            data: args?.data ?? undefined,
            flatData: args?.flatData ?? undefined,
            count: args?.count ?? 0,
            rolledItems: args?.rolledItems ?? [],
            selectedItem: args?.selectedItem ?? undefined,
            selectedItemIsDragged: args?.selectedItemIsDragged ?? false,
            searchByDirectories: args?.searchByDirectories ?? false,
            matchesItemsUuids: args?.matchesItemsUuids ?? [],
            inputTimeoutId: undefined,
            foundItemsUuids: args?.foundItemsUuids ?? [],
        };
    }

    public get state() {
        return this._state;
    }

    public set careOnTree(treeId: TreeId | undefined) {
        this._state.careOnTree = treeId;
    }

    public setState(state: IAppState) {
        this._state = state;
    }

    public setTreesState(data: CheckDirectoriesData) {
        const state = this.state;

        const firstFlatTree = this.buildFlatDataFromTree(data.firstTree.tree);
        state.trees.firstTree = this.getTreeStateTemplate({
            data: data.firstTree.tree,
            flatData: firstFlatTree,
            count: data.firstTree.itemsCount,
            matchesItemsUuids: this.getTreeMatchesItems(firstFlatTree),
            searchByDirectories: this.state.trees.firstTree?.searchByDirectories,
        });

        const secondFlatTree = this.buildFlatDataFromTree(data.secondTree.tree);
        state.trees.secondTree = this.getTreeStateTemplate({
            data: data.secondTree.tree,
            flatData: secondFlatTree,
            count: data.secondTree.itemsCount,
            matchesItemsUuids: this.getTreeMatchesItems(secondFlatTree),
            searchByDirectories: this.state.trees.secondTree?.searchByDirectories,
        });

        this.setState(state);
    }

    // TODO
    private getTreeDataByRenderSettings(treeId: TreeId) {
        if (this.state.buildSettings.excludeEquals) {
            //
        }
        return this.state.trees[treeId]?.data;
    }

    public getTreeInfo(treeId: TreeId) {
        return this.state.trees[treeId];
    }

    private buildFlatDataFromTree(items: FileInfo[], parent?: FileInfo, flatTree: TreeFlatData[] = []) {
        for (let item of items) {
            // TODO: при построение без мимов некорректно отражаются ветви деревьев
            const children = this.state.buildSettings.addMimes ? parent?.children : parent?.children.filter(el => el.status !== FileStatuses.MimeElement);
            flatTree.push({
                uuid: item.uuid,
                parentUuid: parent?.uuid,
                info: item,
                isLastChild: parent ? parent?.children?.indexOf(item) + 1 === parent?.children?.length : true
            });
            if (item.children.length > 0) {
                this.buildFlatDataFromTree(item.children, item, flatTree);
            }
        }
        return flatTree;
    }

    public getTreeFlatData(treeId: TreeId) {
        return this.state.trees[treeId]?.flatData;
        //console.log(333, this.state.trees[treeId]?.flatData.filter((el: any) => !this.state.trees[treeId]?.rolledItems?.includes(el.id)));
        // const treeFlatData = this.state.trees[treeId]?.flatData.filter((el: any) => !this.state.trees[treeId]?.rolledItems?.includes(el.id));
        // if (this.state.buildSettings.addMimes) {
        //     return treeFlatData;
        // }
        // return treeFlatData.filter((el: any) => el.info.status !== FileStatuses.MimeElement);
    }

    public rollUpItem(treeId: TreeId, itemUuid: UUID) {
        const state = this.state;
        if (state.trees[treeId]!.rolledItems.includes(itemUuid)) {
            state.trees[treeId]!.rolledItems = state.trees[treeId]!.rolledItems.filter(el => el !== itemUuid);
        } else {
            state.trees[treeId]!.rolledItems.push(itemUuid);
        }
        this.setState(state);
    }

    public selectItem(treeId: TreeId, itemUuid: UUID) {
        const state = this.state;
        const itemInfo = state.trees[treeId]!.flatData?.find(el => el.uuid === itemUuid)!.info;

        if (itemInfo) {
            state.trees[treeId]!.selectedItem = itemInfo;
            this.setState(state);
        }
    }

    public setDraggableStateItem(dragState: boolean) {
        const state = this.state;
        state.itemIsDragged = dragState;
        this.setState(state);
    }

    public setMouseIsPressedState(pressState: boolean) {
        const state = this.state;
        state.mouseIsPressed = pressState;
        this.setState(state);
    }

    public setOnTreeDragStarts(tree?: TreeId) {
        const state = this.state;
        state.onTreeDragStarts = tree;
        this.setState(state);
    }

    public setSearchByDirectoriesState(treeId: TreeId) {
        const state = this.state;
        state.trees[treeId]!.searchByDirectories = !state.trees[treeId]?.searchByDirectories;
        this.setState(state);
    }

    public setBuildMimeSettingState() {
        const state = this.state;
        state.buildSettings.addMimes = !state.buildSettings.addMimes;
        this.setState(state);
        return state.buildSettings.addMimes;
    }

    public setExcludeEqualsSettingState() {
        const state = this.state;
        state.buildSettings.excludeEquals = !state.buildSettings.excludeEquals;
        this.setState(state);
        return state.buildSettings.excludeEquals;
    }

    private directoryNotIncludeNotExistingItem(items: any[], startDirectory: FileInfo, state: boolean) {
        for (let file of items.filter(el => el.info.parentUuid === startDirectory.uuid)) {
            if (file.info.isDirectory) {
                state = this.directoryNotIncludeNotExistingItem(items, file.info, state);
            }
            if (file.info.status !== FileStatuses.ExistInBothTrees) {
                state = false;
            }
        }

        return state;
    }

    private directoryNotIncludeItemWithSpecificValue(items: TreeFlatData[], startDirectory: FileInfo, state: boolean, fileArg: keyof FileInfo, checkValue: any) {
        for (let file of items.filter(el => el.info.parentUuid === startDirectory.uuid)) {
            if (file.info.isDirectory) {
                state = this.directoryNotIncludeItemWithSpecificValue(items, file.info, state, fileArg, checkValue);
            }
            if (file.info[fileArg]?.toString().trim().toLowerCase().indexOf(checkValue?.toString().trim().toLowerCase()) !== -1) {
                state = true;
            }
        }
        return state;
    }

    public getTreeMatchesItems(items: TreeFlatData[]) {
        const treeMatchesItems: UUID[] = [];
        items.map(el => {
            if (
                (el.info.parentPath && !el.info.isDirectory && el.info.status === FileStatuses.ExistInBothTrees) ||
                (el.info.parentPath && el.info.isDirectory && el.info.status === FileStatuses.ExistInBothTrees && this.directoryNotIncludeNotExistingItem(items, el.info, true))
            ) {
                treeMatchesItems.push(el.uuid);
            }
        });
        return treeMatchesItems;
    }

    private getAllItemsUuidsSiblingsFromItem(items: TreeFlatData[], itemUuid: UUID, siblings: UUID[] = []) {
        for (let item of items.filter(el => el.parentUuid === itemUuid)) {
            siblings.push(item.uuid);
            if (item.info.isDirectory) {
                this.getAllItemsUuidsSiblingsFromItem(items, item.uuid, siblings);
            }
        }
        return siblings;
    }

    public searchItemsUuidsByValue(treeId: TreeId, value: string) {
        const treeMatchesItems: UUID[] = [];
        value = value.trim().toLowerCase();
        const items = this.state.trees[treeId]?.flatData;
        items?.map(el => {
            if (
                ((!this.state.trees[treeId]?.searchByDirectories) && (
                    (el.info.parentPath && el.info.name.trim().toLowerCase().indexOf(value) !== -1) ||
                    (el.info.parentPath && el.info.isDirectory && el.info.name.trim().toLowerCase().indexOf(value) === -1 && this.directoryNotIncludeItemWithSpecificValue(items, el.info, false, 'name', value))
                )) ||
                ((this.state.trees[treeId]?.searchByDirectories) && (
                    (el.info.parentPath && el.info.isDirectory && this.directoryNotIncludeItemWithSpecificValue(items, el.info, false, 'name', value))
                ))
            ) {
                treeMatchesItems.push(el.uuid);
            } else if (
                (this.state.trees[treeId]?.searchByDirectories) &&
                (el.info.parentPath && el.info.isDirectory && el.info.name.trim().toLowerCase().indexOf(value) !== -1)
            ) {
                const siblingsUuids = this.getAllItemsUuidsSiblingsFromItem(items, el.uuid);
                treeMatchesItems.push(...[el.uuid, ...siblingsUuids]);
            }
        });
        return treeMatchesItems;
    }

    public setFoundItemsUuids(treeId: TreeId, uuids?: UUID[]) {
        const state = this.state;
        state.trees[treeId]!.foundItemsUuids = uuids ?? [];
        this.setState(state);
    }

    public setTimeoutId(treeId: TreeId, timeoutId: NodeJS.Timeout | undefined = undefined) {
        const state = this.state;
        state.trees[treeId]!.inputTimeoutId = timeoutId;
        this.setState(state);
    }

}
