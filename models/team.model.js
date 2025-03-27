import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    // معرف قائد الفريق
    teamLeader: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Team must have a leader'],
    },

    // اسم الفريق
    name: {
      type: String,
      required: [true, 'Team name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Team name must be at least 3 characters'],
      maxlength: [50, 'Team name cannot exceed 50 characters'],
    },

    // كود الفريق الفريد
    teamCode: {
      type: String,
      required: [true, 'Team code is required'],
      unique: true,
      uppercase: true,
    },

    // الفئة أو المجال
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Team must belong to a category'],
    },

    // أعضاء الفريق
    members: [
      {
        user: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['member', 'lead', 'admin'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    aboutUs: {
        type: String,
        minlength: [100, 'About us must be at least 100 characters'],
        maxlength: [2000, 'About us cannot exceed 2000 characters'],
      },
      projects: [
        {
          project: {
            type: mongoose.Schema.ObjectId,
            ref: 'Project',
          },
          status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active',
          },
          completionDate: Date,
        },
      ],
      lastedProjects: [
        {
          title: {
            type: String,
            required: true,
          },
          budget: String,
          description: String,
          images: [String],
          projectUrl: String,
          technologies: [String],
          completionDate: Date,
        },
      ],

    // تقييم الفريق
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },

    // حالة الفريق
    status: {
      type: String,
      enum: ['active', 'inactive', 'recruiting'],
      default: 'active',
    },

    // معلومات التواصل
    contactInfo: {
      email: String,
      phone: String,
      website: String,
    },

    // الشعار أو الصورة
    logo: String,

    // تاريخ التأسيس
    foundedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual للحصول على عدد الأعضاء
teamSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

// Virtual للمشاريع النشطة
teamSchema.virtual('activeProjects', {
  ref: 'Project',
  localField: 'projects',
  foreignField: '_id',
  match: { status: 'active' },
});

// Method للتحقق من وجود عضو في الفريق
teamSchema.methods.hasMember = function (userId) {
  return this.members.some(member => member.user.equals(userId));
};

// Middleware للتحقق من صحة كود الفريق
teamSchema.pre('save', function (next) {
  if (this.teamCode) {
    this.teamCode = this.teamCode.toUpperCase().replace(/\s/g, '');
  }
  next();
});

// Indexes للأداء الأفضل
teamSchema.index({ teamLeader: 1 });
teamSchema.index({ category: 1 });
teamSchema.index({ status: 1 });

const Team = mongoose.model('Team', teamSchema);
export default Team;
