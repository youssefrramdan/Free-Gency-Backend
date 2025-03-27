/**
 * @desc    Utility for scheduling periodic tasks
 * @file    utils/scheduler.js
 */

import User from '../models/user.model.js';

/**
 * Schedule cleanup task for rejected team requests
 * @param {number} intervalHours - How often to run the cleanup (in hours)
 */
export const scheduleRejectedRequestsCleanup = (intervalHours = 24) => {
  console.log(
    `Scheduling rejected team requests cleanup every ${intervalHours} hours`
  );

  // Run immediately to clean up existing rejected requests
  setTimeout(() => {
    User.cleanupRejectedRequests().catch(err => {
      console.error('Error during rejected requests cleanup:', err);
    });
  }, 5000); // Wait 5 seconds on startup before first run

  // Schedule periodic cleanup
  setInterval(
    () => {
      User.cleanupRejectedRequests().catch(err => {
        console.error('Error during rejected requests cleanup:', err);
      });
    },
    intervalHours * 60 * 60 * 1000
  ); // Convert hours to milliseconds
};

/**
 * Initialize all scheduled tasks
 */
export const initScheduledTasks = () => {
  // Start the cleanup task to run once a day
  scheduleRejectedRequestsCleanup(24);

  // Add other scheduled tasks here
};

export default initScheduledTasks;
