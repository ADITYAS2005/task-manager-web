const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    color: {
      type: String,
      default: '#185FA5',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code'],
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [memberSchema],
    dueDate: {
      type: Date,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
  }
);

// Indexes
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1 });

// Virtual: task count (populated separately)
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

// Instance method: check if user is member
projectSchema.methods.isMember = function (userId) {
  return (
    this.owner.toString() === userId.toString() ||
    this.members.some((m) => m.user.toString() === userId.toString())
  );
};

// Instance method: check if user has admin rights on project
projectSchema.methods.isProjectAdmin = function (userId) {
  if (this.owner.toString() === userId.toString()) return true;
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member && member.role === 'admin';
};

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
