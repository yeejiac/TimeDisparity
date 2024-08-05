import * as vscode from 'vscode';
import * as moment from 'moment-timezone'; // 使用 moment-timezone 庫來處理時區

export class WorldClockView implements vscode.TreeDataProvider<ClockTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ClockTreeItem | undefined | void> = new vscode.EventEmitter<ClockTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ClockTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    private updateInterval: NodeJS.Timeout;

    private timezones: string[] = [
        'Europe/London',
        'Australia/Sydney',
        'Asia/Taipei'
    ];

    constructor() {
        this.updateTime();
        this.updateInterval = setInterval(() => this.updateTime(), 1000); // 每秒更新時間
    }

    private updateTime() {
        this._onDidChangeTreeData.fire(); // 觸發視圖更新
    }

    getTreeItem(element: ClockTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ClockTreeItem): Thenable<ClockTreeItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            const now = new Date();
            const items: ClockTreeItem[] = this.timezones.map(tz => {
                const time = moment.tz(now, tz).format('YYYY-MM-DD HH:mm:ss');
                return new ClockTreeItem(`${tz}: ${time}`, tz);
            });
            return Promise.resolve(items);
        }
    }

    dispose() {
        clearInterval(this.updateInterval); // 清理計時器
    }
}

class ClockTreeItem extends vscode.TreeItem {
    constructor(label: string, public timezone: string) {
        super(label);
        this.tooltip = `Timezone: ${this.timezone}`;
    }
}