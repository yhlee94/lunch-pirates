const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow;
let tray;
app.isQuitting = false; // 종료 플래그 초기화

// ✅ app.isPackaged 사용: 빌드된 앱인지 확실하게 감지
const isDev = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 450,
        height: 761,
        maxWidth: 450,
        maxHeight: 761,
        backgroundColor: '#ffffff',
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#ffffff',
            symbolColor: '#94a3b8',
            height: 32
        },
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

    // 닫기 버튼 클릭 시 숨기기 (트레이로 이동)
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    // 아이콘 경로 설정 (public 폴더 내 assets/Common/system.png 사용)
    const iconPath = path.join(__dirname, 'assets/Common/system.png'); // 빌드 시 경로 고려
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '열기',
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

    // 트레이 아이콘 클릭 시 창 보이기
    tray.on('click', () => {
        mainWindow.show();
    });

    // 더블 클릭 시 창 보이기
    tray.on('double-click', () => {
        mainWindow.show();
    });
}

// 단일 인스턴스 락 (중복 실행 방지)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // 두 번째 인스턴스가 실행되면 기존 창을 띄움
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow();
        createTray(); // 트레이 아이콘 생성

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });

    app.on('window-all-closed', () => {
        // 트레이 기능을 위해 닫기 버튼을 눌러도 앱 종료 X
        if (process.platform !== 'darwin') {
            // app.quit(); // 여기를 주석 처리하여 백그라운드 유지
        }
    });
}