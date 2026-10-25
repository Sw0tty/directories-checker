import { ReactNode } from "react";


export type ModalArgs = {
    header: string;
    content?: ReactNode;
    buttons?: ModalArgsBtns[];
}

export type UpdatableModalArgs = ModalArgs & {
    header?: string;
    content?: any;
}

export type ModalArgsBtns = {
    id: string;
    caption: string;
    func: () => any
}
