import * as vscode from 'vscode';
import * as moment from 'moment-timezone';

export function activate(context: vscode.ExtensionContext) {
    const timeProvider = new TimeProvider();
    vscode.window.registerTreeDataProvider('timedisparity', timeProvider);

    vscode.commands.registerCommand('timedisparity.refresh', () => timeProvider.refresh());
    vscode.commands.registerCommand('timedisparity.addBirthday', () => timeProvider.addBirthday());
    if(true) {
        vscode.commands.registerCommand('timedisparity.addTimeZone', () => timeProvider.addTimeZone());
        vscode.commands.registerCommand('timedisparity.removeTimezone', (timezoneItem: TimezoneItem) => timeProvider.removeTimezone(timezoneItem));
    }

    const uriProvider = new UriProvider();
    let disposable = vscode.commands.registerCommand('extension.generateUri', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const filePath = document.uri.fsPath;
            const line = editor.selection.active.line + 1;
            const column = editor.selection.active.character + 1;
            let uri: string;
            if (vscode.env.remoteName) {
                // If running in a remote environment, handle the URI accordingly
                switch (vscode.env.remoteName) {
                    case 'wsl':
                    case 'ssh-remote':
                    case 'dev-container':
                        uri = `${filePath}:${line}:${column}`;
                        break;
                    default:
                        uri = `vscode://file/${filePath}:${line}:${column}`;
                        break;
                }
            } else {
                // Local environment
                uri = `${filePath}:${line}:${column}`;
            }
            vscode.env.clipboard.writeText(uri);
            vscode.window.showInformationMessage(`URI copied to clipboard: ${uri}`);
            uriProvider.addUri(uri);
            } else {
            vscode.window.showErrorMessage('No active editor found');
            }
    });

    vscode.window.registerTreeDataProvider('uriView', uriProvider);
    vscode.commands.registerCommand('extension.removeUri', (uris: string) => uriProvider.removeUri(uris));
    context.subscriptions.push(disposable);
}

class UriProvider implements vscode.TreeDataProvider<string> {
    private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | void> = new vscode.EventEmitter<string | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<string | undefined | void> = this._onDidChangeTreeData.event;
  
    private uris: string[] = [];

    getTreeItem(element: string): vscode.TreeItem{
        const regex = /^(.*):(\d+):(\d+)$/;
        const match = element.match(regex);
    
        if (match) {
            const filePath = match[1];
            const line = parseInt(match[2]);
            const column = parseInt(match[3]);
    
            const fileUri = vscode.Uri.file(filePath);
    
            return {
                label: `${filePath}:${line}:${column}`,
                command: {
                    command: 'vscode.open',
                    title: 'Open File',
                    arguments: [fileUri, { selection: new vscode.Range(line - 1, column - 1, line - 1, column - 1) }]
                },
                tooltip: `File: ${filePath}, Line: ${line}, Column: ${column}`
            };
        } else {
            vscode.window.showWarningMessage(`Invalid format: "${element}". Expected format: "/path/to/file:line:column".`);
            return new vscode.TreeItem('Invalid URI Format');
        }
    }
  
    getChildren(): string[] {
      return this.uris;
    }
  
    addUri(uri: string): void {
      this.uris.push(uri);
      this._onDidChangeTreeData.fire();
    }
  
    clearUris(): void {
      this.uris = [];
      this._onDidChangeTreeData.fire();
    }

    refresh(): void {
        console.log('UriProvider is refreshing...');
        this._onDidChangeTreeData.fire();
    }

    removeUri(uris: string): void {
        const index = this.uris.findIndex(link => link === uris);
        if (index !== -1) {
            this.uris.splice(index, 1);
            this.refresh();
            vscode.window.showInformationMessage(`Uris removed successfully.`);
        }
    }
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
        // this.timezones = this.timezones.filter(tz => tz.timezone !== timezoneItem.timezone);
        // this.refresh();
        const index = this.timezones.findIndex(tz => tz.timezone === timezoneItem.timezone);
        if (index !== -1) {
            this.timezones.splice(index, 1);
            this.refresh();
            vscode.window.showInformationMessage(`Timezone '${timezoneItem.timezone}' removed successfully.`);
        }
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
        this.updateTime();

        this.command = {
            command: 'timedisparity.removeTimezone',
            title: 'Remove Timezone',
            arguments: [this.timezone]  // Pass only the timezone string
        };
    }

    getCurrentTime(): string {
        return moment.tz(this.timezone).format('YYYY-MM-DD HH:mm');
    }

    updateTime(): void {
        this.description = this.getCurrentTime();
        this.tooltip = `Current time in ${this.timezone}: ${this.getCurrentTime()}`;
    }
}