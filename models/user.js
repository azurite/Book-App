require("./trade");
require("./book");
const mongoose = require("mongoose");
const localAuthPlugin = require("./plugins/local_auth");
const socialAuthPlugin = require("./plugins/social_auth");
const normalizerPlugin = require("./plugins/normalizer");
const checker = require("./utils/checker");

const errors = require("./utils/errors");

const User = mongoose.Schema({
  local: {
    username: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, unique: true, sparse: true, trim: true },
    image_url: { type: String, default: "/client/media/dummy_image.png", trim: true },
    hash: { type: String, select: false },
    salt: { type: String, select: false }
  },
  github: {
    id: String,
    username: String,
    image_url: { type: String, default: "/client/media/dummy_image.png" }
  },
  twitter: {
    id: String,
    username: String,
    image_url: { type: String, default: "/client/media/dummy_image.png" }
  },
  login_method: String,
  public: {
    full_name: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true }
  },
  library: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "book"
    }
  ],
  trades: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "trade"
    }
  ],
  message_cache: [
    {
      from: Date,
      text: String
    }
  ]
});

User.statics.addBook = function(userId, book, cb) {
  if(!checker.objectId(userId)) {
    return cb(errors.invalidObjectIdError(400, "we couldn't add your book. please try again"));
  }

  this.findOneAndUpdate(
    { _id: userId },
    { $push: { library: book } },
    (err) => {
      if(err) {
        return cb(err);
      }
      cb();
    }
  );
};

User.statics.removeBook = function(userId, bookId, cb) {
  if(!checker.objectId(userId)) {
    return cb(errors.invalidObjectIdError(400, "we couldn't remove your book. please try again"));
  }

  this.findOneAndUpdate(
    { _id: userId },
    { $pull: { library: bookId } },
    (err) => {
      if(err) {
        return cb(err);
      }
      cb();
    }
  );
};

User.statics.updatePublicInfo = function(userId, newInfo, cb) {
  this.findOneAndUpdate(
    { _id: userId },
    { $set: { public: { full_name: newInfo.full_name, city: newInfo.city, state: newInfo.state } } },
    (err) => {
      if(err) {
        return cb(err);
      }
      cb();
    }
  );
};

User.statics.changePassword = function(userId, data, cb) {
  this.findOne({ _id: userId })
    .select("+local.hash +local.salt")
    .exec((err, user) => {
      if(err) {
        return cb(err);
      }
      user.validatePassword(data.old_pw, (err, status) => {
        if(err) {
          return cb(err);
        }

        if(status === false) {
          return cb(errors.wrongOldPasswordError());
        }

        user.setPassword(data.new_pw, (err, updatedUser) => {
          if(err) {
            return cb(err);
          }
          updatedUser.save((err) => {
            if(err) {
              return cb(err);
            }
            cb();
          });
        });
      });
    });
};

User.statics.removeUser = function(userId, cb) {
  this.findOne({ _id: userId }, (err, user) => {
    if(err) {
      return cb(err);
    }
    user.remove((err) => {
      if(err) {
        return cb(err);
      }
      cb();
    });
  });
};

const autoPopulateLibrary = function(next) {
  this.populate({
    path: "library",
    select: "-owner"
  });
  next();
};

const autoPopulateLibraryAndTrades = function(next) {
  this.populate([
    {
      path: "library",
      select: "-owner"
    },
    {
      path: "trades",
      populate: [
        {
          path: "initiand",
          select: "-library -trades"
        },
        {
          path: "acceptand",
          select: "-library -trades"
        }
      ]
    }
  ]);
  next();
};

// TODO: find a better method to hook up different pre middleware that differentiates between when
// the trades are populated as well and when not (right now find vs finOne) but this doesn't feel right

User.pre("find", autoPopulateLibrary);
User.pre("findOne", autoPopulateLibraryAndTrades);

User.pre("remove", function(next) {
  mongoose.model("book").remove({ owner: this._id }, (err) => {
    if(err) {
      return next(err);
    }
    next();
  });
});

// TODO:
// Cancel all pending trades upon account deletion

User.plugin(localAuthPlugin, {
  usernameField: "local.username",
  hashField: "local.hash",
  saltField: "local.salt"
});

User.plugin(socialAuthPlugin, {
  methods: ["github", "twitter"]
});

User.plugin(normalizerPlugin, {
  normalizers: require("./utils/normalizers").user
});

module.exports = mongoose.model("user", User);
