import { UUID } from "crypto";
import { renderToString } from 'react-dom/server';
import { ModalArgs, UpdatableModalArgs } from "src/types/modal-args.type";


export class ModalManager {

    private modalContainer;

    constructor(modalsContainerElement: HTMLElement) {
        this.modalContainer = modalsContainerElement
    }

    public closeModal = (id: UUID) => {
        document.getElementById(id)?.remove();
    }

    public invokeModal = (args: ModalArgs): UUID => {
        const { header, content, buttons } = args;
        const modalUuid = crypto.randomUUID();
        this.modalContainer.appendChild(
            document.createRange().createContextualFragment(
                renderToString(
                    <div id={modalUuid} className="modal-background">
                        <div className="modal" data-modal>
                            <div className="modal-header">
                                <div className="modal-header-caption" data-caption>{header}</div>
                                <div className="modal-header-close-btn" data-close-btn>
                                    <span className="modal-header-close-icon">+</span>
                                </div>
                            </div>
                            <div className="modal-body" data-body>{content}</div>
                            <div className="modal-buttons" data-buttons>
                                {
                                    buttons ?
                                        buttons.map(btn => <button id={btn.id} key={btn.id} className="modal-btn-style">{btn.caption}</button>)
                                    : null
                                }
                            </div>
                        </div>
                    </div>
                )
            )
        );

        const modal = document.getElementById(modalUuid);
        modal?.querySelector('[data-close-btn]')!.addEventListener('click', () => modal.remove());

        if (buttons) {
            for (let btn of buttons) {
                modal?.querySelector('[data-buttons]')?.querySelector(`#${btn.id}`)?.addEventListener('click', async () => await btn.func());
            }
        }

        const modalElement: any = modal?.querySelector('[data-modal]');
        modalElement.style.top = `${-modalElement.clientHeight - 10}px`;

        setTimeout(() => {
            modalElement.style.top = `130px`;
        }, 100);

        return modalUuid;
    }

    public updateModal = (id: UUID, args: UpdatableModalArgs) => {
        const { header, content, buttons } = args;
        const modal = document.getElementById(id);

        if (!modal) {
            this.invokeModal({ header: 'Error', content: `Modal with id: '${id}' does not exist.` });
            return;
        }

        if (header) {
            modal.querySelector('[data-caption]')!.innerHTML = header;
        }

        if (content) {
            modal.querySelector('[data-content]')!.innerHTML = content;
        }

        if (buttons) {
            for (let btn of buttons) {
                modal?.querySelector('[data-buttons]')?.querySelector(`#${btn.id}`)?.addEventListener('click', async () => await btn.func());
            }
        }
    }

}
