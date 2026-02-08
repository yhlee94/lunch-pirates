import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../components/CustomAlert';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        message: '',
        type: 'info',
    });

    const showAlert = useCallback((message, type = 'info') => {
        setAlertConfig({
            isOpen: true,
            message,
            type,
        });
    }, []);

    const closeAlert = useCallback(() => {
        setAlertConfig((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <CustomAlert
                isOpen={alertConfig.isOpen}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={closeAlert}
            />
        </AlertContext.Provider>
    );
};
