export default () => ({
  frontendDomain: process.env.FRONTEND_DOMAIN || 'localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  accessKeyId: process.env.ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ACCESS_KEY_SECRET || '',
  phoneAccessToken: process.env.PHONE_ACCESS_TOKEN || '',
  phoneNumber: process.env.PHONE_NUMBER || '',
  isDev: process.env.ISDEV || false,
})
