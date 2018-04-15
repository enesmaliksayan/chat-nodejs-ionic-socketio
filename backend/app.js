const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors')
const fileUpload = require('express-fileupload');
const bcrypt = require('bcrypt');
const _ = require('lodash');


mongoose.connect('mongodb://enesmaliksayan:enesmaliksayan@ds119969.mlab.com:19969/chatclone').then(() => {
    console.log('connected to db');
}).catch(() => {
    console.log('error while connection to db.');
})

const UserSchema = mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    password: { type: String, require: true }
});

const GroupSchema = mongoose.Schema({
    name: { type: String, required: true },
    users: [{ userName: { type: String, required: true } }],
    messages: [{ sender: { type: String, default: 'Admin' }, message: { type: String, required: true }, createdAt: { type: Date, default: Date.now() } }],
    type: { type: String, required: true },
    userIds: { type: String, unique: true, required: false }
})

const User = mongoose.model('User', UserSchema);
const Group = mongoose.model('Group', GroupSchema);

User.registerUser = (newUser, callback) => {
    newUser = new User(newUser);
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) {
                console.log(err);
            } else {
                newUser.password = hash;
                newUser.save(callback);
            }
        })
    })
};

comparePassword = (candidatePassword, hash, callback) => {
    bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
        if (err) throw err;
        callback(null, isMatch);
    })
}

User.login = (body, callback) => {
    User.findOne({ userName: body.userName }, (err, user) => {
        if (err) callback(err);

        else {
            if (user) {
                comparePassword(body.password, user.password, (err, isMatch) => {
                    if (err) callback(err);
                    else {
                        callback(null, isMatch, user);
                    }
                })
            } else {
                callback('Kullanıcı bulunamadı!');
            }
        }
    })
}

Group.addMessage = (type, id, message, callback) => {
    if (type != 'P2P') {
        Group.findByIdAndUpdate(id, { $push: { messages: message } }, { 'new': true }, callback);
    } else {
        Group.findOneAndUpdate({ userIds: id }, { $push: { messages: message } }, { 'new': true }, callback);
    }
}


require('events').EventEmitter.prototype._maxListeners = 0;

const socketIO = require('socket.io');
const http = require('http');

var app = express();
var server = http.createServer(app);

const port = process.env.PORT || 3000;

const io = socketIO(server);

app.set('io', io);
process.setMaxListeners(0);


app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());

// Express Session
app.use(session({
    secret: 'whatsappcloneEMS',
    saveUninitialized: false,
    resave: true,
    cookie: { maxAge: 60000 * 48 }
}));

app.post('/register', (req, res, next) => {
    let body = req.body;

    User.registerUser(body, (err, user) => {
        if (err) res.status(400).json({ ok: false, err });
        else {
            Group.findOneAndUpdate({ name: 'Lobby' }, { $push: { users: { userName: user.userName, _id:user._id } } }, (err, group) => {
                res.json({ userName: user.userName, id: user._id });
            });
        }
    })
})

app.post('/login', (req, res, next) => {
    let body = req.body;
    User.login(body, (err, ok, user) => {
        if (err) res.status(400).json({ ok: false, err });
        else if (ok) res.json({ userName: user.userName, id: user._id });
        else { res.status(400).json({ ok: false, err: 'Şifre yanlış!' }); }
    })
});

app.post('/createGroup', (req, res, next) => {
    let body = req.body;
    let group = new Group(body);
    if (!group.userIds) group.userIds = Date.now().toString() + group.id;
    group.save((err, group) => {
        console.log("e", err, "g", group)
        res.json({ group });
    });
})

// NMTEFC = New Message To Everyone From Client
// NMTEFS = New Message To Everyone From Server
// NMTGFC = New Message To Group From Client
// NMTGFS = New Message To Group From Server
// NMTPFC = New Message To Peer From Client
// NMTPFS = New Message To Peer From Server

io.on('connection', (socket) => {

    User.find().select('userName').exec((err, users) => {
        socket.emit('getUsers', users);
    })

    Group.find().elemMatch('users', { 'userName': socket.handshake.query.userName }).exec((err, groups) => {
        socket.emit('getGroups', groups);
    })

    socket.on('newGroup', () => {
        Group.find().exec((err, groups) => {
            socket.emit('getGroups', groups);
        })
    })

    socket.on('join', (id, type) => {
        console.log(id);
        socket.join(id);
        if (type == 'P2P') {
            console.log('p2p')
            Group.findOne({ userIds: id }).select('messages').exec((err, messages) => {
                console.log(err, messages);
                io.to(id).emit('NMTGFS', messages);
            })

        } else {
            console.log('değil');
            Group.findById(id).select('messages').exec((err, messages) => {
                io.to(id).emit('NMTGFS', messages);
            })
        }
    })

    socket.on('leave', (id) => {
        socket.leave(id);
    })

    socket.on('NMTEFC', (data) => {
        io.emit('NMTEFS', data);
    });

    socket.on('NMTGFC', (data) => {
        Group.addMessage(data.type, data.id, { sender: data.sender, message: data.message, createdAt: Date.now() }, (err, message) => {
            io.to(data.id).emit('NMTGFS', { sender: data.sender, message: data.message, createdAt: Date.now() });
        });
    });

    socket.on('disconnect', () => {

    })

});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('404 endpoint yok!');
    err.status = 404;
    next(err);
});


server.listen(port, () => {
    console.log('Server started on port ' + port);
});

module.exports = app;

