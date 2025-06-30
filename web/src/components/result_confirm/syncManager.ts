export class SyncManager {
  private leftIframe: HTMLIFrameElement | null = null;
  private rightIframe: HTMLIFrameElement | null = null;
  private observer: MutationObserver | null = null;
  private leftLoaded = false;
  private rightLoaded = false;
  private loadListenersSetup = false;

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
    
    console.log('🔧 SyncManager: setIframes called', leftIframe, rightIframe);
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
        console.log('✅ SyncManager: Table found, setting up observer');
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
    mutations.forEach((mutation) => {
      const cell = (mutation.target as Element).closest('td');
      if (cell && cell.getAttribute('data-cell-id')) {
        const cellId = cell.getAttribute('data-cell-id');
        const contentSpan = cell.querySelector('.cell-content');
        const originalContent = cell.getAttribute('data-original-content');
        const currentContent = contentSpan?.textContent || '';

        console.log(`🔄 单元格 ${cellId} 内容变化: ${currentContent}`);
        this.updateRightCell(cellId!, originalContent!, currentContent);
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

      if (originalContent !== newContent) {
        targetCell.style.border = '2px solid red';
        targetCell.style.backgroundColor = '#ffe6e6';
        console.log('✅ SyncManager: Updated cell with highlight');
      } else {
        targetCell.style.border = '';
        targetCell.style.backgroundColor = '';
        console.log('✅ SyncManager: Restored cell to original');
      }

      // 自动滚动到对应单元格
      targetCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.log('❌ SyncManager: Target cell not found in right iframe');
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}