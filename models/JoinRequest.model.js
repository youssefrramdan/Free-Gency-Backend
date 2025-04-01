import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    team: {
      type: mongoose.Schema.ObjectId,
      ref: 'Team',
      required: [true, 'Team is required'],
    },
    job: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    responseAt: {
      type: Date,
    },
    responseBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User', // Team Leader or Admin
    },
  },
  {
    timestamps: true,
  }
);

// Add compound index for user and team fields
joinRequestSchema.index({ user: 1, team: 1 }, { unique: true });

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema);
export default JoinRequest;
