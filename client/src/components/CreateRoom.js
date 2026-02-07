import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

function CreateRoom({ user }) {
    const navigate = useNavigate();
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [maxParticipants, setMaxParticipants] = useState(4);
    const [departureTime, setDepartureTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [places, setPlaces] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);
    const markersRef = useRef([]);

    // Scroll refs
    const scrollRef = useRef(null);

    const scrollList = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 180; // card width + gap
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const timeOptions = {
        lunch: ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
        dinner: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00']
    };

    // Initialize departure time
    useEffect(() => {
        setDepartureTime('11:30');
    }, []);

    // Check if time has passed
    const isTimePassed = (timeStr) => {
        const now = new Date();
        const [hours, minutes] = timeStr.split(':').map(Number);
        const target = new Date();
        target.setHours(hours, minutes, 0, 0);
        return target < now;
    };

    // Initialize Map
    useEffect(() => {
        if (window.kakao && window.kakao.maps) {
            // Slight delay to ensure DOM is ready
            setTimeout(() => {
                initializeMap();
            }, 100);
        } else {
            console.error('Kakao map not loaded');
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

        // Initialize search
        const ps = new window.kakao.maps.services.Places();

        // Search nearby initially
        ps.categorySearch('FD6', (data, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                displayPlaces(data, map);
            }
        }, {
            location: new window.kakao.maps.LatLng(lat, lng),
            radius: 1000,
            sort: window.kakao.maps.services.SortBy.DISTANCE
        });

        // Re-search on drag end
        window.kakao.maps.event.addListener(map, 'dragend', () => {
            const center = map.getCenter();
            ps.categorySearch('FD6', (data, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                    displayPlaces(data, map);
                }
            }, {
                location: center,
                radius: 1000,
                sort: window.kakao.maps.services.SortBy.DISTANCE
            });
        });
    };

    const displayPlaces = (data, map) => {
        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        setPlaces(data);

        data.forEach((place) => {
            const placePosition = new window.kakao.maps.LatLng(place.y, place.x);
            const marker = new window.kakao.maps.Marker({
                position: placePosition,
                map: map
            });

            window.kakao.maps.event.addListener(marker, 'click', () => {
                handleSelectPlace(place);
            });

            marker.placeId = place.id;
            markersRef.current.push(marker);
        });
    };

    const handleSelectPlace = (place) => {
        setSelectedPlace({
            id: place.id,
            name: place.place_name,
            address: place.address_name || place.road_address_name,
            latitude: place.y,
            longitude: place.x
        });
    };

    const handleManualSearch = () => {
        if (!searchQuery.trim() || !mapInstance) return;

        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(searchQuery, (data, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                displayPlaces(data, mapInstance);
                // Move map to the first result
                if (data.length > 0) {
                    const firstPlace = data[0];
                    const moveLatLng = new window.kakao.maps.LatLng(firstPlace.y, firstPlace.x);
                    mapInstance.panTo(moveLatLng);
                }
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                alert('검색 결과가 존재하지 않습니다.');
            } else if (status === window.kakao.maps.services.Status.ERROR) {
                alert('검색 중 오류가 발생했습니다.');
            }
        }, { category_group_code: 'FD6' }); // Optional: restrict to food/restaurants
    };

    // Effect to update map center and highlight marker when selectedPlace changes
    useEffect(() => {
        if (mapInstance && selectedPlace) {
            const moveLatLng = new window.kakao.maps.LatLng(selectedPlace.latitude, selectedPlace.longitude);
            mapInstance.panTo(moveLatLng);

            // Update markers
            markersRef.current.forEach(marker => {
                if (marker.placeId === selectedPlace.id) {
                    // specific highlighting if needed, for now just z-index
                    marker.setZIndex(999);
                } else {
                    marker.setZIndex(1);
                }
            });
        }
    }, [selectedPlace, mapInstance]);


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

            if (departure < new Date()) {
                alert('이미 지나간 시간으로는 방을 만들 수 없습니다!');
                setIsSubmitting(false);
                return;
            }

            const year = departure.getFullYear();
            const month = String(departure.getMonth() + 1).padStart(2, '0');
            const day = String(departure.getDate()).padStart(2, '0');
            const hh = String(departure.getHours()).padStart(2, '0');
            const mm = String(departure.getMinutes()).padStart(2, '0');
            const ss = '00';
            const localDepartureTime = `${year}-${month}-${day} ${hh}:${mm}:${ss}`;

            const response = await axios.post(
                `${API_BASE_URL}/api/rooms`,
                {
                    restaurant_name: selectedPlace.name,
                    restaurant_address: selectedPlace.address,
                    latitude: parseFloat(selectedPlace.latitude),
                    longitude: parseFloat(selectedPlace.longitude),
                    max_participants: maxParticipants,
                    departure_time: localDepartureTime,
                    kakao_place_id: selectedPlace.id
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                alert(`"${selectedPlace.name} 출항해요!" 방이 생성되었습니다! 🏴‍☠️`);
                navigate('/'); // Redirect to home/list
            }
        } catch (error) {
            alert('방 생성에 실패했습니다. 다시 시도해주세요.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="antialiased text-slate-900 bg-[#f6f7f8] dark:bg-[#101922] font-['Plus_Jakarta_Sans'] selection:bg-[#2b8cee]/20 min-h-screen flex flex-col relative overflow-hidden max-w-[400px] mx-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center px-6 pt-10 pb-4 justify-between z-10 shrink-0">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full active:bg-slate-100 transition-colors text-slate-800 -ml-2"
                >
                    <span className="material-symbols-rounded text-[24px]">arrow_back_ios_new</span>
                </button>
                <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-8">해적선 생성</h2>
            </div>

            <div className="relative z-0 flex h-screen w-full flex-col bg-gradient-to-b from-white to-[#F0F7FF] overflow-hidden" style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', zIndex: -1 }}></div>

            <div className="flex-1 overflow-y-auto hide-scrollbar pb-36 relative z-10">
                {/* Search Section */}
                <div className="px-6 mb-4 pt-2">
                    <div className="flex gap-2 relative">
                        <input
                            type="text"
                            placeholder="식당 이름을 입력하세요"
                            className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-[15px] shadow-sm outline-none focus:ring-2 focus:ring-[#2b8cee] focus:border-transparent transition-all placeholder-slate-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                        />
                        <button
                            onClick={handleManualSearch}
                            className="bg-[#2b8cee] text-white px-6 rounded-2xl font-black text-[15px] shadow-md hover:bg-[#2573c2] hover:-translate-y-0.5 active:translate-y-0 transition-all border-b-4 border-[#1a6bb5] active:border-b-0 active:mt-1 active:mb-[-1px] shrink-0"
                        >
                            검색
                        </button>
                    </div>
                </div>

                {/* Map Section */}
                <div className="px-6 mb-6">
                    <div className="w-full h-64 bg-slate-100 rounded-[2rem] relative overflow-hidden border border-white shadow-soft group transform transition-all">
                        {/* Map Container */}
                        <div id="create-room-map" className="w-full h-full absolute inset-0 z-0"></div>

                        {/* Overlay info if place selected */}
                        {selectedPlace && (
                            <div className="absolute top-[42%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 pointer-events-none">
                                <div className="bg-slate-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl shadow-lg mb-2 flex items-center gap-1.5 animate-[bounce_2.5s_infinite]">
                                    <span className="size-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                                    <span className="text-[11px] font-bold tracking-wide max-w-[150px] truncate">{selectedPlace.name}</span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                if (mapInstance && user) {
                                    const moveLatLng = new window.kakao.maps.LatLng(user.companyLatitude, user.companyLongitude);
                                    mapInstance.panTo(moveLatLng);
                                }
                            }}
                            className="absolute bottom-4 right-4 size-10 bg-white/90 backdrop-blur rounded-full shadow-soft border border-slate-50 flex items-center justify-center text-slate-600 active:scale-95 transition-transform z-30"
                        >
                            <span className="material-symbols-rounded text-[20px]">my_location</span>
                        </button>
                    </div>
                </div>

                {/* Nearby Places List */}
                <div className="flex flex-col mb-8">
                    <div className="px-6 mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-lg">list</span>
                        <h3 className="text-slate-900 text-[15px] font-bold tracking-tight">주변 맛집 리스트</h3>
                    </div>
                    <div className="relative group px-2">
                        <button
                            onClick={() => scrollList('left')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white text-[#2b8cee] rounded-full w-8 h-8 flex items-center justify-center shadow-lg border border-slate-100 hover:bg-[#2b8cee] hover:text-white transition-all transform hover:scale-110"
                        >
                            <span className="material-symbols-outlined text-xl">chevron_left</span>
                        </button>

                        <div
                            ref={scrollRef}
                            className="flex overflow-x-auto hide-scrollbar px-4 gap-4 py-4 -my-4 snap-x snap-mandatory scroll-smooth"
                        >
                            {places.map((place) => (
                                <div
                                    key={place.id}
                                    onClick={() => handleSelectPlace(place)}
                                    className={`snap-center shrink-0 w-40 aspect-square rounded-[1.5rem] relative flex flex-col justify-end p-5 transition-all duration-300 transform cursor-pointer border ${selectedPlace?.id === place.id
                                        ? 'bg-white shadow-glow border-2 border-[#2b8cee] scale-[1.02]'
                                        : 'bg-white shadow-soft border-slate-100 opacity-70 hover:opacity-100 active:scale-95'}`}
                                >
                                    <div className="flex-1 w-full flex items-center justify-center mb-1">
                                        {selectedPlace?.id === place.id ? (
                                            <span className="material-symbols-outlined filled text-[48px] text-[#2b8cee] animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>sailing</span>
                                        ) : (
                                            <div className="size-12 rounded-full bg-slate-50 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-300 text-[24px]">restaurant</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full text-center">
                                        <h4 className="text-slate-900 text-[14px] font-bold leading-tight mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{place.place_name}</h4>
                                        <p className="text-slate-400 text-[11px] font-medium leading-normal line-clamp-1 text-center">{place.category_name.split('>').pop()}</p>
                                    </div>
                                </div>
                            ))}
                            {places.length === 0 && (
                                <div className="px-6 text-slate-400 text-sm">주변에 식당이 없습니다. 지도를 이동해보세요.</div>
                            )}
                        </div>

                        <button
                            onClick={() => scrollList('right')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white text-[#2b8cee] rounded-full w-8 h-8 flex items-center justify-center shadow-lg border border-slate-100 hover:bg-[#2b8cee] hover:text-white transition-all transform hover:scale-110"
                        >
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </button>
                    </div>
                </div>

                <div className="mx-6 border-t border-slate-100 mb-6"></div>

                {/* Max Participants */}
                <div className="px-6 mb-8">
                    <h3 className="text-slate-900 text-[15px] font-bold tracking-tight mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-lg">group</span>
                        인원
                    </h3>
                    <div className="flex gap-3">
                        {[2, 3, 4, 6].map(num => (
                            <button
                                key={num}
                                onClick={() => setMaxParticipants(num)}
                                className={`flex-1 h-12 rounded-2xl font-bold text-sm flex items-center justify-center transition-all active:scale-95 ${maxParticipants === num
                                    ? 'bg-[#2b8cee] text-white shadow-glow ring-2 ring-[#2b8cee] ring-offset-2'
                                    : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                            >
                                {num}명
                            </button>
                        ))}
                    </div>
                </div>

                {/* Departure Time */}
                <div className="px-6 mb-8">
                    <h3 className="text-slate-900 text-[15px] font-bold tracking-tight mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-lg">schedule</span>
                        시간
                    </h3>
                    <button
                        onClick={() => setShowTimePicker(true)}
                        className="w-full bg-white rounded-2xl border border-slate-200 p-1 flex items-center shadow-sm active:scale-[0.99] transition-transform group"
                    >
                        <div className="flex-1 flex items-center gap-4 px-4 py-3 border-r border-slate-100 border-dashed">
                            <div className="w-11 h-11 flex items-center justify-center bg-[#2b8cee] rounded-full text-white shrink-0 shadow-md">
                                <span className="material-symbols-outlined text-[20px]">schedule</span>
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Start Time</p>
                                <p className="text-[17px] font-bold text-slate-900">
                                    {departureTime ? (
                                        parseInt(departureTime.split(':')[0]) < 12
                                            ? `오전 ${departureTime}`
                                            : `오후 ${departureTime}`
                                    ) : '시간 선택'}
                                </p>
                            </div>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined">expand_more</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Bottom Action Button */}
            <div className="absolute bottom-0 w-full p-6 pb-9 bg-white/80 backdrop-blur-md border-t border-white/50 z-20">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !selectedPlace}
                    className="w-full h-14 bg-[#2b8cee] rounded-[1.5rem] text-white font-bold text-lg shadow-glow flex items-center justify-center gap-2 transition-transform active:scale-[0.98] hover:shadow-lg hover:shadow-[#2b8cee]/30 disabled:opacity-50 disabled:grayscale"
                >
                    <span>{isSubmitting ? '생성 중...' : '해적선 생성'}</span>
                </button>
            </div>

            {/* Time Picker Modal Overlay */}
            {showTimePicker && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-xl text-slate-900">출항 시간 선택</h4>
                            <button onClick={() => setShowTimePicker(false)} className="p-2 rounded-full hover:bg-slate-100">
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <div className="space-y-6 mb-6">
                            <section>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">점심 시간</div>
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
                                                className={`py-3 rounded-xl font-bold text-sm transition-all ${departureTime === time
                                                    ? 'bg-[#2b8cee] text-white shadow-lg'
                                                    : passed
                                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                            <section>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">저녁 시간</div>
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
                                                className={`py-3 rounded-xl font-bold text-sm transition-all ${departureTime === time
                                                    ? 'bg-slate-800 text-white shadow-lg'
                                                    : passed
                                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateRoom;
