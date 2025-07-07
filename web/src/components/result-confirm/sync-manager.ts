import { DATA_ORIGINAL_CONTENT } from '../../constants';

export class SyncManager {
    private leftIframe: HTMLIFrameElement | null = null;
    private rightIframe: HTMLIFrameElement | null = null;
    private observer: MutationObserver | null = null;
    private leftLoaded = false;
    private rightLoaded = false;
    private loadListenersSetup = false;
    private isUpdating = false; // 防止死循环标志

    constructor() {
        this.observer = new MutationObserver(this.handleMutations.bind(this));
    }

    setIframes(leftIframe: HTMLIFrameElement, rightIframe: HTMLIFrameElement) {
        // 清理之前的状态
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

        // 监听左侧iframe加载完成
        this.leftIframe.addEventListener('load', () => {
            console.log('📍 SyncManager: Left iframe loaded');
            this.leftLoaded = true;
            this.initializeObserver();
        });

        // 监听右侧iframe加载完成
        this.rightIframe.addEventListener('load', () => {
            console.log('📍 SyncManager: Right iframe loaded');
            this.rightLoaded = true;
            this.initializeObserver();
        });

        // 如果iframe已经加载完成，直接检查
        if (this.leftIframe.contentDocument && this.leftIframe.contentDocument.readyState === 'complete') {
            console.log('📍 SyncManager: Left iframe already loaded');
            this.leftLoaded = true;
            this.initializeObserver();
        }

        if (this.rightIframe.contentDocument && this.rightIframe.contentDocument.readyState === 'complete') {
            console.log('📍 SyncManager: Right iframe already loaded');
            this.rightLoaded = true;
            this.initializeObserver();
        }
    }

