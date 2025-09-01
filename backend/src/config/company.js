/**
 * Company configuration for Eagle Events
 * Centralizes company information used throughout the application
 */

export const companyConfig = {
  name: process.env.COMPANY_NAME || 'Eagles Events',
  address: process.env.COMPANY_ADDRESS || '7280 Nhlangala Street Protea Glen SOWETO',
  phone: process.env.COMPANY_PHONE || '083-989-4082 / 068-078-0301',
  email: process.env.COMPANY_EMAIL || 'eaglesevents581@gmail.com',
  website: process.env.COMPANY_WEBSITE || 'https://www.eaglesevents.co.za',
  frontendUrl: process.env.FRONTEND_URL || 'https://www.eaglesevents.co.za',
  backendUrl: process.env.BACKEND_URL || 'https://api.eaglesevents.co.za'
};

/**
 * Get formatted company contact information
 */
export const getCompanyContactInfo = () => ({
  name: companyConfig.name,
  address: companyConfig.address,
  phone: companyConfig.phone,
  email: companyConfig.email,
  website: companyConfig.website
});

/**
 * Get company branding information
 */
export const getCompanyBranding = () => ({
  name: companyConfig.name,
  website: companyConfig.website,
  frontendUrl: companyConfig.frontendUrl,
  backendUrl: companyConfig.backendUrl
});

export default companyConfig;
