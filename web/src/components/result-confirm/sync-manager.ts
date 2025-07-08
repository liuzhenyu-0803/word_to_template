import { DATA_ORIGINAL_CONTENT, DATA_CELL_ID } from '../../constants';

export class SyncManager {
    private leftIframe: HTMLIFrameElement | null = null;
    private rightIframe: HTMLIFrameElement | null = null;
    private observer: MutationObserver | null = null;
    private leftLoaded = false;
    private rightLoaded = false;
    private loadListenersSetup = false;
    private isUpdating = false;

    constructor() {
        this.observer = new MutationObserver(this.handleMutations.bind(this));
    }

    setIframes(leftIframe: HTMLIFrameElement, rightIframe: HTMLIFrameElement) {
        this.cleanup();

        this.leftIframe = leftIframe;
        this.rightIframe = rightIframe;
        this.leftLoaded = false;
        this.rightLoaded = false;
        this.loadListenersSetup = false;

        this.setupLoadListeners();
    }

    private cleanup() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    private setupLoadListeners() {
        if (!this.leftIframe || !this.rightIframe || this.loadListenersSetup) return;

        this.loadListenersSetup = true;

        this.leftIframe.addEventListener('load', () => {
            this.leftLoaded = true;
            this.initializeObserver();
        });

        this.rightIframe.addEventListener('load', () => {
            this.rightLoaded = true;
            this.initializeObserver();
        });

        if (this.leftIframe.contentDocument && this.leftIframe.contentDocument.readyState === 'complete') {
            this.leftLoaded = true;
            this.initializeObserver();
        }

        if (this.rightIframe.contentDocument && this.rightIframe.contentDocument.readyState === 'complete') {
            this.rightLoaded = true;
            this.initializeObserver();
        }
    }

    private initializeObserver() {
        if (this.leftLoaded && this.rightLoaded && this.leftIframe && this.observer) {
            const table = this.leftIframe.contentDocument?.querySelector('table');
            if (table) {
                this.checkLeftCellsHighlight();
                this.checkRightCellsHighlight();

                this.observer.observe(table, {
                    subtree: true,
                    characterData: true,
                    childList: true,
                    attributes: false
                });
            } else {
                console.log('❌ SyncManager: No table found in left iframe');
            }
        }
    }

    private handleMutations = (mutations: MutationRecord[]) => {
        if (this.isUpdating) {
            return;
        }

        mutations.forEach((mutation) => {
            const cell = (mutation.target as Element).closest('td');
            if (cell && cell.getAttribute(DATA_CELL_ID)) {
                const cellId = cell.getAttribute(DATA_CELL_ID);
                const contentSpan = cell.querySelector('.cell-content');
                const originalContent = cell.getAttribute(DATA_ORIGINAL_CONTENT);
                const currentContent = contentSpan?.textContent || '';

                this.isUpdating = true;

                try {
                    this.updateLeftCell(cellId!, originalContent!, currentContent);
                    this.updateRightCell(cellId!, originalContent!, currentContent);
                } finally {
                    this.isUpdating = false;
                }
            }
        });
    };

    private updateRightCell(cellId: string, originalContent: string, newContent: string) {
        if (!this.rightIframe?.contentDocument) {
            console.log('❌ SyncManager: No right iframe contentDocument');
            return;
        }

        const rightDoc = this.rightIframe.contentDocument;
        const targetCell = rightDoc.querySelector(`[${DATA_CELL_ID}="${cellId}"]`) as HTMLElement;

        if (targetCell) {
            targetCell.textContent = newContent;
            this.applyCellHighlight(targetCell, newContent, originalContent);
            if (originalContent !== newContent) {
                targetCell.setAttribute(DATA_ORIGINAL_CONTENT, originalContent);
            } else {
                targetCell.removeAttribute(DATA_ORIGINAL_CONTENT);
            }

            targetCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            console.log('❌ SyncManager: Target cell not found in right iframe');
        }
    }

    private updateLeftCell(cellId: string, originalContent: string, newContent: string) {
        if (!this.leftIframe?.contentDocument) {
            console.log('❌ SyncManager: No left iframe contentDocument');
            return;
        }

        const leftDoc = this.leftIframe.contentDocument;
        const targetCell = leftDoc.querySelector(`[${DATA_CELL_ID}="${cellId}"]`) as HTMLElement;

        if (targetCell) {
            this.applyCellHighlight(targetCell, newContent, originalContent);
        } else {
            console.log('❌ SyncManager: Left target cell not found in left iframe');
        }
    }

    private applyCellHighlight(cell: HTMLElement, currentContent: string, originalContent: string) {
        if (originalContent !== currentContent) {
            cell.style.border = '2px solid red';
            cell.style.backgroundColor = '#ffe6e6';
        } else {
            cell.style.border = '';
            cell.style.backgroundColor = '';
        }
    }

    private checkRightCellsHighlight() {
        if (!this.rightIframe?.contentDocument) {
            console.log('❌ SyncManager: No right iframe contentDocument');
            return;
        }

        const rightDoc = this.rightIframe.contentDocument;
        const cells = rightDoc.querySelectorAll(`[${DATA_CELL_ID}]`) as NodeListOf<HTMLElement>;

        cells.forEach(cell => {
            if (cell.hasAttribute(DATA_ORIGINAL_CONTENT)) {
                const originalContent = cell.getAttribute(DATA_ORIGINAL_CONTENT) || '';
                const currentContent = cell.textContent || '';
                this.applyCellHighlight(cell, currentContent, originalContent);
            }
        });
    }

    private checkLeftCellsHighlight() {
        if (!this.leftIframe?.contentDocument) {
            console.log('❌ SyncManager: No left iframe contentDocument');
            return;
        }

        const leftDoc = this.leftIframe.contentDocument;
        const cells = leftDoc.querySelectorAll(`[${DATA_CELL_ID}]`) as NodeListOf<HTMLElement>;

        cells.forEach(cell => {
            if (cell.hasAttribute(DATA_ORIGINAL_CONTENT)) {
                const originalContent = cell.getAttribute(DATA_ORIGINAL_CONTENT) || '';
                const contentSpan = cell.querySelector('.cell-content');
                const currentContent = contentSpan?.textContent || '';
                this.applyCellHighlight(cell, currentContent, originalContent);
            }
        });
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}