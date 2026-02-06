const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray;

// ✅ app.isPackaged 사용: 빌드된 앱인지 확실하게 감지
const isDev = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: '점심 해적단',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: isDev,
        },
    });

    // ✅ 개발: localhost:3000, 배포: 빌드된 파일 로드
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`;

    console.log('isDev:', isDev);
    console.log('startUrl:', startUrl);

    mainWindow.loadURL(startUrl);

    // ✅ 개발 환경에서만 개발자 도구 자동 열기
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // ✅ 커스텀 메뉴 설정 (필요한 것만)
    const menuTemplate = [
        {
            label: '파일',
            submenu: [
                {
                    label: '새로고침',
                    accelerator: 'F5',
                    click: () => {
                        mainWindow.reload();
                    },
                },
                {
                    label: '종료',
                    accelerator: 'Alt+F4',
                    click: () => {
                        app.isQuitting = true;
                        app.quit();
                    },
                },
            ],
        },
        {
            label: '도움말',
            submenu: [
                {
                    label: '점심 해적단 정보',
                    click: () => {
                        // 정보 창 열기 (나중에 구현)
                    },
                },
            ],
        },
    ];

    // 개발 모드에서만 개발자 도구 메뉴 추가
    if (isDev) {
        menuTemplate.push({
            label: '개발',
            submenu: [
                {
                    label: '개발자 도구',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    },
                },
            ],
        });
    }

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    // 임시로 트레이 없이 (아이콘 파일 없으니까)
    // 나중에 아이콘 만들면 주석 해제
    /*
    tray = new Tray(path.join(__dirname, 'tray-icon.png'));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '점심 해적단 열기',
        click: () => {
          mainWindow.show();
        },
      },
      {
        label: '종료',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip('점심 해적단');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      mainWindow.show();
    });
    */
}

app.whenReady().then(() => {
    createWindow();
    // createTray(); // 아이콘 준비되면 활성화

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Windows/Linux에서는 종료하지 않고 백그라운드 유지
        // (트레이 기능 구현 후)
    }
});