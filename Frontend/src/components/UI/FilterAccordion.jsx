import React, { createContext, useContext, useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

// Create a context to manage which panel is open
const FilterAccordionContext = createContext();

export const FilterAccordionGroup = ({ children }) => {
    const [openPanelId, setOpenPanelId] = useState(null);

    return (
        <FilterAccordionContext.Provider value={{ openPanelId, setOpenPanelId }}>
            <div className="space-y-4 filter-accordion-group">
                {children}
            </div>
        </FilterAccordionContext.Provider>
    );
};

export const FilterAccordion = ({ id, title, children }) => {
    const { openPanelId, setOpenPanelId } = useContext(FilterAccordionContext);

    // When this panel is opened, close any other panels
    const handleToggle = (open) => {
        if (open) {
            setOpenPanelId(id);
        } else if (openPanelId === id) {
            setOpenPanelId(null);
        }
    };

    return (
        <Disclosure
            as="div"
            className="filter-accordion"
            defaultOpen={false}
            open={openPanelId === id}
            onChange={handleToggle}
        >
            {({ open }) => (
                <>
                    <Disclosure.Button
                        className="flex w-full justify-between items-center px-4 py-3 text-left text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200"
                        onClick={() => handleToggle(!open)}
                    >
                        <span className="text-base">{title}</span>
                        <ChevronUpIcon
                            className={`${open ? 'transform rotate-180' : ''} h-5 w-5 text-gray-500 transition-transform`}
                        />
                    </Disclosure.Button>
                    <Disclosure.Panel className="filter-dropdown-panel px-4 pt-4 pb-2 text-sm text-gray-900">
                        <div className="filter-content">
                            {children}
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    );
};

export default FilterAccordion; 