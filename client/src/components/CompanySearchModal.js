// client/src/components/CompanySearchModal.js
import React, { useState } from 'react';
import '../styles/CompanySearchModal.css';

function CompanySearchModal({ onSelectCompany, onClose }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setError('회사명을 입력해주세요');
            return;
        }

        setLoading(true);
        setError('');
        setSearched(true);

        try {
            const response = await fetch(`http://localhost:5000/api/company/search?query=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (response.ok) {
                setSearchResults(data.companies || []);
                if (data.companies.length === 0) {
                    setError('검색 결과가 없습니다. 다른 검색어를 입력해주세요.');
                }
            } else {
                setError(data.message || '검색에 실패했습니다');
            }
        } catch (err) {
            console.error('회사 검색 오류:', err);
            setError('서버와 연결할 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (company) => {
        onSelectCompany(company);
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icons-round" style={{ color: '#94a3b8' }}>business</span>
                        회사 검색
                    </h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="search-section">
                    <input
                        type="text"
                        placeholder="회사명을 입력하세요 (예: 카카오, 네이버)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="search-input"
                        autoFocus
                    />
                    <button
                        onClick={handleSearch}
                        className="search-button"
                        disabled={loading}
                    >
                        {loading ? '검색 중...' : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-icons-round" style={{ fontSize: '18px' }}>search</span>
                                검색
                            </div>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="error-box">
                        {error}
                    </div>
                )}

                <div className="results-section">
                    {loading && (
                        <div className="loading-message">
                            검색 중입니다...
                        </div>
                    )}

                    {!loading && searched && searchResults.length === 0 && !error && (
                        <div className="no-results">
                            검색 결과가 없습니다
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <div className="results-list">
                            {searchResults.map((company, index) => (
                                <div
                                    key={index}
                                    className="result-item"
                                    onClick={() => handleSelect(company)}
                                >
                                    <div className="company-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="material-icons-round" style={{ fontSize: '18px', color: '#94a3b8' }}>business</span>
                                        {company.place_name}
                                    </div>
                                    <div className="company-address" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="material-icons-round" style={{ fontSize: '16px', color: '#94a3b8' }}>place</span>
                                        {company.address_name || company.road_address_name}
                                    </div>
                                    {company.phone && (
                                        <div className="company-phone" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="material-icons-round" style={{ fontSize: '14px', color: '#94a3b8' }}>call</span>
                                            {company.phone}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <p className="hint-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span className="material-icons-round" style={{ fontSize: '16px', color: '#94a3b8' }}>lightbulb</span>
                        검색 후 원하는 회사를 클릭해주세요
                    </p>
                </div>
            </div>
        </div>
    );
}

export default CompanySearchModal;