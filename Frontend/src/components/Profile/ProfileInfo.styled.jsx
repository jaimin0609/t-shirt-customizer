import React from 'react';
import { FaUser, FaPhone, FaMapMarkerAlt, FaEnvelope } from 'react-icons/fa';
import withStyles from '../../styles/withStyles';
import styleSystem from '../../styles/styleSystem';

const ProfileInfoBase = ({ userData, formatFullAddress, onRefresh, isLoading, styles }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Current Profile Information</h2>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={styles.refreshButton}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className={styles.infoGrid}>
        <div>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <FaUser className={styles.infoIcon} />
              <span className={styles.infoText}>{userData?.name || 'Not set'}</span>
            </div>
            <div className={styles.infoItem}>
              <FaEnvelope className={styles.infoIcon} />
              <span className={styles.infoText}>{userData?.email || 'Not set'}</span>
            </div>
            <div className={styles.infoItem}>
              <FaPhone className={styles.infoIcon} />
              <span className={styles.infoText}>{userData?.customer?.phone || 'Not set'}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className={styles.sectionTitle}>
            {(userData?.customer?.isDefaultShippingAddress !== false)
              ? 'Default Shipping Address'
              : 'Shipping Address'}
          </h3>
          <div className={styles.addressItem}>
            <FaMapMarkerAlt className={styles.addressIcon} />
            <span className={styles.addressText}>{formatFullAddress()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withStyles(ProfileInfoBase, (theme) => ({
  container: `
    bg-white 
    shadow 
    rounded-lg 
    p-6 
    mb-8
  `,
  header: `
    flex 
    justify-between 
    items-center 
    mb-4
  `,
  title: `
    text-xl 
    font-semibold
  `,
  refreshButton: `
    bg-gray-200 
    hover:bg-gray-300 
    text-gray-800 
    font-semibold 
    py-1 
    px-3 
    rounded 
    text-sm 
    flex 
    items-center
    disabled:opacity-50
    disabled:cursor-not-allowed
  `,
  infoGrid: `
    grid 
    grid-cols-1 
    md:grid-cols-2 
    gap-4
  `,
  sectionTitle: `
    font-medium 
    text-gray-700 
    mb-2
  `,
  infoList: `
    space-y-2
  `,
  infoItem: `
    flex 
    items-center
  `,
  infoIcon: `
    text-gray-500 
    mr-2
  `,
  infoText: `
    text-gray-800
  `,
  addressItem: `
    flex 
    items-start
  `,
  addressIcon: `
    text-gray-500 
    mr-2 
    mt-1
  `,
  addressText: `
    text-gray-800
  `,
})); 