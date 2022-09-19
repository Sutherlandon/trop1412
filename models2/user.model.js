import sortBy from 'lodash.sortby';
import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import db from '../config/database';

// define the default collection name
let collection = 'users';

// use a random table name for testing
if (process.env.NODE_ENV === 'test') {
  collection = `${collection}-${nanoid()}`;
}

// cached schedule for repeated get calls this cache is updated
// everytime an upate is made to the list
let _users = [];

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  issuer: { type: String, unique: true },
  firstName: String,
  lastName: String,
  roles: Array,
}, {
  collection,
  timestamps: {
    createdAt: 'created',
    updatedAt: 'updated',
  },
});

UserSchema.statics = {
  async add(formData) {
    const user = await this.create(formData);

    return user;
  },

  async get(id) {
    // not sure whether email or issuer will be more consistently used
    const user = await this.findOne({ $or: [{ email: id }, { issuer: id }] }).lean();

    return user;
  },

  async getAll() {
    const users = await this.find().lean();

    _users = sortBy(users, 'lastName');

    return _users;
  },

  async update(formData) {
    const { _id, firstName, lastName } = formData;

    await this.findOneAndUpdate({ _id }, { firstName, lastName }).lean();

    return this.getAll();
  },
};

let User;
if (process.env.NODE_ENV === 'development') {
  // always start fresh, we need to do this because Next preserves the
  // mongoose instance of User so we cant build a new one
  console.log('Rebuilding User Model');
  delete db.models.User;

  User = db.model('User', UserSchema);
} else {
  User = db.models.User || db.model('User', UserSchema);
}

export default User;
