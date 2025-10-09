const mongoose = require('mongoose');
const Admin = require('../models/admin');
require('dotenv').config({ path: '../.env' });

const run = async () => {
  try {
    await mongoose.connect("mongodb+srv://UflexShuttle:uflexshuttle%23%23%23%40able@uflexshuttle.5gpxies.mongodb.net/UflexDB?retryWrites=true&w=majority");
    console.log('✅ Connected to MongoDB');

    const result = await Admin.updateMany(
      {
        $or: [
          { createdAt: { $exists: false } },
          { createdAt: null }
        ]
      },
      { $set: { createdAt: new Date(), updatedAt: new Date() } }
    );

    console.log(`✅ Updated ${result.modifiedCount} admins with timestamps`);

    // 👉 Show which admins were affected
    const updatedAdmins = await Admin.find().select('email createdAt updatedAt');
    console.table(updatedAdmins.map(a => ({
      email: a.email,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    })));

  } catch (err) {
    console.error('❌ Error updating timestamps:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Connection closed');
  }
};

run();
