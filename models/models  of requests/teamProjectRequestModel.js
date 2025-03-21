import mongoose from 'mongoose';

const teamProjectRequestSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.ObjectId,
      ref: 'TeamLeader',
      required: [true, 'Request must belong to a team'],
    },
    project: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'Request must belong to a project'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    responseDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure team can only have one pending request per project
teamProjectRequestSchema.index(
  { team: 1, project: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

// Pre-save middleware
teamProjectRequestSchema.pre('save', async function (next) {
  if (
    this.isModified('status') &&
    (this.status === 'accepted' || this.status === 'rejected')
  ) {
    this.responseDate = Date.now();
  }
  next();
});

// When a request is accepted
teamProjectRequestSchema.pre('save', async function (next) {
  if (this.isModified('status') && this.status === 'accepted') {
    // Update project status and assigned team
    await mongoose.model('Project').findByIdAndUpdate(this.project, {
      status: 'in-progress',
      assignedTeam: this.team,
    });

    // Reject all other pending requests for this project
    await mongoose.model('TeamProjectRequest').updateMany(
      {
        project: this.project,
        _id: { $ne: this._id },
        status: 'pending',
      },
      {
        status: 'rejected',
        responseDate: Date.now(),
      }
    );
  }
  next();
});

const TeamProjectRequest = mongoose.model(
  'TeamProjectRequest',
  teamProjectRequestSchema
);
export default TeamProjectRequest;
