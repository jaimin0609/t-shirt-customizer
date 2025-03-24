import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FilterAccordion, FilterAccordionGroup } from '../../UI/FilterAccordion';
import withStyles from '../../../styles/withStyles.jsx';
import styleSystem from '../../../styles/styleSystem';

const SearchFiltersBase = ({
    availableFilters,
    filters,
    handleFilterChange,
    applyFilters,
    clearFilters,
    removeFilter,
    appliedFilters,
    styles
}) => {
    return (
        <div className={styles.container}>
            <div className={styles.headerContainer}>
                <h2 className={styles.title}>Filters</h2>
                {Object.values(appliedFilters).some(arr => arr.length > 0) && (
                    <button
                        onClick={clearFilters}
                        className={styles.clearButton}
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Applied Filters */}
            {Object.values(appliedFilters).some(arr => arr.length > 0) && (
                <div className={styles.appliedFiltersContainer}>
                    <p className={styles.appliedFiltersTitle}>Applied Filters:</p>
                    <div className={styles.filtersGrid}>
                        {appliedFilters.categories.map(category => (
                            <div key={`cat-${category}`} className={styles.categoryFilter}>
                                {category}
                                <button
                                    onClick={() => removeFilter('categories', category)}
                                    className={styles.removeFilterButton}
                                    aria-label={`Remove ${category} filter`}
                                >
                                    <XMarkIcon className={styles.removeIcon} />
                                </button>
                            </div>
                        ))}
                        {appliedFilters.genders.map(gender => (
                            <div key={`gender-${gender}`} className={styles.genderFilter}>
                                {gender}
                                <button
                                    onClick={() => removeFilter('genders', gender)}
                                    className={styles.removeFilterButton}
                                    aria-label={`Remove ${gender} filter`}
                                >
                                    <XMarkIcon className={styles.removeIcon} />
                                </button>
                            </div>
                        ))}
                        {appliedFilters.ageGroups.map(ageGroup => (
                            <div key={`age-${ageGroup}`} className={styles.ageFilter}>
                                {ageGroup}
                                <button
                                    onClick={() => removeFilter('ageGroups', ageGroup)}
                                    className={styles.removeFilterButton}
                                    aria-label={`Remove ${ageGroup} filter`}
                                >
                                    <XMarkIcon className={styles.removeIcon} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <FilterAccordionGroup>
                {/* Categories Filter */}
                <FilterAccordion title="Categories">
                    <div className={styles.checkboxGroup}>
                        {availableFilters.categories.map(category => (
                            <div key={category.id} className={styles.checkboxItem}>
                                <input
                                    id={`category-${category.id}`}
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={filters.categories.includes(category.id)}
                                    onChange={() => handleFilterChange('categories', category.id)}
                                />
                                <label htmlFor={`category-${category.id}`} className={styles.checkboxLabel}>
                                    {category.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </FilterAccordion>

                {/* Gender Filter */}
                <FilterAccordion title="Gender">
                    <div className={styles.checkboxGroup}>
                        {availableFilters.genders.map(gender => (
                            <div key={gender.id} className={styles.checkboxItem}>
                                <input
                                    id={`gender-${gender.id}`}
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={filters.genders.includes(gender.id)}
                                    onChange={() => handleFilterChange('genders', gender.id)}
                                />
                                <label htmlFor={`gender-${gender.id}`} className={styles.checkboxLabel}>
                                    {gender.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </FilterAccordion>

                {/* Age Group Filter */}
                <FilterAccordion title="Age Group">
                    <div className={styles.checkboxGroup}>
                        {availableFilters.ageGroups.map(ageGroup => (
                            <div key={ageGroup.id} className={styles.checkboxItem}>
                                <input
                                    id={`ageGroup-${ageGroup.id}`}
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={filters.ageGroups.includes(ageGroup.id)}
                                    onChange={() => handleFilterChange('ageGroups', ageGroup.id)}
                                />
                                <label htmlFor={`ageGroup-${ageGroup.id}`} className={styles.checkboxLabel}>
                                    {ageGroup.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </FilterAccordion>
            </FilterAccordionGroup>

            <button
                onClick={applyFilters}
                className={styles.applyButton}
            >
                Apply Filters
            </button>
        </div>
    );
};

// Define component-specific styles
const searchFiltersStyles = styleSystem.createStyles({
    container: `
        w-full 
        md:w-64 
        lg:w-72 
        p-4 
        bg-white 
        rounded-lg 
        shadow-sm 
        border 
        border-gray-100
    `,
    headerContainer: `
        flex 
        items-center 
        justify-between 
        mb-4
    `,
    title: `
        text-lg 
        font-semibold 
        text-gray-800
    `,
    clearButton: `
        text-sm 
        text-blue-600 
        hover:text-blue-800
    `,
    appliedFiltersContainer: `
        mb-4
    `,
    appliedFiltersTitle: `
        text-sm 
        font-medium 
        text-gray-700 
        mb-2
    `,
    filtersGrid: `
        flex 
        flex-wrap 
        gap-2
    `,
    categoryFilter: `
        inline-flex 
        items-center 
        px-2 
        py-1 
        rounded-full 
        text-xs 
        bg-blue-100 
        text-blue-800
    `,
    genderFilter: `
        inline-flex 
        items-center 
        px-2 
        py-1 
        rounded-full 
        text-xs 
        bg-purple-100 
        text-purple-800
    `,
    ageFilter: `
        inline-flex 
        items-center 
        px-2 
        py-1 
        rounded-full 
        text-xs 
        bg-green-100 
        text-green-800
    `,
    removeFilterButton: `
        ml-1 
        focus:outline-none
    `,
    removeIcon: `
        h-3 
        w-3
    `,
    checkboxGroup: `
        space-y-2
    `,
    checkboxItem: `
        flex 
        items-center
    `,
    checkbox: `
        h-4 
        w-4 
        text-blue-600 
        focus:ring-blue-500 
        border-gray-300 
        rounded
    `,
    checkboxLabel: `
        ml-2 
        text-sm 
        text-gray-700
    `,
    applyButton: `
        w-full 
        mt-4 
        bg-blue-600 
        hover:bg-blue-700 
        text-white 
        py-2 
        px-4 
        rounded-md 
        text-sm 
        font-medium 
        transition 
        duration-150 
        ease-in-out
    `,
});

// Create the styled component
const SearchFilters = withStyles(SearchFiltersBase, searchFiltersStyles);

export default SearchFilters; 