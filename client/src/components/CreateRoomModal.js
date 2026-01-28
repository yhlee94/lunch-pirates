import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function CreateRoomModal({ onClose, onSuccess, user }) {
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [maxParticipants, setMaxParticipants] = useState(4);
    const [departureTime, setDepartureTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [showResearchBtn, setShowResearchBtn] = useState(false);
    const [places, setPlaces] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const markersRef = useRef([]);

    const timeOptions = {
        lunch: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
        dinner: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00']
    };

    // 기본 출발 시간 설정 (오전 11:30)
    useEffect(() => {
        setDepartureTime('11:30');
    }, []);

    // 시간이 지났는지 체크하는 함수
    const isTimePassed = (timeStr) => {
        const now = new Date();
        const [hours, minutes] = timeStr.split(':').map(Number);
        const target = new Date();
        target.setHours(hours, minutes, 0, 0);
        return target < now;
    };

    // 선택된 장소로 지도 이동 및 마커 강조
    useEffect(() => {
        if (mapInstance && selectedPlace) {
            const moveLatLng = new window.kakao.maps.LatLng(selectedPlace.latitude, selectedPlace.longitude);
            mapInstance.panTo(moveLatLng);
            mapInstance.setLevel(3);

            // 해적선 마커 이미지 설정 (선택된 곳만!)
            const selectedShipImage = new window.kakao.maps.MarkerImage(
                '/assets/map-pirate-ship.png',
                new window.kakao.maps.Size(55, 55),
                { offset: new window.kakao.maps.Point(27, 55) }
            );

            markersRef.current.forEach(marker => {
                const isSelected = marker.placeId === selectedPlace.id;

                if (isSelected) {
                    marker.setImage(selectedShipImage);
                    marker.setZIndex(999);
                } else {
                    marker.setImage(null); // 다른 곳은 다시 기본 마커로!
                    marker.setZIndex(1);
                }
            });
        }
    }, [selectedPlace, mapInstance]);

    // 카카오맵 초기화
    useEffect(() => {
        if (window.kakao && window.kakao.maps) {
            setMapLoaded(true);
            setTimeout(() => {
                initializeMap();
            }, 100);
        } else {
            alert('카카오맵을 불러올 수 없습니다.');
        }
    }, []);

    const initializeMap = () => {
        const container = document.getElementById('create-room-map');
        if (!container) return;

        const lat = user?.companyLatitude || 37.5665;
        const lng = user?.companyLongitude || 126.9780;

        const options = {
            center: new window.kakao.maps.LatLng(lat, lng),
            level: 3
        };
        const map = new window.kakao.maps.Map(container, options);
        setMapInstance(map);

        const searchManager = initializeSearch(map);

        window.kakao.maps.event.addListener(map, 'dragend', () => {
            setShowResearchBtn(true);
        });

        searchManager.searchNearby();
    };

    const initializeSearch = (map) => {
        const ps = new window.kakao.maps.services.Places();
        const listEl = document.getElementById('places-list-scroll');
        let markers = [];

        const displayPlaces = (data) => {
            markersRef.current.forEach(marker => marker.setMap(null));
            markersRef.current = [];

            const bounds = new window.kakao.maps.LatLngBounds();

            setPlaces(data);

            data.forEach((place, index) => {
                const placePosition = new window.kakao.maps.LatLng(place.y, place.x);
                const marker = new window.kakao.maps.Marker({
                    position: placePosition,
                    map: map
                    // 기본 마커로 초기화
                });

                // 마커 클릭 시에도 리스트 항목이 선택되도록 연동
                window.kakao.maps.event.addListener(marker, 'click', () => {
                    setSelectedPlace({
                        id: place.id,
                        name: place.place_name,
                        address: place.address_name || place.road_address_name,
                        latitude: place.y,
                        longitude: place.x
                    });
                });

                marker.placeId = place.id;
                markersRef.current.push(marker);
                bounds.extend(placePosition);
            });

            map.setBounds(bounds);
        };

        const searchPlaces = (keyword) => {
            if (!keyword) return;
            ps.keywordSearch(keyword, (data, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    displayPlaces(data);
                }
            }, { category_group_code: 'FD6' });
        };

        const searchNearby = () => {
            ps.categorySearch('FD6', (data, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    displayPlaces(data);
                    setShowResearchBtn(false);
                }
            }, {
                location: map.getCenter(),
                radius: 1000,
                sort: window.kakao.maps.services.SortBy.DISTANCE
            });
        };

        window.reSearchNearby = searchNearby;
        window.manualSearch = searchPlaces;

        return { searchNearby, searchPlaces };
    };

    const handleSubmit = async () => {
        if (!selectedPlace) {
            alert('식당을 선택해주세요!');
            return;
        }

        if (!departureTime) {
            alert('출발 시간을 선택해주세요!');
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            const departure = new Date();
            const [hours, minutes] = departureTime.split(':');
            departure.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // 최종 제출 시점에도 한 번 더 체크
            if (departure < new Date()) {
                alert('이미 지나간 시간으로는 방을 만들 수 없습니다!');
                setIsSubmitting(false);
                return;
            }

            // 한국 시간 기준 문자열 생성 (YYYY-MM-DD HH:mm:ss)
            const year = departure.getFullYear();
            const month = String(departure.getMonth() + 1).padStart(2, '0');
            const day = String(departure.getDate()).padStart(2, '0');
            const hh = String(departure.getHours()).padStart(2, '0');
            const mm = String(departure.getMinutes()).padStart(2, '0');
            const ss = '00';
            const localDepartureTime = `${year}-${month}-${day} ${hh}:${mm}:${ss}`;

            const response = await axios.post(
                'http://localhost:5000/api/rooms',
                {
                    restaurant_name: selectedPlace.name,
                    restaurant_address: selectedPlace.address,
                    latitude: parseFloat(selectedPlace.latitude),
                    longitude: parseFloat(selectedPlace.longitude),
                    max_participants: maxParticipants,
                    departure_time: localDepartureTime
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                alert(`"${selectedPlace.name} 출항해요!" 방이 생성되었습니다! 🏴‍☠️`);
                onSuccess();
            }
        } catch (error) {
            alert('방 생성에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans transition-all duration-300">
            <div className="relative w-full max-w-4xl transform transition-all animate-in zoom-in-95 duration-300">
                <div className="bg-surface-light rounded-3xl border-[3px] border-game-dark-blue shadow-modal overflow-hidden flex flex-col relative">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-game-blue to-sky-500 p-6 border-b-[3px] border-game-dark-blue flex justify-between items-center relative overflow-hidden shadow-lg z-10">
                        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')]"></div>
                        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-white/10 blur-2xl"></div>
                        <h1 className="text-2xl lg:text-3xl font-display font-black text-white tracking-wide relative z-10 flex items-center gap-3 drop-shadow-[0_2px_0_#005f73]">
                            <span className="material-symbols-rounded text-3xl lg:text-4xl drop-shadow-md">add_circle</span>
                            방 만들기
                        </h1>
                        <button
                            onClick={onClose}
                            className="bg-white/10 hover:bg-white/20 text-white rounded-xl p-2.5 transition-all hover:scale-105 border border-white/20 shadow-sm backdrop-blur-sm"
                        >
                            <span className="material-symbols-rounded text-2xl">close</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 relative">
                        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>

                        {/* Left Column: Map & Search */}
                        <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <label className="block text-white font-black text-lg drop-shadow-md flex items-center gap-2">
                                    <span className="material-symbols-rounded text-accent-yellow">search</span>
                                    식당 직접 검색
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="식당 이름을 입력하세요"
                                        className="flex-1 bg-white/95 border-2 border-transparent focus:border-accent-yellow rounded-xl px-4 py-2 font-bold text-base shadow-lg outline-none transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && window.manualSearch(searchQuery)}
                                    />
                                    <button
                                        onClick={() => window.manualSearch(searchQuery)}
                                        className="bg-accent-yellow text-game-navy px-5 py-2 rounded-xl font-black text-base shadow-game border-b-4 border-yellow-600 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
                                    >
                                        검색
                                    </button>
                                </div>
                            </div>

                            <div className="bg-blue-900/20 rounded-2xl h-64 w-full relative overflow-hidden border-2 border-white/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] group ring-1 ring-white/10">
                                <div id="create-room-map" className="w-full h-full" />

                                {showResearchBtn && (
                                    <button
                                        onClick={() => window.reSearchNearby && window.reSearchNearby()}
                                        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white text-blue-600 px-6 py-2.5 rounded-full font-black shadow-xl border-2 border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-2 scale-100 hover:scale-105 active:scale-95"
                                    >
                                        <span className="material-symbols-rounded text-sm">refresh</span>
                                        여기서 맛집 재검색
                                    </button>
                                )}
                            </div>

                            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
                                <label className="block text-white font-bold text-base mb-1 flex items-center gap-2">
                                    <span className="material-symbols-rounded text-accent-yellow">info</span>
                                    선택된 식당
                                </label>
                                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${selectedPlace
                                    ? 'bg-white border-accent-yellow shadow-lg'
                                    : 'bg-white/5 border-white/10 text-white/40 italic flex items-center justify-center'
                                    }`}>
                                    {selectedPlace ? (
                                        <div className="flex items-center gap-4">
                                            <div className="bg-accent-yellow/20 p-2 rounded-lg">
                                                <span className="material-symbols-rounded text-accent-yellow text-2xl">restaurant</span>
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="text-game-navy font-black text-lg leading-tight truncate">{selectedPlace.name} 🏴‍☠️</div>
                                                <div className="text-gray-500 text-sm font-medium mt-1">📍 {selectedPlace.address}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        "식당을 선택해주세요"
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: List & Settings */}
                        <div className="flex flex-col gap-4">
                            <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-md shadow-lg flex flex-col gap-3 h-[320px]">
                                <h3 className="text-white font-bold text-xl flex items-center gap-2 pb-2 border-b border-white/10">
                                    <span className="material-symbols-rounded text-accent-yellow text-xl">list_alt</span>
                                    주변 맛집 리스트
                                </h3>
                                <div id="places-list-scroll" className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                    {places.length > 0 ? (
                                        places.map((place, index) => (
                                            <div
                                                key={place.id}
                                                onClick={() => setSelectedPlace({
                                                    id: place.id,
                                                    name: place.place_name,
                                                    address: place.address_name || place.road_address_name,
                                                    latitude: place.y,
                                                    longitude: place.x
                                                })}
                                                className={`rounded-xl p-3 flex items-center justify-between border-2 cursor-pointer transition-all group overflow-hidden relative ${selectedPlace?.id === place.id
                                                    ? 'bg-gradient-to-r from-white to-blue-50 border-accent-yellow shadow-md'
                                                    : 'bg-white/80 border-transparent hover:border-blue-300 shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 z-10 w-full">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-md ring-2 ring-white/30 transition-colors ${selectedPlace?.id === place.id
                                                        ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                                                        : 'bg-gray-400 text-white group-hover:bg-game-blue'
                                                        }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className={`font-black text-lg leading-tight truncate transition-colors ${selectedPlace?.name === place.place_name
                                                            ? 'text-game-navy'
                                                            : 'text-game-navy/70 group-hover:text-blue-600'
                                                            }`}>
                                                            {place.place_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                                                            {place.category_name.split(' > ').pop()} · {place.address_name}
                                                        </div>
                                                    </div>
                                                    {selectedPlace?.name === place.place_name && (
                                                        <span className="material-symbols-rounded text-accent-yellow text-2xl drop-shadow-sm flex-shrink-0">check_circle</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-white/40 gap-4 mt-10">
                                            <span className="material-symbols-rounded text-5xl animate-pulse">map</span>
                                            <div className="font-bold">주변 식당을 찾는 중...</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 flex-1 justify-center">
                                <div>
                                    <label className="block text-white font-bold text-base mb-2 opacity-90 shadow-sm flex items-center gap-2">
                                        <span className="material-symbols-rounded text-sm">group</span>최대 인원
                                    </label>
                                    <div className="grid grid-cols-4 gap-2 bg-game-dark-blue/40 p-2 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner">
                                        {[2, 4, 6, 8].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setMaxParticipants(num)}
                                                className={`py-2 rounded-xl font-black text-sm transition-all ${maxParticipants === num
                                                    ? 'bg-gradient-to-b from-white to-gray-100 text-game-navy shadow-lg ring-1 ring-white/40 transform scale-105 z-10'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {num}명
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white font-bold text-base mb-2 opacity-90 shadow-sm flex items-center gap-2">
                                        <span className="material-symbols-rounded text-sm">schedule</span>출발 시간
                                    </label>
                                    <div className="relative group cursor-pointer" onClick={() => setShowTimePicker(true)}>
                                        <div className="absolute inset-0 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="w-full bg-white/95 border-2 border-transparent group-hover:border-accent-yellow text-game-navy font-black text-lg rounded-xl py-3 px-4 shadow-lg flex justify-between items-center transition-all">
                                            <span>
                                                {departureTime ? (
                                                    parseInt(departureTime.split(':')[0]) < 12
                                                        ? `☀️ ${departureTime} AM`
                                                        : `🌙 ${departureTime} PM`
                                                ) : '시간을 선택하세요'}
                                            </span>
                                            <span className="material-symbols-rounded text-game-blue">schedule</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-surface-light p-6 border-t-[3px] border-game-dark-blue flex justify-center gap-6 relative z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
                        <button
                            onClick={onClose}
                            className="w-40 lg:w-48 py-4 rounded-2xl font-black text-xl text-gray-600 bg-gradient-to-b from-gray-50 to-gray-200 border-b-4 border-gray-300 hover:border-gray-400 active:border-b-0 active:mt-1 active:mb-[-1px] transition-all shadow-lg ring-1 ring-white/50"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedPlace}
                            className="w-40 lg:w-48 py-4 rounded-2xl font-black text-xl text-game-navy bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 border-b-4 border-yellow-600 hover:border-yellow-700 active:border-b-0 active:mt-1 active:mb-[-1px] disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-yellow-500/30 ring-1 ring-yellow-200 ring-inset hover:brightness-110"
                        >
                            {isSubmitting ? '생성 중...' : '확인 ⚓'}
                        </button>
                    </div>

                    {/* Custom Time Picker Modal Overlay */}
                    {showTimePicker && (
                        <div className="absolute inset-0 z-[110] bg-game-navy/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl border-4 border-game-dark-blue shadow-2xl w-full max-w-sm overflow-hidden transform animate-in zoom-in-95 duration-200">
                                <div className="bg-game-dark-blue p-4 text-white flex justify-between items-center">
                                    <h4 className="font-black text-xl flex items-center gap-2">
                                        <span className="material-symbols-rounded text-accent-yellow">schedule</span>
                                        출항 시간 선택
                                    </h4>
                                    <button onClick={() => setShowTimePicker(false)} className="hover:rotate-90 transition-transform">
                                        <span className="material-symbols-rounded">close</span>
                                    </button>
                                </div>

                                <div className="p-5 space-y-6">
                                    <section>
                                        <div className="flex items-center gap-2 mb-3 text-gray-600 font-bold border-b pb-1">
                                            <span>☀️ 점심 시간</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {timeOptions.lunch.map(time => {
                                                const passed = isTimePassed(time);
                                                return (
                                                    <button
                                                        key={time}
                                                        disabled={passed}
                                                        onClick={() => {
                                                            setDepartureTime(time);
                                                            setShowTimePicker(false);
                                                        }}
                                                        className={`py-2 rounded-xl font-black text-sm border-2 transition-all ${departureTime === time
                                                            ? 'bg-game-blue text-white border-game-dark-blue shadow-md scale-105'
                                                            : passed
                                                                ? 'bg-gray-200 text-gray-400 border-transparent cursor-not-allowed opacity-50'
                                                                : 'bg-gray-50 border-transparent hover:border-game-blue'
                                                            }`}
                                                    >
                                                        {time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>

                                    <section>
                                        <div className="flex items-center gap-2 mb-3 text-gray-600 font-bold border-b pb-1">
                                            <span>🌙 저녁 시간</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {timeOptions.dinner.map(time => {
                                                const passed = isTimePassed(time);
                                                return (
                                                    <button
                                                        key={time}
                                                        disabled={passed}
                                                        onClick={() => {
                                                            setDepartureTime(time);
                                                            setShowTimePicker(false);
                                                        }}
                                                        className={`py-2 rounded-xl font-black text-sm border-2 transition-all ${departureTime === time
                                                            ? 'bg-game-navy text-white border-indigo-900 shadow-md scale-105'
                                                            : passed
                                                                ? 'bg-gray-200 text-gray-400 border-transparent cursor-not-allowed opacity-50'
                                                                : 'bg-gray-50 border-transparent hover:border-game-navy'
                                                            }`}
                                                    >
                                                        {time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                </div>

                                <div className="p-4 bg-gray-50 text-center">
                                    <button
                                        onClick={() => setShowTimePicker(false)}
                                        className="text-gray-500 font-bold hover:text-game-navy transition-colors"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CreateRoomModal;