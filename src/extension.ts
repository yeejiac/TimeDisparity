import * as vscode from 'vscode';
import * as moment from 'moment-timezone';

export function activate(context: vscode.ExtensionContext) {
    const timeProvider = new TimeProvider();
    vscode.window.registerTreeDataProvider('timedisparity', timeProvider);

    vscode.commands.registerCommand('timeExplorer.refresh', () => timeProvider.refresh());
    vscode.commands.registerCommand('timeExplorer.addBirthday', () => timeProvider.addBirthday());
}

class TimeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private timezones: TimezoneItem[];
    private birthdays: BirthdayItem[];

    constructor() {
        this.timezones = [
            new TimezoneItem('Taipei', 'Asia/Taipei'),
            new TimezoneItem('Sydney', 'Australia/Sydney'),
            new TimezoneItem('London', 'Europe/London')
        ];

        this.birthdays = [
            new BirthdayItem('08-07', 'Asia/Taipei', 'Happy International Day of Peace!'),
            new BirthdayItem('08-06', 'Australia/Sydney', 'Happy International Day of Peace!')
        ];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addBirthday(): void {
        // Prompt for new birthday details
        vscode.window.showInputBox({ prompt: 'Enter name' }).then(name => {
            if (name) {
                vscode.window.showInputBox({ prompt: 'Enter date (MM-DD)' }).then(date => {
                    if (date) {
                        vscode.window.showInputBox({ prompt: 'Enter timezone' }).then(timezone => {
                            if (timezone) {
                                this.birthdays.push(new BirthdayItem(date, timezone, 'msg'));
                                this.refresh();
                            }
                        });
                    }
                });
            }
        });
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            const items: vscode.TreeItem[] = [...this.timezones];
            const today = moment.tz().format('MM-DD');
            for (const birthday of this.birthdays) {
                if (birthday.date === today) {
                    items.push(birthday);
                }
            }
            return Promise.resolve(items);
        } else {
            return Promise.resolve([]);
        }
    }
}

class BirthdayItem extends vscode.TreeItem {
    constructor(public date: string, private timezone: string, public msg: string) {
        super(date);
        this.description = `${date}  ${msg}`;
        this.tooltip = `Date: ${date}\nTime in ${timezone}: ${this.getTimeInTimeZone()}`;
        this.contextValue = 'birthdayItem';
        this.iconPath = this.isToday() ? new vscode.ThemeIcon('gift') : undefined;
    }

    getTimeInTimeZone(): string {
        return moment.tz(this.timezone).format('YYYY-MM-DD HH:mm:ss');
    }

    isToday(): boolean {
        const today = moment.tz(this.timezone).format('MM-DD');
        return today === this.date;
    }
}

class TimezoneItem extends vscode.TreeItem {
    constructor(public readonly label: string, private timezone: string) {
        super(label);
        this.description = this.getCurrentTime();
        this.tooltip = `Current time in ${timezone}: ${this.getCurrentTime()}`;
        this.contextValue = 'timezoneItem';
    }

    getCurrentTime(): string {
        return moment.tz(this.timezone).format('YYYY-MM-DD HH:mm:ss');
    }
}
