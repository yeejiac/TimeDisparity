import * as vscode from 'vscode';
import * as moment from 'moment-timezone';

export function activate(context: vscode.ExtensionContext) {
    const timeProvider = new TimeProvider();
    vscode.window.registerTreeDataProvider('timedisparity', timeProvider);

    vscode.commands.registerCommand('timedisparity.refresh', () => timeProvider.refresh());
    vscode.commands.registerCommand('timedisparity.addBirthday', () => timeProvider.addBirthday());
    vscode.commands.registerCommand('timedisparity.addTimeZone', () => timeProvider.addTimeZone());
}

    export class TimeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
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
            new BirthdayItem('A', '05-23', 'Asia/Taipei', 'https://open.spotify.com/track/4uvARnZIajUDXWXPifhK3B?si=bfbf77be2bad41d7'),
            new BirthdayItem('B', '08-21', 'Australia/Sydney', 'Happy International Day of Peace!🧸'),
            new BirthdayItem('C', '08-01', 'Asia/Taipei', 'Happy International Day of Peace!🧢'),
            new BirthdayItem('D', '04-14', 'Asia/Taipei', 'Happy International Day of Peace!🐥'),
            new BirthdayItem('E', '05-24', 'Asia/Taipei', 'Happy International Day of Peace!🐠'),
            new BirthdayItem('F', '10-25', 'Asia/Taipei', 'Happy International Day of Peace!🪼'),
            new BirthdayItem('Test', '08-07', 'Asia/Taipei', 'Happy International Day of Peace!🪼')
        ];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    addTimeZone(): void {
        // Prompt for new birthday details
        vscode.window.showInputBox({ prompt: 'Enter City' }).then(label => {
            if (label) {
                vscode.window.showInputBox({ prompt: 'Enter timezone' }).then(timezone => {
                    if (timezone) {
                        this.timezones.push(new TimezoneItem(label, timezone));
                        this.refresh();
                    }
                });
            }
        });
    }

    addBirthday(): void {
        // Prompt for new birthday details
        vscode.window.showInputBox({ prompt: 'Enter name' }).then(name => {
            if (name) {
                vscode.window.showInputBox({ prompt: 'Enter date (MM-DD)' }).then(date => {
                    if (date) {
                        vscode.window.showInputBox({ prompt: 'Enter timezone' }).then(timezone => {
                            if (timezone) {
                                this.birthdays.push(new BirthdayItem(name, date, timezone, 'msg'));
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
            for (const birthday of this.birthdays) {
                if (birthday.isToday()) {
                    items.push(birthday);
                }
            }
            return Promise.resolve(items);
        } else {
            return Promise.resolve([]);
        }
    }
}

export class BirthdayItem extends vscode.TreeItem {
    constructor(public name: string, public date: string, private timezone: string, public msg: string) {
        super('');
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
        return moment.tz(this.timezone).format('YYYY-MM-DD HH:mm');
    }
}
