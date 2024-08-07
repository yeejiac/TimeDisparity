import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../../extension';
import * as moment from 'moment-timezone';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('TimeProvider - getChildren', async () => {
        const timeProvider = new myExtension.TimeProvider();
        const items = await timeProvider.getChildren();

        assert.strictEqual(items.length, 3, 'Should return 3 timezone items initially');
    });

    test('TimeProvider - addBirthday', async () => {
        const timeProvider = new myExtension.TimeProvider();

        // Mock input boxes
        vscode.window.showInputBox = async () => 'Test User';
        vscode.window.showInputBox = async () => '08-08';
        vscode.window.showInputBox = async () => 'Asia/Taipei';

        await vscode.commands.executeCommand('timeExplorer.addBirthday');
        const items = await timeProvider.getChildren();

        assert.strictEqual(items.length, 4, 'Should return 4 items after adding a birthday');
    });

    test('BirthdayItem - isToday', () => {
        const today = moment.tz().format('MM-DD');
        const birthdayItem = new myExtension.BirthdayItem('name', today, 'Asia/Taipei', 'Test');

        assert.strictEqual(birthdayItem.isToday(), true, 'BirthdayItem should recognize today as the birthday');
    });
});
