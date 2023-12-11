const { app, BrowserWindow, ipcMain } = require('electron');
const mysql = require('mysql2');
const path = require('path');

try {
    require('electron-reloader')(module)
} catch (_) { }

let win;

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: true,
        }
    });

    win.loadFile('index.html');

    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
});

// Function to create a popup window
function createPopup(message) {
    const popupWindow = new BrowserWindow({
        width: 400,
        height: 200,
        parent: win,
        frame: false,
        modal: true,
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        }
    });

    popupWindow.loadFile('popup.html');

    // Send the message to the popup window
    popupWindow.webContents.once('did-finish-load', () => {
        popupWindow.webContents.send('popup-message', message);
        popupWindow.show();
    });
}

ipcMain.on('show-popup', (event, message) => {
    createPopup(message);
});

ipcMain.on('quit-app', (event) => {
    app.quit();
});

ipcMain.handle('execute-query', async (event, query, values) => {
    return await perform_query(query, values);
});

ipcMain.on('get-html-template', (event, results) => {
    const dynamicIdPlaceholder = '{dynamicId}';

    const htmlTemplates = [];

    for (let i = 0; i < results.length; i++) {
        htmlTemplates.push(`
            <section class="column">
                <label class="Label" id="Label${i}">Campo ${i}</label>
                <input type="text" class="TextField input is-small" id="Campo${i}">
            </section>
        `);
    }

    event.reply('html-template', htmlTemplates);
});

const connection = mysql.createConnection({
    host: '---',
    user: '---',
    password: '---',
    database: '---',
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
});

function perform_query(query, values) {
    return new Promise((resolve, reject) => {
        connection.query(query, (err, results, fields) => {
            if (err) {
                reject(err);
                return;
            }

            // Resolve with the results
            resolve(results);
        });
    });
}