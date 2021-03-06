function normalizeTrades(user) {
  const trades =  user.trades.map((trade) => {
    const ilm = trade.initiand.login_method;
    const alm = trade.acceptand.login_method;
    return {
      id: trade._id.toString(),
      initiand: {
        id: trade.initiand._id.toString(),
        username: trade.initiand[ilm].username,
        image_url: trade.initiand[ilm].image_url
      },
      acceptand: {
        id: trade.acceptand._id.toString(),
        username: trade.acceptand[alm].username,
        image_url: trade.acceptand[alm].image_url
      },
      initiand_stage: trade.initiand_stage,
      acceptand_stage: trade.acceptand_stage,
      state: trade.state
    };
  });

  return { trades: trades };
}

function normalizePublic(user, opt = {}) {
  const method = user.login_method;

  const publicUser = {
    username: user[method].username,
    image_url: user[method].image_url,
    public: user.public
  };

  if(opt.id === true) {
    publicUser.id = user._id.toString();
  }

  return publicUser;
}

function normalizeOwnLibrary(user) {
  return {
    library: user.library.map(book_normalizers.ownLibrary)
  };
}

const user_normalizers = {
  ownProfile: function(user) {
    return Object.assign({},
       normalizePublic(user, { id: true }),
       normalizeOwnLibrary(user),
       normalizeTrades(user),
      {
        message_cache: user.message_cache.map((msg) => {
          return {
            from: msg.from,
            text: msg.text,
            seen: msg.seen,
            id: msg._id.toString()
          };
        })
        .sort((a, b) => b.from - a.from)
      }
     );
  },
  profile: function(user) {
    return normalizePublic(user);
  },
  trade: function(user) {
    return Object.assign({},
      normalizePublic(user, { id: true }),
      normalizeOwnLibrary(user)
    );
  }
};

const book_normalizers = {
  "default": function(book) {
    const norm = Object.assign({}, book.toObject(), {
      owner: normalizePublic(book.owner, { id: true }),
      id: book._id.toString()
    });

    delete norm._id;
    delete norm.__v;

    return norm;
  },
  ownLibrary: function(book) {
    const norm = Object.assign({}, book.toObject(), {
      id: book._id.toString()
    });

    delete norm._id;
    delete norm.__v;

    return norm;
  }
};

const trade_normalzers = {
  "default": function(trade) {
    return normalizeTrades({ trades: [trade] }).trades[0];
  }
};

module.exports = {
  user: user_normalizers,
  book: book_normalizers,
  trade: trade_normalzers
};
