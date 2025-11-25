/* eslint-disable no-undef */
// Initializes analytics database/user in shared MongoDB instance
(function initAnalyticsDb() {
  const analyticsDb = db.getSiblingDB('analytics_service');

  const existingUsers = analyticsDb.getUsers({ filter: { user: 'analytics' } });
  if (!existingUsers.length) {
    analyticsDb.createUser({
      user: 'analytics',
      pwd: 'analytics',
      roles: [{ role: 'readWrite', db: 'analytics_service' }],
    });
  }

  if (!analyticsDb.getCollectionNames().includes('system.version')) {
    analyticsDb.createCollection('system.version');
  }
})();
