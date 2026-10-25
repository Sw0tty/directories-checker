import { UUID } from "crypto";
import { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import {
    treeFooter_Component,
    arrow_Component,
    arrow_2_Component,
    slider_Component,
    aboutFileForm_Component,
    treeSpace_Component,
    contentMenuBtnTemplate_Component,
    infoModalContent_Component
} from './components/components';
import { getElementOrThrowError } from './functions/common-functions';
import { SelectDirectoryDialogData } from "src/types/response-data/select-directory-dialog.data.type";
import { Response } from "src/types/response.type";
import { FileInfo } from './types/file-info.type';
import { VideoExtension } from './types/video-extension.type';
import { ImageExtension } from './types/image-extension.type';
import { AppStateManager } from "./classes/app-state-manager.class";
import { VIDEO_EXTENSIONS, IMAGE_EXTENSIONS } from "./consts/data.consts";
import { CSSClassNames } from "./enums/css-class-names.enum";
import { ElementsIds } from "./enums/elements-ids.enum";
import { ModalManager } from "./classes/modal-manager.class";
import { TreeId } from "./types/tree-id.type";
import { ContextMenuBtnRule } from "./types/context-menu-btn-rule.type";
import { FileStatuses } from "./enums/file-statuses.enum";


const windowElements = {
    firstInput: getElementOrThrowError(ElementsIds.firstTreeInput),
    secondInput: getElementOrThrowError(ElementsIds.secondTreeInput),
    firstInputBtn: getElementOrThrowError(ElementsIds.firstTreeInputBtn),
    secondInputBtn: getElementOrThrowError(ElementsIds.secondTreeInputBtn),
    checkDirectoriesBtn: getElementOrThrowError(ElementsIds.checkDirectoriesBtn),
    treeDelimiter: getElementOrThrowError(ElementsIds.treeDelimiter),
    draggedItem: getElementOrThrowError(ElementsIds.draggedItem),
    modalsContainer: getElementOrThrowError(ElementsIds.modalsContainer),
    contextMenu: getElementOrThrowError(ElementsIds.contextMenu),
    firstTreeFooter: getElementOrThrowError(ElementsIds.firstTreeFooter),
    secondTreeFooter: getElementOrThrowError(ElementsIds.secondTreeFooter),
    searchFirstTreeInput: getElementOrThrowError(ElementsIds.searchFirstTreeInput),
    searchSecondTreeInput: getElementOrThrowError(ElementsIds.searchSecondTreeInput),
    firstSearchByDirectoriesCheckboxState: getElementOrThrowError(ElementsIds.firstSearchByDirectoriesCheckboxState),
    secondSearchByDirectoriesCheckboxState: getElementOrThrowError(ElementsIds.secondSearchByDirectoriesCheckboxState),
    buildMimeElementsCheckbox: getElementOrThrowError(ElementsIds.buildMimeElementsCheckbox),
    excludeEqualsCheckbox: getElementOrThrowError(ElementsIds.excludeEqualsCheckbox),
    infoBtn: getElementOrThrowError(ElementsIds.infoBtn),
};

const appStateManager = new AppStateManager();
const modalManager = new ModalManager(windowElements.modalsContainer);


const notUsedIdsBank = {
    treeDataComponents: [],
    sliders: []
}
const treeState = {};
let startDragFilePathState = "";
const selectedFiles = [];




const addListenersToTreeDataComponents = () => {
    notUsedIdsBank.treeDataComponents.map(componentId => {
        document.getElementById(componentId).addEventListener('dragstart', (event) => {
            dragstart_handler(event);
        });
        document.getElementById(componentId).addEventListener('dragover', (event) => {
            dragover_handler(event);
        });
        document.getElementById(componentId).addEventListener('drop', (event) => {
            drop_handler(event);
        });
    });
    notUsedIdsBank.treeDataComponents.length = 0;
}

const visibleViewPort = () => {
    const elementsContainer = document.getElementById("tree-elements-container");
    const eventTarget = document.getElementById(ElementsIds.firstTree);
    // event.target.offsetTop - самый верх скрола
    // elementsContainer.offsetHeight - высота блока с контейнерами
    //console.log(event.target.offsetTop, elementsContainer.getBoundingClientRect(), elementsContainer.offsetHeight);
    // elementsContainer.querySelectorAll("div.element-container") - все элементы контейнера

    //console.log(event, elementsContainer.querySelectorAll("div.element-container").length);
    // for (let elem of elementsContainer.querySelectorAll("div.element-container")) {
    //     let elemWrapper = elem.querySelector(".element-data-wrapper-container");
    //     let elemRect = elem.getBoundingClientRect();
    //     //console.log(elemRect.top + (elemRect.height * 2) < event.target.offsetTop);
    //     //console.log(elemRect, elemRect.top + elemRect.height > event.target.offsetTop + event.target.offsetHeight); //|| elemRect.top + elemRect.height > event.target.offsetTop + event.target.offsetHeight
    //     console.log(elem, elem.offsetTop, elemRect);
    //     if (elemRect.top + (elemRect.height * 2) < eventTarget.offsetTop || elemRect.top - (elemRect.height * 2) > eventTarget.offsetTop + eventTarget.offsetHeight) {
    //         elemWrapper.style.display = "none";
    //         //elem.style.visibility = "collapse";
    //     } else {
    //         elemWrapper.style.display = "flex";
    //         //elem.style.visibility = "visible";
    //     }
    // }

    //console.log(elementsContainer.querySelectorAll("div.element-container")[1].getBoundingClientRect());
}

// document.getElementById(FIRST_TREE_ID).addEventListener("scroll", (event) => {
//     visibleViewPort();
// });


window.addEventListener("keyup", (event) => {

    if (event.ctrlKey) {
        console.log("ctrl");
    }
})

window.addEventListener("click", (event) => {
    if (event.ctrlKey) {
        console.log("CEHCK");
        console.log(event.target);
        console.log(event.target.dataset['filepath']);
        const treeId = event.target.dataset['tree'];
        const filePath = event.target.dataset['filepath'];
        const fileData = treeState[treeId].find(el => el.path === filePath);
        console.log(fileData);
        if (fileData) {
            selectedFiles.push(fileData);
            document.getElementById(fileData.uuid)?.classList.add('selected-dataitem');
        }
    }
    if (!selectedFiles.map(el => { return el.uuid }).includes(event.target.id)) {
        for (let item of selectedFiles) {
            document.getElementById(item.uuid)?.classList.remove('selected-dataitem');
        }
        selectedFiles.length = 0;
    }

    const contextMenu = document.getElementById(ElementsIds.contextMenu);

    if (contextMenu && !contextMenu?.classList.contains(CSSClassNames.displayNone)) {
        contextMenu.classList.add(CSSClassNames.displayNone);
    }
})

const renderContextMenu = (selectedTargetData: FileInfo) => {
    const btnsRenderer = (btnsRules: ContextMenuBtnRule[]) => {
        windowElements.contextMenu.innerHTML = btnsRules.map(el => {
                el.id = `context-menu-btn-${btnCount++}`;
                return renderToString(contentMenuBtnTemplate_Component(el.id, el.caption))
            }).join('');

        for (let btn of btnsRules) {
            document.getElementById(btn?.id ?? '')?.addEventListener('click', (event: any) => {
                btn.func(event)
            });
        }
    }

    let btnCount = 1;

    const forFolderBtns: ContextMenuBtnRule[] = [
        {
            caption: "Create folder",
            func: () => {
                const inputId = 'create-folder-name-input';
                const modalUuid = modalManager.invokeModal({ header: "Folder creating", content: <input id={inputId} className="input-base" type="text" />, buttons: [
                    { id: "create-folder-btn", caption: "Create",
                        func: async () => {
                            // const response = await appFunctions.createDir(`${selectedTargetData.path}\\${document.getElementById("create-folder-name-input").value}`, false);
                            const response = await window.api.createDirectory(`${selectedTargetData.path}\\${(document.getElementById(inputId) as HTMLInputElement).value}`);

                            if (response.ok) {
                                checkDirectories();
                                return modalManager.closeModal(modalUuid);
                            }
                            if (response?.error) {
                                modalManager.closeModal(modalUuid);
                                return modalManager.invokeModal({ header: 'Error', content: <>{response.error}</> });
                            }
                            return modalManager.invokeModal({ header: 'Error', content: <>Unexpected error</> });
                        }
                    }
                ] });
            },
        },
        {
            caption: "Rename",
            func: () => {
                const inputId = 'rename-folder-name-input';
                const modalUuid = modalManager.invokeModal({ header: "Folder renaming", content: <input id={inputId} className="input-base" type="text" defaultValue={selectedTargetData.name} />, buttons: [
                    { id: "create-folder-btn", caption: "Rename",
                        func: async () => {
                            // const response = await appFunctions.moveRenameFile(selectedTargetData.path, `${selectedTargetData.parentPath}\\${document.getElementById("rename-folder-name-input").value}`);
                            const response = await window.api.moveRenameFile(selectedTargetData.path, `${selectedTargetData.parentPath}\\${(document.getElementById(inputId) as HTMLInputElement).value}`);

                            if (response.ok) {
                                checkDirectories();
                                return modalManager.closeModal(modalUuid);
                            }
                            if (response?.error) {
                                modalManager.closeModal(modalUuid);
                                return modalManager.invokeModal({ header: 'Error', content: <>{response.error}</> });
                            }
                            return modalManager.invokeModal({ header: 'Error', content: <>Unexpected error</> });
                        }
                    }
                ] });
            },
        },
        {
            caption: "Delete",
            func: async () => {
                // TODO
                // const tree = await appFunctions.buildTreeFrom(selectedTargetData.path);
                const tree = await window.api.buildTreeFrom(selectedTargetData.path);
                console.log(tree);

                if (tree && tree.length === 1) {
                    const modalUuid = modalManager.invokeModal({ header: "Delete directory", content: `Are you sure want to delete this folder forever?`, buttons: [
                        { id: "delete-dir-btn", caption: "Yes",
                            func: async () => {
                                // const response = await appFunctions.deleteDir(selectedTargetData.path);
                                const response = await window.api.deleteDirectory(selectedTargetData.path);

                                if (response.ok) {
                                    checkDirectories();
                                    return modalManager.closeModal(modalUuid);
                                }
                                if (response?.error) {
                                    modalManager.closeModal(modalUuid);
                                    return modalManager.invokeModal({ header: 'Error', content: <>{response.error}</> });
                                }
                                return modalManager.invokeModal({ header: 'Error', content: <>Unexpected error</> });
                            }
                        },
                        { id: "cancel-delete-dir-btn", caption: "Cancel",
                            func: () => {
                                return modalManager.closeModal(modalUuid);
                            }
                        }
                    ] });
                } else {
                    // TODO
                    const modalUuid = modalManager.invokeModal({ header: "Delete dirs tree", content: `${tree.map(el => { return renderTreeDataComponent(undefined, el, false, false) }).join('')}`, buttons: [
                        { id: "delete-dirs-tree-btn", caption: "Yes",
                            func: async () => {
                                const response = await appFunctions.deleteDir(selectedTargetData.path);
                            }
                        },
                        { id: "cancel-delete-dirs-tree-btn", caption: "Cancel",
                            func: () => {
                                modalManager.closeModal(modalUuid);
                            }
                        }
                    ] });
                }
            },
        }
    ];

    const forFileBtns: ContextMenuBtnRule[] = [
        {
            caption: 'About',
            func: () => {
                const lines = [
                    { caption: 'Name:', value: selectedTargetData.name },
                    { caption: 'Extension:', value: selectedTargetData.extension },
                    { caption: 'Size:', value: selectedTargetData.mbSize === 0 ? `${selectedTargetData.bSize} bytes` : `${selectedTargetData.mbSize} Mb` },
                    { caption: 'Last mod date:', value: selectedTargetData.lastModPeopleFormat }
                ];

                modalManager.invokeModal({
                    header: 'About file',
                    content: aboutFileForm_Component({ path: selectedTargetData.path, extension: selectedTargetData.extension, fileDataLines: lines })
                });
            },
        },
        {
            caption: 'Rename',
            func: () => {
                const inputId = 'rename-file-name-input';
                const modalUuid = modalManager.invokeModal({ header: 'File renaming', content: <input id={inputId} className="input-base" type="text" defaultValue={selectedTargetData.name} />, buttons: [
                    { id: 'rename-file-btn', caption: 'Rename',
                        func: async () => {
                            const response = await window.api.moveRenameFile(selectedTargetData.path, `${selectedTargetData.parentPath}\\${(document.getElementById(inputId) as HTMLInputElement).value}.${selectedTargetData.extension}`);
                            
                            if (response.ok) {
                                checkDirectories();
                                return modalManager.closeModal(modalUuid);
                            }
                            if (response?.error) {
                                return modalManager.invokeModal({ header: 'Error', content: <>{response.error}</> });
                            }
                            return modalManager.invokeModal({ header: 'Error', content: <>Unexpected error</> });
                        }
                    }
                ] });
            },
        },
        {
            caption: 'Move to recycle bin',
            func: () => {
                const modalUuid = modalManager.invokeModal({ header: 'Deleting file', content: 'Are you sure want to move this file to recycle bin?', buttons: [
                    { id: 'agree-delete-btn', caption: 'Yes',
                        func: async () => {
                            // const response = await appFunctions.recycleBin(selectedTargetData.path);
                            const response = await window.api.recycleBin(selectedTargetData.path);
                            modalManager.closeModal(modalUuid);
                            if (response.ok) {
                                return checkDirectories();
                            }
                            if (response?.error) {
                                return modalManager.invokeModal({ header: 'Error', content: <>{response.error}</> });
                            }
                            return modalManager.invokeModal({ header: 'Error', content: <>Unexpected error</> });

                            // TODO: оптимизация, чтобы каждый раз не ререндерить деревья
                            // removeItemByUuid(selectedTargetData.treeId, 'uuid', selectedTargetData.uuid);
                            // removeItemByUuid(selectedTargetData.treeId === ElementsIds.firstTree ? ElementsIds.secondTree : ElementsIds.firstTree, 'mimeUuid', selectedTargetData.uuid);
                        }
                    },
                    { id: 'cancel-delete-btn', caption: 'Cancel',
                        func: () => {
                            return modalManager.closeModal(modalUuid);
                        }
                    }
                ] });
            },
        },
        {
            caption: 'Delete forever',
            func: () => {
                const modalUuid = modalManager.invokeModal({ header: 'Deleting file', content: 'Are you sure want to delete this file forever?', buttons: [
                    { id: 'agree-delete-btn', caption: 'Yes',
                        func: async () => {
                            const response = await window.api.deleteFile(selectedTargetData.path);
                            modalManager.closeModal(modalUuid);
                            if (response.ok) {
                                return checkDirectories();
                            }
                            if (response?.error) {
                                return modalManager.invokeModal({ header: 'Error', content: <>{response.error}</> });
                            }
                            return modalManager.invokeModal({ header: 'Error', content: <>Unexpected error</> });
                        }
                    },
                    { id: "cancel-delete-btn", caption: "Cancel",
                        func: async () => {
                            return modalManager.closeModal(modalUuid);
                        }
                    }
                ] });
            },
        },
    ];

    if (selectedTargetData.isDirectory) {
        btnsRenderer(forFolderBtns);
    } else if (!selectedTargetData.isDirectory) {
        btnsRenderer(forFileBtns);
    }
}

// const renderTreeDataComponent = (id, data, draggable, renderByStatus, statusCode) => {
//     console.log(11, draggable, data.uuid, data);
//     const componentId = draggable ? getTreeDataComponentId(data.uuid) : undefined; //getTreeDataComponentId() : undefined;

//     return `
//         <div class="element-data-container ${statusCode === 4 ? "fantom-element" : statusCode === 3 ? "element-difference" : ''} ${draggable && statusCode !== 4 ? "draggable" : ''}">
                
    

//                 <div ${componentId ? `id="${componentId}"` : ''} class="element-flow" data-tree="${id}" data-filepath="${data.path}" ${draggable && statusCode !== 4 ? `draggable="true"` : ''}></div>
//                 <div title="${data.extension === 'mp3' ? 'Music' : VIDEO_EXTENSIONS.includes(data.extension) ? 'Video' : IMAGE_EXTENSIONS.includes(data.extension) ? 'Image' : 'File'}" class="element-icon-container-${data.isDirectory ? 'folder' : data.extension === 'mp3' ? 'musicfile' : VIDEO_EXTENSIONS.includes(data.extension) ? 'videofile' : IMAGE_EXTENSIONS.includes(data.extension) ? 'imagefile' : 'file'}"><img alt="" /></div>
                
//                 <div class="element-caption-container">
//                     <span class="element-caption ${renderByStatus ? (statusCode == 1 ? 'not-exist-status' : statusCode == 2 ? 'exist-status' : statusCode == 3 ? 'size-difference-status' : statusCode == 5 ? 'time-mode-difference-status' :'') : ''}">${data.name}</span>
//                     ${statusCode === 3 ? `<span class="element-additionally-caption">${data.mbSize === 0 ? `${data.bSize} bytes` : `${data.mbSize} Mb`}</span>` : ''}
//                     ${statusCode === 5 ? `<span class="element-additionally-caption">${data.lastModPeopleFormat}</span>` : ''}
//                 </div>
                
            
            
//             </div>`;
// }



// const dragstart_handler = (ev, data) => {
//     startDragFilePathState = ev.target.dataset.filepath;
//     ev.dataTransfer.setData("text/plain", JSON.stringify(ev.target.dataset));
// }

// const dragover_handler = (ev) => {
//     ev.preventDefault();
//     if (ev.target.dataset.filepath === startDragFilePathState) {
//         ev.dataTransfer.dropEffect = "none";
//     } else {
//         ev.dataTransfer.dropEffect = "move";
//     }
// }

// const drop_handler = (ev) => {
//     ev.preventDefault();

//     const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
//     const endTreeId = ev.target.dataset.tree;

//     const startDragTarget = treeState[data.tree].find(el => el.path === data.filepath);
//     const endDragTarget = treeState[endTreeId].find(el => el.path === ev.target.dataset.filepath);

//     if (startDragTarget.path !== endDragTarget.path && startDragTarget.parentPath !== endDragTarget.path) {
//         if (!startDragTarget.isDirectory && endDragTarget.isDirectory) {
//             const modalContent = `
//                 <div class="coping-file-event">
//                     <div class="coping-file-event-file">
//                         ${renderTreeDataComponent(1, startDragTarget, false, false, startDragTarget.status)}
//                     </div>

//                     ${arrow_Component()}

//                     <div class="coping-file-event-dictionary-destination">
//                         ${renderTreeDataComponent(2, endDragTarget, false, false, endDragTarget.status)}
//                     </div>
//                 </div>`;
            
//             setModal_Component({ header: "File transfer", showImmediately: true, content: modalContent,
//                 buttons: [
//                     { id: "modal-copy-btn", caption: "Copy",
//                         func: async () => {
//                             setModal_Component({ content: "Coping, please wait..." });

//                             const response = await appFunctions.copyFile({
//                                 filePath: startDragTarget.path,
//                                 destination: `${endDragTarget.path}\\${startDragTarget.name}.${startDragTarget.extension}`,
//                                 fullFileName: `${startDragTarget.name}.${startDragTarget.extension}`,
//                                 destParentPath: endDragTarget.path,
//                                 destRootPath: endDragTarget.fromRootPath,
//                                 fileLevel: startDragTarget.level,
//                                 fullCopy: true
//                             });
                            
//                             if (response.ok) {
//                                 checkDirectories();
//                                 //pushNewItem(endTreeId, response.file);
//                                 //rerenderTrees();
//                                 return setHideStateModal_Component(true);
//                             }

//                             return setModal_Component({ content: response?.error, showImmediately: true });
//                         }
//                     },
//                     { id: "modal-move-btn", caption: "Move",
//                         func: async () => {
//                             setModal_Component({ content: "Moving, please wait...", showImmediately: true });

//                             const response = await appFunctions.moveRenameFile(startDragTarget.path, `${endDragTarget.path}\\${startDragTarget.name}.${startDragTarget.extension}`);
                            
//                             if (response.ok) {
//                                 checkDirectories();
//                                 return setHideStateModal_Component(true);
//                             }
//                             return setModal_Component({ content: response.error, showImmediately: true });
//                         }
//                     }
//                 ] });
//         } else if (!startDragTarget.isDirectory && !endDragTarget.isDirectory) {
//             setModal_Component({ header: 'Files comparing', showImmediately: true, content: `
//                 <div style="display: flex; column-gap: 20px;">
//                     ${aboutFileForm_Component({ path: startDragTarget.path, extension: startDragTarget.extension, removePreview: true, fileDataLines: [
//                         { caption: 'Name:', value: startDragTarget.name },
//                         { caption: 'Extension:', value: startDragTarget.extension },
//                         { caption: 'Size:', value: startDragTarget.mbSize === 0 ? `${startDragTarget.bSize} bytes` : `${startDragTarget.mbSize} Mb` },
//                         { caption: 'Last mod date:', value: startDragTarget.lastModPeopleFormat }
//                     ] })}
//                     ${aboutFileForm_Component({ path: endDragTarget.path, extension: endDragTarget.extension, removePreview: true, fileDataLines: [
//                         { caption: 'Name:', value: endDragTarget.name },
//                         { caption: 'Extension:', value: endDragTarget.extension },
//                         { caption: 'Size:', value: endDragTarget.mbSize === 0 ? `${endDragTarget.bSize} bytes` : `${endDragTarget.mbSize} Mb` },
//                         { caption: 'Last mod date:', value: endDragTarget.lastModPeopleFormat }
//                     ] })}
//                 </div>
//                 ` })
//         } else if (startDragTarget.isDirectory && endDragTarget.isDirectory && !endDragTarget.fromRootPath.includes(startDragTarget.fromRootPath)) {
//             setModal_Component({ header: "Folders tree transfer", showImmediately: true, content: "Coping folders to new path", buttons: [
//                 { id: "modal-copy-tree-btn", caption: "Copy folders tree", func: async () => {
//                     setModal_Component({ content: "Coping, please wait...", showImmediately: true });

//                     const response = await appFunctions.copyFoldersTree(startDragTarget.path, `${endDragTarget.path}\\${startDragTarget.name}.${startDragTarget.extension}`);

//                     if (response?.error) {
//                         return setModal_Component({ header: "File transfer", content: response.error, showImmediately: true });
//                     }
//                     checkDirectories();
//                     return setHideStateModal_Component(true);
//                 }},
//                 { id: "modal-move-tree-btn", caption: "Move folders tree", func: async () => {
//                     setModal_Component({ content: "Moving, please wait...", showImmediately: true });

//                     const response = await appFunctions.moveRenameFile(startDragTarget.path, `${endDragTarget.path}\\${startDragTarget.name}.${startDragTarget.extension}`);

//                     if (response.ok) {
//                         checkDirectories();
//                         return setHideStateModal_Component(true);
//                     }
//                     return setModal_Component({ header: "File transfer", content: response.error, showImmediately: true });
//                 }}
//             ] });
//         }
//     }
// }

const renderTrees = () => {
    const firstTreeInfo = appStateManager.getTreeInfo(ElementsIds.firstTree);
    const secondTreeInfo = appStateManager.getTreeInfo(ElementsIds.secondTree);
    if (!firstTreeInfo?.data || !secondTreeInfo?.data) {
        return;
    }
    appStateManager.careOnTree = ElementsIds.firstTree;
    const firstTreeNodes = renderTree(ElementsIds.firstTree, firstTreeInfo?.data, 0);
    const firstTreeContainer = document.getElementById(ElementsIds.firstTree);
    if (firstTreeContainer) {
        firstTreeContainer.innerHTML = firstTreeNodes.map(el => (renderToString(el))).join("");
    }

    appStateManager.careOnTree = ElementsIds.secondTree;
    const secondTreeNodes = renderTree(ElementsIds.secondTree, secondTreeInfo?.data, 0);
    const secondTreeContainer = document.getElementById(ElementsIds.secondTree);
    if (secondTreeContainer) {
        secondTreeContainer.innerHTML = secondTreeNodes.map(el => (renderToString(el))).join("");
    }

    addListenersOnItems(ElementsIds.firstTree, firstTreeInfo?.data);
    addListenersOnItems(ElementsIds.secondTree, secondTreeInfo?.data);

    // TODO: подсчет разницы
    // treeFooter_Component(treeState.secondTree.filter(el => el.status !== 4).length, treeState.secondTree.filter(el => el.status === 4).length)
    windowElements.firstTreeFooter.innerHTML = renderToString(treeFooter_Component(firstTreeInfo?.count ?? 0, 0));
    windowElements.secondTreeFooter.innerHTML = renderToString(treeFooter_Component(secondTreeInfo?.count ?? 0, 0));

    if (windowElements.firstTreeFooter.classList.contains(CSSClassNames.displayNone)) {
        windowElements.firstTreeFooter.classList.remove(CSSClassNames.displayNone);
    }
    if (windowElements.secondTreeFooter.classList.contains(CSSClassNames.displayNone)) {
        windowElements.secondTreeFooter.classList.remove(CSSClassNames.displayNone);
    }
}

const renderTree = (treeId: TreeId, items: FileInfo[], level: number, parentItem: any = undefined, renderedItems: ReactNode[] = []) => {
    for (let item of items) {
        if (
            (!appStateManager.state.buildSettings.addMimes && item.status === FileStatuses.MimeElement) ||
            (appStateManager.state.buildSettings.excludeEquals && appStateManager.state.trees[treeId]?.matchesItemsUuids.includes(item.uuid)) ||
            (item.parentUuid && appStateManager.state.trees[treeId]?.foundItemsUuids && appStateManager.state.trees[treeId]?.foundItemsUuids.length > 0 && !appStateManager.state.trees[treeId]?.foundItemsUuids.includes(item.uuid))
        ) {
            continue;
        }
        renderedItems.push(
            <div id={item.uuid} key={item.uuid} className="simple-tree-item-row">
                {getLevelSpace(treeId, item, parentItem, item.level)}
                {renderTreeItem(item)}
            </div>
        );
        if (item.children.length > 0 && !appStateManager.getTreeInfo(treeId)?.rolledItems.includes(item.uuid)) {
            renderTree(treeId, item.children, ++level, item, renderedItems);
            --level;
        }
    }
    return renderedItems;
}

const removeRenderedTreeItems = (items: FileInfo[]) => {
    for (let item of items) {
        document.getElementById(item.uuid)?.remove();
        if (item.children.length > 0) {
            removeRenderedTreeItems(item.children);
        }
    }
}

const renderTreeItem = (item: FileInfo): ReactNode => {
    return (
        <div className="simple-tree-item-container" data-select-area data-context-area>
            {getTreeComponent(item)}
        </div>
    );
}

const getTreeComponent = (item: FileInfo, simple: boolean = false): ReactNode => {
    return (
        <div className="element-data-container">
            <div className={
                `icon-element-base icon-${
                    item.isDirectory ? 'folder' :
                    item.extension === 'mp3' ? 'music-file' :
                    VIDEO_EXTENSIONS.includes(item.extension as VideoExtension) ? 'video-file' :
                    IMAGE_EXTENSIONS.includes(item.extension as ImageExtension) ? 'image-file' :
                    'blank-file'
                }`
            }><img alt="" /></div>
            {
                item.differenceStatuses && item.differenceStatuses.length > 1 ?
                slider_Component(item)
                :
                <div>
                    <div className={!simple ? `tree-item-status-${item.status}` : ''}>{item.name}</div>
                </div>
            }
            
            {!simple && item.isDirectory && item.status !== FileStatuses.MimeElement ? <div className="icon-element-base icon-background-transition icon-explore" data-explore-btn><img alt="" /></div> : ''}
        </div>
    );
}

const digOnParentLevel = (currentItemId: UUID, currentLevel: number, endLevel: number): any => {
    if (!appStateManager.state.careOnTree) return;
    const item = appStateManager.getTreeFlatData(appStateManager.state.careOnTree)?.find(el => el.uuid === currentItemId);
    if (!item) {
        return;
    }
    if (currentLevel === endLevel) {
        return item;
    }
    return digOnParentLevel(item.parentUuid!, --currentLevel, endLevel);
}

const getLevelSpace = (treeId: TreeId, item: FileInfo, parentItem: FileInfo, level: number) => {
    if (!parentItem) return;
    let space = [];
    const parentChildren = parentItem.children;
    const indexOfItem = parentChildren.indexOf(item);
    const itemChildren = item.children;

    for (let i = 0; i < level; i++) {
        const familyItem = digOnParentLevel(item.uuid, level - 1, i);
        const className = (indexOfItem + 1 === parentChildren.length && i + 1 === level) ?
                            'simple-tree-space-line-last' :
                            (indexOfItem + 1 !== parentChildren.length && i + 1 === level) ?
                            'simple-tree-space-line-child' :
                            (!familyItem.isLastChild) ? 'simple-tree-space-line' :
                            'simple-tree-space';
        space.push(treeSpace_Component(i, className));
    }

    return (
        <span className="simple-tree-space-container">
            {space?.map(el => (el))}
            {
                itemChildren.length > 0 ?
                    <span className="simple-tree-space simple-tree-space-pointer simple-tree-space-center-content simple-tree-space-icon" data-roll-up-btn>
                        <img className={`simple-tree-space-icon-arrow ${appStateManager.getTreeInfo(treeId)?.rolledItems.includes(item.uuid) ? 'rotated-roll-up-btn' : ''}`} alt="" />
                    </span> :
                null
            }
        </span>
    );
}

const checkDirectories = async () => {
    const response = await window.api.checkDirectories((windowElements.firstInput as HTMLInputElement)?.value ?? '', (windowElements.secondInput as HTMLInputElement)?.value ?? '', true, true);

    if (!response.ok) {
        modalManager.invokeModal({ header: 'Error', content: <>{response?.error?.toString()}</> });
        return;
    }

    if (response.data) {
        appStateManager.setTreesState(response.data);
        renderTrees();
    }
}

const addListenersOnItems = (treeId: TreeId, items: FileInfo[]) => {
    for (let item of items) {
        if (
            (!appStateManager.state.buildSettings.addMimes && item.status === FileStatuses.MimeElement) ||
            (appStateManager.state.buildSettings.excludeEquals && appStateManager.state.trees[treeId]?.matchesItemsUuids.includes(item.uuid)) ||
            (item.parentUuid && appStateManager.state.trees[treeId]?.foundItemsUuids && appStateManager.state.trees[treeId]?.foundItemsUuids.length > 0 && !appStateManager.state.trees[treeId]?.foundItemsUuids.includes(item.uuid))
        ) {
            continue;
        }
        const element = document.getElementById(item.uuid);
        if (!element) return modalManager.invokeModal({ header: "Error", content: `Can't find element with uuid: ${item.uuid}` });
        const exploreBtn = element.querySelector('[data-explore-btn]');
        if (exploreBtn) {
            exploreBtn.addEventListener('click', () => window.api.openExplorer(item.path))
        }

        const rollupBtn = element.querySelector('[data-roll-up-btn]');
        if (rollupBtn) {
            rollupBtn.addEventListener('click', () => {
                appStateManager.rollUpItem(treeId, item.uuid);
                const iconElement = rollupBtn.querySelector('img');
                if (iconElement) {
                    if (iconElement.classList.contains('rotated-roll-up-btn')) {
                        iconElement.classList.remove('rotated-roll-up-btn');
                    } else {
                        iconElement.classList.add('rotated-roll-up-btn');
                    }
                }

                appStateManager.careOnTree = treeId;
                
                if (appStateManager.getTreeInfo(treeId)?.rolledItems.includes(item.uuid)) {
                    removeRenderedTreeItems(item.children);
                } else {
                    const treeNodes: any[] = renderTree(treeId, item.children, item.level, item);
                    let parentNodeId = item.uuid;
                    const rerenderedNodesIds: any[] = [];
                    for (let node of treeNodes) {
                        const parentNode = document.getElementById(parentNodeId);
                        parentNode?.insertAdjacentHTML('afterend', renderToString(node));
                        parentNodeId = node?.key;
                        rerenderedNodesIds.push(node?.key);
                    }
                    addListenersOnItems(treeId, appStateManager.getTreeFlatData(treeId)?.filter(item => rerenderedNodesIds.includes(item.uuid))?.map(el => { return el.info }) ?? []);
                }
            })
        }

        const selectItemHandler = (treeId: TreeId) => {
            const selectedItem = document.getElementById(appStateManager.getTreeInfo(treeId)?.selectedItem?.uuid as string)?.querySelector('[data-select-area]');
            if (selectedItem) {
                selectedItem.classList.remove('simple-tree-item-selected');
            }
            appStateManager.selectItem(treeId, item.uuid);
            selectItemArea?.classList.add('simple-tree-item-selected');
        }

        const selectItemArea = element.querySelector('[data-select-area]');
        if (selectItemArea) {
            selectItemArea.addEventListener('mousedown', (event: any) => {
                if (event.button === 0) {
                    selectItemHandler(treeId);
                    if (item?.parentPath && item.status !== FileStatuses.MimeElement) {
                        appStateManager.setMouseIsPressedState(true);
                        if (windowElements.draggedItem) {
                            windowElements.draggedItem!.innerHTML = renderToString(getTreeComponent(item));
                        }
                    }
                }
            })
            selectItemArea.addEventListener('mousemove', () => {
                if (appStateManager.state.mouseIsPressed && !appStateManager.state.itemIsDragged) {
                    appStateManager.setDraggableStateItem(true);
                    appStateManager.setOnTreeDragStarts(treeId);
                }
            })
            selectItemArea.addEventListener('mouseup', (event: any) => {
                if (event.button === 0 && appStateManager.state.itemIsDragged && appStateManager.state.onTreeDragStarts) {
                    const startDragTarget = appStateManager.getTreeInfo(appStateManager.state.onTreeDragStarts)?.selectedItem;
                    const endDragTarget = appStateManager.getTreeFlatData(treeId)?.find(el => el.uuid === item.uuid)?.info;
                    if (startDragTarget && endDragTarget) {
                        if (!startDragTarget.isDirectory && endDragTarget.isDirectory) {
                            const modalContent = 
                                <div className="coping-file-event">
                                    <div className="coping-file-event-file">
                                        {getTreeComponent(startDragTarget, true)}
                                    </div>
                                    <div className="coping-file-event-arrow-container">
                                        {arrow_2_Component()}
                                    </div>
                                    <div className="coping-file-event-dictionary-destination">
                                        {getTreeComponent(endDragTarget, true)}
                                    </div>
                                </div>;
                            const modalUuid = modalManager.invokeModal({ header: "File transfer", content: modalContent,
                                buttons: [
                                    { id: "modal-copy-btn", caption: "Copy",
                                        func: async () => {
                                            modalManager.closeModal(modalUuid);
                                            const copyModalUuid = modalManager.invokeModal({ header: 'Copy in progress', content: 'Coping, please wait...' });

                                            // const response = await appFunctions.copyFile({
                                            //     filePath: startDragTarget.path,
                                            //     destination: `${endDragTarget.path}\\${startDragTarget.name}.${startDragTarget.extension}`,
                                            //     fullFileName: `${startDragTarget.name}.${startDragTarget.extension}`,
                                            //     destParentPath: endDragTarget.path,
                                            //     destRootPath: endDragTarget.rootPath,
                                            //     fileLevel: startDragTarget.level,
                                            //     fullCopy: true
                                            // });
                                            const response = await window.api.copyFile({
                                                filePath: startDragTarget.path,
                                                destination: `${endDragTarget.path}\\${startDragTarget.name}.${startDragTarget.extension}`,
                                                fullFileName: `${startDragTarget.name}.${startDragTarget.extension}`,
                                                destParentPath: endDragTarget.path,
                                                destRootPath: endDragTarget.fromRootPath!,
                                                fileLevel: startDragTarget.level,
                                                fullCopy: true
                                            });
                                            
                                            if (response.ok) {
                                                checkDirectories();
                                                return modalManager.closeModal(copyModalUuid);
                                            }
                                            if (response?.error) {
                                                modalManager.closeModal(copyModalUuid);
                                                return modalManager.invokeModal({ header: 'Error', content: <>{response?.error}</> });
                                            }
                                        }
                                    },
                                    { id: "modal-move-btn", caption: "Move",
                                        func: async () => {
                                            modalManager.closeModal(modalUuid);
                                            const moveModalUuid = modalManager.invokeModal({ header: 'Move in progress', content: 'Moving file, please wait...' });

                                            // const response = await appFunctions.moveRenameFile(startDragTarget.path, `${endDragTarget.path}\\${startDragTarget.name}.${startDragTarget.extension}`);
                                            const response = await window.api.moveRenameFile(startDragTarget.path, `${endDragTarget.path}\\${startDragTarget.name}.${startDragTarget.extension}`);
                                            
                                            if (response.ok) {
                                                checkDirectories();
                                                return modalManager.closeModal(moveModalUuid);
                                            }
                                            if (response?.error) {
                                                modalManager.closeModal(moveModalUuid);
                                                return modalManager.invokeModal({ header: 'Error', content: <>{response?.error}</> });
                                            }
                                        }
                                    }
                                ] });
                        } else if (!startDragTarget.isDirectory && !endDragTarget.isDirectory) {
                            modalManager.invokeModal({ header: 'Files comparing', content: 
                                    <div style={{ display: 'flex', columnGap: '20px' }}>
                                        {aboutFileForm_Component({ path: startDragTarget.path, extension: startDragTarget.extension, removePreview: true, fileDataLines: [
                                            { caption: 'Name:', value: startDragTarget.name },
                                            { caption: 'Extension:', value: startDragTarget.extension },
                                            { caption: 'Size:', value: startDragTarget.mbSize === 0 ? `${startDragTarget.bSize} bytes` : `${startDragTarget.mbSize} Mb` },
                                            { caption: 'Last mod date:', value: startDragTarget.lastModPeopleFormat }
                                        ] })}
                                        {aboutFileForm_Component({ path: endDragTarget.path, extension: endDragTarget.extension, removePreview: true, fileDataLines: [
                                            { caption: 'Name:', value: endDragTarget.name },
                                            { caption: 'Extension:', value: endDragTarget.extension },
                                            { caption: 'Size:', value: endDragTarget.mbSize === 0 ? `${endDragTarget.bSize} bytes` : `${endDragTarget.mbSize} Mb` },
                                            { caption: 'Last mod date:', value: endDragTarget.lastModPeopleFormat }
                                        ] })}
                                    </div>
                                })
                        } else if (startDragTarget.isDirectory && endDragTarget.isDirectory && !endDragTarget.fromRootPath?.includes(startDragTarget?.fromRootPath ?? '')) {
                            // TODO
                            // setModal_Component({ header: "Folders tree transfer", showImmediately: true, content: "Coping folders to new path", buttons: [
                            //     { id: "modal-copy-tree-btn", caption: "Copy folders tree", func: async () => {
                            //         setModal_Component({ content: "Coping, please wait...", showImmediately: true });

                            //         const response = await appFunctions.copyFoldersTree(startDragTarget.path, `${endDragTarget.path}\\${startDragTarget.name}.${startDragTarget.extension}`);

                            //         if (response?.error) {
                            //             return setModal_Component({ header: "File transfer", content: response.error, showImmediately: true });
                            //         }
                            //         checkDirectories();
                            //         return setHideStateModal_Component(true);
                            //     }},
                            //     { id: "modal-move-tree-btn", caption: "Move folders tree", func: async () => {
                            //         setModal_Component({ content: "Moving, please wait...", showImmediately: true });

                            //         const response = await appFunctions.moveRenameFile(startDragTarget.path, `${endDragTarget.path}\\${startDragTarget.name}.${startDragTarget.extension}`);

                            //         if (response.ok) {
                            //             checkDirectories();
                            //             return setHideStateModal_Component(true);
                            //         }
                            //         return setModal_Component({ header: "File transfer", content: response.error, showImmediately: true });
                            //     }}
                            // ] });
                        }
                    }
                }
            })
        }

        const contextItemArea = element.querySelector('[data-context-area]');
        if (contextItemArea) {
            contextItemArea.addEventListener('contextmenu', (event: any) => {
                selectItemHandler(treeId);
                if (item?.parentPath && item.status !== FileStatuses.MimeElement) {
                    const contextMenu = document.getElementById(ElementsIds.contextMenu);
                    const selectedItem = appStateManager.getTreeInfo(treeId)?.selectedItem;
                    if (contextMenu && selectedItem) {
                        renderContextMenu(selectedItem);
                        if (contextMenu.classList.contains(CSSClassNames.displayNone)) {
                            contextMenu.classList.remove(CSSClassNames.displayNone);
                        }
                        const contextMenuRect = contextMenu.getBoundingClientRect();
                        contextMenu.style.left = `${event.clientX + contextMenuRect.width > event.view.innerWidth ? event.clientX - contextMenuRect.width : event.clientX}px`;
                        contextMenu.style.top = `${event.clientY + contextMenuRect.height > event.view.innerHeight ? event.clientY - contextMenuRect.height : event.clientY}px`;
                    }
                }
            })
        }

        const sliderItem: HTMLElement | null = element.querySelector('[data-slider]');
        if (sliderItem) {
            const sliderItemBtn = element.querySelector('[data-slider-btn]');
            sliderItemBtn?.addEventListener('click', () => {
                const linkedElement = document.getElementById(item?.linkedWithUuid as string);
                const linkedElementSlider = linkedElement?.querySelector('[data-slider]');
                const linkedElementSlidesContainer = linkedElement?.querySelector('[data-slides-container]');

                const mainSlidesContainer = sliderItem.querySelector('[data-slides-container]');
                const mainSlides = sliderItem.querySelectorAll('[data-slide]');

                let lastIndex = sliderItem.dataset?.lastIdx ? Number(sliderItem.dataset.lastIdx) : 0;

                if (lastIndex + 1 >= mainSlides.length) {
                    (mainSlidesContainer as HTMLElement).style.transform = `translateY(0%)`;
                    sliderItem.dataset.lastIdx = '0';
                    if (linkedElementSlider) {
                        (linkedElementSlidesContainer as HTMLElement).style.transform = `translateY(0%)`;
                        (linkedElementSlider as HTMLElement).dataset.lastIdx = '0';
                    }
                } else if (lastIndex + 1 < mainSlides.length) {
                    (mainSlidesContainer as HTMLElement).style.transform = `translateY(${(lastIndex + 1) * -100}%)`;
                    sliderItem.dataset.lastIdx = (++lastIndex).toString();
                    if (linkedElementSlider) {
                        (linkedElementSlidesContainer as HTMLElement).style.transform = `translateY(${lastIndex * -100}%)`;
                        (linkedElementSlider as HTMLElement).dataset.lastIdx = lastIndex.toString();
                    }
                }
            })
        }
        if (item.children.length > 0 && !appStateManager.getTreeInfo(treeId)?.rolledItems.includes(item.uuid)) {
            addListenersOnItems(treeId, item.children);
        }
    }
}

const addEventListenersOnWindowElements = () => {
    windowElements.firstSearchByDirectoriesCheckboxState.addEventListener('click', () => {
        appStateManager.setSearchByDirectoriesState(ElementsIds.firstTree);
        if (appStateManager.getTreeInfo(ElementsIds.firstTree)?.searchByDirectories) {
            windowElements.firstSearchByDirectoriesCheckboxState.classList.add(CSSClassNames.checkedCheckBlock);
        } else {
            windowElements.firstSearchByDirectoriesCheckboxState.classList.remove(CSSClassNames.checkedCheckBlock);
        }
        const value = (windowElements.searchFirstTreeInput as HTMLInputElement).value;
        let foundTreeUuids: UUID[] = [];
        if (value) {
            foundTreeUuids = appStateManager.searchItemsUuidsByValue(ElementsIds.firstTree, value);
        }
        appStateManager.setFoundItemsUuids(ElementsIds.firstTree, foundTreeUuids);
        renderTrees();
    });

    windowElements.secondSearchByDirectoriesCheckboxState.addEventListener('click', () => {
        appStateManager.setSearchByDirectoriesState(ElementsIds.secondTree);
        if (appStateManager.getTreeInfo(ElementsIds.secondTree)?.searchByDirectories) {
            windowElements.secondSearchByDirectoriesCheckboxState.classList.add(CSSClassNames.checkedCheckBlock);
        } else {
            windowElements.secondSearchByDirectoriesCheckboxState.classList.remove(CSSClassNames.checkedCheckBlock);
        }
        const value = (windowElements.searchSecondTreeInput as HTMLInputElement).value;
        let foundTreeUuids: UUID[] = [];
        if (value) {
            foundTreeUuids = appStateManager.searchItemsUuidsByValue(ElementsIds.secondTree, value);
        }
        appStateManager.setFoundItemsUuids(ElementsIds.secondTree, foundTreeUuids);
        renderTrees();
    });

    windowElements.buildMimeElementsCheckbox.addEventListener('click', () => {
        const actualState = appStateManager.setBuildMimeSettingState();
        (windowElements.buildMimeElementsCheckbox.querySelector('input') as HTMLInputElement).checked = actualState;
        renderTrees();
    });

    windowElements.excludeEqualsCheckbox.addEventListener('click', () => {
        const actualState = appStateManager.setExcludeEqualsSettingState();
        (windowElements.excludeEqualsCheckbox.querySelector('input') as HTMLInputElement).checked = actualState;
        renderTrees();
    });

    windowElements.searchFirstTreeInput.addEventListener('input', (event: any) => {
        if (appStateManager.state.trees[ElementsIds.firstTree]?.inputTimeoutId) {
            clearTimeout(appStateManager.state.trees[ElementsIds.firstTree]?.inputTimeoutId);
        }
        const timeoutId = setTimeout(() => {
            appStateManager.setTimeoutId(ElementsIds.firstTree);
            const value = event.target.value;
            let foundTreeUuids: UUID[] = [];
            if (value) {
                foundTreeUuids = appStateManager.searchItemsUuidsByValue(ElementsIds.firstTree, value);
            }
            appStateManager.setFoundItemsUuids(ElementsIds.firstTree, foundTreeUuids);
            renderTrees();
        }, 1000);
        appStateManager.setTimeoutId(ElementsIds.firstTree, timeoutId);
    });

    windowElements.searchSecondTreeInput.addEventListener('input', (event: any) => {
        if (appStateManager.state.trees[ElementsIds.secondTree]?.inputTimeoutId) {
            clearTimeout(appStateManager.state.trees[ElementsIds.secondTree]?.inputTimeoutId);
        }
        const timeoutId = setTimeout(() => {
            appStateManager.setTimeoutId(ElementsIds.secondTree);
            const value = event.target.value;
            let foundTreeUuids: UUID[] = [];
            if (value) {
                foundTreeUuids = appStateManager.searchItemsUuidsByValue(ElementsIds.secondTree, value);
            }
            appStateManager.setFoundItemsUuids(ElementsIds.secondTree, foundTreeUuids);
            renderTrees();
        }, 1000);
        appStateManager.setTimeoutId(ElementsIds.secondTree, timeoutId);
    });

    windowElements.checkDirectoriesBtn.addEventListener('click', async () => {
        checkDirectories();
    });

    windowElements.infoBtn.addEventListener('click', () => {
        modalManager.invokeModal({ header: 'Info', content: infoModalContent_Component() });
    })

    windowElements.treeDelimiter.addEventListener('mousedown', (event) => {
        event.preventDefault();

        const resizedBlock: HTMLElement | null = document.querySelector(".tree-container");
        if (!resizedBlock) { return; }
        const resizedBlockWidth = resizedBlock.offsetWidth;
        const pageDirection = event.pageX;

        const mMove = (event: any) => {
            if (resizedBlock) {
                var different = (event.pageX) - pageDirection;
                resizedBlock.style.width = (resizedBlockWidth + (different)) + 'px';
            }
        }
        const mUp = () => {
            document.removeEventListener('mousemove', mMove);
            document.removeEventListener('mouseup', mUp);
        }
        document.addEventListener('mousemove', mMove);
        document.addEventListener('mouseup', mUp);
    });

    windowElements.firstInputBtn.addEventListener('click', async () => {
        const response: Response<SelectDirectoryDialogData> = await window.api.selectDirectoryDialog();
        if (response.ok && response.data) {
            (windowElements.firstInput as HTMLInputElement).value = response.data.path;
        }
    });

    windowElements.secondInputBtn.addEventListener('click', async () => {
        const response: Response<SelectDirectoryDialogData> = await window.api.selectDirectoryDialog();
        if (response.ok && response.data) {
            (windowElements.secondInput as HTMLInputElement).value = response.data.path;
        }
    });
}

const addEventListenersOnWindow = () => {
    window.addEventListener('mouseup', () => {
        appStateManager.setDraggableStateItem(false);
        const draggedItemElement = windowElements.draggedItem;
        if (draggedItemElement && !draggedItemElement.classList.contains(CSSClassNames.displayNone)) {
            draggedItemElement.classList.add(CSSClassNames.displayNone)
        };
    });

    window.addEventListener('mousemove', (event: any) => {
        if (appStateManager.state.itemIsDragged) {
            const draggedItemElement = windowElements.draggedItem;
            if (draggedItemElement) {
                if (draggedItemElement.classList.contains(CSSClassNames.displayNone)) {
                    draggedItemElement.classList.remove(CSSClassNames.displayNone)
                };
                draggedItemElement.style.top = `${event.clientY}px`;
                draggedItemElement.style.left = `${event.clientX}px`;
            }
        }
    });

    window.addEventListener('mouseup', () => {
        appStateManager.setMouseIsPressedState(false);
        appStateManager.setOnTreeDragStarts();
    });
}

addEventListenersOnWindow();
addEventListenersOnWindowElements();
