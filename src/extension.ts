import * as vscode from 'vscode';
import * as moment from 'moment-timezone';

export function activate(context: vscode.ExtensionContext) {
    const timeProvider = new TimeProvider();
    vscode.window.registerTreeDataProvider('timedisparity', timeProvider);

    vscode.commands.registerCommand('timedisparity.refresh', () => timeProvider.refresh());
    vscode.commands.registerCommand('timedisparity.addBirthday', () => timeProvider.addBirthday());
    vscode.commands.registerCommand('timedisparity.addTimeZone', () => timeProvider.addTimeZone());
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
            new BirthdayItem('A', '05-23', 'Asia/Taipei', 'https://open.spotify.com/track/4uvARnZIajUDXWXPifhK3B?si=bfbf77be2bad41d7'),
            new BirthdayItem('B', '08-21', 'Australia/Sydney', 'Happy International Day of Peace!🧸'),
            new BirthdayItem('C', '08-01', 'Asia/Taipei', 'Happy International Day of Peace!🧢'),
            new BirthdayItem('D', '04-14', 'Asia/Taipei', 'Happy International Day of Peace!🐥'),
            new BirthdayItem('E', '05-24', 'Asia/Taipei', 'Happy International Day of Peace!🐠'),
            new BirthdayItem('F', '10-25', 'Asia/Taipei', 'Happy International Day of Peace!🪼'),
            new BirthdayItem('Test', '08-09', 'Asia/Taipei', 'Happy International Day of Peace!🪼')
        ];

        setInterval(() => {
            this.updateTimes();
            this.refresh();
        }, 10000);
    }

    refresh(): void {
        console.log('TreeDataProvider is refreshing...');
        this._onDidChangeTreeData.fire();
    }

    updateTimes(): void {
        this.timezones.forEach(timezoneItem => timezoneItem.updateTime());
    }

    addTimeZone(): void {
        const options = [
            'Asia/Taipei',
            'Australia/Sydney',
            'Europe/London',
            'America/New_York',
            'Asia/Tokyo'
        ];
        // Prompt for new birthday details
        vscode.window.showQuickPick(options, {
            placeHolder: 'Select a time zone'
        }).then(selectedTimezone => {
            if (selectedTimezone) {
                if (this.timezones.some(tz => tz.timezone === selectedTimezone)) {
                    vscode.window.showErrorMessage('Time zone already exists in the list.');
                }
                else {
                    const label = this.getLabelForTimezone(selectedTimezone);
                this.timezones.push(new TimezoneItem(label, selectedTimezone));
                this.refresh();
                }
                
            }
        });
    }

    removeTimezone(timezoneItem: TimezoneItem): void {
        this.timezones = this.timezones.filter(tz => tz.timezone !== timezoneItem.timezone);
        this.refresh();
    }

    addBirthday(): void {
        // Prompt for new birthday details
        vscode.window.showInputBox({ prompt: 'Enter name' }).then(name => {
            if (name) {
                vscode.window.showInputBox({ prompt: 'Enter date (MM-DD)' }).then(date => {
                    if (date) {
                        vscode.window.showInputBox({ prompt: 'Enter timezone' }).then(timezone => {
                            if (timezone) {
                                vscode.window.showInputBox({ prompt: 'Enter message' }).then(msg => {
                                    if (msg) {
                                        this.birthdays.push(new BirthdayItem(name, date, timezone, msg));
                                        this.refresh();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    getLabelForTimezone(timezone: string): string {
        // You can add more mapping based on your preferences
        const labels: { [key: string]: string } = {
            'Asia/Taipei': 'Taipei',
            'Australia/Sydney': 'Sydney',
            'Europe/London': 'London',
            'America/New_York': 'New York',
            'Asia/Tokyo': 'Tokyo'
        };
        return labels[timezone] || 'Unknown';
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
    constructor(public name: string, public date: string, private timezone: string, public msg: string) {
        super('');
        this.label = `🎉 ${msg}`;
        this.tooltip = `Date: ${date}\nTime in ${timezone}: ${this.getDate()}`;
        this.contextValue = 'birthdayItem';
        this.iconPath = this.isToday() ? new vscode.ThemeIcon('gift') : undefined;
    }

    getDate(): string {
        return moment.tz(this.timezone).format('YYYY-MM-DD');
    }

    getTimeInTimeZone(): string {
        return moment.tz(this.timezone).format('YYYY-MM-DD HH:mm');
    }

    isToday(): boolean {
        const today = moment.tz(this.timezone).format('MM-DD');
        return today === this.date;
    }
}

class TimezoneItem extends vscode.TreeItem {
    constructor(public label: string, public timezone: string) {
        super(label);
        this.description = this.getCurrentTime();
        this.tooltip = `Current time in ${timezone}: ${this.getCurrentTime()}`;
        this.contextValue = 'timezoneItem';
    }

    getCurrentTime(): string {
        return moment.tz(this.timezone).format('YYYY-MM-DD HH:mm');
    }

    updateTime(): void {
        this.description = this.getCurrentTime();
        this.tooltip = `Current time in ${this.timezone}: ${this.getCurrentTime()}`;
    }
}