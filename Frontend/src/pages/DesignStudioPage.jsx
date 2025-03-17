import React from 'react';
import CustomDesignStudioPage from './CustomDesignStudioPage';

// This is a wrapper component that simply forwards to CustomDesignStudioPage
// In the future, you could use this to add additional functionality or routing
const DesignStudioPage = () => {
    return <CustomDesignStudioPage />;
};

export default DesignStudioPage; 