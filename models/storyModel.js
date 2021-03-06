const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: String,
  date: String,
  body: String,
  author: {
    name: String,
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  image: {
    name: String,
    id: String,
  },
  location: {
    name: String,
    city: String,
    country: String,
    latitude: Number,
    longitude: Number,
  },
  city: {
    name: String,
    country: String,
    id: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
