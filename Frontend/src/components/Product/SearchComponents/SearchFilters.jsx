import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FilterAccordion, FilterAccordionGroup } from '../../UI/FilterAccordion';

const SearchFilters = ({
    availableFilters,
    filters,
    handleFilterChange,
    applyFilters,
    clearFilters,
    removeFilter,
    appliedFilters
}) => {
    return (
        <div className="w-full md:w-64 lg:w-72 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
                {Object.values(appliedFilters).some(arr => arr.length > 0) && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Applied Filters */}
            {Object.values(appliedFilters).some(arr => arr.length > 0) && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Applied Filters:</p>
                    <div className="flex flex-wrap gap-2">
                        {appliedFilters.categories.map(category => (
                            <div key={`cat-${category}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {category}
                                <button
                                    onClick={() => removeFilter('categories', category)}
                                    className="ml-1 focus:outline-none"
                                    aria-label={`Remove ${category} filter`}
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        {appliedFilters.genders.map(gender => (
                            <div key={`gender-${gender}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                {gender}
                                <button
                                    onClick={() => removeFilter('genders', gender)}
                                    className="ml-1 focus:outline-none"
                                    aria-label={`Remove ${gender} filter`}
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        {appliedFilters.ageGroups.map(ageGroup => (
                            <div key={`age-${ageGroup}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                {ageGroup}
                                <button
                                    onClick={() => removeFilter('ageGroups', ageGroup)}
                                    className="ml-1 focus:outline-none"
                                    aria-label={`Remove ${ageGroup} filter`}
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <FilterAccordionGroup>
                {/* Categories Filter */}
                <FilterAccordion title="Categories">
                    <div className="space-y-2">
                        {availableFilters.categories.map(category => (
                            <div key={category.id} className="flex items-center">
                                <input
                                    id={`category-${category.id}`}
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={filters.categories.includes(category.id)}
                                    onChange={() => handleFilterChange('categories', category.id)}
                                />
                                <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                                    {category.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </FilterAccordion>

                {/* Gender Filter */}
                <FilterAccordion title="Gender">
                    <div className="space-y-2">
                        {availableFilters.genders.map(gender => (
                            <div key={gender.id} className="flex items-center">
                                <input
                                    id={`gender-${gender.id}`}
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={filters.genders.includes(gender.id)}
                                    onChange={() => handleFilterChange('genders', gender.id)}
                                />
                                <label htmlFor={`gender-${gender.id}`} className="ml-2 text-sm text-gray-700">
                                    {gender.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </FilterAccordion>

                {/* Age Group Filter */}
                <FilterAccordion title="Age Group">
                    <div className="space-y-2">
                        {availableFilters.ageGroups.map(ageGroup => (
                            <div key={ageGroup.id} className="flex items-center">
                                <input
                                    id={`ageGroup-${ageGroup.id}`}
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={filters.ageGroups.includes(ageGroup.id)}
                                    onChange={() => handleFilterChange('ageGroups', ageGroup.id)}
                                />
                                <label htmlFor={`ageGroup-${ageGroup.id}`} className="ml-2 text-sm text-gray-700">
                                    {ageGroup.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </FilterAccordion>
            </FilterAccordionGroup>

            <button
                onClick={applyFilters}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-150 ease-in-out"
            >
                Apply Filters
            </button>
        </div>
    );
};

export default SearchFilters; 