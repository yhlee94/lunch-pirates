const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

// 보안 경고 무시 (개발 중 콘솔을 깔끔하게 유지하기 위함)
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

let mainWindow;
let tray;
app.isQuitting = false; // 종료 플래그 초기화

// app.isPackaged 사용: 빌드된 앱인지 확실하게 감지
const isDev = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 450,
        height: 761,
        maxWidth: 450,
        maxHeight: 761,
        backgroundColor: '#ffffff',
        titleBarStyle: 'hidden',
        // [Mac] 신호등 버튼 위치 조정 (Mac에서만 적용됨)
        trafficLightPosition: { x: 12, y: 12 },
        // [Win] 윈도우 컨트롤 오버레이 (Mac에서는 false 처리)
        titleBarOverlay: process.platform === 'darwin' ? false : {
            color: '#ffffff',
            symbolColor: '#94a3b8',
            height: 32
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'assets/Common/system.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: true, // [디버깅용] 프로덕션에서도 개발자 도구 활성화
            webSecurity: false // [중요] file:// 프로토콜에서 외부 API(카카오 등) 호출 시 CORS 문제 해결을 위한 강력한 설정
        },
    });

    // 개발: localhost:3000, 배포: 빌드된 파일 로드
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`;

    console.log('isDev:', isDev);
    console.log('startUrl:', startUrl);

    mainWindow.loadURL(startUrl);

    // [디버깅용] 항상 개발자 도구 열기 (에러 확인을 위해)
    mainWindow.webContents.openDevTools();

    // 커스텀 메뉴 설정 (필요한 것만)
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

    // 개발 모드에서만 개발자 도구 메뉴 추가 (이제 항상 추가)
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

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    // [중요] 카카오 지도 API가 file:// 프로토콜에서 작동하지 않는 문제 해결
    // API 요청 시 Origin과 Referer를 localhost:3000으로 속여서 보냄
    const filter = {
        urls: ['*://*.kakao.com/*', '*://*.daum.net/*', '*://*.daumcdn.net/*', '*://*.kakaocdn.net/*']
    };

    mainWindow.webContents.session.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        details.requestHeaders['Origin'] = 'http://localhost:3000';
        details.requestHeaders['Referer'] = 'http://localhost:3000';
        // User-Agent를 일반 크롬 브라우저처럼 위장 (Electron 식별자 제거)
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        callback({ cancel: false, requestHeaders: details.requestHeaders });
    });

    // 닫기 버튼 클릭 시 숨기기 (트레이로 이동)
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

// 출항 알림 전체 화면 팝업
ipcMain.on('show-wallpaper', (event, data) => {
    console.log(' [Main] 출항 신호 수신됨! 전체화면 팝업 생성...');

    const imageUrl = isDev
        ? 'http://localhost:3000/assets/Common/wallpaper.png'
        : `file://${path.join(__dirname, '../build/assets/Common/wallpaper.png')}`.replace(/\\/g, '/');

    const videoUrl = isDev
        ? 'http://localhost:3000/assets/Common/ready.mp4'
        : `file://${path.join(__dirname, '../build/assets/Common/ready.mp4')}`.replace(/\\/g, '/');

    let splashWindow = new BrowserWindow({
        width: 1920, height: 1080, fullscreen: true, frame: false,
        alwaysOnTop: true, skipTaskbar: true, backgroundColor: '#000000',
        webPreferences: { nodeIntegration: true, contextIsolation: false, webSecurity: false }
    });

    const participants = (data && data.participants) ? data.participants : [];
    const restaurantName = (data && data.restaurant_name) ? data.restaurant_name : '출항 예정';

    const participantsHtml = participants.map(p => `
        <div class="participant">
            <span class="name">${p.name}</span>
        </div>
    `).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8"/>
            <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
            <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&amp;family=Pirata+One&amp;family=Roboto+Slab:wght@400;700&amp;display=swap" rel="stylesheet"/>
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet"/>
            <script>
                tailwind.config = {
                    darkMode: "class",
                    theme: {
                        extend: {
                            colors: {
                                primary: "#8B4513","wood-light": "#D2691E","wood-dark": "#5D4037","rope": "#C2B280","gold": "#FFD700",
                                "background-light": "#f3f4f6",
                                "background-dark": "#1f2937",
                            },
                            fontFamily: {
                                display: ['"Noto Sans KR"', 'sans-serif'],
                                body: ['"Noto Sans KR"', 'sans-serif'],
                                carved: ['"Noto Sans KR"', 'sans-serif'],
                            },
                            boxShadow: {
                                'wood': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
                                'inset-wood': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.1), inset 0 -2px 4px 0 rgba(0, 0, 0, 0.5)',
                            },
                            backgroundImage: {
                                'wood-pattern': "url('https://www.transparenttextures.com/patterns/wood-pattern.png')",
                                'dark-wood-pattern': "url('https://www.transparenttextures.com/patterns/purty-wood.png')",
                            }
                        },
                    },
                };
            </script>
            <style>
                .wood-texture {
                    background-color: #8B4513;
                    background-image: url(https://lh3.googleusercontent.com/aida-public/AB6AXuB5y-uUHrKKJqrhUDzSz-fWczL67ZGH3ErIHpB1ZR9FSRexsbv8B2yIvFvTI-8y0aaerr2kA4GJRBfyAVB8TLB-hIxXUPTlkR36VeMCkfxLM3w58MwCP7vzHL784oJLk2SfcI4ErOfd-SbQ54VRhr2W4_Ark04OU9saTRX1abPaXl_iM4UKXAVknk1DBAqKfcEaC-nLiEFlJpuzGxd6ErUxkfQ2z9QhkjmiOjmMMhUG15CVqBk9TZ_nHTl8TZzdyqEmpC2TaISbXK8A);
                    background-blend-mode: multiply;
                }
                .wood-texture-dark {
                    background-color: #3E2723;
                    background-image: url(https://lh3.googleusercontent.com/aida-public/AB6AXuBjVy_98ceTgW3D-Gg7bYH85PauAlj3_SREoG7kzKZKAGeOJasW4WYfg7kzVHJqMfaFxrOf5_AgTZy5DckDHJ76QMw317jMkou9pDfEBoKyVeozkYmscV7j_JTJeL238EcLPA4F1PILzHMeH9_5AfHekp5j8ieQHaxJi15aglzHiKOhPnCGCO9znnS1ET6e5AYnEUfMsjg1SJdMKgRd8hD4_Mesh0Y95VWa2VTuVi-ZYdIyjXqF-O2vkzi1m9tkn80gv3kYdCFrgIw4);
                    background-blend-mode: multiply;
                }
                .rope-line {
                    background: repeating-linear-gradient(45deg, #d4c4a8, #d4c4a8 4px, #8c7b5d 4px, #8c7b5d 8px);
                    width: 6px;
                    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.5);
                }
                .wax-seal {
                    background: radial-gradient(circle at 30% 30%, #ff6b6b, #c0392b);
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5), inset 0 2px 5px rgba(255, 255, 255, 0.4);
                    border: 2px solid #a93226;
                }
                .gold-coin {
                    background: radial-gradient(circle at 30% 30%, #ffd700, #b8860b);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6);
                    border: 1px solid #d4af37;
                }
                .plank {
                    position: relative;
                    transform-origin: top center;
                    transition: transform 0.2s ease;
                }
                .plank:hover {
                    transform: rotate(-1deg) scale(1.02);
                    z-index: 10;
                }
                .nail {
                    width: 8px;
                    height: 8px;
                    background: radial-gradient(circle at 30% 30%, #95a5a6, #2c3e50);
                    border-radius: 50%;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
                }
                .porthole {
                    box-shadow: 0 0 0 4px #b8860b,0 0 0 6px #5D4037,0 0 0 8px #8B4513,inset 0 0 10px rgba(0, 0, 0, 0.8);
                }
                .text-shadow-outline {
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                }
                #introVideo {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    object-fit: cover; z-index: 200; background: black;
                }
                #mainContent {
                    opacity: 0; width: 100%; height: 100%;
                    transition: opacity 1s ease-in;
                }
                /* Stagger animation for planks */
                @keyframes slideInRight {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0) rotate(var(--rotation)); opacity: 1; }
                }
                .plank-animate {
                    animation: slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    opacity: 0; 
                }
            </style>
        </head>
        <body class="bg-black h-screen w-screen overflow-hidden relative font-body text-white" onclick="window.close()">
            <video id="introVideo" src="${videoUrl}" autoplay muted></video>
            
            <div id="mainContent" class="relative w-full h-full">
                <!-- Background Image -->
                <div class="absolute inset-0 z-0">
                    <img alt="Pirate ship" class="w-full h-full object-cover opacity-90 transition-opacity duration-500" src="${imageUrl}"/>
                    <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none"></div>
                </div>

                <!-- Main UI Overlay -->
                <main class="relative z-10 w-full h-full flex justify-end p-6 pointer-events-none">
                    <div class="absolute top-0 right-10 md:right-32 h-3/5 w-2 flex justify-between pointer-events-none z-0" style="width: 280px;">
                        <div class="rope-line h-full"></div>
                        <div class="rope-line h-full"></div>
                    </div>

                    <div class="flex flex-col items-end w-full md:w-auto mt-4 pointer-events-auto mr-4 md:mr-24 relative z-10">
                        <!-- Header Plank -->
                        <div class="plank wood-texture w-80 h-16 mb-6 rounded-sm shadow-wood flex items-center justify-center relative border-y-4 border-[#5D4037]">
                            <div class="nail absolute top-2 left-2"></div>
                            <div class="nail absolute top-2 right-2"></div>
                            <div class="nail absolute bottom-2 left-2"></div>
                            <div class="nail absolute bottom-2 right-2"></div>
                            <h2 class="text-2xl font-black text-[#f3e5ab] text-center tracking-tight leading-tight">${restaurantName}</h2>
                        </div>

                        <!-- Participants List -->
                        ${Array(6).fill(null).map((_, index) => {
        const p = participants[index];
        if (p) {
            return `
                                <div class="plank-animate wood-texture w-80 h-20 mb-3 rounded-r-lg rounded-l-md shadow-wood flex items-center px-4 relative border-b-4 border-r-4 border-[#5D4037]" 
                                     style="--rotation: ${index % 2 === 0 ? '1deg' : '-1deg'}; animation-delay: ${index * 0.15 + 0.5}s;">
                                    
                                    <div class="relative w-14 h-14 flex-shrink-0 mr-4">
                                        <div class="porthole w-full h-full rounded-full overflow-hidden bg-blue-300 relative z-10">
                                            <img alt="${p.name}" class="w-full h-full object-cover" 
                                                 src="${p.equipped_item_image_url ? (isDev ? 'http://localhost:3000' + p.equipped_item_image_url : 'file://' + path.join(__dirname, '../build' + p.equipped_item_image_url).replace(/\\/g, '/')) : 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png'}"/>
                                        </div>
                                    </div>
                                    
                                    <div class="flex-grow">
                                        <span class="text-2xl font-black text-white text-shadow-outline tracking-tight truncate block w-48">${p.name}</span>
                                    </div>
                                </div>
                                `;
        } else {
            return `
                                <div class="plank-animate wood-texture w-80 h-20 mb-3 rounded-r-lg rounded-l-md shadow-wood flex items-center px-4 relative border-b-4 border-r-4 border-[#5D4037] opacity-80" 
                                     style="--rotation: ${index % 2 === 0 ? '1deg' : '-1deg'}; animation-delay: ${index * 0.15 + 0.5}s;">
                                    <div class="relative w-14 h-14 flex-shrink-0 mr-4 opacity-40">
                                        <div class="w-full h-full rounded-full border-4 border-dashed border-[#5D4037] bg-black/20 flex items-center justify-center">
                                            <span class="material-symbols-outlined text-[#d4c4a8] text-3xl">person_add</span>
                                        </div>
                                    </div>
                                    <div class="flex-grow">
                                        <span class="text-xl font-bold text-[#d4c4a8] opacity-50 italic">Empty Berth</span>
                                    </div>
                                </div>
                                `;
        }
    }).join('')}

                    </div>
                </main>
            </div>

            <script>
                const video = document.getElementById('introVideo');
                const mainContent = document.getElementById('mainContent');
                
                function showMainContent() {
                    video.style.transition = 'opacity 0.5s';
                    video.style.opacity = '0';
                    setTimeout(() => { video.style.display = 'none'; }, 500);
                    mainContent.style.opacity = '1';
                }

                video.onended = showMainContent;
                video.onerror = showMainContent;

                // 비디오 길이가 8초라고 가정하고 안전장치 실행
                setTimeout(showMainContent, 8000); 
            </script>
        </body>
        </html>
    `;
    splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    splashWindow.once('ready-to-show', () => {
        splashWindow.show();
        splashWindow.setAlwaysOnTop(true, 'screen-saver'); // 다른 창보다 무조건 위에 뜨도록 설정
        splashWindow.focus();
    });
    splashWindow.on('closed', () => { splashWindow = null; });
});

// 새 해적선 알림 (우측 하단 슬라이드 업)
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

    // No changes needed for this specific block based on re-evaluation.

}