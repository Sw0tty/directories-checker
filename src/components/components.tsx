import { VIDEO_EXTENSIONS, IMAGE_EXTENSIONS } from "src/consts/data.consts";
import { SpaceComponentClassName } from "src/types/space-component-class-name.type";
import { imageMediaProtocol, videoMediaProtocol } from "src/consts/protocol.consts";
import { FileInfo } from "src/types/file-info.type";
import { FileStatuses } from "src/enums/file-statuses.enum";


export const aboutFileForm_Component = (data: any) => {
    const { path, extension, fileDataLines, removePreview } = data;
    return (
        <div className="about-file-container">
            {VIDEO_EXTENSIONS.includes(extension) && !removePreview ? <video className="video-container" controls>
                <source src={`${videoMediaProtocol}://${path}`} type={`video/${extension}`} />
            </video> : ''}
            {IMAGE_EXTENSIONS.includes(extension) && !removePreview ? <img className="image-container" src={`${imageMediaProtocol}://${path}`} /> : ''}
            <div className="about-file-info-container">
                {fileDataLines.map((el: { caption: string, value: string }) => {
                    return (
                        <div className="file-info-line">
                            <span className="file-info-param">{el.caption}</span>
                            <span className="file-info-value">{el.value}</span>
                        </div>
                    );
                })}
            </div>
        </div>);
}

export const checkBox_Component = (id: string, caption: string) => {
    return (
        <div className="checkbox-component-container">
            {caption ? <span>{caption}</span> : ''}
            <label htmlFor={id}>
                <input id={id} className="checkbox-input" type="checkbox" />
                <div className="checkbox-checked-status-container">
                    <div className="checkbox-checked-status"></div>
                </div>
            </label>
        </div>
    );
}

export const checkBox2_Component = (id: string,caption: string) => {
    const inputId = `${id}-check-state`;
    return {
        renderedCheckbox: (
            <>
                {caption ? <span>{caption}</span> : ''}
                <div>
                    <input id={inputId} className="checkbox-input" type="checkbox" />
                    <div className="checkbox-checked-status-container">
                        <div className="checkbox-checked-status"></div>
                    </div>
                </div>
            </>
        ),
        inputId: inputId
    };
}

export const arrow_Component = () => {
    return (
        <div className="arrow-container">
            <div className="arrow">
                <div className="arrow-body"></div>
                <span>&gt;</span>
            </div>
        </div>
    );
}

export const arrow_2_Component = () => {
    return (<div className="arrow-on-right"></div>);
}

export const treeFooter_Component = (allComponents: number, difference: number) => {
    return (<>
        <span>Всего: {allComponents}</span>
        <span>Разница: {difference}</span>
    </>);
}

export const treeSpace_Component = (idx: number, className?: SpaceComponentClassName) => {
    return (<span key={idx} className={`simple-tree-space ${className ?? ''}`}></span>);
};

export const contentMenuBtnTemplate_Component = (btnId: string, caption: string) => {
    return (
        <div id={btnId} className="context-menu-button-container">
            <div className="context-menu-button-cover"></div>
            <span className="context-menu-button-caption">{caption}</span>
        </div>
    );
}

export const infoModalContent_Component = () => {
    const statusElement = (status: number, caption: string) => {
        return (
            <div className="icon-element-base icon-blank-file info-status-element">
                <img />
                <div className={`tree-item-status-${status}`}>{caption}</div>
            </div>
        );
    }
    return (<div className="info-modal-body">
        {statusElement(1, "Директория/файл существует в обоих 'деревьях'.")}
        {statusElement(2, "Директория/файл не существует в соседнем 'древе'.")}
        {statusElement(3, "Файл отличается по размеру в соседнем 'древе'.")}
        {statusElement(4, "Файл/директория является мимом недостающего элемента.")}
        {statusElement(5, "Файл отличается по дате изменения в соседнем 'древе'.")}
    </div>)
}

export const slider_Component = (file: FileInfo) => {
    return (
        <div className="slider-container">
            <div className="slider" data-slider>
                <div className="slider-btn" data-slider-btn>⮃</div>
                <div className="slides-container" data-slides-container>
                    {
                        file.differenceStatuses!.map((statusCode, idx) => { return (
                            <div key={idx} className="slide" data-slide>
                                <div className={`tree-item-status-${statusCode}`}>
                                    <div>{file.name}</div>
                                    <span className="element-additionally-caption">
                                        {
                                            statusCode === FileStatuses.SizeDifference ?
                                            file.mbSize === 0 ? `${file.bSize} bytes` : `${file.mbSize} Mb` :
                                            statusCode === FileStatuses.LastModDifference ? file.lastModPeopleFormat : ''
                                        }
                                    </span>
                                </div>
                            </div>
                        ) })
                    }
                </div>
            </div>
        </div>
    );
}