    private initializeObserver() {
        console.log('🔍 SyncManager: initializeObserver called', {
            leftLoaded: this.leftLoaded,
            rightLoaded: this.rightLoaded,
            leftIframe: !!this.leftIframe,
            observer: !!this.observer
        });

        if (this.leftLoaded && this.rightLoaded && this.leftIframe && this.observer) {
            const table = this.leftIframe.contentDocument?.querySelector('table');

            console.log('🎯 SyncManager: Looking for table in left iframe', table);

            if (table) {
                console.log('✅ SyncManager: Table found, checking cells highlight');
                // 检查左侧iframe中的cells高亮状态
                this.checkLeftCellsHighlight();
                // 检查右侧iframe中的cells高亮状态
                this.checkRightCellsHighlight();
                
                // 设置 observer
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
        // 防止死循环：如果正在更新中，直接返回
        if (this.isUpdating) {
            return;
        }

        mutations.forEach((mutation) => {
            const cell = (mutation.target as Element).closest('td');
            if (cell && cell.getAttribute('data-cell-id')) {
                const cellId = cell.getAttribute('data-cell-id');
                const contentSpan = cell.querySelector('.cell-content');
                const originalContent = cell.getAttribute(DATA_ORIGINAL_CONTENT);
                const currentContent = contentSpan?.textContent || '';

                console.log(`🔄 单元格 ${cellId} 内容变化: ${currentContent}`);
                
                // 设置更新标志，防止死循环
                this.isUpdating = true;
                
                try {
                    this.updateRightCell(cellId!, originalContent!, currentContent);
                    this.updateLeftCell(cellId!, originalContent!, currentContent);
                } finally {
                    // 确保在任何情况下都能重置标志
                    this.isUpdating = false;
                }
            }
        });
    };

    private updateRightCell(cellId: string, originalContent: string, newContent: string) {
        console.log('🔄 SyncManager: updateRightCell called', { cellId, originalContent, newContent });

        if (!this.rightIframe?.contentDocument) {
            console.log('❌ SyncManager: No right iframe contentDocument');
            return;
        }

        const rightDoc = this.rightIframe.contentDocument;
        const targetCell = rightDoc.querySelector(`[data-cell-id="${cellId}"]`) as HTMLElement;

        console.log('🎯 SyncManager: Looking for target cell', cellId, targetCell);

        if (targetCell) {
            targetCell.textContent = newContent;

            // 使用统一的高亮处理方法
            this.applyCellHighlight(targetCell, newContent, originalContent);

            // 设置或移除 data-original-content 属性
            if (originalContent !== newContent) {
                targetCell.setAttribute(DATA_ORIGINAL_CONTENT, originalContent);
                console.log('✅ SyncManager: Updated cell and set data-original-content');
            } else {
                targetCell.removeAttribute(DATA_ORIGINAL_CONTENT);
                console.log('✅ SyncManager: Restored cell and removed data-original-content');
            }

            // 自动滚动到对应单元格
            targetCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            console.log('❌ SyncManager: Target cell not found in right iframe');
        }
    }

    private updateLeftCell(cellId: string, originalContent: string, newContent: string) {
        console.log('🔄 SyncManager: updateLeftCell called', { cellId, originalContent, newContent });

        if (!this.leftIframe?.contentDocument) {
            console.log('❌ SyncManager: No left iframe contentDocument');
            return;
        }

        const leftDoc = this.leftIframe.contentDocument;
        const targetCell = leftDoc.querySelector(`[data-cell-id="${cellId}"]`) as HTMLElement;

        console.log('🎯 SyncManager: Looking for left target cell', cellId, targetCell);

        if (targetCell) {
            // 使用统一的高亮处理方法
            this.applyCellHighlight(targetCell, newContent, originalContent);

            // // 设置或移除 data-original-content 属性
            // if (originalContent !== newContent) {
            //     targetCell.setAttribute(DATA_ORIGINAL_CONTENT, originalContent);
            //     console.log('✅ SyncManager: Updated left cell and set data-original-content');
            // } else {
            //     targetCell.removeAttribute(DATA_ORIGINAL_CONTENT);
            //     console.log('✅ SyncManager: Restored left cell and removed data-original-content');
            // }
        } else {
            console.log('❌ SyncManager: Left target cell not found in left iframe');
        }
    }

    /**
     * 统一的高亮处理方法
     * @param cell 单元格元素
     * @param currentContent 当前内容
     * @param originalContent 原始内容
     */
    private applyCellHighlight(cell: HTMLElement, currentContent: string, originalContent: string) {
        if (originalContent !== currentContent) {
            // 内容不同，添加高亮样式
            cell.style.border = '2px solid red';
            cell.style.backgroundColor = '#ffe6e6';
            console.log(`✅ 单元格高亮: 原始="${originalContent}", 当前="${currentContent}"`);
        } else {
            // 内容相同，取消高亮样式
            cell.style.border = '';
            cell.style.backgroundColor = '';
            console.log(`✅ 单元格取消高亮: 内容相同="${currentContent}"`);
        }
    }

    private checkRightCellsHighlight() {
        console.log('🔍 SyncManager: Checking right iframe cells highlight');
        
        if (!this.rightIframe?.contentDocument) {
            console.log('❌ SyncManager: No right iframe contentDocument');
            return;
        }

        const rightDoc = this.rightIframe.contentDocument;
        const cells = rightDoc.querySelectorAll('[data-cell-id]') as NodeListOf<HTMLElement>;
        
        cells.forEach(cell => {
            const cellId = cell.getAttribute('data-cell-id');
            const originalContent = cell.getAttribute(DATA_ORIGINAL_CONTENT);
            const currentContent = cell.textContent || '';
            
            if (cell.hasAttribute(DATA_ORIGINAL_CONTENT) && originalContent) {
                this.applyCellHighlight(cell, currentContent, originalContent);
            }
        });
    }

    private checkLeftCellsHighlight() {
        console.log('🔍 SyncManager: Checking left iframe cells highlight');
        
        if (!this.leftIframe?.contentDocument) {
            console.log('❌ SyncManager: No left iframe contentDocument');
            return;
        }

        const leftDoc = this.leftIframe.contentDocument;
        const cells = leftDoc.querySelectorAll('[data-cell-id]') as NodeListOf<HTMLElement>;
        
        cells.forEach(cell => {
            const cellId = cell.getAttribute('data-cell-id');
            const originalContent = cell.getAttribute(DATA_ORIGINAL_CONTENT);
            const contentSpan = cell.querySelector('.cell-content');
            const currentContent = contentSpan?.textContent || '';
            
            if (cell.hasAttribute(DATA_ORIGINAL_CONTENT) && originalContent) {
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