export default () => ({
  frontendDomain: process.env.FRONTEND_DOMAIN || 'localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
})
