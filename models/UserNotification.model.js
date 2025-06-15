import mongoose from 'mongoose';

const userNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    imageUrl: String,
    type: {
      type: String,
      //   enum:["Task-Posted" , "Accept-Request"],
      default: 'info',
    },
    actionUrl: String,
    data: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const UserNotification = mongoose.model(
  'UserNotification',
  userNotificationSchema
);
export default UserNotification;
