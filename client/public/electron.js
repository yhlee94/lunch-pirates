const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

// ✅ 보안 경고 무시 (개발 중 콘솔을 깔끔하게 유지하기 위함)
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

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
        icon: path.join(__dirname, 'assets/Common/system.png'),
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

// ✅ 출항 알림 전체 화면 팝업
ipcMain.on('show-wallpaper', (event) => {
    // ... 기존 코드 유지 (생략 가능하나 가독성을 위해 전체 교체됨)
    console.log('📢 [Main] 출항 신호 수신됨! 전체화면 팝업 생성...');

    const imageUrl = isDev
        ? 'http://localhost:3000/assets/Common/wallpaper.png'
        : `file://${path.join(__dirname, '../build/assets/Common/wallpaper.png')}`.replace(/\\/g, '/');

    let splashWindow = new BrowserWindow({
        width: 1920, height: 1080, fullscreen: true, frame: false,
        alwaysOnTop: true, skipTaskbar: true, backgroundColor: '#000000',
        webPreferences: { nodeIntegration: true, contextIsolation: false, webSecurity: false }
    });

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { margin: 0; padding: 0; width: 100vw; height: 100vh; overflow: hidden; background-color: black; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                img { width: 100%; height: 100%; object-fit: cover; animation: fadeIn 1.2s ease-in; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            </style>
        </head>
        <body onclick="window.close()"><img src="${imageUrl}" /></body>
        </html>1
    `;
    splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    splashWindow.once('ready-to-show', () => { splashWindow.show(); splashWindow.focus(); });
    splashWindow.on('closed', () => { splashWindow = null; });
});

// ✅ 새 해적선 알림 (우측 하단 슬라이드 업)
ipcMain.on('show-notification', (event, data) => {
    const { screen } = require('electron');
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    const winWidth = 380;
    const winHeight = 300;
    const padding = 20;

    let notifyWindow = new BrowserWindow({
        width: winWidth,
        height: winHeight,
        x: screenWidth - winWidth - padding,
        y: screenHeight,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        skipTaskbar: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const departureDate = new Date(data.departure_time || new Date());
    const month = departureDate.getMonth() + 1;
    const date = departureDate.getDate();
    const timeStr = departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const remaining = (data.max_participants || 4) - 1;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
                body {
                    margin: 0; padding: 20px; overflow: hidden;
                    font-family: 'Noto Sans KR', sans-serif;
                    background: transparent;
                }
                .room-card {
                    width: 330px;
                    height: 250px;
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border-radius: 2.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    position: relative;
                    padding: 24px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .card-top-bg {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 35%;
                    background: linear-gradient(to b, rgba(255, 247, 237, 0.5) 0%, transparent 100%);
                    border-radius: 2.5rem 2.5rem 0 0;
                    pointer-events: none;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    z-index: 10;
                }
                .date-info {
                    text-align: left;
                }
                .date-text {
                    display: block;
                    font-size: 24px;
                    font-weight: 900;
                    color: #1e293b;
                    letter-spacing: -0.5px;
                }
                .sub-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: #64748b;
                }
                .badge {
                    background: rgba(249, 115, 22, 0.1);
                    color: #ea580c;
                    font-size: 14px;
                    font-weight: 800;
                    padding: 10px 20px;
                    border-radius: 9999px;
                    border: 1px solid rgba(249, 115, 22, 0.2);
                    white-space: nowrap;
                }
                .content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 20px 0;
                    z-index: 10;
                }
                .sailing-icon {
                    font-size: 32px;
                    color: #2563eb;
                }
                .restaurant-info {
                    flex: 1;
                    min-width: 0;
                }
                .restaurant-name {
                    font-size: 18px;
                    font-weight: 900;
                    color: #1e293b;
                    margin: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .restaurant-address {
                    font-size: 14px;
                    color: #64748b;
                    margin: 2px 0 0 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .join-button {
                    width: 100%;
                    padding: 12px 0;
                    background: #f1f5f9;
                    color: #334155;
                    font-weight: 700;
                    font-size: 14px;
                    border: none;
                    border-radius: 0.75rem;
                    z-index: 10;
                }
            </style>
        </head>
        <body>
            <div class="room-card">
                <div class="card-top-bg"></div>
                <div class="header">
                    <div class="date-info">
                        <span class="date-text">${month}월 ${date}일</span>
                        <span class="sub-text">${timeStr} • ${remaining}명 남음</span>
                    </div>
                    <div class="badge">모집중</div>
                </div>
                <div class="content">
                    <div class="sailing-icon">⛵</div>
                    <div class="restaurant-info">
                        <div class="restaurant-name">${data.restaurant_name}</div>
                        <div class="restaurant-address">${data.restaurant_address}</div>
                    </div>
                </div>
                <button class="join-button">탑승하기</button>
            </div>
        </body>
        </html>
    `;

    notifyWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    let currentY = screenHeight;
    const targetY = screenHeight - winHeight - padding;

    const slideUp = setInterval(() => {
        if (currentY <= targetY) {
            clearInterval(slideUp);
            setTimeout(() => {
                const slideDown = setInterval(() => {
                    if (currentY >= screenHeight) {
                        clearInterval(slideDown);
                        notifyWindow.close();
                    } else {
                        currentY += 3;
                        notifyWindow.setPosition(screenWidth - winWidth - padding, Math.floor(currentY));
                    }
                }, 10);
            }, 5000); // 5초 대기
        } else {
            currentY -= 5;
            notifyWindow.setPosition(screenWidth - winWidth - padding, Math.floor(currentY));
        }
    }, 10);

    notifyWindow.on('closed', () => { notifyWindow = null; });
});

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